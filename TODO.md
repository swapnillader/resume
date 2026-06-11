# Pending Tasks — Launch Checklist

Site is fully built on branch `build-resume-site`. These remaining items need
owner input before launch.

## 1. Deploy the chatbot Worker (blocks chatbot)

- [x] Get a free Gemini API key: https://aistudio.google.com/apikey (no card needed)
- [x] Log in to Cloudflare: `npx wrangler login` (run from `worker/`)
- [x] Deploy: `cd worker && npx wrangler deploy` — deployed at
      https://resume-chat.swapnillader.workers.dev
- [x] Set the secret: `npx wrangler secret put GEMINI_API_KEY` (uses `x-goog-api-key` header)
- [x] Update `chatEndpoint` in `src/data/site.json` to
      `https://resume-chat.swapnillader.workers.dev/chat`

## 2. Resume PDF (blocks "Download resume" button — currently 404s)

- [x] Save resume as `public/resume.pdf` — generated from site content via
      `scripts/resume-pdf.html` (headless Chrome); replace with your own PDF anytime

## 3. Formspree contact form (blocks contact form)

- [x] Create free form at https://formspree.io (50 submissions/month free)
- [x] Replace `YOUR_FORM_ID` in `src/pages/contact.astro` with the real form ID
      (`meewllln`)

## 4. Analytics — optional

- [ ] Create free account at https://www.goatcounter.com, pick a site code
- [ ] Add before `</body>` in `src/layouts/BaseLayout.astro`:
      `<script is:inline data-goatcounter="https://<CODE>.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>`

## 5. Social preview image — optional

- [x] Provide a 1200×630 image, save as `public/og.png` — generated from
      `scripts/og-image.html` (headless Chrome screenshot); replace anytime
- [x] Add after the `og:url` meta in `src/layouts/BaseLayout.astro`:
      `<meta property="og:image" content={new URL(`${base}og.png`, Astro.site)} />`

## 6. Real content — follow-up

- [ ] Replace the Medium profile link with individual article entries in
      `src/content/writing/` (fetching the article list was blocked from this machine)
- [ ] Review/extend the three project write-ups in `src/content/projects/`

## 7. Go live

- [x] Merge `build-resume-site` into `main` and push
- [x] Confirm repo Settings → Pages → Source = "GitHub Actions" (deploy workflow ran)
- [x] Verify https://swapnillader.github.io/resume/ renders — all routes,
      resume.pdf, og.png return 200
- [ ] Run the manual verification checklist (Task 13 of
      `docs/superpowers/plans/2026-06-10-resume-website.md`): remaining manual
      bits — chat rate-limit (21 msgs in an hour), real form submission
      (sends email), OG preview via social-card debugger.
      Already verified: all routes 200, chat on-topic + off-topic refusal,
      PDF download, form action wired.

## Note

After ANY content change (`src/data/site.json`, `src/content/**`), the deployed
Worker needs a redeploy to refresh chatbot facts: `npm run facts && cd worker && npx wrangler deploy`.
See README.md.
