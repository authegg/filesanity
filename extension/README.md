# FileSanity browser extension (v3)

One Manifest V3 codebase for Chrome and Firefox. It removes metadata from a JPEG, PNG, HEIC, MP4, MOV, DOCX, XLSX, PPTX or PDF the moment a page receives it from a file input or a drop, using the same parsers as the site (`src/lib`). Files never leave the browser.

## Build

```
npm run build:ext
```

Writes `dist-extension/chrome/`, `dist-extension/firefox/` and a zip of each (`filesanity-<browser>-<version>.zip`). The two differ only in the manifest: Chrome gets `background.service_worker`, Firefox gets `background.scripts` and `browser_specific_settings.gecko` (id `extension@filesanity.com`).

Load unpacked: Chrome, `chrome://extensions`, Developer mode, "Load unpacked", pick `dist-extension/chrome`. Firefox, `about:debugging#/runtime/this-firefox`, "Load Temporary Add-on", pick `dist-extension/firefox/manifest.json`.

Check: `python3 tools/ext_check.py` loads the Chrome build in headless Chromium and proves an input upload and a drop arrive without GPS, Artist or City, that a saved policy and a "never" rule apply, and that the popup and options render.

## Files

| File | Job |
| --- | --- |
| `src/content.ts` | On every page: holds `input`/`change` on file inputs, `drop` events and pastes that carry files, swaps in clean copies, replays the event. Answers the popup's "which site" and the background's "save this image". |
| `src/background.ts` | Counts (per tab, per day), the toolbar badge, the subscriber log, the plan refresh, the "Save without metadata" menu. |
| `src/popup.*` | Counts, the pause switch for this site, a drop zone that cleans one file and downloads it. |
| `src/options.*` | Connection token, saved policy, site rules, the log. |
| `src/store.ts` | Storage shape and the one network call, `GET https://filesanity.com/api/ext/me`. |

## Free and paid

Free, no account: auto-clean on upload everywhere, the counts, the per-site pause, the popup drop zone.
Pro, Team or API, after pasting a connection token from `/account`: the saved policy on every upload, per-site rules (always, never, ask), "Save without metadata" on images, a local log of the last 100 cleans.

## Permissions, and why each is needed

| Permission | Why |
| --- | --- |
| Content script on `<all_urls>` | The extension's single purpose is to clean files as a site receives them, and that can be any site. The script listens for file-input changes and drops only; it reads no page content and sends nothing. |
| `storage` | Keeps the counts, paused sites, site rules, the log and the connection token in the browser. |
| `contextMenus` | Adds "Save without metadata" to images, for subscribers. |
| `downloads` | Saves the clean copy made from that menu item under its own name. |
| Host `https://filesanity.com/*` | Lets the extension call `GET /api/ext/me` with the connection token to read the plan and saved policy. That response holds `{ plan, policy }` only. No file, file name or visited site is ever sent. The endpoint also allows any origin, so Firefox users who decline the host permission still connect. |

No `tabs`, `scripting`, `webRequest` or `cookies` permission is asked for.

## Known limits

- A replayed paste is untrusted too: pages that read the pasted files (upload fields, chat boxes) get the clean copies, but the browser's own insert of an image into a bare editable area does not run.
- A replayed drop is an untrusted event; a page that ignores untrusted drops gets nothing; pausing the extension for that site restores the plain drop.
- "Save without metadata" fetches the image from the page, so a cross-origin image served without CORS headers cannot be read; the extension says so.
- In Firefox the popup's "Choose a file" opens the panel in a tab, because Firefox closes a popup when its file dialog opens.
