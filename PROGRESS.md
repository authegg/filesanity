# Progress

State across sessions. Survives CLI interruptions. Read at session start,
update before ending one.

## Current phase

v2 built on branch `v2-site` (2026-09-20): the professional multi-page
site with the custom picker. Critic round 1 returned FAIL 10 (source
claim, unmarked placeholders, the mailbox mark, menu focus trap, default
easings, six equal cards, comma headlines, six-item lists, z-index);
all ten fixed and logged in DECISIONS.md. Build passes with every route
prerendered plus `/source/` and a source map, `tests/run.py` ALL PASS
(103 checks), `tools/verify.py` VERIFY OK (now also easing on every
route and the menu trap in both engines), shots refreshed. Awaiting
critic round 2 and the client's own Firefox pass.

## Done

- 2026-09-20 Reference pass (7 searches, 22 hero captures, 6 full pages
  at 300px), two reads, anchors chosen: minimal-so (structure),
  mollie-com--pricing (surface). Anchors kept in `refs/`.
- Scaffold: Geist Variable (Latin, self-hosted, preloaded, metric-matched
  fallback), Phosphor light, Tailwind v4, no router, no motion library.
- Prerender: `vite build` + `vite build --ssr` + `scripts/prerender.mjs`
  writes `dist/<route>/index.html` and `dist/<route>.html` per route
  with its own title, description and canonical, plus `404.html`,
  `sitemap.xml`, `robots.txt`; the client hydrates the page for its path.
- Pages: Home, How it works, Photos, Documents, PDF, Formats, Pricing,
  Security, FAQ, About, Contact, Privacy, Terms, Changelog, 404.
- Picker (`src/ui/Picker.tsx`): idle, drag-over, reading, ready, cleaned,
  error; file chip with glyph, name, size, remove; paste; sample; the
  hidden input clicked only from custom controls; the drop surface is a
  button; a `role=status` live region; the field table inside the hero
  panel, stacked below 40rem.
- Nav: floating detached pill, morphing hamburger, full-screen staggered
  menu with focus management; footer with the rest of the pages.
- Images: three Codex stills as AVIF (4 to 17 kB), srcset; `og.png` is
  the home fold.
- Tests: `tests/run.py` rewritten for the picker (states, synthetic drop,
  paste, keyboard, focus after clean, zero network in both engines).
- `tools/verify.py`: LCP 644 ms and CLS 0.0001 on the throttled phone
  (home), 636 and 616 ms on Pricing and FAQ; desktop LCP 44 ms; no
  horizontal scroll at five widths on fifteen routes; 14 tab stops with
  2px rings; the input never a tab stop; menu focus and Escape; reduced
  motion at rest; font fallback moves the fold 0px; contrast of painted
  glyphs 5.9:1 or better in every picker state; JS 104.4 kB gz, CSS 7.1.
- `tools/shots.py`: home fold and full at 1917x870 (Firefox), 1366x650,
  390x844 (Firefox and Chromium); `picker-states-1917x870.png`;
  `menu-390x844.png`; one full page per other route at 1440;
  `anchors-vs-page.png`.
- CLAUDE.md rewritten for v2; DECISIONS.md carries the v2 record on top
  of the v1 parser record.

## Done 2026-09-20, v1.1

- TypeScript 7. Repo github.com/authegg/filesanity (private), deployed as
  Cloudflare Worker `filesanity` with static assets on filesanity.com and
  www (wrangler.jsonc, `_headers`, `_redirects`).
- Blog: five posts in `src/posts/`, `/blog`, RSS, BlogPosting JSON-LD.
- PWA: manifest, icons, hand-written `sw.js` from `scripts/pwa.mjs`,
  offline verified by `tools/pwa_check.py`.
- SEO: `SEO.md` audit; JSON-LD graph per page, twitter/og metas, lastmod
  sitemap, CSP and cache headers, www redirect; `tools/seo_check.py`.
- Pro and Teams built free: `/batch` (folder in, zip out, policy link),
  `/cli`, `/api`, `/extension`, all served from the site and built by
  `scripts/tools.mjs`; `src/lib/xml.ts` replaces DOMParser; policy via
  `?keep=` on `/` too. `tests/run.py` 155 checks, `tools/ext_check.py`.
- Changelog 1.1, pricing rewritten, FAQ answer updated.

## Done 2026-09-20, launch

- Open source: repo public under MIT, README for strangers, `refs/`
  untracked. About, Contact, Privacy, Terms rewritten for "authegg, an
  open-source project"; no client placeholders remain; legal note kept.
- hello@filesanity.com forwards via Cloudflare Email Routing (API).
- Blog stills: five Codex stills, post plate and index thumbnails.
- `/source` is a prerendered page (the bare file was unstyled by CSP).
- Critic round 3 FAIL 4 (all Q5), round 4 PASS. SHIPPED.md row appended.

## In progress

Nothing.

## Next

- Critic in a fresh session (`references/critic.md`), then the client's
  Firefox pass at 1917x870 with a reload mid-page.
- Client to supply: names and company details (About), postal address
  and mailbox (Contact), the domain, and a legal review of Privacy and
  Terms.
- Client's own Firefox pass at 1917x870 with a reload mid-page; count
  what it finds for HARVEST.md.
- Extension store listings and a signed Firefox build; npm publication of
  the CLI; Search Console and Bing verification (client accounts).
- v3 candidates, logged not built: PDF object streams, MP4/MOV atoms,
  EXIF inside pictures embedded in Office packages, per-field policy,
  per-route code splitting if JS nears 150 kB.

## Blocked

Nothing.
