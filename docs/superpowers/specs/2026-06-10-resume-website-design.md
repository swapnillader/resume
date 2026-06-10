# Resume Website — Design Spec

**Date:** 2026-06-10
**Owner:** Swapnil Lader
**Goal:** Personal resume website that positions Swapnil as a strong AI-engineer candidate for top-tier (FAANG-level) companies. Entirely free to run.

## Overview

A static site built with Astro, deployed to GitHub Pages, with a guardrailed chatbot powered by Google Gemini's free tier behind a Cloudflare Worker. Contact form via Formspree. Total running cost: $0.

Per owner decision, this project ships without automated tests. Verification is manual (build succeeds, pages render, chat behaves).

## Architecture

```
GitHub repo
  Astro site (markdown content collections)
    GitHub Actions build -> GitHub Pages (static hosting)

Browser chat widget --POST /chat--> Cloudflare Worker (free tier)
  Worker holds GEMINI_API_KEY as secret
  Worker calls Gemini Flash (free tier) with guardrail system prompt
  Worker rate-limits per IP

Contact form --> Formspree (free tier, 50 submissions/month)
```

- The existing `.github/workflows/static.yml` is replaced with an Astro build + Pages deploy workflow.
- The Worker is deployed with `wrangler deploy` (manual; CF token stays local).
- The Gemini API key lives only as a Worker secret. It never appears in the repo or browser.

## Visual direction

**Light editorial.** Warm paper background, serif display headlines (e.g., Instrument Serif / Georgia stack), sans-serif body (e.g., Inter), generous whitespace, restrained single accent color. Tone: thoughtful senior engineer; write-ups are the star. No dark mode.

## Site structure (hub and spokes)

| Route | Content |
|---|---|
| `/` | Hero (name, role one-liner, social links, resume PDF button), short bio + skills, 3 featured projects, 3 recent writing items, footer |
| `/projects` | Full project grid. Card: title, blurb, tech tags, links (write-up, live demo, GitHub) as available |
| `/projects/<slug>` | On-site project write-up rendered from markdown |
| `/writing` | Single chronological list mixing on-site posts (internal link) and external articles (outbound link + icon) |
| `/writing/<slug>` | On-site article rendered from markdown |
| `/contact` | Formspree form (name, email, message) plus direct links: email, LinkedIn, GitHub |
| `404` | Friendly not-found page linking home |

Header nav on all pages: about (home) / projects / writing / contact. Chat bubble bottom-right on all pages.

## Content model

- `src/content/projects/*.md` — frontmatter: `title`, `blurb`, `tags[]`, `demoUrl?`, `repoUrl?`, `featured` (bool), `date`. Body is the write-up; a project with no body renders as card-only (no detail page).
- `src/content/writing/*.md` — frontmatter: `title`, `externalUrl?`, `featured` (bool), `date`. If `externalUrl` set, the list links out and no page is generated; otherwise body renders at `/writing/<slug>`.
- `src/data/site.json` — single source of truth for identity: name, role, one-liner, bio, skills, experience summary, social links, email. Drives hero/about sections and the chatbot facts.
- `public/resume.pdf` — provided by owner; "Download resume" button on home.

Content status: partial. Owner provides raw material (CV, project list, article URLs, demo URLs); missing prose (bio, blurbs) is drafted collaboratively during implementation.

## Chatbot

**Widget (site side):** vanilla JS + CSS, no framework. Floating bubble bottom-right; opens a panel with message list, text input, and 2-3 suggestion chips ("What projects has Swapnil built?"). Client sends last 6 conversation turns max; input capped at 500 characters.

**Worker (`POST /chat`):**

1. Validate request: JSON body, message length <= 500, history <= 6 turns. Reject otherwise with 400.
2. Rate limit per IP: ~20 requests/hour (Workers KV counter or equivalent). Over limit -> 429 with friendly message.
3. Call Gemini Flash — `gemini-2.5-flash` (or its successor if Google has rotated the free-tier flash model when implementation starts) — with:
   - System prompt: persona = assistant on Swapnil's personal site; answer ONLY questions about Swapnil, his background, skills, projects, articles, and this website; politely refuse everything else (no general coding help, no opinions, no other topics); answer from provided facts only, say "I don't know" when facts don't cover it.
   - Facts context: a JSON blob generated at build time from `site.json` + project/writing frontmatter, committed alongside the Worker.
4. Return reply to widget.
5. CORS: allow only the site's origin.

**Failure behavior:** Gemini error/quota exhausted -> widget shows "Chat is napping — email me instead" with link to `/contact`.

## Extras

- **SEO/OG:** per-page `<title>` + meta description, OpenGraph tags + social preview image, sitemap, robots.txt (Astro integrations).
- **Analytics:** GoatCounter snippet (free, no cookies).
- **Resume PDF:** static file, prominent button on home.

## Error handling

- Custom 404 page.
- Contact form failure: page also shows direct mailto link, so a Formspree outage never blocks contact.
- Chat failure: fallback message with contact link (above).

## Out of scope

- Automated tests (explicit owner decision).
- Custom domain (uses `*.github.io`; can add later).
- Dark mode.
- CMS/admin UI — content edits happen via markdown commits.

## Verification (manual)

- `astro build` completes clean; CI deploy green.
- Each route renders with real content.
- Chat: on-topic question answered from facts; off-topic question refused; rate limit and Gemini-down fallback observed.
- Form submission arrives via Formspree; resume PDF downloads.
