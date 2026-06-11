# Swapnil Prakash Lader — Personal Site

Live at [swapnillader.github.io/resume](https://swapnillader.github.io/resume/).

A personal portfolio and resume website featuring an AI chatbot that answers
questions about my background, projects, and writing.

## Highlights

- **Static-first architecture** — built with Astro 5, content managed through
  typed content collections (`projects`, `writing`) with Markdown frontmatter,
  so adding a project or post is a single file change.
- **Guardrailed AI chatbot** — a Cloudflare Worker fronts the Gemini API and
  constrains answers to a generated facts file, so the assistant only speaks
  from verified site content rather than open-ended model knowledge.
- **Automated content pipeline** — a build step derives the chatbot's knowledge
  base from the site's own data and content frontmatter, keeping the bot in
  sync with the site from a single source of truth.
- **Zero-touch deploys** — pushes to `main` trigger a GitHub Actions workflow
  that builds the site and publishes it to GitHub Pages.

## Stack

Astro 5 · TypeScript · Cloudflare Workers · Gemini API · GitHub Actions · GitHub Pages
