# SEO audit, 2026-09-20

Audited the built `dist/` of the v2 site (21 prerendered routes, 5 of
them blog posts) and the way Cloudflare static assets serve it, using
`npx wrangler dev`. Verified with `tools/seo_check.py` in Chromium and
Firefox, and `tests/run.py` against the served site with its headers.

## Findings

| # | Finding | Severity | State |
|---|---------|----------|-------|
| 1 | No structured data except a BlogPosting on posts; no Organization, WebSite, SoftwareApplication, FAQPage, BreadcrumbList, Blog | High | Fixed |
| 2 | No Twitter card metas; no og:site_name, og:locale, og:image:width/height/alt | Medium | Fixed |
| 3 | Posts had og:type website and no article:published_time / modified_time | Medium | Fixed |
| 4 | No security headers and no caching rules at the host: no CSP, nosniff, Referrer-Policy, Permissions-Policy; hashed assets revalidated on every load | Medium | Fixed |
| 5 | No www to bare-domain redirect; both hosts serve the same pages | Medium | Fixed (rule written; cannot be exercised locally) |
| 6 | Sitemap had no lastmod | Low | Fixed |
| 7 | Titles inconsistent and short: no brand suffix, five titles at 9 to 18 chars (Changelog, Terms, Privacy, About, Contact) | Medium | Fixed for pages I own; two left for the owner |
| 8 | Descriptions out of range: five under 120 (404, Changelog, Terms, Privacy, Contact, Photos), six over 160 (blog index, four posts, How it works) | Medium | Fixed |
| 9 | 404 page had no noindex | Low | Fixed |
| 10 | `/x.html` twins exist beside `/x`; the host already 307s them to `/x`, but the `/x/` trailing-slash form serves 200 as a duplicate | Low | Twins noindexed by header; trailing-slash form is covered by the canonical tag |
| 11 | `_headers` and `_redirects` were being precached by the service worker (found while fixing 4) | Low | Fixed |
| 12 | BlogPosting lacked mainEntityOfPage, image and a publisher logo (recommended by Google's article validator) | Low | Fixed |
| 13 | One h1 per page, heading order h1 > h2 > h3 without skips, `lang="en"`, viewport, canonical on every page, alt on every image, every route reachable from nav, footer or body links, no orphan pages, robots.txt with the sitemap line, RSS discovery link only on blog pages, og.png at 1200x630, `Skip to content` link present, no empty link text | Pass | No change |
| 14 | Text-to-HTML ratio 0.07 to 0.34; lowest on 404 (0.07), Contact (0.09), Pricing (0.11) because each is a short page over the same shell | Info | No change; the pages are short by design |
| 15 | Single language, no hreflang | Info | Correct as is; add `x-default` only if a second language ships |
| 16 | `/source/` (the published parsers) is linked only from Security, has its own minimal HTML, and is not in the sitemap | Info | Left out of the sitemap on purpose; it is a reference page, not a landing page |
| 17 | Domain, mailbox and postal address are client-marked placeholders; no `sameAs` profiles for the Organization | Info | For the client |

## Implemented

- `index.html`: og:site_name, og:locale, og:image:width, og:image:height,
  og:image:alt, twitter:card, twitter:title, twitter:description,
  twitter:image; og:type moved out of the shell; a `<!--head-->`
  placeholder for per-page head content.
- `scripts/prerender.mjs`: title suffix ` | FileSanity` when the brand is
  absent; per-page og:type (article on posts, with published and
  modified times); noindex on the 404; one JSON-LD `@graph` per page
  (Organization, WebSite, SoftwareApplication on the home page; FAQPage
  from `FAQ` in `src/content.ts` on `/faq`; Blog and ItemList on
  `/blog`; BlogPosting with mainEntityOfPage, image, publisher logo and
  breadcrumbs on posts; BreadcrumbList on every other inner page);
  sitemap lastmod from the post date or the last git commit of the
  page's source file.
- `src/entry-server.tsx`: re-exports `FAQ` for the prerender.
- `scripts/pwa.mjs`: `_headers` and `_redirects` excluded from the
  precache.
- www to bare domain, 301: `www/worker.mjs`, a separate Worker (static assets accept only relative `_redirects` sources).
- `public/_headers`: nosniff, Referrer-Policy, Permissions-Policy, CSP
  (`default-src 'self'`, script-src with the hash of the one inline
  script, style-src split so only `style` attributes are inline,
  img-src self and data:, object-src none, frame-ancestors none,
  base-uri and form-action self); immutable caching for `/assets`,
  `/fonts`, `/icons`, `/img`; no-cache for `sw.js` and the manifest;
  `X-Robots-Tag: noindex` on `/*.html`.
- Titles and descriptions in `src/pages/` Changelog, Terms, Privacy,
  About, Contact, Photos, Pdf, Faq, Blog, HowItWorks, NotFound and in
  `src/posts/` what-a-jpeg-carries, what-office-documents-carry,
  what-a-pdf-carries, why-the-file-never-leaves-the-browser.
- `tools/seo_check.py`: fetches every sitemap URL, a missing page and
  `/faq.html` from the served site; asserts status, one h1, title
  length and uniqueness, description length, canonical, og:image,
  twitter:card, og:type, RSS link placement, noindex on the 404,
  JSON-LD parse with ISO dates and absolute URLs, image alt, link text,
  the security headers, and no CSP violation in the console (Chromium;
  Firefox does not pass CSP reports to Playwright). `python3
  tools/seo_check.py [url] [firefox]` against `npx wrangler dev --port
  4188`.

## Verified

- `tools/seo_check.py`: 0 failures in Chromium, 0 in Firefox on the 22 URLs
  at the start of the audit; the final run on the owner's latest build
  fails only on the three over-long descriptions listed below.
- The CSP: inline `--d` style attributes apply, the service worker
  registers, `Try a sample` fetches, and the blob download saves, in
  both engines. Injecting an inline `<style>` and a cross-origin image
  in Chromium produced the expected violations, so the check can see
  them.
- `tests/run.py` against `wrangler dev` with the headers: every read,
  clean, download and network assertion passes. One failure, "two
  files: reads the first and says so", comes from the owner's in-flight
  change to the multi-file note in `src/ui/Picker.tsx` (the text now
  points at batch); not caused by the headers.
- Cache-Control served: HTML `public, max-age=0, must-revalidate`
  (platform default), `/assets/*` `immutable`, `/sw.js` `no-cache`.
- `/faq.html` 307 to `/faq` with `X-Robots-Tag: noindex`; a missing
  path serves 404 with the noindexed 404 page.

## For the client / owner

- `src/pages/Home.tsx` title is 52 chars and fine. Its description is
  143 chars and fine. No change needed.
- `src/pages/Pricing.tsx`: title "Pricing: free, no account, no upload"
  becomes 49 chars with the suffix; consider "Pricing: free, no
  account, no upload, no limit" (58 with suffix). Its description is
  now 166 chars after the owner's edit; trim to 160.
- New pages added during the audit, in the owner's files: `/batch`
  description is 183 chars and `/extension` is 166; both need trimming
  to 160. Everything else on them passes (one h1, canonical, JSON-LD
  breadcrumbs, headers) because the prerender handles it.
- `tests/run.py` line 185 expects the old multi-file note text; update
  it to the new Picker wording.
- The www redirect Worker needs one check on the
  live domain after deploy: `curl -sI https://www.filesanity.com/faq`
  should return 301 to `https://filesanity.com/faq`.
- Confirm the domain: `SITE` in `scripts/prerender.mjs` and
  `src/content.ts`, the og:image URLs in `index.html`, and the sitemap
  all say filesanity.com.
- Organization `sameAs`: add social or company-register URLs to `org`
  in `scripts/prerender.mjs` once any exist. There are none now, so
  none are claimed.
- Register the property in Google Search Console and Bing Webmaster
  Tools, submit `https://filesanity.com/sitemap.xml`, and validate the
  home, FAQ and one post URL with Google's Rich Results test.
- A real company name, registration number and postal address for the
  About and Contact pages and for the Organization schema; the pages
  carry visible client placeholders.
- The trailing-slash twin (`/faq/` serving 200) could be closed by
  dropping `<route>/index.html` from the prerender and serving only
  `<route>.html`, which makes the host 307 `/faq/` to `/faq`. That
  changes what `vite preview`, `tests/run.py` and the service worker
  precache rely on, so it is a decision, not a fix.
- The build is currently blocked by a TypeScript error in
  `src/lib/zip.ts` (Uint8Array to BlobPart), which is in the owner's
  files; the site was built with the four build steps minus `tsc -b`
  for this audit.
