# FileSanity

Per-project layer. Scope only; identity and standards come from the
studio layer.

---

## What this is
A one-page launch site for filesanity.com, a metadata cleaner that
competes with metacleaner.com, whose hero is the product itself: drop a
photo or an Office document, the page reads what it carries, shows it in
a table, strips it and downloads the clean file, all inside the visitor's
browser. For people who send files to strangers: journalists, lawyers,
HR, freelancers, marketplace sellers, and the privacy-minded who found
metacleaner and hesitated at "upload".

## Constraints
- Stack: React + Vite, Tailwind v4 via `@tailwindcss/vite`, self-hosted
  fonts, no animation library, no zip library (native
  `DecompressionStream` / `CompressionStream`), hand-written parsers.
- Client environment: Firefox at 1917x870 primary, phone 390x844, also
  1366x650. Verified in Firefox and Chromium.
- Hard cap 150 kB gzipped JS total; hero image under 200 kB.
- The one fixed idea (from the brief, not contradicted by the client):
  **the file never leaves the browser.** Metadata is read and stripped on
  the visitor's machine. No fetch, no beacon, no analytics; no size cap
  from a server, no daily count, no trust claim to make.
- One CTA label everywhere: "Clean a file". It opens the file picker.
- Scope of the parser for v1: JPEG (APP1 EXIF and XMP, APP13 IPTC, COM),
  PNG (tEXt, zTXt, iTXt, eXIf, tIME), DOCX/XLSX/PPTX (docProps/core.xml,
  app.xml, custom.xml). PDF: the Info dictionary and the XMP packet are
  read and shown, and their values are blanked in place; metadata inside
  compressed object streams is neither read nor removed, and the page
  says so.

### Open assumptions (the client has fixed none of these)
- Name: "FileSanity" and the domain filesanity.com are taken from the
  brief as given; wordmark is set in the page's type, no logo supplied.
- Pricing: none. The page has no pricing section until the client
  supplies one. Free use is implied by the absence of a server cost and is
  not stated as a plan.
- Formats: the v1 parser list above is the builder's choice, scoped to
  what can be done correctly without a library. Audio and video
  (m4a/m4v/mov/mp4), legacy Office (doc/xls/ppt), OpenDocument, GIF, TIFF,
  PSD and VSD are not read in v1 and are named on the page as not yet.
- Account: none. Nothing on the page requires or mentions one.
- API: none.
- Legal: the page collects nothing, stores nothing and sells nothing, so
  it ships no privacy policy or terms link; a one-line statement in the
  footer says why. Revisit when the client adds anything that collects.
- The sample photograph is generated (Codex CLI) and injected with EXIF,
  XMP and IPTC by the build; it stands in for "a photo from your phone"
  and is captioned as a sample.
- Domain for `og:url`: https://filesanity.com, a placeholder until the
  client confirms.

## Success
At 390x844 with no input, the first screen shows what FileSanity does
(the exploded file diagram and its labels), that the file stays on your
device (the headline), and the "Clean a file" button; dropping the
bundled sample JPEG lists its camera, position, date, software and author
fields, and "Strip and download" produces a JPEG that Pillow opens with
no EXIF, XMP or IPTC, while the Playwright network log shows zero
requests after page load.

## The risk
The hero is a hardware manual's exploded-parts diagram of the visitor's
own file: each metadata segment drawn as a plate lifted off the picture,
joined by a leader line to its real values, with a safety-orange tag on
every plate that will be removed; cleaning knocks the plates off and
leaves the picture plate alone. No dropzone icon, no padlock, no feature
columns. In the full-page thumbnail a stranger sees a two-line
typewriter headline beside a boxed figure of tilted plates with labels
and orange tags, then one spec table.

## Out of scope
Accounts, pricing, API, anything server-side (no backend, no upload, no
analytics, no error reporting), audio and video formats, legacy binary
Office formats, batch cleaning, a browser extension, a CLI.

---

## Working files
- `DECISIONS.md`: autonomous calls + rejected alternatives, the read, `RISK:`
- `PROGRESS.md`: state across sessions, survives CLI interruptions
- `HARVEST.md`: manual fixes made after "done", for the studio layer
- `tests/`: sample files and `run.py`, which strips each and asserts

## Session start
Read the studio layer, this brief, `DECISIONS.md`, `PROGRESS.md`.
Do not re-derive decisions already logged.
