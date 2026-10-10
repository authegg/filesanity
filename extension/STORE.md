# Store listings: Chrome Web Store and Firefox Add-ons (AMO)

Copy for the owner to paste. The owner submits; nothing here has been submitted. Upload `dist-extension/filesanity-chrome-1.0.0.zip` to Chrome and `dist-extension/filesanity-firefox-1.0.0.zip` to AMO (build with `npm run build:ext`). AMO asks for the source as well: upload a zip of the repository at the release commit, with the build steps from `extension/README.md`.

## Name

FileSanity: remove metadata on upload

## Short description (Chrome summary, 132 characters max; AMO summary, 250 max)

Removes hidden metadata (GPS, names, dates, device) from photos, Word, Excel, PowerPoint and PDF files as you upload them, locally.

## Long description

Photos, documents and PDFs carry more than you can see: the GPS position where a photo was taken, the phone and its serial number, the author and company in a Word file, editing time in a spreadsheet, names in a PDF.

FileSanity removes that metadata the moment you choose, drop or paste a file for upload, on any website, before the site receives it. The cleaning happens inside your browser. Your files are never uploaded to FileSanity.

Free, with no account:
- Cleans JPEG, PNG, HEIC, WebP, MP4, MOV, M4A, MP3, DOCX, XLSX, PPTX, ODT, ODS, ODP and PDF uploads on every site.
- The toolbar button shows how many files were cleaned on the current tab and today.
- Pause it for any site with one switch.
- Drop a file on the toolbar panel to clean it and download the clean copy.

With a FileSanity Pro, Team or API plan:
- Your saved policy (the kinds of field you choose to keep) applies to every upload.
- Rules per site: always clean, never clean, or ask each time.
- Right-click an image and choose "Save without metadata".
- A log of your last 100 cleans, kept in your browser only.

What it does not do: it does not clean files a site reads from the clipboard, and an encrypted PDF is reported as not cleaned rather than changed. The source code is open under the MIT licence.

Who it is for: people who send files to strangers. Journalists, lawyers, HR staff, freelancers and marketplace sellers.

## Category

Chrome: Privacy and security (Productivity if that category is unavailable). AMO: Privacy and security.

## Single purpose statement (Chrome)

FileSanity removes metadata from photos, Office documents and PDFs as the user uploads them to a website, inside the browser.

## Permission justifications (Chrome "Privacy practices" tab)

- **Host permission and content script on all sites:** Files are uploaded to any website, so the content script must run on any website to replace a chosen, dropped or pasted file with its clean copy before the page reads it. It listens only for file-input changes, file drops and pastes that carry files. It does not read page content, forms, or browsing history, and sends nothing.
- **https://filesanity.com/\*:** Used only when the user connects a paid FileSanity account. The extension sends the user's connection token to one endpoint and receives the plan name and the saved policy. No file, file name or website address is sent.
- **storage:** Stores the clean counts, sites where cleaning is paused, site rules, the local log of cleans and the connection token, in the browser.
- **contextMenus:** Adds the "Save without metadata" item to images, for subscribers.
- **downloads:** Saves the clean copy of an image chosen with "Save without metadata".
- **Remote code:** No. All code ships in the package. The extension does not load or evaluate remote code.

## Data usage answers (Chrome)

- Personally identifiable information: not collected.
- Health, financial and payment, authentication, personal communications, location, web history, user activity, website content: not collected.
  - Authentication: the connection token the user pastes is stored locally and sent only to filesanity.com to read the user's own plan. If the reviewer counts this as authentication information, tick it, with "used only to read the user's plan from filesanity.com, never sold or shared".
- Certifications: data is not sold to third parties; not used or transferred for purposes unrelated to the single purpose; not used to determine creditworthiness or for lending.
- Privacy policy URL: https://filesanity.com/privacy

## AMO data collection (manifest `data_collection_permissions`)

Set to `required: ["none"]`: the extension collects and transmits no user data. The optional connection token is user-provided and goes to the developer's own service to read the user's plan.

## Support and links

- Homepage: https://filesanity.com/extension
- Support email: hello@filesanity.com
- Source: https://github.com/authegg/filesanity

## Screenshots to take (1280x800, PNG)

1. **Before and after on a real upload form.** A webmail compose window with a photo attached, and the FileSanity toolbar panel open showing "1 cleaned on this tab".
2. **The toolbar panel.** The counts, the "Clean uploads on mail.example.com" switch and the drop zone, centred on a plain forest background at 2x.
3. **The popup drop zone in use.** A photo dropped on the panel with "30 fields removed. Saved as photo-clean.jpg." and the download bar visible.
4. **Options, connected.** A Pro plan connected, the saved policy line, two site rules (always, ask) and several log rows. Use invented site names and file names.
5. **"Save without metadata".** The right-click menu open on an image in a browser tab with the item highlighted.

Use the sample photo (`public/sample.jpg`) and invented names only. Show no real person's inbox, no ratings and no user counts.
