# FileSanity

**The file never leaves your browser.** Drop a JPEG, PNG, Word, Excel, PowerPoint or PDF on [filesanity.com](https://filesanity.com); the page reads the metadata it carries, lists every field, removes it and downloads the clean copy. No server, no upload, no account, no analytics, no cookies. MIT licence.

The same hand-written parsers also ship as:

- **Batch**: a folder in, a clean zip out, in the browser, with a shareable policy of what to keep ([/batch](https://filesanity.com/batch))
- **Command line**: one dependency-free file for Node 20+ ([/cli](https://filesanity.com/cli))
- **API** you host yourself, on a Cloudflare Worker or Node ([/api](https://filesanity.com/api))
- **Browser extension** that cleans a file the moment you pick it for upload on any site ([/extension](https://filesanity.com/extension))

## What it removes

| Format | Removed | Kept, and shown |
|---|---|---|
| JPEG | EXIF (camera, GPS, dates, owner, serial, thumbnail), XMP, IPTC, Photoshop resources, comments | ICC profile; the orientation flag is written back so the photo displays upright |
| PNG | tEXt, zTXt, iTXt (incl. XMP), eXIf, tIME | iCCP |
| DOCX, XLSX, PPTX | core, app and custom properties, the thumbnail, zip entry timestamps | comment and tracked-change authors (removing them edits the document) |
| PDF | Info dictionary and uncompressed XMP, blanked in place at the same length | compressed XMP streams and object streams, with a note saying so |

Files are sniffed by their first bytes, never by extension. The clean copy is assembled from slices of the original: nothing is decoded or re-encoded.

## Repository

```
src/lib/        the parsers (jpeg, png, ooxml, pdf, exif, xmp, xml, zip, bytes)
src/pages/      one file per route, prerendered to static HTML
src/ui/         the picker, nav, footer
src/posts/      the blog
cli/ api/ extension/ www/   the tools built from src/lib, and the www redirect worker
scripts/        prerender, pwa (service worker), tools (cli, api, extension bundles)
tests/run.py    every format cleaned through the real page and asserted with Pillow, python-docx, openpyxl, python-pptx, pypdf; zero network in Chromium and Firefox
tools/          verify.py (vitals, widths, keyboard, contrast), seo_check.py, pwa_check.py, ext_check.py, shots.py
```

```
npm install
npm run build                       # tsc, client, ssr, prerender, tools, service worker -> dist/
npx vite preview --port 4184        # then, in another shell:
python3 tests/run.py                # needs playwright, pillow, python-docx, openpyxl, python-pptx, pypdf
node dist/cli/filesanity.mjs --inspect tests/files/photo.jpg
```

Deploy: `npx wrangler deploy` (Cloudflare Worker with static assets). The www redirect is its own worker in `www/`.

## Contributing

Issues and pull requests are welcome. A parser change needs a test file in `tests/files` and an assertion in `tests/run.py`; a copy change must keep the prerender's guard happy (no em or en dashes). `DECISIONS.md` records why things are the way they are; read it before proposing a different shape.

## Licence

MIT. Copyright (c) 2026 authegg.
