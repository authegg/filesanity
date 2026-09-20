# FileSanity browser extension

Cleans a photo, Office document or PDF the moment you choose it in a file picker on any site, before the page
sees it. The same parsers as filesanity.com, running inside your browser. Nothing is sent anywhere.

## Install (unpacked)

1. Unzip this file.
2. Chrome, Edge, Brave: open `chrome://extensions`, turn on Developer mode, "Load unpacked", pick the folder.
   Firefox: open `about:debugging#/runtime/this-firefox`, "Load Temporary Add-on", pick `manifest.json`
   (temporary add-ons are removed when Firefox closes; a signed build is the next step).
3. The toolbar button toggles it and counts the files it has cleaned.

## Limits

Only uploads that go through an `<input type="file">` are cleaned. A file dragged straight onto a page, or pasted,
is not. Files FileSanity cannot read pass through untouched.
