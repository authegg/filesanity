# FileSanity

Per-project layer. Scope only; identity and standards come from the
studio layer.

---

## What this is
A multi-page product site for filesanity.com, a metadata cleaner that
competes with metacleaner.com. The home page's hero is the product: drop
a photo, an Office document or a PDF, the page reads what it carries,
lists it in a table, removes it and downloads the clean file, all inside
the visitor's browser. For people who send files to strangers:
journalists, lawyers, HR, freelancers, marketplace sellers, and the
privacy-minded who found metacleaner and hesitated at "upload".

v2 (branch `v2-site`, 2026-09-20) replaces v1's one-page typewriter
manual after the client's verdict: "Looks not professional and a scam
site. Let's do it professionally, complete all pages, and make sure the
file picker is not using the native one."

## Pages
Home `/`, How it works `/how-it-works`, Photos `/photos`, Documents
`/documents`, PDF `/pdf`, Formats `/formats`, Pricing `/pricing`,
Security `/security`, FAQ `/faq`, About `/about`, Contact `/contact`,
Privacy policy `/privacy`, Terms `/terms`, Changelog `/changelog`, Batch
`/batch`, Command line `/cli`, API `/api`, Extension `/extension`, Blog
`/blog` with one page per post and `/blog/feed.xml`, and a 404. Each is
prerendered to its own HTML with its own title, description and JSON-LD;
`sitemap.xml` (with lastmod) and `robots.txt` are written at build. The
nav carries Home, How it works, Formats, Pricing, Security, FAQ; the
footer carries the rest. The blog was added 2026-09-20 at the studio
owner's request, overriding v2's "no blog".

## Constraints
- The three client instructions, taken literally:
  1. Professional: the register of a trusted product company (1Password,
     Proton, Linear, Vercel, Stripe in their calm modes). Soft
     Structuralism from the client's design skill: silver-grey ground,
     white panels on diffused shadows, one clean grotesk, pill controls,
     double-bezel containers, a floating detached nav.
  2. Complete: every page above, real URLs, shared nav and footer, 404,
     sitemap, robots, per-page meta.
  3. The file picker is not the native one: a custom drop surface with
     idle, drag-over, reading, ready, cleaned and error states; a file
     chip; paste; a sample; the hidden `<input type="file">` is triggered
     only from the custom control and never painted. The OS dialog is the
     browser's and cannot be replaced.
- Stack: React + Vite, Tailwind v4 via `@tailwindcss/vite`, Geist
  self-hosted (Fontsource files), Phosphor icons at weight light, no
  animation library, no router library (each route is its own prerendered
  HTML; links are plain anchors), no zip library, hand-written parsers
  kept from v1 in `src/lib` with their tests.
- Client environment: Firefox at 1917x870 primary, phone 390x844, also
  1366x650. Verified in Firefox and Chromium.
- The site is an installable PWA: `scripts/pwa.mjs` writes `dist/sw.js`
  with a precache of every route and asset; `public/_headers` carries the
  CSP and cache rules; `www/` is a one-line Worker that 301s www to the bare domain.
- Hard standards: LCP under 2.0 s at 390x844 throttled (1.6 Mbps, 150 ms,
  4x); 150 kB gzipped JS per route; AA on painted glyphs in every picker
  state; 320 px; keyboard and visible focus; reduced motion renders
  entrances at rest; CLS 0 cold; transform and opacity only;
  backdrop-blur only on the fixed nav and the menu overlay.
- The one fixed idea: **the file never leaves the browser.** No fetch,
  no beacon, no analytics, no cookies, no cookie banner.
- One CTA label everywhere: "Clean a file". On the home page it opens the
  picker; elsewhere it leads to the home page.
- Parser scope (unchanged from v1): JPEG, PNG, DOCX/XLSX/PPTX, PDF (Info
  and uncompressed XMP blanked in place; compressed streams shown and
  kept, and the page says so).

### Open assumptions (the client has fixed none of these)
- Name "FileSanity" and domain filesanity.com from the brief; wordmark set
  in the page's type. `og:url`, the sitemap and the contact mailbox
  (hello@filesanity.com) use the domain as a placeholder.
- Pricing: everything is free, including what v2 listed as Pro and Teams
  (decided 2026-09-20): batch and policy on `/batch`, the command line
  at `/cli/filesanity.mjs`, the self-hosted API at `/api/*.mjs`, the
  extension zip at `/extension/`. All built from `src/lib` by
  `scripts/tools.mjs`, no payments, no accounts.
- Formats: the v1 list; video and audio, GIF, TIFF, PSD, legacy Office
  and OpenDocument are listed as not yet.
- Account: none. The API is self-hosted by the visitor; the site runs none.
- Legal: privacy policy and terms are written to be true for a site that
  collects nothing, dated 20 September 2026, and marked for legal review
  on the page.
- About and Contact carry visible client-marked placeholders for names,
  company registration and postal address. No invented people.
- The sample photograph is generated (Codex) and its metadata is
  invented; the footer says so.
- Images: three abstract product stills (Codex), no people, no padlocks
  or shields.

## Success
At 390x844 with no input, the first screen shows the headline "The file
never leaves your browser.", the "Clean a file" pill and the drop
surface; dropping `tests/files/photo.jpg` lists its camera, position,
date, software and author fields in the table, "Remove all and download"
produces a JPEG that Pillow opens with no EXIF, XMP or IPTC, and the
Playwright network log shows zero requests during read and clean in both
engines. `tests/run.py` measures this.

## The risk
The first screen is the drop tray: one white double-bezel panel fills
the fold below the floating nav, with the headline, the sub-line and the
one pill inside its top-left and the picker at its right; a file dropped
anywhere on the panel, headline included, is read. There is no page
around the tool until you scroll. Full block in `DECISIONS.md`.

## Out of scope
Accounts, a server of any kind behind the site, payments, store listings
for the extension, npm publication of the CLI, audio and video, legacy
binary Office, client-side routing.

---

## Working files
- `DECISIONS.md`: reference pass, both reads, every call with its
  rejected alternative, tells logged
- `PROGRESS.md`: state across sessions
- `HARVEST.md`: manual fixes made after "done", for the studio layer
- `tests/run.py`: the picker's states, every format cleaned and asserted,
  zero network in both engines, batch zip and the policy link
- `tools/ext_check.py`: the extension loaded unpacked into Chromium;
  `tools/pwa_check.py`: offline; `tools/seo_check.py`: every URL's metas,
  JSON-LD, headers, CSP (needs `npx wrangler dev --port 4187`)
- Deploy: `npm run build && npx wrangler deploy` (Worker `filesanity`,
  custom domains filesanity.com and www). Repo github.com/authegg/filesanity.
- `tools/verify.py`: vitals, widths, keyboard, reduced motion, contrast,
  font fallback, weight; `tools/shots.py`: the screenshot set

## Session start
Read the studio layer, this brief, `DECISIONS.md`, `PROGRESS.md`.
Do not re-derive decisions already logged.
