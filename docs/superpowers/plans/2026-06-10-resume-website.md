# Resume Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Swapnil Lader's resume website — Astro static site on GitHub Pages with a guardrailed Gemini chatbot behind a Cloudflare Worker and a Formspree contact form, all on free tiers.

**Architecture:** Astro v5 builds markdown content collections into a static hub-and-spoke site deployed by GitHub Actions to GitHub Pages (`https://swapnillader.github.io/resume`). A separate Cloudflare Worker (`worker/`) holds the Gemini API key, applies guardrails and per-IP rate limiting, and serves `POST /chat` for the vanilla-JS chat widget. A build script generates `worker/facts.json` from site content so the bot answers only from site facts.

**Tech Stack:** Astro 5, @astrojs/sitemap, gray-matter (facts script), Cloudflare Workers + wrangler, Google Gemini API (`gemini-2.5-flash`, free tier), Formspree, GoatCounter.

**Spec:** `docs/superpowers/specs/2026-06-10-resume-website-design.md`

**Testing note:** Per owner decision in the spec, NO automated tests. Every task verifies via `npm run build` and/or a manual check instead. Do not add test frameworks.

**User inputs needed during execution** (ask at the marked steps, not all upfront): real bio/skills/experience text, project list + write-ups, article URLs, demo URLs, LinkedIn URL, resume PDF, Formspree form ID, GoatCounter code, Gemini API key, Cloudflare account for wrangler.

## File structure

```
astro.config.mjs            Astro config: site/base for GitHub Pages, sitemap
package.json                scripts: dev/build/preview/facts
src/styles/global.css       editorial theme (all shared CSS)
src/layouts/BaseLayout.astro head/meta/OG, header nav, footer, analytics, chat widget
src/components/ProjectCard.astro  project card (home + /projects)
src/components/ChatWidget.astro   chat bubble UI + client JS
src/data/site.json          identity single source of truth
src/content.config.ts       collections schema (projects, writing)
src/content/projects/*.md   project entries
src/content/writing/*.md    posts / external article links
src/pages/                  index, projects, projects/[slug], writing, writing/[slug], contact, 404
public/robots.txt, resume.pdf
scripts/build-facts.mjs     site content -> worker/facts.json
worker/wrangler.toml        Worker config
worker/src/index.js         chat proxy: CORS, rate limit, guardrails, Gemini call
worker/facts.json           generated facts (committed)
.github/workflows/deploy.yml  replaces static.yml
```

---

