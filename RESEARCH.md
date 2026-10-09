# Competitor research: FileSanity

Checked 2026-10-08. Every figure below is as published on the cited page on that date. Where a page could not be fetched, the section says so and no figure is given. "Unverified" means the claim is the vendor's own and was not tested.

## Summary

| Product | Types | Processing | Price (published) | Main hesitation for a cautious buyer |
|---|---|---|---|---|
| metacleaner.com | Office (incl. legacy .doc/.xls/.ppt), ODF, PDF, Visio, many images, some audio/video | **Server.** Says "in the browser" but its uploader POSTs the file to `/public/files` | Free (1 or 5 files/day, 5 MB); Basic EUR 5/mo; Advance EUR 30/mo; Enterprise EUR 50/mo | The privacy claim contradicts its own code; Google Tag Manager and Analytics on the page |
| metadata2go.com | "Any file type" (viewer); photos, PDF, Office, video, audio, ebooks | Server, EU, under a DPA | Free / Starter / Pro / Business, credit based; prices not shown in the fetched page | Upload plus ad and analytics trackers on the same site; no stated file retention period |
| verexif.com | Images | Server (multipart POST to `ver.php`) | Free, no plans | No company, no privacy policy |
| ExifCleaner | Images incl. RAW, video, PDF | Local desktop app (Electron + ExifTool) | Free, MIT | Unsigned builds; says PDF metadata cannot be securely erased |
| mat2 | ~40 formats incl. Office, ODF, PDF, images, audio, archives | Local (Python CLI/library) | Free, LGPL-3.0+ | Command line; may alter content (PDF text unselectable); no guarantee |
| Metadata Cleaner (GNOME) | mat2's formats | Local (Linux GUI on mat2) | Free | Marked no longer maintained; removed from Flathub |
| Adobe Acrobat Sanitize | PDF | Local desktop | Acrobat Pro US$19.99/mo (annual) | Help pages not fetchable (403); sanitize can rasterize and enlarge the file |
| Microsoft Document Inspector | Word, Excel, PowerPoint, Visio | Local desktop | Bundled with Office | Flags but does not remove some items; no undo; no images or PDF |
| Litera Clean / Metadact / Clean+ | Word, PDF, Excel, ZIP and more, 300+ metadata types, in Outlook | Desktop, own server, or Litera-hosted cloud (attachments routed through Litera) | Not published; sales only | Enterprise only; Clean+ routes attachments through Litera's servers |
| BigHand Metadata Assistant (ex Payne Group) | Office | Local desktop | 2010: US$89/licence; current not published | Old public pricing, sales only |
| Workshare Protect | Office, PDF | Desktop | Retired | Expired support since Litera's Q4 2021 Metadact release |
| exiftool | Hundreds of image, video, document formats | Local CLI | Free (donations) | Expert tool; PDF edits are reversible by design |
| Scrambled Exif (Android) | Pictures (JPEG named) | On device, share-sheet flow | Free, GPL-3.0 | Photos only, Android only |
| ImageOptim (Mac) | JPEG, PNG, SVG, GIF | Mac app | Free, GPL-2.0+ | A compressor that strips metadata as a side effect; Mac only |
| BatchPurifier | 28 types incl. Office, PDF, images, media, ZIP | Local, Windows only | From US$19 per computer | Windows only, small vendor |
| AI Metadata Cleaner | Images in browser; video, PDF, RAW on server | Split | Tiers named, prices not on home page | "Images never leave your browser" while PDFs go to the server; no legal entity named |
| Metadata Stripper (utils.com) | JPEG, PNG, WebP, GIF, PDF, DOCX, XLSX, PPTX | Browser (claimed) | Free | No company named, no open source, unverified claim |
| Metadata Cleaner for Google Drive (KoroDigital) | JPEG, PNG, WebP, PDF, DOCX, XLSX, PPTX | Browser (claimed) | Free 50 files/mo; Pro US$8/mo | Needs Drive scopes and "connect to an external service"; overwrites originals |
| iLovePDF / Smallpdf | PDF suites | Server | iLovePDF Premium US$4/mo annual, US$7 monthly; Smallpdf page not fetchable | No metadata tool listed on iLovePDF's pricing page |

