# filesanity

Removes metadata (GPS position, camera, author, dates, document properties) from photos, videos, audio, Office documents and PDFs. It runs on your machine: the file never leaves it, and the tool makes no network request at all.

It is the same cleaner that runs in the browser at [filesanity.com](https://filesanity.com).

## Install

```sh
npm i -g filesanity
```

It needs Node 20.12 or later.

## Use

```sh
filesanity inspect photo.jpg            # what the file carries; writes nothing
filesanity photo.jpg memo.pdf           # writes photo-clean.jpg and memo-clean.pdf beside them
filesanity -o clean/ ~/Desktop/send     # cleans a folder into clean/send/..., subfolders kept
filesanity --in-place offer.docx        # replaces the file with its clean copy
filesanity --keep exif,iptc photo.jpg   # keeps EXIF and IPTC, removes the rest
filesanity --neutral-name -o out IMG_20260411_draft.jpg   # writes out/photo.jpg
filesanity --json inspect *.pdf         # machine-readable
```

`filesanity --help` lists every kind `--keep` accepts.

Each clean copy is read back before it is saved; if anything removable is still in it, nothing is written and the file is reported as failed.

Exit codes: 0 every file done, 1 a file failed or was skipped (unsupported files are skipped with the reason), 2 usage error.

## Formats

JPEG, PNG, HEIC, WebP, MP4, MOV, M4A, MP3, DOCX, XLSX, PPTX, ODT, ODS, ODP and PDF, recognised by their bytes, not their extension.

Some things are in the content rather than the metadata (hidden sheets, tracked changes, comments, earlier PDF saves). Those are shown by `inspect` and left as they are, because removing them would change the document.

## License

MIT