### Task 1: Scaffold Astro project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro` (temporary stub, replaced in Task 5)
- Modify: `.gitignore`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "resume",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "facts": "node scripts/build-facts.mjs"
  },
  "dependencies": {
    "@astrojs/sitemap": "^3.2.0",
    "astro": "^5.0.0"
  },
  "devDependencies": {
    "gray-matter": "^4.0.3"
  }
}
```

- [ ] **Step 2: Install**

Run: `npm install`
Expected: completes without errors, creates `node_modules/` and `package-lock.json`.

- [ ] **Step 3: Write `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://swapnillader.github.io',
  base: '/resume',
  integrations: [sitemap()],
});
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/base",
  "include": [".astro/types.d.ts", "src/**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 5: Write temporary stub `src/pages/index.astro`** (replaced in Task 5)

```astro
---
---
<html lang="en"><head><title>Swapnil Lader</title></head><body><h1>Coming soon</h1></body></html>
```

- [ ] **Step 6: Append to `.gitignore`**

```
node_modules/
dist/
.astro/
```

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: `Complete!` with `dist/index.html` generated.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json src/pages/index.astro .gitignore
git commit -m "feat: scaffold Astro project for resume site"
```

---

### Task 2: Editorial theme + base layout

**Files:**
- Create: `src/styles/global.css`, `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Write `src/styles/global.css`**

```css
:root {
  --bg: #fbfaf8;
  --bg-2: #f1efe9;
  --ink: #1a1812;
  --ink-2: #4f4a40;
  --muted: #8a857c;
  --rule: #e5e1d8;
  --accent: #2f5d9e;
  --serif: "Instrument Serif", Georgia, serif;
  --sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --container: 760px;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 17px;
  line-height: 1.65;
}
main { max-width: var(--container); margin: 0 auto; padding: 0 24px 96px; }
h1, h2, h3 { font-family: var(--serif); font-weight: 400; line-height: 1.15; }
h1 { font-size: clamp(2.4rem, 6vw, 3.6rem); font-style: italic; margin: 0 0 12px; }
h2 { font-size: 1.7rem; margin: 64px 0 16px; }
h3 { font-size: 1.25rem; margin: 0 0 6px; }
a { color: var(--accent); text-decoration-thickness: 1px; text-underline-offset: 3px; }
a:hover { color: var(--ink); }
time { color: var(--muted); font-size: 0.85rem; }

.site-header {
  max-width: var(--container); margin: 0 auto; padding: 28px 24px;
  display: flex; justify-content: space-between; align-items: baseline; gap: 16px; flex-wrap: wrap;
}
.site-header .name { font-family: var(--serif); font-size: 1.15rem; color: var(--ink); text-decoration: none; }
.site-header nav { display: flex; gap: 20px; }
.site-header nav a { color: var(--ink-2); text-decoration: none; font-size: 0.95rem; }
.site-header nav a:hover { color: var(--accent); }

.hero { padding: 48px 0 8px; }
.lede { font-size: 1.15rem; color: var(--ink-2); max-width: 56ch; }
.hero-links { display: flex; gap: 18px; align-items: center; flex-wrap: wrap; margin-top: 20px; }
.button {
  display: inline-block; background: var(--ink); color: var(--bg); border-radius: 6px;
  padding: 10px 18px; text-decoration: none; font-size: 0.95rem;
}
.button:hover { background: var(--accent); color: var(--bg); }

.grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
@media (min-width: 640px) { .grid { grid-template-columns: 1fr 1fr; } }
.card { background: #fff; border: 1px solid var(--rule); border-radius: 10px; padding: 22px; }
.card p { margin: 8px 0; color: var(--ink-2); font-size: 0.95rem; }
.card .links { display: flex; gap: 14px; font-size: 0.9rem; }
.tags { list-style: none; display: flex; flex-wrap: wrap; gap: 8px; padding: 0; margin: 10px 0 0; }
.tags li { background: var(--bg-2); border-radius: 999px; padding: 3px 12px; font-size: 0.8rem; color: var(--ink-2); }

.post-list { list-style: none; padding: 0; margin: 0; }
.post-list li {
  display: flex; justify-content: space-between; gap: 16px; align-items: baseline;
  padding: 14px 0; border-bottom: 1px solid var(--rule);
}

.prose { max-width: 68ch; }
.prose img { max-width: 100%; }
.prose pre { background: #14130f; color: #eee; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 0.85rem; }
.prose code { font-size: 0.9em; }
.prose blockquote { border-left: 3px solid var(--rule); margin-left: 0; padding-left: 16px; color: var(--ink-2); }

form.contact { display: grid; gap: 14px; max-width: 480px; }
form.contact label { display: grid; gap: 6px; font-size: 0.9rem; color: var(--ink-2); }
form.contact input, form.contact textarea {
  font: inherit; padding: 10px 12px; border: 1px solid var(--rule); border-radius: 6px; background: #fff;
}
form.contact button { justify-self: start; border: 0; cursor: pointer; }

.site-footer {
  max-width: var(--container); margin: 0 auto; padding: 32px 24px;
  border-top: 1px solid var(--rule); color: var(--muted); font-size: 0.85rem;
  display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap;
}

/* Chat widget */
#chat-widget { position: fixed; right: 20px; bottom: 20px; z-index: 50; font-family: var(--sans); }
.chat-toggle {
  width: 52px; height: 52px; border-radius: 50%; border: 0; cursor: pointer;
  background: var(--ink); color: var(--bg); font-size: 22px; box-shadow: 0 4px 16px rgba(0,0,0,.18);
}
.chat-panel {
  display: none; position: absolute; right: 0; bottom: 64px; width: min(340px, calc(100vw - 40px));
  background: #fff; border: 1px solid var(--rule); border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0,0,0,.16); overflow: hidden;
}
.chat-panel.open { display: flex; flex-direction: column; }
.chat-head { padding: 12px 16px; border-bottom: 1px solid var(--rule); font-size: 0.9rem; color: var(--ink-2); }
.chat-log { height: 300px; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.msg { max-width: 85%; padding: 8px 12px; border-radius: 10px; font-size: 0.9rem; white-space: pre-wrap; }
.msg.user { align-self: flex-end; background: var(--accent); color: #fff; }
.msg.model { align-self: flex-start; background: var(--bg-2); }
.chat-chips { display: flex; gap: 6px; flex-wrap: wrap; padding: 0 12px 8px; }
.chip { border: 1px solid var(--rule); background: #fff; border-radius: 999px; padding: 4px 10px; font-size: 0.75rem; cursor: pointer; color: var(--ink-2); }
.chat-panel form { display: flex; border-top: 1px solid var(--rule); }
.chat-panel input { flex: 1; border: 0; padding: 12px; font: inherit; font-size: 0.9rem; outline: none; }
.chat-panel button[type="submit"] { border: 0; background: none; color: var(--accent); padding: 0 14px; cursor: pointer; font-size: 0.9rem; }
```

- [ ] **Step 2: Write `src/layouts/BaseLayout.astro`**

Note: the GoatCounter `data-goatcounter` code and the ChatWidget import get filled in by Tasks 9 and 12; write it exactly as below for now.

```astro
---
import '../styles/global.css';
import site from '../data/site.json';

interface Props { title: string; description: string; }
const { title, description } = Astro.props;
const base = import.meta.env.BASE_URL;
const canonical = new URL(Astro.url.pathname, Astro.site);
---
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonical} />
  <meta name="twitter:card" content="summary" />
  <link rel="sitemap" href={`${base}/sitemap-index.xml`} />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
</head>
<body>
  <header class="site-header">
    <a class="name" href={`${base}/`}>{site.name}</a>
    <nav>
      <a href={`${base}/`}>about</a>
      <a href={`${base}/projects/`}>projects</a>
      <a href={`${base}/writing/`}>writing</a>
      <a href={`${base}/contact/`}>contact</a>
    </nav>
  </header>
  <main>
    <slot />
  </main>
  <footer class="site-footer">
    <span>© {new Date().getFullYear()} {site.name}</span>
    <span>
      <a href={site.links.github}>GitHub</a> · <a href={site.links.linkedin}>LinkedIn</a> · <a href={`mailto:${site.email}`}>Email</a>
    </span>
  </footer>
</body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css src/layouts/BaseLayout.astro
git commit -m "feat: add editorial theme and base layout"
```

(Build will fail until Task 3 creates `site.json` — that's expected; don't run build in this task.)

---

### Task 3: Site data + content collections

**Files:**
- Create: `src/data/site.json`, `src/content.config.ts`, `src/content/projects/sample-project.md`, `src/content/writing/sample-post.md`, `src/content/writing/sample-external.md`

- [ ] **Step 1: USER INPUT — collect identity content**

Ask the user for: tagline, one-liner, bio (2–4 sentences), skills list, experience summary, LinkedIn URL, preferred public email. Draft prose with them if missing. Use the answers in Step 2; the values below are structural defaults to replace.

- [ ] **Step 2: Write `src/data/site.json`** (substitute user-provided values)

```json
{
  "name": "Swapnil Prakash Lader",
  "role": "AI Engineer",
  "tagline": "Building AI systems people can rely on.",
  "oneLiner": "AI engineer working on LLM pipelines, retrieval, and evaluation.",
  "bio": "I build production AI systems — LLM pipelines, retrieval-augmented generation, and the evaluation infrastructure that keeps them honest.",
  "skills": ["Python", "LLM systems", "RAG", "Evaluation", "AWS", "TypeScript"],
  "experience": "AI Engineer with hands-on experience shipping LLM-backed products end to end.",
  "email": "claude1128@crowdanalytix.com",
  "links": {
    "github": "https://github.com/swapnillader",
    "linkedin": "https://www.linkedin.com/in/swapnillader"
  },
  "chatEndpoint": "https://resume-chat.REPLACE-SUBDOMAIN.workers.dev/chat"
}
```

(`chatEndpoint` gets its real value in Task 10 Step 5 after the Worker deploys.)

- [ ] **Step 3: Write `src/content.config.ts`**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    blurb: z.string(),
    tags: z.array(z.string()).default([]),
    demoUrl: z.string().url().optional(),
    repoUrl: z.string().url().optional(),
    featured: z.boolean().default(false),
    date: z.coerce.date(),
  }),
});

