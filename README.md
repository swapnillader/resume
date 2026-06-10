# Resume Website

Personal site for Swapnil Prakash Lader — Astro 5 static site on GitHub Pages
(https://swapnillader.github.io/resume/) with a guardrailed Gemini chatbot served
by a Cloudflare Worker.

## Editing content

- `src/data/site.json` — identity: name, role, bio, skills, links, chat endpoint.
- `src/content/projects/*.md` — project entries (frontmatter + optional write-up body).
- `src/content/writing/*.md` — posts; set `externalUrl` in frontmatter to link out
  instead of generating a page.

The site deploys automatically: push to `main` runs `.github/workflows/deploy.yml`
(Astro build → GitHub Pages).

## Chatbot facts — important

The chatbot answers only from `worker/facts.json`, generated from `site.json` and
content frontmatter. `npm run build` regenerates it automatically (`prebuild` hook),
but the deployed Worker does NOT update on its own.

**After changing any content, redeploy the Worker:**

```bash
npm run facts
cd worker
npx wrangler deploy
```

## Worker setup (one-time)

```bash
cd worker
npx wrangler login
npx wrangler deploy                      # note the printed workers.dev URL
npx wrangler secret put GEMINI_API_KEY   # key from https://aistudio.google.com/apikey
```

Then set `chatEndpoint` in `src/data/site.json` to `https://<worker-url>/chat`.

## Local development

```bash
npm install
npm run dev    # http://localhost:4321/resume/
```
