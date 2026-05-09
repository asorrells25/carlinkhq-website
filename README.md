# carlinkhq.com — marketing site

Static site for `carlinkhq.com`. Deployed via Cloudflare Pages.

## Files

- `index.html` — landing page (hero, features, organizer pitch, beta signup CTA)
- `privacy.html` — Privacy Policy page; client-side fetches the canonical doc from Supabase
- `terms.html` — Terms of Service page; same pattern
- `support.html` — Support / FAQ / contact page (used for App Store "Support URL")
- `legal.js` — small script that fetches `legal_documents_current` from Supabase and renders Markdown
- `styles.css` — single shared stylesheet

## Before deploying

1. Open `legal.js` and replace `REPLACE_WITH_PUBLISHABLE_ANON_KEY` with your Supabase project's anon (publishable) key. Find it in Supabase Dashboard → Project Settings → API → "anon / public".
2. The Supabase URL is already set to your project (`gdnzkwfoyzqmliijtyos.supabase.co`).
3. Add a `favicon.png` (32×32) and `apple-touch-icon.png` (180×180) at the repo root if you want them. The site renders fine without them.

## Deploy via Cloudflare Pages (recommended path)

### Option A — drag-and-drop (easiest)

1. Go to **Cloudflare → Workers & Pages → Create → Pages → Upload assets**.
2. Drag this entire `web/` folder into the upload box. Or zip it first and upload the zip.
3. Name the project `carlinkhq` (anything, doesn't matter for the URL).
4. After the first deploy, Cloudflare gives you a `*.pages.dev` URL. Click **Custom domain → Set up a custom domain → carlinkhq.com**.
5. Cloudflare walks you through DNS — if your domain is already on Cloudflare, it's two clicks. If your DNS is elsewhere (e.g., Namecheap), CF tells you exactly which CNAME to add.

### Option B — GitHub-connected (better for ongoing edits)

1. Push this `web/` folder to a private GitHub repo.
2. Cloudflare → Pages → Create → **Connect to Git** → select the repo.
3. Build settings: leave build command empty, output directory = `/` (or wherever the html lives in the repo).
4. Each push to `main` re-deploys automatically.

## App Store readiness

This site provides three URLs Apple Connect requires:

- **Support URL**: `https://carlinkhq.com/support.html`
- **Privacy Policy URL**: `https://carlinkhq.com/privacy.html`
- **Marketing URL**: `https://carlinkhq.com/`

Plug those into App Store Connect → App Information when you submit the build.

## Notes

- The site is fully static — no build step, no node_modules, no SPA framework. Three HTML files, one CSS file, one JS file. Loads fast, indexes easily, and is trivial to edit.
- The privacy / terms pages fetch live from Supabase so they never drift from the in-app canonical copy. The script does its own minimal Markdown rendering — no external library load.
- Original styling and copy. No third-party tracking, ads, or analytics included. If you want analytics later, Cloudflare Web Analytics is free and privacy-respecting; just toggle it on in the project settings.