const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    externalUrl: z.string().url().optional(),
    featured: z.boolean().default(false),
    date: z.coerce.date(),
  }),
});

export const collections = { projects, writing };
```

- [ ] **Step 4: USER INPUT — collect real content entries**

Ask the user for their actual projects (title, blurb, tags, demo/repo URLs, write-up text) and articles (on-site drafts and external URLs). Create one `.md` per item using the formats in Step 5. Keep the samples below only if the user has no content ready yet; delete them once real entries exist.

- [ ] **Step 5: Write sample content files**

`src/content/projects/sample-project.md`:

```markdown
---
title: "RAG Evaluation Harness"
blurb: "Automated evaluation pipeline for retrieval-augmented generation systems."
tags: ["Python", "LLM", "RAG"]
repoUrl: "https://github.com/swapnillader/resume"
featured: true
date: 2026-01-15
---

## Problem

Retrieval quality silently degrades as corpora grow. This project builds a harness that scores retrieval and generation separately.

## Approach

Golden-set retrieval scoring plus LLM-as-judge answer grading, run on every index rebuild.
```

`src/content/writing/sample-post.md`:

```markdown
---
title: "What I learned shipping my first LLM feature"
featured: true
date: 2026-02-01
---

Shipping LLM features taught me that evaluation is the product. Here's how I structure evals before writing any prompt.
```

`src/content/writing/sample-external.md`:

```markdown
---
title: "Guardrails for production chatbots"
externalUrl: "https://medium.com/@swapnillader"
featured: false
date: 2026-03-01
---
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: `Complete!` — collections compile, stub index still renders.

