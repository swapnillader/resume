import facts from '../facts.json';

const ALLOWED_ORIGINS = ['https://swapnillader.github.io', 'http://localhost:4321'];
const RATE_LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000;
// Per-isolate memory: resets on eviction, so limiting is approximate. Fine for free tier.
const buckets = new Map();

const SYSTEM_PROMPT = `You are the assistant on Swapnil Prakash Lader's personal website.
Answer ONLY questions about Swapnil: his background, skills, experience, projects, articles, and this website.
Use ONLY the FACTS below. If the facts don't cover a question about Swapnil, say you don't know and suggest the contact page.
Politely refuse anything else — general coding help, opinions, news, other people, or any off-topic request. One-sentence refusal, then offer to answer questions about Swapnil's work.
Keep answers under 120 words. Plain text only, no markdown.

FACTS:
${JSON.stringify(facts)}`;

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') ?? '';
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, cors);

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const now = Date.now();
    const bucket = buckets.get(ip);
    if (!bucket || now > bucket.reset) {
      buckets.set(ip, { count: 1, reset: now + WINDOW_MS });
    } else if (++bucket.count > RATE_LIMIT) {
      return json({ error: 'rate_limited' }, 429, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'bad_request' }, 400, cors);
    }
    const message = body?.message;
    if (typeof message !== 'string' || !message.trim() || message.length > 500) {
      return json({ error: 'bad_request' }, 400, cors);
    }
    const history = Array.isArray(body?.history) ? body.history.slice(-6) : [];

    const contents = [
      ...history
        .filter((t) => t && (t.role === 'user' || t.role === 'model') && typeof t.text === 'string')
        .map((t) => ({ role: t.role, parts: [{ text: t.text.slice(0, 500) }] })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const upstream = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { maxOutputTokens: 512, temperature: 0.3 },
        }),
      },
    );
    if (!upstream.ok) return json({ error: 'upstream' }, 502, cors);

    const data = await upstream.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    if (!reply.trim()) return json({ error: 'upstream' }, 502, cors);
    return json({ reply }, 200, cors);
  },
};
