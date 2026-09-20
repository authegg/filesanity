# filesanity, the command line

One file, no dependencies, Node 20 or newer. The same parsers as the page.

    curl -O https://filesanity.com/cli/filesanity.mjs
    node filesanity.mjs photo.jpg                       # writes photo-clean.jpg beside it
    node filesanity.mjs --out clean/ ./outbox           # a folder in, the same shape out
    node filesanity.mjs --inspect --json report.pdf     # read only, one JSON line per file
    node filesanity.mjs --keep exif,iptc *.jpg          # a policy: keep those kinds, remove the rest

Options: `--out DIR`, `--keep a,b,c` (exif, xmp, iptc, com, text, exif-png, time, core, app, custom, thumbnail, info),
`--inspect`, `--json`, `--quiet`. Exit code 1 if any file was refused, 2 for a usage error.