- [ ] **Step 7: Commit**

```bash
git add src/data/site.json src/content.config.ts src/content/
git commit -m "feat: add site data and content collections"
```

---

### Task 4: Project card component

**Files:**
- Create: `src/components/ProjectCard.astro`

- [ ] **Step 1: Write `src/components/ProjectCard.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';

interface Props { project: CollectionEntry<'projects'>; }
const { project } = Astro.props;
const base = import.meta.env.BASE_URL;
const hasPage = !!project.body?.trim();
const pageUrl = `${base}/projects/${project.id}/`;
---
<article class="card">
  <h3>{hasPage ? <a href={pageUrl}>{project.data.title}</a> : project.data.title}</h3>
  <p>{project.data.blurb}</p>
  <ul class="tags">{project.data.tags.map((t) => <li>{t}</li>)}</ul>
  <p class="links">
    {hasPage && <a href={pageUrl}>Write-up</a>}
    {project.data.demoUrl && <a href={project.data.demoUrl}>Live demo</a>}
    {project.data.repoUrl && <a href={project.data.repoUrl}>GitHub</a>}
  </p>
</article>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ProjectCard.astro
git commit -m "feat: add project card component"
```

---

### Task 5: Home page

**Files:**
- Modify: `src/pages/index.astro` (replace the Task 1 stub entirely)

