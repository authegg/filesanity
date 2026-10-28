# FileSanity

[![CI](https://github.com/authegg/filesanity/actions/workflows/ci.yml/badge.svg)](https://github.com/authegg/filesanity/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-0d5641.svg)](LICENSE)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Ffilesanity.com&label=filesanity.com)](https://filesanity.com)

Removes hidden metadata from photos, video, audio, Office documents and PDFs, inside your browser. On the website the file is never uploaded.

[filesanity.com](https://filesanity.com) · made by [authegg](https://authegg.com) · [MIT licence](LICENSE)

## What it cleans

| Files | Formats | Removed |
|---|---|---|
| Photos | JPEG, PNG, HEIC, WebP | GPS position, camera and serial number, dates, editing app, names, C2PA content credentials |
| Video and audio | MP4, MOV, M4A, MP3 | Location, device, dates, encoder, ID3 tags |
| Office | DOCX, XLSX, PPTX, ODT, ODS, ODP | Author, last editor, company, manager, editing time, custom properties, preview thumbnail |
| PDF | PDF | The Info dictionary and XMP, plain or compressed, blanked in place so no offset moves |

It also flags what it does not change: hidden sheets and slides, tracked deletions, comments, speaker notes, embedded files, earlier PDF saves, PDF JavaScript, and file names that carry dates or emails. Encrypted PDFs are shown as not cleaned.

The parsers are hand-written in `src/lib`, with no third-party parsing code, and tested against real files in `tests/`.

## Run it

Node 24 and Python 3.

```sh
npm install
npm run build
npx wrangler dev --port 8787        # site plus /api, values from .dev.vars
```

Checks: `npm run lint`, `python3 tests/lib.py`, `node tools/saas_check.mjs`, `python3 tools/site_check.py`.

## Layout

- `src/lib`: the format parsers.
- `src/shared`: the cleaner tray, batch window and hooks.
- `src/site`: the pages, prerendered per route by `scripts/prerender.mjs`.
- `extension/`: the browser extension for Chromium and Firefox (`npm run build:ext`).
- `worker/`: the Cloudflare Worker that serves the site and answers `/api/*` (sign-in, billing webhook, API keys, hosted API).

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [code of conduct](CODE_OF_CONDUCT.md). Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## Licence

[MIT](LICENSE) © authegg
