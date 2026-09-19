# Progress

State across sessions. Survives CLI interruptions. Read at session start,
update before ending one.

## Current phase

Built, tested, screenshotted, committed. Awaiting the critic (not run by
the builder) and the client's own browser pass.

## Done

- 2026-09-19 Reference pass (9 searches, 5 macrostructure pulls, 26 hero
  captures, 2 full pages), two reads, anchors chosen: excalidraw-com
  (structure and pace), makingsoftware-com (surface).
- Scaffold: Vite React TS, Tailwind v4 via @tailwindcss/vite, IBM Plex
  Mono and Sans self-hosted (Fontsource, Latin only), no other deps.
- Parsers in `src/lib`: JPEG, PNG, OOXML (DOCX/XLSX/PPTX), PDF, with
  EXIF and XMP/IPTC shared. Blob-slice reads; clean file is a Blob of
  slices. Native DecompressionStream/CompressionStream for zip parts.
- Page: header, hero with the exploded-file figure (empty, reading,
  ready, cleaned, nothing-to-remove, unsupported, error states), the
  file's field table, formats spec table, manual paragraphs, footer.
- Sample: Codex still injected with EXIF, XMP, IPTC, comment
  (`public/sample.jpg`, 198 kB); test corpus in `tests/files`.
- `tests/run.py`: ALL PASS (six formats stripped and verified with
  Pillow, zipfile, python-docx, openpyxl, python-pptx, pypdf; edge
  states; zero network requests).
- `tools/shots.py`: fold and full at 1917x870 (Firefox and Chromium),
  1366x650, 390x844 (Chromium and Firefox); flow strip; network log.
- `tools/verify.py`: LCP 932 ms and CLS 0.006 throttled phone; widths
  320 to 1440 clean; six tab stops with rings; reduced motion 0s; dark
  mode shots; JS 80.0 kB gz; no dashes.
- `shots/anchors-vs-page.png`, `public/og.png`.
- DECISIONS.md, CLAUDE.md with open assumptions, README.

## In progress

Nothing.

## Next

- Critic pass in a fresh session (`references/critic.md`), then the
  client's Firefox pass at 1917x870 with a reload mid-page.
- If the client supplies pricing, a name change or a formats list, update
  CLAUDE.md's open assumptions first.
- Candidates for v2, logged not built: PDF object streams (needs a FlateDecode
  rewrite), MP4/MOV `udta` and `meta` atoms, GIF/TIFF, DOCX comment
  removal as an explicit second action.

## Blocked

Nothing.