---

## metacleaner.com

- **Types:** Office including legacy binaries (.doc, .xls, .ppt and macro and template variants), OpenDocument, Visio, PDF, GIF, JPEG and JPEG 2000, HEIC, PNG, PSD, TIFF, M4A, MOV, MP4. Source: https://metacleaner.com
- **Processing: server.** The home page says it "Runs in your browser" and the header of the privacy page says "Strip hidden metadata from your files in the browser. No install, no third-party upload." (https://metacleaner.com, https://metacleaner.com/privacy-policy). The page's own uploader script sends the file to the server: `a.append("files[]",e,e.name),$.ajax({url:"/public/files",type:"POST",...` with an upload progress listener (https://metacleaner.com/build/assets/uploader-c8386174.js, read 2026-10-08). The API is likewise `POST https://metacleaner.com/api/files` (https://metacleaner.com/api-documentation).
- **Pricing (EUR):** Free unregistered 5 MB, 1 file/day; free registered 5 MB, 5 files/day; Basic EUR 5/month (30 MB, 1 GB/month, bulk); Advance EUR 30/month (50 MB, 10 GB/month, 3 API apps); Enterprise EUR 50/month (50 MB, 100 GB/month, unlimited API apps). Source: https://metacleaner.com
- **Trust:** Itson Group Ltd, NI718987, Belfast; "Powered by Open Data Security"; "We don't keep your files or the metadata we strip", no deletion timeframe (https://metacleaner.com). Privacy policy says hosting is in the UK or EU and the site uses Google Analytics cookies; no processors named; no retention rule for uploaded files (https://metacleaner.com/privacy-policy). The page loads Google Tag Manager (GTM-KXHVVTZ) and reCAPTCHA (page source of https://metacleaner.com). No audits or third-party reviews on the page. Trustpilot page did not exist (404).
- **Hesitation:** A journalist or lawyer who opens the network tab sees the file go up, after being told it would not. That is the single largest trust gap in the category, and it belongs to the brief's named competitor.

## metadata2go.com

- **Types:** "It accepts any file type and reads whatever the format stores"; photos, PDFs, Word, Excel, MP4, MP3, ebooks; 75 MB free limit. Source: https://www.metadata2go.com
- **Processing: server.** "processed on servers located in Europe under a signed data processing agreement"; staff do not read files; not used for AI training. Source: https://www.metadata2go.com
- **Pricing:** Free, Starter (480 credits/month, 2 users), Pro (2,800 credits, 5 users), Business (10,000 credits, 20 users); yearly saves 16%; EUR 5 per additional user/month. Plan prices were not present in the fetched text, so none are given here. Source: https://www.metadata2go.com/pricing
- **Trust:** QaamGo Web GmbH, Radolfzell, Germany; DPA downloadable; logo wall (UC Berkeley, Booking.com, Facebook, Uber) without context (https://www.metadata2go.com). Privacy policy gives no retention period for uploaded files, keeps server logs 7 days, and lists Google Analytics, Matomo, Google Ad Manager, AdSense, reCAPTCHA and Cloudflare, with a note that Cloudflare may route data outside the EU (https://www.metadata2go.com/privacy). G2 reviews page blocked fetch (403).
- **Hesitation:** Upload to a site that also runs ad networks. An HR officer handling a personnel file cannot square that with a policy.

## verexif.com

- **Types:** Images, 20 MB limit; also takes a public image URL. Source: https://www.verexif.com/en/
- **Processing: server.** The form is `<form enctype="multipart/form-data" method="post" action="ver.php">` with `name="foto_file"` (page source of https://www.verexif.com/en/, 2026-10-08). The page states "We don't store any copy of the image."
- **Pricing:** No price or plans on the page.
- **Trust:** No company name, no privacy policy link, contact contacto@verexif.com. Source: https://www.verexif.com/en/
- **Hesitation:** Anonymous operator plus upload.

## ExifCleaner (desktop)

- **Types:** JPEG, PNG, GIF, TIFF, WebP, HEIC, AVIF, many RAW, MP4, MOV, AVI and others, PDF. Caveat: "PDF metadata can't be securely erased". Source: https://github.com/szTheory/exifcleaner
- **Processing:** Local desktop app; "No automatic updates or network traffic, zero telemetry, zero phone-home"; uses ExifTool under Electron. Source: same.
- **Pricing:** Free, MIT. Source: same.
- **Trust:** Open source, 2.7k stars; v4.0 is the first release since v3.6.0 (May 2021); builds not code-signed. Source: same.
- **Hesitation:** Install an unsigned app and click through an OS warning; no Office documents; PDF admitted unsafe. An HR department's IT will not allow it.

## mat2

- **Types:** avi, bmp, css, epub, flac, gif, jpeg, mp3, mp4, OpenDocument, ogg, pdf, png, pptx/xlsx/docx, svg, tar, tiff, torrent, wav, wmv, zip, webp, avif, jxl. Source: https://pypi.org/project/mat2/
- **Processing:** Local Python library and CLI; writes a new `.cleaned` file. Source: https://github.com/jvoisin/mat2
- **Pricing:** Free, LGPL-3.0+. Latest 0.15.0, 4 August 2026. Source: https://pypi.org/project/mat2/
- **Trust:** Open source, 372 stars on the GitHub mirror (https://github.com/jvoisin/mat2); the 0xacab.org repository shows as archived (https://0xacab.org/jvoisin/mat2). States "There is no reliable way to detect every single possible metadata" and default mode may make PDF text unselectable (https://pypi.org/project/mat2/).
- **Hesitation:** Command line only; may change the document's content, which a lawyer cannot accept for an exhibit.

## Metadata Cleaner (GNOME)

- **Types/processing:** GUI over mat2, local on Linux. Source: https://forum.torproject.org/t/metadata-cleaner-is-looking-for-a-new-co-maintainer/17021
- **Pricing:** Free.
- **Trust:** January 2025 call for a co-maintainer said the project had no active maintainer (same source). Flathub now says "This application is no longer available on Flathub" and "no longer maintained" (https://flathub.org/apps/fr.romainvigier.MetadataCleaner). GNOME Apps page could not be fetched (404); search listed 2.5.6 of 14 July 2024 as latest (https://apps.gnome.org/fur/MetadataCleaner, via search result).
- **Hesitation:** Abandoned and Linux only.

## Adobe Acrobat: Sanitize document / Remove hidden information

- **Types:** PDF.
- **Processing:** Local in the Acrobat desktop app (All tools > Redact a PDF > Sanitize document; "Remove all" or "Selectively remove"). Adobe's help pages returned 403 to fetching (https://helpx.adobe.com/acrobat/desktop/protect-documents/redact-pdfs/sanitize.html); this summary is from search result excerpts of that page, titled "Sanitize PDFs in Acrobat Pro".
- **Pricing (US):** Standard US$14.99/mo annual billed monthly, US$179.88/yr prepaid, US$24.99 month-to-month; Pro US$19.99/mo, US$239.88/yr, US$29.99. Redaction is listed for Pro, "not a feature" of Standard. Sanitize is not named on the pricing page. Source: https://www.adobe.com/acrobat/pricing.html
- **Trust:** Adobe; enterprise standard. Adobe's KB on sanitized file size (https://helpx.adobe.com/acrobat/kb/prevent-file-size-increase-after-sanitizing-pdf.html, 403 to fetch, excerpt via search) says the result can be rasterized and larger. A 2022 community thread reports Sanitize missing cropped images that "Remove Hidden Information" caught (https://community.adobe.com/t5/acrobat-discussions/question-about-sanitizing-documents/m-p/13186547, via search).
- **Hesitation:** A US$20 per-seat subscription for one PDF; output may stop being searchable text.

## Microsoft Office: Document Inspector

- **Types:** Word, Excel, PowerPoint, Visio.
- **Processing:** Local, in desktop Office (File > Info > Check for Issues > Inspect Document); the support page covers Microsoft 365 and Office 2016 to 2024 and does not mention Mac or web. Source: https://support.microsoft.com/en-us/office/remove-hidden-data-and-personal-information-by-inspecting-documents-presentations-or-workbooks-356b7b5d-77af-44fe-a07f-9aa4d085966f
- **Pricing:** Included with Office.
- **Trust:** Microsoft. Limits stated by Microsoft: removed content may not be restorable with Undo; external links, embedded objects, macros and cached PivotTable data are flagged but not removed; white-on-white text not detected. Source: same.
- **Hesitation:** Not for photos or PDFs; a manual step people forget; a marketplace seller on a phone does not have it.

## Litera Clean (Metadact, Clean+)

- **Types:** "Word, PDF, Excel, ZIP, and more"; 300+ metadata types; classic and new Outlook on desktop, web and mobile. Source: https://www.litera.com/store/metadact
- **Processing:** Three forms after the June 2026 rename: Clean Desktop, Clean Server (on-prem), Clean+ (Litera-hosted; attachments are routed through Litera's servers). Clean+ announced 17 June 2026, GA 30 June. Sources: https://itbrief.co.uk/story/litera-launches-clean-cloud-metadata-tool-for-firms, https://www.litera.com/newslinks/litera-announces-new-cloud-ai-automation
- **Pricing:** Not published; demo and sales only (https://www.litera.com/store/metadact). The product page URL https://www.litera.com/products/litera-metadact returned 404.
- **Trust:** Claims trust by 98% of the Am Law 200 and 42% of firms (ILTA Tech Survey 2025, Litera's citation); logs every clean event; Security and Trust Center linked, no certification named on the page. Sources: https://www.litera.com/products/metadact, https://itbrief.co.uk/story/litera-launches-clean-cloud-metadata-tool-for-firms
- **Hesitation:** Built for firms with an IT department and an Outlook rollout. A solo practitioner cannot buy it off a page.

## BigHand Metadata Assistant (formerly Payne Group)

- **Types/processing:** Office documents, local desktop add-in.
- **Pricing:** Only public figures are from 2010: US$89 single licence; 25 users US$1,600; 100 users US$4,600; then US$320 or US$920 per year maintenance. Source: https://senseient.com/ride-the-lightning/metadata-assistant-enterprise-version-for-the-big-guys/ . Current pricing not found.
- **Trust:** Acquired by BigHand. Source: https://www.bighand.com/en-au/resources/news/bighand-boosts-template-management-and-metadata-management-offerings-by-acquiring-paynegroup/
- **Hesitation:** Sales-led, Windows Office only.

## Workshare Protect

- Retired. Litera acquired Workshare in July 2019 (https://www.lawnext.com/2019/07/litera-microsystems-acquires-workshare-extending-document-capabilities.html); Protect's metadata cleaning moved to Expired Support with the Q4 2021 Metadact release (https://www.litera.com/node/464). Litera also ended support for DocsCorp cleanDocs (https://legaltechnology.com/litera-to-end-support-roles-for-docscorp-and-workshare-as-focus-shifts-to-litera-compare/).
- **Relevance:** Small and mid firms on Workshare or cleanDocs were pushed toward an enterprise product.

## exiftool

- **Types:** Hundreds of formats; local Perl library and CLI by Phil Harvey; 13.59 of 27 May 2026. Source: https://exiftool.org/
- **Pricing:** Free (donations). Source: same.
- **Trust:** The reference tool, used inside ExifCleaner and mat2. The site warns ExifTool is "not guaranteed to remove metadata completely", and that PDF edits are reversible because the original metadata is not actually deleted. Source: same.
- **Hesitation:** Command line, and for PDF the "removed" data is still in the file.

## Scrambled Exif (Android)

- **Types/processing:** Pictures via the share sheet, on device; JPEG named. GPL-3.0; 1.8.1 added 11 September 2026; no listed anti-features. Source: https://f-droid.org/en/packages/com.jarsilio.android.scrambledeggsif/
- **Pricing:** Free, donations.
- **Hesitation:** Photos only. A marketplace seller's best current option, and it is free.

## ImageOptim (Mac)

- **Types/processing:** JPEG, PNG, SVG, GIF; strips EXIF as part of optimisation; Mac app; free, GPL-2.0+. Source: https://imageoptim.com/mac
- **Hesitation:** Compression tool first; may recompress; Mac only.

## BatchPurifier

- **Types/processing:** 28 types incl. Office, LibreOffice, PDF, JPEG, PNG, WebP, SVG, MP3, MP4, inside ZIP; offline, Windows. 8.7 of 3 November 2025. Digital Confidence Ltd. Source: https://www.digitalconfidence.com/BatchPurifier.html
- **Pricing:** "Starts at $19 (per computer)". Source: same.
- **Hesitation:** Windows install; one-time licence per machine.

## Doc Scrubber

- Legacy free tool for Word .doc only, by JavaCool/BrightFort; free for personal use, business licence required per the developer. Sources from 2003 to 2012 only; current availability unconfirmed. Source: https://www.ghacks.net/?p=8362, https://gigazine.net/gsc_news/en/20120621-doc-scrubber
- **Relevance:** Still cited by small firms; does not handle .docx.

## AI Metadata Cleaner

- **Types/processing:** JPG, PNG, WebP, AVIF in the browser; MP4, MOV, PDF, RAW "cleaned on our server and deleted within minutes". Source: https://aimetadatacleaner.com/
- **Pricing:** Anonymous 3 images/day; free account 10/day plus 3 video/PDF/RAW a month; Pro and Business tiers; API with Business. Prices are on /subscription, not fetched. Source: same.
- **Trust:** No legal entity named; footer "Images never leave your browser". Source: same.
- **Hesitation:** The browser claim stops at PDFs, which is exactly what a lawyer sends.

## Metadata Stripper (utils.com)

- **Types/processing:** JPEG, PNG, WebP, GIF, PDF (Info and XMP), DOCX, XLSX, PPTX; "everything is processed privately inside your browser". Free. No company named, open source not stated. Source: https://metadata-stripper.utils.com/
- **Relevance:** Nearly FileSanity's exact format scope and claim, free. The claim is the commodity; proof is not.

## Metadata Cleaner for Google Drive (KoroDigital)

- **Types/processing:** JPEG, PNG, WebP, PDF, DOCX, XLSX, PPTX; "All processing happens in your browser"; overwrites originals. Free 50 files/month; Pro US$8/month unlimited. Requests Drive file access, email, profile and "Connect to an external service". Source: https://workspace.google.com/marketplace/app/metadata_cleaner/741330923137
- **Relevance:** A live price point for a browser-local cleaner: US$8/month.

## iLovePDF and Smallpdf

- iLovePDF: Premium US$4/month billed annually (US$48/yr) or US$7 monthly; Business on quote for 25+ users; no metadata tool listed on the pricing page. Source: https://www.ilovepdf.com/pricing
- Smallpdf: pricing page did not render in fetch; no figures recorded. Source tried: https://smallpdf.com/pricing
- **Relevance:** Sets what a buyer expects to pay for an online PDF utility.

---

## Gaps

1. **No online cleaner proves its claim.** metacleaner says "in the browser" and uploads; AI Metadata Cleaner says images stay and sends PDFs up; utils.com and KoroDigital claim browser processing with no source, no named company and no way to check. Nobody shows the visitor a network log, publishes the code, or works offline.
2. **Nobody reports honestly on what was not removed.** exiftool, mat2 and ExifCleaner each say in their docs that removal is not guaranteed or that PDF removal is unsafe or reversible; online tools say "removed" with no list. Document Inspector flags items it does not remove. No online tool hands the user a record of what was found, what was removed and what was kept.
3. **The legal market has a hole below enterprise.** Litera Clean is sales-only and Outlook-centred, Workshare Protect and cleanDocs are retired, Metadata Assistant's last public price is from 2010, Acrobat Pro is US$19.99 per seat per month for PDF only. A solo lawyer or a five-person HR team has no self-serve, mixed-format, priced-on-the-page option with a record.
4. **Trackers on privacy tools.** metacleaner runs Google Tag Manager and Analytics; metadata2go runs Google Analytics, Matomo, Ad Manager and AdSense. A site with no trackers at all is rare in this set.
5. **Content changes.** Acrobat Sanitize can rasterize; mat2 can make PDF text unselectable. Cleaning in place without touching content is a stated buyer need for exhibits and contracts.
6. **Caution for FileSanity's own plan.** The planned hosted API uploads files by definition, the same thing this research faults metacleaner for. The site must keep the hosted API visibly separate from the browser cleaner, say plainly that it is a server, and never let the "never leaves your browser" line sit beside it.

---

## Three positions FileSanity can win

### 1. The only cleaner that proves, on the page, that the file never left the browser.
- **Buyer:** journalists and the privacy-minded who found metacleaner and hesitated at "upload"; lawyers whose duty of confidentiality rules out third-party upload.
- **Evidence:** metacleaner's uploader POSTs to `/public/files` while claiming browser processing (https://metacleaner.com/build/assets/uploader-c8386174.js); AI Metadata Cleaner sends PDFs to its server (https://aimetadatacleaner.com/); verexif posts to `ver.php`; metadata2go uploads and runs ad trackers (https://www.metadata2go.com/privacy); browser-only rivals give no proof and no named company (https://metadata-stripper.utils.com/).
- **What the site must show:** a live request counter beside the drop surface that stays at zero through read and clean; the tool working with the network switched off (the PWA already does); the source published under MIT with the parser tests; a "check it yourself" guide to the browser's network tab; no analytics, no cookies, a named maker.

### 2. The cleaner that tells you what it found, what it removed and what it could not, and gives you a record.
- **Buyer:** lawyers and HR who must be able to show what left the office; journalists protecting a source.
- **Evidence:** exiftool "not guaranteed to remove metadata completely" and PDF changes reversible (https://exiftool.org/); mat2 "no reliable way to detect every single possible metadata" (https://pypi.org/project/mat2/); ExifCleaner "PDF metadata can't be securely erased" (https://github.com/szTheory/exifcleaner); Document Inspector flags but does not remove some items (Microsoft support page above); Litera sells "logs every clean event" only to enterprises.
- **What the site must show:** the before and after table for every file, including "compressed stream kept, here is why"; a downloadable per-file report (hashes, fields removed, fields kept); a verification step that re-reads the cleaned file; content untouched (no rasterizing, text stays selectable).

### 3. Self-serve batch cleaning with a policy and a record, priced on the page, for the small firm Litera does not sell to.
- **Buyer:** solo and small-firm lawyers, small HR teams, high-volume marketplace sellers.
- **Evidence:** Litera Clean is demo and sales only (https://www.litera.com/store/metadact); Workshare Protect and cleanDocs retired (https://www.litera.com/node/464, https://legaltechnology.com/litera-to-end-support-roles-for-docscorp-and-workshare-as-focus-shifts-to-litera-compare/); Acrobat Pro US$19.99/mo per seat for PDF only (https://www.adobe.com/acrobat/pricing.html); metacleaner's bulk starts at EUR 5/mo but uploads.
- **What the site must show:** a pricing page with figures and no "contact sales"; batch with a saved policy in the browser; team seats via Lemon Squeezy; a short page for law-firm IT answering "where does the file go, who are you, what is logged".

### Recommendation

Position 1. It is the brief's one fixed idea, it is the claim the named competitor makes and breaks in its own code, and it is the only one of the three a stranger can verify in thirty seconds without trusting FileSanity at all. Position 2 is the natural second line on the same page and makes 1 credible for lawyers. Position 3 is the revenue path but needs trust that 1 and 2 build first, and a hosted API sits uneasily with it (Gap 6), so the paid tier should lead with batch and reports that still run in the browser, and keep the hosted API as a clearly labelled server option.

### Pricing anchors from this research
- metacleaner: EUR 5 / 30 / 50 per month (bulk from EUR 5; API from EUR 30).
- Metadata Cleaner for Google Drive: free 50 files/month, US$8/month unlimited.
- iLovePDF Premium: US$4/month annual, US$7 monthly.
- Acrobat Pro: US$19.99/month annual, US$29.99 month-to-month.
- BatchPurifier: from US$19 one-off per computer.
- Metadata Assistant (2010): US$89 per licence; metadata2go: EUR 5 per additional user/month.
