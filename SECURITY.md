# Security policy

FileSanity's promise is that a file cleaned on the website never leaves the browser, and that a cleaned file carries none of the metadata the page says it removed. A break in either is a security bug.

## Reporting a vulnerability

Please report privately, not in a public issue:

- through [GitHub private vulnerability reporting](https://github.com/authegg/filesanity/security/advisories/new), or
- by email to hello@filesanity.com.

Include the steps to reproduce and, if it concerns a file, a sample that shows it (strip anything personal first). We acknowledge every report and keep you informed until it is fixed. We credit reporters in the advisory unless you ask us not to.

## In scope

- The website at filesanity.com and its account and billing API (`worker/`).
- The parsers in `src/lib`: metadata left behind after a clean, or a file that makes the cleaner hang, crash or write a broken file.
- Any request the website sends with file contents or file details.
- The hosted API (`/api/v1/clean`) and the browser extension in `extension/`.

## Out of scope

- Formats the site lists as not supported, and metadata the page shows as kept.
- Reports from automated scanners with no demonstrated impact.
- Denial of service by volume, and social engineering.

Only the latest version on `main` is supported; it is what filesanity.com runs.
