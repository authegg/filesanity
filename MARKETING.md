# Marketing plan: FileSanity

Prepared 2026-10-10, for when Lemon Squeezy approves the store. Nothing here has been done yet unless marked.

## What changed in search (2026)

- **AI answers sit on top of ordinary search.**
  - Google says AI Overviews and AI Mode need nothing extra: "no additional requirements … nor other special optimizations necessary", and no special files or schema. A page qualifies if it is indexed and can show a snippet ([Google](https://developers.google.com/search/docs/appearance/ai-features)).
  - Bing says the same, and Bing feeds ChatGPT search and Copilot. So llms.txt and paid "GEO" tools are not where the work is.
- **AI engines recommend what they see mentioned elsewhere.**
  - ChatGPT and Perplexity cite mostly other sites: listings and directories, Reddit, Wikipedia, comparison articles. They cite the product's own page less.
  - Only about 11% of cited domains overlap between the two engines.
  - These figures come from vendor studies and swing month to month ([1](https://authoritytech.io/blog/perplexity-vs-chatgpt-search-2026), [2](https://everything-pr.com/perplexity-citation-source-index-2026)). The direction is consistent: be mentioned in many trusted places, under the same name and description.
- **Answer-first pages win both kinds of search.**
  - The first lines state the fact the searcher asked for.
  - Clear headings and FAQs phrased the way people ask.
  - FileSanity's pages already follow this.

## Checked

- AI crawlers can reach the site. As of 2026-10-10:
  - robots.txt allows everything except /account, /sign-in and /api;
  - the pages answer 200 to OAI-SearchBot, PerplexityBot, GPTBot, Claude-SearchBot and Googlebot.
- Cloudflare blocks AI bots by default on some zones. Re-check if the setting changes.

## 1. Foundations (now: indexing takes weeks)

1. **Google Search Console:** verify filesanity.com and submit `/sitemap.xml`. This is an owner task.
2. **Bing Webmaster Tools:** import from Search Console, which takes one click. Bing is what ChatGPT search and Copilot draw on.
3. **Cloudflare Crawler Hints:** turn on IndexNow (Caching > Configuration) so Bing and Yandex hear about changes at once.
4. **Measure without analytics.** The site carries none, by design. Use:
   - Search Console (clicks, queries, AI Overview traffic is counted under "Web");
   - Lemon Squeezy orders;
   - a monthly hand check of about 20 questions in ChatGPT, Perplexity, Gemini and Google, such as "how do I remove GPS from an iPhone photo before selling".

## 2. Pages that answer real searches

Searches people make, each mapped to a page the site has or could add.

| Search | Page |
|---|---|
| remove metadata from photo / remove EXIF / remove GPS from photo | /photos (have) |
| remove metadata from iPhone photo / HEIC | /photos (have, HEIC is new): consider a guide |
| remove author from Word document / docx metadata | /documents (have) |
| remove metadata from PDF | /pdf (have) |
| remove AI metadata / Content Credentials / C2PA from image | new guide. Rising topic; say plainly what is removed and that visible watermarks are not |
| how to check if a file has metadata | /guides/check-a-file-is-clean (have) |
| metacleaner alternative / exiftool for non-technical users | new comparison pages: honest, dated, naming what each tool does better |

Rules for these pages:
- Every claim tested on a real file.
- No invented numbers.
- One page per question, not one page with many questions.

## 3. Being mentioned elsewhere (what AI engines read)

- **Store listings:** Chrome Web Store and Firefox Add-ons. They are search surfaces of their own. Publisher "FileSanity", verified with filesanity.com.
- **Directories:** AlternativeTo (list it as an alternative to metacleaner, ExifCleaner and mat2), Product Hunt, SaaSHub, There's An AI For That (only if the C2PA angle fits).
- **Open source lists:** the repo is MIT. Submit it to "awesome-privacy" style GitHub lists and to Privacy Guides' forum. Their bar is high; the no-upload and open-source facts are what pass it.
- **The GitHub README:** a clear first paragraph with the same one-line description as the site.

The same description everywhere:

> FileSanity removes hidden metadata from photos, Office documents and PDFs inside your browser; the file never leaves your device.

## 4. Launch (when payments are live)

Stagger the launches over two to three weeks, not one day.

1. **Show HN.**
   - Plain title, e.g. "Show HN: FileSanity, a metadata cleaner that runs in your browser (open source)".
   - First comment: how the parsers work, what it cannot clean yet (compressed PDF streams, WebP), and how to verify the claim. Open the network tab, clean a file, and see no request.
   - Reply to every comment for the first hours.
2. **Reddit:** only after weeks of real participation, always disclosing that you built it, and following each subreddit's rules (many ban self-promotion).
   - Fits: r/privacy (strict), r/EtsySellers and marketplace-seller subs (GPS in product photos), r/photography, r/Journalism, r/LawFirm, r/humanresources.
   - A useful answer to someone's question beats a launch post.
3. **Product Hunt.**
   - Crowded, so lead with a story, not a feature list. For example: the shoe photo that gives away the seller's gate.
   - The demo video in Downloads/filesanity fits here.

## 5. Going straight to the audience

- **Journalists:** source protection. Pitch to newsroom security trainers and journalism-security newsletters, with the HEIC and PDF guides.
- **Lawyers:** stray author, comment and revision data in DOCX. Legal-tech newsletters and bar association tech columns. The Team plan is the offer.
- **HR:** offer letters that name everyone who edited them (the DOCX sample on the home page).
- **Marketplace sellers:** GPS in phone photos. Seller forums and the Carousell, Facebook Marketplace and eBay communities.

## Do not

- Buy GEO or "AI visibility" tools before there is anything to measure.
- Publish AI-spun blog posts in bulk.
- Post fake reviews, buy upvotes or ask friends to brigade a launch.
- Claim the tool removes visible watermarks (it doesn't; DECISIONS.md).
