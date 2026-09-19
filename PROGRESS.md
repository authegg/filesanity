# Progress

State across sessions. Survives CLI interruptions. Read at session start,
update before ending one.

## Current phase

v2 built on branch `v2-site` (2026-09-20): the professional multi-page
site with the custom picker. Build passes with every route prerendered,
`tests/run.py` ALL PASS (103 checks, Chromium and Firefox),
`tools/verify.py` VERIFY OK, shots taken. Awaiting the critic (not run by
the builder) and the client's own Firefox pass.

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

## In progress

Nothing.

## Next

- Critic in a fresh session (`references/critic.md`), then the client's
  Firefox pass at 1917x870 with a reload mid-page.
- Client to supply: names and company details (About), postal address
  and mailbox (Contact), the domain, and a legal review of Privacy and
  Terms.
- v3 candidates, logged not built: PDF object streams, MP4/MOV atoms,
  EXIF inside pictures embedded in Office packages, batch.

## Blocked

Nothing.
