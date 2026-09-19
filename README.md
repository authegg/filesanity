# FileSanity

Metadata cleaner that runs in the browser. Fourteen prerendered pages;
the home page's hero is the picker: drop a JPEG, PNG, DOCX, XLSX, PPTX
or PDF, the page reads its metadata, lists it, removes it and downloads
the clean file. No server, no upload, no analytics, no cookies.

```
npm install
npm run build                 # tsc, client build, ssr build, prerender every route
fuser -k 4184/tcp; setsid nohup npx vite preview --port 4184 --strictPort --host 127.0.0.1 < /dev/null &
python3 tests/run.py          # picker states, every format cleaned and asserted, zero network (Chromium and Firefox)
python3 tools/verify.py       # vitals, widths, keyboard, menu, reduced motion, font fallback, contrast, weight
python3 tools/shots.py        # the screenshot set in shots/
python3 tools/make_samples.py # rebuild public/sample.jpg and tests/files from assets-src
```

Parsers live in `src/lib` (`jpeg.ts`, `png.ts`, `ooxml.ts`, `pdf.ts`,
with `exif.ts` and `xmp.ts` shared). Pages in `src/pages`, the picker
and shell in `src/ui`, shared facts in `src/content.ts`, routes in
`src/routes.ts`, prerender in `scripts/prerender.mjs`.
