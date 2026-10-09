# FileSanity

Removes hidden metadata from photos, Office documents and PDFs, inside your browser. The file is never uploaded.

[filesanity.com](https://filesanity.com) · made by authegg · MIT licence

## What it cleans

- **Photos** (JPEG, PNG): GPS position, camera and serial number, dates, editing app, names.
- **Office** (DOCX, XLSX, PPTX): author, last editor, company, manager, editing time, custom properties, the preview thumbnail.
- **PDF**: the Info dictionary and uncompressed XMP, blanked in place. Compressed metadata streams are shown and kept, and the result says so.

The parsers are hand-written in `src/lib`, with tests in `tests/`.

## Run it

```sh
npm install
npm run build
npx wrangler dev --port 8787        # site plus /api, values from .dev.vars
```

Checks: `python3 tests/lib.py`, `node tools/saas_check.mjs`, `python3 tools/site_check.py`.

## Layout

- `src/site`: the pages, prerendered per route by `scripts/prerender.mjs`.
- `src/shared`: the cleaner tray, batch window and hooks.
- `src/lib`: the format parsers.
- `worker/`: the Cloudflare Worker that serves the site and answers `/api/*` (sign-in, billing webhook, API keys, hosted API).
