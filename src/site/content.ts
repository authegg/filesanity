/** Facts used on more than one page, from one source. */
export const MAIL = 'hello@filesanity.com' // forwards through Cloudflare Email Routing (as on main)
export const REPO = 'https://github.com/authegg/filesanity'
export const MAKER = 'authegg'
export const MAKER_URL = 'https://authegg.com'
export const LEGAL = 'AUTHEGG SOFTWARE DEVELOPMENT SERVICES' // DTI-registered sole proprietorship
export const CTA = 'Clean a file'
export const FORMATS = 'JPEG, PNG, HEIC, WebP, MP4, MOV, M4A, MP3, Word, Excel, PowerPoint, OpenDocument and PDF'
export const UPDATED = '19 October 2026'

export const NAV = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/batch', label: 'Batch' },
  { href: '/developers', label: 'API' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/security', label: 'Security' },
]

/** What each sample file really carries, read from public/sample.jpg and public/samples/ (the metadata is invented; the captions say so).
 *  `fields` is the cleaner's own count for that file. */
export const EXAMPLES = [
  {
    key: 'photo', tab: 'Photo', ext: 'JPG', url: '/sample.jpg', fields: 52,
    title: 'The buyer sees shoes. The file gives them your gate.',
    rows: [
      { k: 'Who made it', v: 'R. Villanueva' },
      { k: 'Where it was', v: 'Quezon City, 14.6760° N, 121.0437° E' },
      { k: 'When', v: '11 April 2026 at 17:42' },
      { k: 'On what', v: 'iPhone 16 Pro, serial F2LXK9Q0PLJ7' },
    ],
  },
  {
    key: 'video', tab: 'Video', ext: 'MOV', url: '/samples/tour.mov', fields: 8,
    title: 'The followers see a clip. The file pins where you stood.',
    rows: [
      { k: 'Where it was', v: 'Cebu City, 10.3157° N, 123.8854° E' },
      { k: 'When', v: '2 May 2026 at 18:20 local time' },
      { k: 'On what', v: 'iPhone 16 Pro, iOS 18.5' },
      { k: 'And again', v: 'In the file header: 10:20:14 UTC' },
    ],
  },
  {
    key: 'word', tab: 'Word', ext: 'DOCX', url: '/samples/offer.docx', fields: 18,
    title: 'The candidate sees an offer. The file names everyone who touched it.',
    rows: [
      { k: 'Who wrote it', v: 'Priya Raman, last edited by H. Delacroix' },
      { k: 'Company', v: 'Delacroix Partners, manager H. Delacroix' },
      { k: 'How long', v: '847 minutes of editing, 14 saves' },
      { k: 'Hidden fields', v: 'Client matter DEL-2026-0417, reviewer S. Byrne' },
    ],
  },
  {
    key: 'pdf', tab: 'PDF', ext: 'PDF', url: '/samples/memo.pdf', fields: 25,
    title: 'The client sees a fee summary. The file calls it an internal memo.',
    rows: [
      { k: 'Who wrote it', v: 'Priya Raman' },
      { k: 'Its real title', v: 'Internal memo, keyword "confidential"' },
      { k: 'About', v: 'Tamarind Freight fees' },
      { k: 'Made with', v: 'Microsoft Word for Mac, 12 April 2026 at 09:03' },
    ],
  },
] as const

export const FAQ: { group: string; items: [string, string][] }[] = [
  {
    group: 'The cleaner',
    items: [
      ['Is my file uploaded?', 'No. The page reads and rewrites the file inside your browser tab. Under the cleaner, a counter shows every network request the page makes after your file arrives, taken from the browser\'s own record, and it stays at zero. Only the hosted API, which you call from your own code, sends a file to a server, and its page says so.'],
      ['What does it remove?', 'From photos: GPS position, camera and serial number, dates, editing software, names, comments, and AI and Content Credentials (C2PA) records. From Word, Excel and PowerPoint: author, last editor, company, manager, editing time, custom properties, the preview thumbnail, comments, and the camera data and position of photos placed in the document; tracked changes are accepted. From videos and voice recordings: GPS position, camera, software, titles and recording time. From MP3s: the ID3 tags. From OpenDocument files: author, editing time, generator, the printer name, comments and the data of photos placed in them; tracked changes are accepted. From PDFs: the document information and the XMP, plain or compressed, and the camera data and position of JPEG photos placed in them. When a PDF stores something in a way FileSanity cannot rewrite yet, the result shows it as kept and says the file is not fully cleaned.'],
      ['Does it remove AI labels and Content Credentials?', 'It shows and removes the metadata ones: C2PA Content Credentials, the IPTC "made by AI" tag, and the prompt and settings AI tools write into PNG files. Pro can keep them with a saved policy, for example when a client asks for provenance. It does not touch watermarks hidden in the pixels, such as SynthID: FileSanity never changes the picture.'],
      ['How do I know it worked?', 'After cleaning, FileSanity reads the clean copy again with the same parsers and tells you whether any metadata is left. Download the receipt to keep that result with SHA-256 fingerprints of the file before and after; batches put the same in their record.'],
      ['Does it change what is in my file?', 'Only where review marks count as hidden data: comments are removed and tracked changes are accepted, so deleted text leaves the file. A saved policy can keep either. Otherwise the picture, the text, the cells and the slides stay as they were; only the metadata parts are removed or blanked.'],
      ['What can it not clean yet?', 'Encrypted PDFs: their metadata is shown and kept, and the result says so instead of calling the file clean. GIF, TIFF, audio other than MP3 and M4A, and legacy .doc, .xls and .ppt files are not read yet. And no cleaner can clean a file name: FileSanity warns when a name gives something away and offers a neutral one.'],
      ['Does it work offline?', 'Yes. After your first visit the site is stored by your browser. Turn off Wi-Fi and clean a file: it still works, because the file never needed the network.'],
      ['Does it remove viruses or macros?', 'No. FileSanity removes metadata. Removing active content from documents is a different job, done by tools sold as content disarm and reconstruction.'],
    ],
  },
  {
    group: 'Accounts and billing',
    items: [
      ['Do I need an account?', 'Not to clean files one at a time. An account is for batches, a saved policy, a team and API keys.'],
      ['How do I sign in?', 'With your email address. We send a link that works once, for 15 minutes. There is no password to leak.'],
      ['Who handles payment?', 'Paddle, as merchant of record: it takes the payment, charges the right sales tax or VAT, and sends the receipt. We never see your card. Your statement shows the charge as AUTHEGG, the studio that makes FileSanity.'],
      ['How do I cancel?', 'From your account page, at any time. The plan runs to the end of the period you paid for, and a first payment can be refunded in full within 14 days.'],
    ],
  },
  {
    group: 'Source and trust',
    items: [
      ['Can I read the code?', 'Yes. FileSanity is open source under the MIT licence. The parsers, the site and the API are in one repository on GitHub.'],
      ['If the code is free, what am I paying for?', 'Convenience: batches, a saved policy, a team, records, and a hosted API with signed reports. Cleaning a file in the browser stays free.'],
    ],
  },
]
