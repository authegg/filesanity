# FileSanity

This file holds the per-project layer: scope only. Identity and standards come from the studio layer.

---

## What this is
filesanity.com is a metadata cleaner that competes with metacleaner.com. It is a product site with a small SaaS behind it.

- **The home page's hero is the product.** Drop a photo, an Office document or a PDF. The page lists what the file carries, removes it and downloads the clean copy, all inside the visitor's browser.
- **The paid side** sells convenience:
  - batches with a saved policy and a record (Pro);
  - five seats with a shared policy (Team);
  - a hosted API with keys, quotas and signed reports (API).
- **Billing** goes through Lemon Squeezy as merchant of record. The owner is in the Philippines.

Audience: people who send files to strangers. That means journalists, lawyers, HR staff, freelancers and marketplace sellers.

v3 (branch `v3-rebuild`, 2026-10-08) is a full rebuild. The owner picked direction J1 after four gate rounds (DECISIONS.md).

## Pages
Every route is prerendered to `dist/<route>.html` with its own title, description and JSON-LD:

- `/`
- `/how-it-works`
- `/photos`, `/documents`, `/pdf`
- `/batch`
- `/pricing`
- `/developers` (the API)
- `/extension` (the browser extension; source in `extension/`, build `npm run build:ext`)
- `/security`
- `/faq`
- `/about`, `/contact`
- `/privacy`, `/terms`
- `/sign-in`, `/account` (both noindex)
- `/404`

The build also writes `sitemap.xml` and `robots.txt`.

The nav carries How it works, Batch, API, Pricing, Security and Account. The footer carries the rest.

## Constraints
- **The one fixed idea:** on the website, the file never leaves the browser, batches included.
  - Marketing pages make no API call, carry no analytics and set no cookie.
  - Only the hosted API receives files, and every page that mentions it says so.
- **Look: J1.**
  - Forest #0d5641 on every section, with cream ink and lime #e3f07a for every action.
  - The wordmark is File plus "Sanity" in lime.
  - Headings are Archivo at 112% width.
  - Tools (the tray, the batch window, account panels) are cream sheets.
  - Radius is 6px everywhere.
  - Tokens live in `src/j/j.css` (`.jv-1`), and pages in `src/site/site.css`.
- **The CTA** is labelled "Clean a file" everywhere. On pages with a cleaner it opens the picker; elsewhere it links to `/#cleaner`.
- **Stack:**
  - React 19 and Vite, with plain CSS.
  - Archivo self-hosted through Fontsource.
  - No router library, no animation library, no zip library.
  - Hand-written parsers in `src/lib` with their tests.
- **Worker:** `worker/index.ts` serves the assets and answers `/api/*`. Storage is KV `DB`. It also sends sign-in links through Cloudflare Email Sending (`send_email` binding `EMAIL`), checks Turnstile on sign-in, and receives the Lemon Squeezy webhook.
- **Client environment:**
  - Firefox at 1917x870 is primary, then 1366x650 and a 390x844 phone.
  - The phone matrix is 320x568, 360x780, 390x844, 412x915, 430x932 and 667x375.
  - Verified in Firefox and Chromium.
- **Hard standards:** the studio's. JS is currently 103 kB gzipped against 150.
- **Parser scope:**
  - JPEG, PNG, HEIC, DOCX, XLSX, PPTX and PDF.
  - HEIC Exif and XMP items are blanked in place (same length); C2PA in JPEG APP11 and PNG caBX is removed.
  - In PDFs, the Info dictionary and uncompressed XMP are blanked in place. Compressed streams are shown and kept, and the page says so.

### Open assumptions (owner to confirm; PLACEHOLDERS.md)
- Prices and limits: Pro $6, Team $24, API $29, plus the API quotas.
- Lemon Squeezy buy links and variant IDs.
- The Turnstile keys and filesanity.com onboarded for Cloudflare Email Sending.
- Company name, registration and address.

## Success
- At 390x844 with no input, the first screen shows the headline, "Clean a file" and the tray.
- The sample cleans with zero requests during the clean, and the output has no GPS, Artist or City.
- `tools/site_check.py` passes in both engines.
- `tools/saas_check.mjs` passes 16 of 16.

## The risk
One saturated forest green on every section of every page, with each tool a cream sheet laid on it. The full block is in DECISIONS.md.

## Out of scope
- Formats: audio and video, legacy binary Office.
- A blog.
- Porting the v2 CLI (it is at commit bc9103d). The extension was rebuilt for v3 (DECISIONS.md, "Extension (v3)").
- Server-side batch processing.

---

## Working files
- `DECISIONS.md`, `PROGRESS.md`, `PLACEHOLDERS.md`, `HARVEST.md`, `RESEARCH.md`, `TRENDS.md`.
- Build: `npm run build`.
- Local: `npx wrangler dev --port 8787`, with values in `.dev.vars`: DEV_LINKS=1, the Turnstile test secret, the webhook secret, the variant IDs and the report key. Restart it after each build.
- Checks: `node tools/saas_check.mjs`, `python3 tools/site_check.py [--shots]`, `python3 tests/lib.py`.
- Deploy: ask first. Then `npm run build && npx wrangler deploy`. It needs:
  - the KV namespace id in `wrangler.jsonc`;
  - the secrets listed there;
  - the webhook URL `https://filesanity.com/api/webhooks/lemonsqueezy` in Lemon Squeezy.

## Session start
Read the studio layer, this brief, DECISIONS.md and PROGRESS.md. Do not re-derive logged decisions.