- [ ] **Step 1: Replace `src/pages/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import ProjectCard from '../components/ProjectCard.astro';
import site from '../data/site.json';

const base = import.meta.env.BASE_URL;
const projects = (await getCollection('projects'))
  .filter((p) => p.data.featured)
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
  .slice(0, 3);
const posts = (await getCollection('writing'))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
  .slice(0, 3);
---
<BaseLayout title={`${site.name} — ${site.role}`} description={site.oneLiner}>
  <section class="hero">
    <h1>{site.tagline}</h1>
    <p class="lede">{site.oneLiner}</p>
    <p class="hero-links">
      <a class="button" href={`${base}/resume.pdf`} download>Download resume</a>
      <a href={site.links.github}>GitHub</a>
      <a href={site.links.linkedin}>LinkedIn</a>
      <a href={`mailto:${site.email}`}>Email</a>
    </p>
  </section>

  <section>
    <h2>About</h2>
    <p class="prose">{site.bio}</p>
    <p class="prose">{site.experience}</p>
    <ul class="tags">{site.skills.map((s) => <li>{s}</li>)}</ul>
  </section>

  <section>
    <h2>Featured projects</h2>
    <div class="grid">{projects.map((p) => <ProjectCard project={p} />)}</div>
    <p><a href={`${base}/projects/`}>All projects →</a></p>
  </section>

  <section>
    <h2>Recent writing</h2>
    <ul class="post-list">
      {posts.map((p) => (
        <li>
          <a href={p.data.externalUrl ?? `${base}/writing/${p.id}/`}>
            {p.data.title}{p.data.externalUrl ? ' ↗' : ''}
          </a>
          <time datetime={p.data.date.toISOString()}>{p.data.date.toISOString().slice(0, 10)}</time>
        </li>
      ))}
    </ul>
    <p><a href={`${base}/writing/`}>All writing →</a></p>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Verify**

Run: `npm run build`
Expected: `Complete!`. Then `npm run dev`, open `http://localhost:4321/resume/` — hero, about, 1 featured project card, 3 writing items render. Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: add home page with hero, about, featured sections"
```

---

### Task 6: Projects list + detail pages

**Files:**
- Create: `src/pages/projects/index.astro`, `src/pages/projects/[slug].astro`

- [ ] **Step 1: Write `src/pages/projects/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import ProjectCard from '../../components/ProjectCard.astro';
import site from '../../data/site.json';

const projects = (await getCollection('projects'))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
---
<BaseLayout title={`Projects — ${site.name}`} description={`Projects by ${site.name}: ${site.oneLiner}`}>
  <h1>Projects</h1>
  <div class="grid">{projects.map((p) => <ProjectCard project={p} />)}</div>
