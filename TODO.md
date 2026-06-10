# Pending Tasks — Launch Checklist

Site is fully built on branch `build-resume-site`. These remaining items need
owner input before launch.

## 1. Deploy the chatbot Worker (blocks chatbot)

- [ ] Get a free Gemini API key: https://aistudio.google.com/apikey (no card needed)
- [ ] Log in to Cloudflare: `npx wrangler login` (run from `worker/`)
- [ ] Deploy: `cd worker && npx wrangler deploy` — note the printed `*.workers.dev` URL
- [ ] Set the secret: `npx wrangler secret put GEMINI_API_KEY` (paste key when prompted)
- [ ] Update `chatEndpoint` in `src/data/site.json` to `https://<worker-url>/chat`
      (replaces the `REPLACE-SUBDOMAIN` placeholder)

## 2. Resume PDF (blocks "Download resume" button — currently 404s)

- [ ] Save resume as `public/resume.pdf`

## 3. Formspree contact form (blocks contact form)

- [ ] Create free form at https://formspree.io (50 submissions/month free)
- [ ] Replace `YOUR_FORM_ID` in `src/pages/contact.astro` with the real form ID
      from `https://formspree.io/f/<FORM_ID>`

## 4. Analytics — optional

- [ ] Create free account at https://www.goatcounter.com, pick a site code
- [ ] Add before `</body>` in `src/layouts/BaseLayout.astro`:
      `<script is:inline data-goatcounter="https://<CODE>.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>`

## 5. Social preview image — optional

- [ ] Provide a 1200×630 image, save as `public/og.png`
- [ ] Add after the `og:url` meta in `src/layouts/BaseLayout.astro`:
      `<meta property="og:image" content={new URL(`${base}og.png`, Astro.site)} />`

## 6. Real content — follow-up

- [ ] Replace the Medium profile link with individual article entries in
      `src/content/writing/` (fetching the article list was blocked from this machine)
- [ ] Review/extend the three project write-ups in `src/content/projects/`

## 7. Go live

- [ ] Merge `build-resume-site` into `main` and push
- [ ] Confirm repo Settings → Pages → Source = "GitHub Actions"
- [ ] Verify https://swapnillader.github.io/resume/ renders
- [ ] Run the manual verification checklist (Task 13 of
      `docs/superpowers/plans/2026-06-10-resume-website.md`): all routes, chat
      on-topic/off-topic/rate-limit, form submission, PDF download, OG preview

## Note

After ANY content change (`src/data/site.json`, `src/content/**`), the deployed
Worker needs a redeploy to refresh chatbot facts: `npm run facts && cd worker && npx wrangler deploy`.
See README.md.
