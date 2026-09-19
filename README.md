# FileSanity

Metadata cleaner whose hero is the product: drop a JPEG, PNG, DOCX, XLSX,
PPTX or PDF, the page reads its metadata in the browser, shows it as an
exploded-parts diagram and a table, strips it and downloads the clean
file. No server, no upload, no analytics.

```
npm install
npm run build
npx vite preview --port 4184 --strictPort --host 127.0.0.1
python3 tests/run.py          # strips every file in tests/files, asserts with Pillow, zipfile, pypdf
python3 tools/shots.py        # screenshots, flow strip, network log
python3 tools/verify.py       # LCP, CLS, widths, keyboard, reduced motion, dark, JS weight
python3 tools/make_samples.py # rebuild public/sample.jpg and tests/files from assets-src
```

Parsers live in `src/lib`: `jpeg.ts`, `png.ts`, `ooxml.ts`, `pdf.ts`,
with `exif.ts` and `xmp.ts` shared. Files are read by Blob slices; the
clean file is a Blob of slices of the original.