</BaseLayout>
```

- [ ] **Step 2: Write `src/pages/projects/[slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import site from '../../data/site.json';

export async function getStaticPaths() {
  const projects = await getCollection('projects');
  return projects
    .filter((p) => p.body?.trim())
    .map((p) => ({ params: { slug: p.id }, props: { project: p } }));
}

const { project } = Astro.props;
const { Content } = await render(project);
const base = import.meta.env.BASE_URL;
---
<BaseLayout title={`${project.data.title} — ${site.name}`} description={project.data.blurb}>
  <p><a href={`${base}/projects/`}>← All projects</a></p>
  <h1>{project.data.title}</h1>
  <p class="lede">{project.data.blurb}</p>
  <ul class="tags">{project.data.tags.map((t) => <li>{t}</li>)}</ul>
  <p class="links">
    {project.data.demoUrl && <a href={project.data.demoUrl}>Live demo</a>}
    {project.data.repoUrl && <a href={project.data.repoUrl}>GitHub</a>}
  </p>
  <div class="prose"><Content /></div>
</BaseLayout>
```

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: `Complete!` and `dist/projects/index.html` plus `dist/projects/sample-project/index.html` exist.

- [ ] **Step 4: Commit**

```bash
git add src/pages/projects/
git commit -m "feat: add projects list and write-up pages"
```

---

### Task 7: Writing list + detail pages

**Files:**
- Create: `src/pages/writing/index.astro`, `src/pages/writing/[slug].astro`

- [ ] **Step 1: Write `src/pages/writing/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import site from '../../data/site.json';

const base = import.meta.env.BASE_URL;
const posts = (await getCollection('writing'))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
---
<BaseLayout title={`Writing — ${site.name}`} description={`Articles and write-ups by ${site.name}.`}>
  <h1>Writing</h1>
  <ul class="post-list">
    {posts.map((p) => (
      <li>
        <a href={p.data.externalUrl ?? `${base}/writing/${p.id}/`}>
          {p.data.title}{p.data.externalUrl ? ' ↗' : ''}
        </a>
        <time datetime={p.data.date.toISOString()}>{p.data.date.toISOString().slice(0, 10)}</time>
      </li>
    ))}
  </ul>
</BaseLayout>
```

- [ ] **Step 2: Write `src/pages/writing/[slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import site from '../../data/site.json';

export async function getStaticPaths() {
  const posts = await getCollection('writing');
  return posts
    .filter((p) => !p.data.externalUrl)
    .map((p) => ({ params: { slug: p.id }, props: { post: p } }));
}

const { post } = Astro.props;
const { Content } = await render(post);
const base = import.meta.env.BASE_URL;
---
<BaseLayout title={`${post.data.title} — ${site.name}`} description={post.data.title}>
  <p><a href={`${base}/writing/`}>← All writing</a></p>
  <h1>{post.data.title}</h1>
  <time datetime={post.data.date.toISOString()}>{post.data.date.toISOString().slice(0, 10)}</time>
  <div class="prose"><Content /></div>
</BaseLayout>
```

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: `Complete!`; `dist/writing/sample-post/index.html` exists; NO `dist/writing/sample-external/` directory (external articles get no page).

- [ ] **Step 4: Commit**

```bash
git add src/pages/writing/
git commit -m "feat: add writing list and article pages"
```

---

### Task 8: Contact page

**Files:**
- Create: `src/pages/contact.astro`

- [ ] **Step 1: USER SETUP — Formspree**

Ask the user to create a free form at https://formspree.io (sign up → New form → copy the form ID from the endpoint `https://formspree.io/f/<FORM_ID>`). Get the form ID before Step 2. If the user wants to defer, use `YOUR_FORM_ID` and record a follow-up to replace it before launch.

- [ ] **Step 2: Write `src/pages/contact.astro`** (substitute the real form ID)

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import site from '../data/site.json';
---
<BaseLayout title={`Contact — ${site.name}`} description={`Get in touch with ${site.name}.`}>
  <h1>Contact</h1>
  <p class="lede">
    Recruiting, collaboration, or questions about my work — happy to talk.
    Fastest: email <a href={`mailto:${site.email}`}>{site.email}</a> or
    <a href={site.links.linkedin}>LinkedIn</a>.
  </p>
  <form class="contact" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
    <label>Name <input type="text" name="name" required /></label>
    <label>Email <input type="email" name="email" required /></label>
    <label>Message <textarea name="message" rows="6" required></textarea></label>
    <button class="button" type="submit">Send</button>
  </form>
</BaseLayout>
```

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: `Complete!`, `dist/contact/index.html` exists.

- [ ] **Step 4: Commit**

```bash
git add src/pages/contact.astro
git commit -m "feat: add contact page with Formspree form"
```

---

### Task 9: 404 page, robots.txt, analytics

**Files:**
- Create: `src/pages/404.astro`, `public/robots.txt`
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Write `src/pages/404.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import site from '../data/site.json';
const base = import.meta.env.BASE_URL;
---
<BaseLayout title={`Not found — ${site.name}`} description="Page not found.">
  <h1>Page not found</h1>
  <p class="lede">That page doesn't exist. <a href={`${base}/`}>Back to home →</a></p>
</BaseLayout>
```

- [ ] **Step 2: Write `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://swapnillader.github.io/resume/sitemap-index.xml
```

- [ ] **Step 3: USER SETUP — GoatCounter**

Ask the user to create a free account at https://www.goatcounter.com and choose a site code (e.g. `swapnillader`). If deferring, skip Step 4 and record a follow-up.

- [ ] **Step 4: Add analytics to `src/layouts/BaseLayout.astro`** (substitute real code)

Add this line directly before `</body>`:

```html
<script is:inline data-goatcounter="https://YOUR_CODE.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
```

- [ ] **Step 5: Verify**

Run: `npm run build`
Expected: `Complete!`, `dist/404.html` exists, `dist/sitemap-index.xml` exists.

- [ ] **Step 6: Commit**

```bash
git add src/pages/404.astro public/robots.txt src/layouts/BaseLayout.astro
git commit -m "feat: add 404 page, robots.txt, and analytics"
```

---

### Task 10: Facts script + Cloudflare Worker (chat backend)

**Files:**
- Create: `scripts/build-facts.mjs`, `worker/wrangler.toml`, `worker/src/index.js`, `worker/facts.json` (generated)

- [ ] **Step 1: Write `scripts/build-facts.mjs`**

```js
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import matter from 'gray-matter';

const site = JSON.parse(readFileSync('src/data/site.json', 'utf8'));

function readEntries(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const { data, content } = matter(readFileSync(`${dir}/${f}`, 'utf8'));
      return { ...data, summary: content.trim().slice(0, 600) };
    });
}

