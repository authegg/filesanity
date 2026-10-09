/** Facts used on more than one page, from one source. */
export const MAIL = 'hello@filesanity.com' // forwards through Cloudflare Email Routing (as on main)
export const REPO = 'https://github.com/authegg/filesanity'
export const MAKER = 'authegg'
export const MAKER_URL = 'https://authegg.com'
export const CTA = 'Clean a file'
export const FORMATS = 'JPEG, PNG, HEIC, Word, Excel, PowerPoint and PDF'
export const UPDATED = '8 October 2026'

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
      ['What does it remove?', 'From photos: GPS position, camera and serial number, dates, editing software, names, comments, and AI and Content Credentials (C2PA) records. From Word, Excel and PowerPoint: author, last editor, company, manager, editing time, custom properties and the preview thumbnail. From PDFs: the document information and uncompressed XMP.'],
      ['Does it remove AI labels and Content Credentials?', 'It shows and removes the metadata ones: C2PA Content Credentials, the IPTC "made by AI" tag, and the prompt and settings AI tools write into PNG files. Pro can keep them with a saved policy, for example when a client asks for provenance. It does not touch watermarks hidden in the pixels, such as SynthID: FileSanity never changes the picture.'],
      ['Does it change what is in my file?', 'No. The picture, the text, the cells and the slides stay as they were. Only the metadata parts are removed or blanked.'],
      ['What can it not clean yet?', 'Compressed metadata inside some PDFs is shown and kept, and the result says so instead of calling the file clean. Video, audio, GIF, TIFF, WebP, legacy .doc, .xls and .ppt, and OpenDocument files are not read yet.'],
      ['Does it work offline?', 'Yes. After your first visit the site is stored by your browser. Turn off Wi-Fi and clean a file: it still works, because the file never needed the network.'],
      ['Does it remove viruses or macros?', 'No. FileSanity removes metadata. Removing active content from documents is a different job, done by tools sold as content disarm and reconstruction.'],
    ],
  },
  {
    group: 'Accounts and billing',
    items: [
      ['Do I need an account?', 'Not to clean files one at a time. An account is for batches, a saved policy, a team and API keys.'],
      ['How do I sign in?', 'With your email address. We send a link that works once, for 15 minutes. There is no password to leak.'],
      ['Who handles payment?', 'Lemon Squeezy, as merchant of record. They take the payment, charge the right sales tax or VAT, and send the receipt. We never see your card.'],
      ['How do I cancel?', 'From your account page, which opens the Lemon Squeezy customer portal. The plan runs to the end of the period you paid for.'],
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
