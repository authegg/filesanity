# Contributing

Thank you for helping. Bug reports, sample files that the cleaner gets wrong and small fixes are the most useful contributions.

## Before you start

- For a security problem, follow [SECURITY.md](SECURITY.md) instead of opening an issue.
- For anything larger than a fix, open an issue first so we can agree on the approach.
- Never attach a file with real personal metadata. Make a sample and set the fields to invented values.

## Set up

Node 24 and Python 3 are needed. The parser tests read the results with `pip install pillow pillow-heif python-docx openpyxl python-pptx pypdf pikepdf mutagen`, plus ffmpeg and Ghostscript.

```sh
npm install
npm run build
npx wrangler dev --port 8787   # site plus /api; copy the values listed in wrangler.jsonc into .dev.vars
```

## Checks

Run these before opening a pull request:

```sh
npm run lint
python3 tests/lib.py              # every parser against the fixtures in tests/files
node tools/saas_check.mjs         # account API, needs wrangler dev running
python3 tools/site_check.py       # pages in Firefox and Chromium, needs Playwright
```

## Rules for code

- No new runtime dependency without an issue first. The parsers are hand-written on purpose.
- The website must not send file contents or file details anywhere. Pages make no analytics call and set no cookie.
- A parser change comes with a fixture in `tests/files` and an assertion in `tests/lib.py`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/), for example `fix(pdf): blank XMP in object streams`.

By contributing you agree that your work is released under the [MIT licence](LICENSE) and that you follow the [code of conduct](CODE_OF_CONDUCT.md).