const { chatEndpoint, ...identity } = site;
const facts = {
  ...identity,
  siteUrl: 'https://swapnillader.github.io/resume/',
  projects: readEntries('src/content/projects'),
  writing: readEntries('src/content/writing'),
};

mkdirSync('worker', { recursive: true });
writeFileSync('worker/facts.json', JSON.stringify(facts, null, 2));
console.log('Wrote worker/facts.json');
```

- [ ] **Step 2: Generate facts**

Run: `npm run facts`
Expected: `Wrote worker/facts.json`; file contains site identity plus project/writing entries.

- [ ] **Step 3: Write `worker/wrangler.toml`**

```toml
name = "resume-chat"
main = "src/index.js"
compatibility_date = "2026-06-10"
```

- [ ] **Step 4: Write `worker/src/index.js`**

```js
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
```

- [ ] **Step 5: USER SETUP — deploy Worker**

Ask the user to do / authorize these (needs their accounts; suggest `! <command>` for interactive logins):

```bash
# 1. Gemini key: user creates one at https://aistudio.google.com/apikey (free, no card)
# 2. Cloudflare login (interactive — user runs: ! npx wrangler login)
cd worker
npx wrangler deploy                      # note the printed URL: https://resume-chat.<subdomain>.workers.dev
npx wrangler secret put GEMINI_API_KEY   # paste the Gemini key when prompted
```

Then update `chatEndpoint` in `src/data/site.json` to `https://resume-chat.<subdomain>.workers.dev/chat` (exact URL from deploy output).

- [ ] **Step 6: Verify Worker manually**

```bash
curl -s -X POST "https://resume-chat.<subdomain>.workers.dev/chat" \
  -H "Content-Type: application/json" -H "Origin: https://swapnillader.github.io" \
  -d '{"message":"What projects has Swapnil built?","history":[]}'
```

Expected: `{"reply":"..."}` mentioning a project from facts.json.

Then off-topic check:

```bash
curl -s -X POST "https://resume-chat.<subdomain>.workers.dev/chat" \
  -H "Content-Type: application/json" -H "Origin: https://swapnillader.github.io" \
  -d '{"message":"Write me a python quicksort","history":[]}'
```

Expected: `{"reply":"..."}` containing a polite refusal, not code.

- [ ] **Step 7: Commit**

```bash
git add scripts/build-facts.mjs worker/ src/data/site.json
git commit -m "feat: add chat worker with Gemini guardrails and facts pipeline"
```

---

### Task 11: Chat widget

**Files:**
- Create: `src/components/ChatWidget.astro`
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Write `src/components/ChatWidget.astro`**

```astro
---
import site from '../data/site.json';
const base = import.meta.env.BASE_URL;
---
<div id="chat-widget" data-endpoint={site.chatEndpoint} data-contact={`${base}/contact/`}>
  <div class="chat-panel">
    <div class="chat-head">Ask me about Swapnil's work — answers come from this site only.</div>
    <div class="chat-log"></div>
    <div class="chat-chips">
      <button type="button" class="chip">What projects has Swapnil built?</button>
      <button type="button" class="chip">What's his experience with LLMs?</button>
      <button type="button" class="chip">How do I contact him?</button>
    </div>
    <form>
      <input type="text" maxlength="500" placeholder="Ask a question…" aria-label="Chat message" />
      <button type="submit">Send</button>
    </form>
  </div>
  <button type="button" class="chat-toggle" aria-label="Open chat">💬</button>
</div>

<script>
  const root = document.getElementById('chat-widget')!;
  const endpoint = root.dataset.endpoint!;
  const contactUrl = root.dataset.contact!;
  const panel = root.querySelector('.chat-panel')!;
  const log = root.querySelector('.chat-log')!;
  const form = root.querySelector('form')!;
  const input = root.querySelector('input')!;
  const history: { role: string; text: string }[] = [];

  root.querySelector('.chat-toggle')!.addEventListener('click', () => panel.classList.toggle('open'));
  root.querySelectorAll('.chip').forEach((chip) =>
    chip.addEventListener('click', () => {
      input.value = chip.textContent ?? '';
      form.requestSubmit();
    }),
  );

  function add(role: string, text: string) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    input.value = '';
    add('user', message);
    const pending = add('model', '…');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: history.slice(-6) }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { reply } = await res.json();
      pending.textContent = reply;
      history.push({ role: 'user', text: message }, { role: 'model', text: reply });
    } catch {
      pending.innerHTML = `Chat is napping — <a href="${contactUrl}">email me instead</a>.`;
    }
  });
</script>
```

- [ ] **Step 2: Mount widget in `src/layouts/BaseLayout.astro`**

Add import in frontmatter:

```astro
import ChatWidget from '../components/ChatWidget.astro';
```

Add `<ChatWidget />` directly after `</footer>` (before the GoatCounter script line).

- [ ] **Step 3: Verify manually**

Run: `npm run dev`, open `http://localhost:4321/resume/`.
Expected: bubble bottom-right; open panel; chip click gets a real answer (Worker allows `http://localhost:4321`); off-topic question gets refusal. Stop dev server. Run `npm run build` — expect `Complete!`.

- [ ] **Step 4: Commit**

```bash
git add src/components/ChatWidget.astro src/layouts/BaseLayout.astro
git commit -m "feat: add chat widget wired to worker endpoint"
```

---

### Task 12: Deploy workflow + resume PDF

**Files:**
- Create: `.github/workflows/deploy.yml`, `public/resume.pdf`
- Delete: `.github/workflows/static.yml`, old `index.html` (already deleted in working tree — stage the deletion)

- [ ] **Step 1: USER INPUT — resume PDF**

Ask the user for their resume PDF; copy it to `public/resume.pdf`. If not ready, note follow-up — home page button 404s until provided.

- [ ] **Step 2: Write `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v3

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Remove old workflow and stage old index.html deletion**

```bash
git rm .github/workflows/static.yml
git add index.html   # stages the deletion already present in working tree
```

- [ ] **Step 4: Commit and push**

```bash
git add .github/workflows/deploy.yml public/resume.pdf
git commit -m "feat: deploy Astro site to GitHub Pages, remove legacy static workflow"
git push origin main
```

- [ ] **Step 5: Verify deploy**

Check Actions run is green: `gh run watch` (or GitHub UI). Confirm GitHub Pages source is "GitHub Actions" in repo Settings → Pages (ask user to flip it if it's "Deploy from branch").
Open `https://swapnillader.github.io/resume/` — site renders.

---

### Task 13: Final manual verification (from spec)

**Files:** none (verification only)

- [ ] **Step 1: Walk every route**

`/`, `/projects/`, one project write-up, `/writing/`, one on-site post, one external article link, `/contact/`, a bogus URL (404 page). All render with real content and working nav.

- [ ] **Step 2: Chat checks on production**

On-topic question → answer from facts. Off-topic ("what's the weather") → refusal. 21st rapid request → friendly failure (rate limit). Confirm fallback by asking user to test once with Worker temporarily misconfigured only if convenient — otherwise skip.

- [ ] **Step 3: Contact + extras**

Submit form → arrives in Formspree dashboard/email. Resume PDF downloads. Share home URL in a LinkedIn draft → OG preview shows title/description. `robots.txt` and `sitemap-index.xml` reachable.

- [ ] **Step 4: Report results to user**

List what passed, anything deferred (Formspree ID, GoatCounter code, resume.pdf, real content), with exact file/value still needed.
