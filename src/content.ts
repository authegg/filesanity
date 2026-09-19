/** Shared facts. A number or a format that appears on two pages comes from here. */

export const SITE = 'https://filesanity.com' // CLIENT: placeholder until the domain is confirmed
export const MAIL = 'hello@filesanity.com' // CLIENT: placeholder address
export const LAUNCH = '20 September 2026'
export const VERSION = '1.0'

export type Format = { name: string; ext: string; read: string; removed: string; status: 'read' | 'not-yet' }

export const FORMATS: Format[] = [
  { name: 'JPEG', ext: '.jpg, .jpeg', status: 'read', read: 'EXIF (camera, lens, dates, GPS, owner, serial numbers, the embedded thumbnail), XMP, IPTC and Photoshop resources, comments', removed: 'All of it. The ICC colour profile stays so the colours do not shift. If the photo was shot sideways, one orientation value is written back so it still displays the right way up.' },
  { name: 'PNG', ext: '.png', status: 'read', read: 'tEXt, zTXt and iTXt text chunks (including XMP), eXIf, tIME', removed: 'All of it. The colour profile stays.' },
  { name: 'Word', ext: '.docx', status: 'read', read: 'core.xml, app.xml and custom.xml (author, last saved by, company, manager, revision, editing time, custom properties), the first-page thumbnail; the names on comments and tracked changes', removed: 'The three property parts are emptied, the thumbnail is dropped and every zip entry\'s own timestamp is reset. Comment and tracked-change authors are shown, not removed: that is an edit to the document, so it stays your call.' },
  { name: 'Excel', ext: '.xlsx', status: 'read', read: 'core.xml, app.xml and custom.xml, the thumbnail', removed: 'The three property parts are emptied, the thumbnail is dropped, the zip timestamps are reset.' },
  { name: 'PowerPoint', ext: '.pptx', status: 'read', read: 'core.xml, app.xml and custom.xml, the thumbnail', removed: 'The three property parts are emptied, the thumbnail is dropped, the zip timestamps are reset.' },
  { name: 'PDF', ext: '.pdf', status: 'read', read: 'The Info dictionary (author, creator, producer, title, subject, keywords, dates) and the XMP packet', removed: 'Info values and an uncompressed XMP packet are blanked in place, same length, so nothing else in the file moves. A compressed XMP stream, which is what Word and Acrobat usually write, is shown and kept, and the page says so. Metadata inside compressed object streams is not read yet.' },
  { name: 'Video and audio', ext: '.mp4, .mov, .m4a, .m4v', status: 'not-yet', read: 'Not read yet', removed: 'Not yet. The udta and meta atoms are on the list.' },
  { name: 'GIF', ext: '.gif', status: 'not-yet', read: 'Not read yet', removed: 'Not yet.' },
  { name: 'TIFF', ext: '.tif, .tiff', status: 'not-yet', read: 'Not read yet', removed: 'Not yet.' },
  { name: 'Photoshop', ext: '.psd', status: 'not-yet', read: 'Not read yet', removed: 'Not yet.' },
  { name: 'Legacy Office', ext: '.doc, .xls, .ppt', status: 'not-yet', read: 'Not read yet', removed: 'Not yet. The binary formats need a different parser.' },
  { name: 'OpenDocument', ext: '.odt, .ods, .odp', status: 'not-yet', read: 'Not read yet', removed: 'Not yet.' },
]

export const FAQ: { group: string; items: [string, string][] }[] = [
  {
    group: 'The basics',
    items: [
      ['Is this really free?', 'Yes. Everything on this site runs in your browser, so there is no server to pay for and nothing to charge you for. There is no account, no limit on file size or count, and no upload. Paid plans for batches, an API and a browser extension are planned and marked as coming soon on the pricing page; nothing here moves behind them.'],
      ['Does it work offline?', 'Yes. Once the page has loaded, disconnect and it keeps working. The sample file is the only thing fetched on demand, and only when you press "Try a sample".'],
      ['What happens to my file?', 'Your browser hands the page a reference to it. The page reads the header bytes it needs, shows you what it found, and builds the clean copy from slices of the original. The file is never sent anywhere and is forgotten when you close the tab.'],
      ['How do I know nothing is uploaded?', 'Open your browser\'s developer tools, choose the Network tab, then drop a file and clean it. No request appears. The counter beside your result reads the same data from the browser. The source is unminified enough to read, and there is no server component at all.'],
    ],
  },
  {
    group: 'Files and formats',
    items: [
      ['Which formats are supported?', 'JPEG, PNG, Word, Excel and PowerPoint (.docx, .xlsx, .pptx) and PDF. The formats page lists exactly what is read and removed for each.'],
      ['What about video?', 'Not yet. MP4, MOV and M4A carry metadata in their udta and meta atoms, and a parser for those is on the list. Drop one today and the page tells you it cannot read it; nothing is sent either way.'],
      ['Does cleaning change the picture or the text?', 'No. Nothing is decoded or re-saved. The clean file is the original with the metadata parts left out, so the pixels and the document body are byte for byte what they were. The one exception is a sideways photo, where a single orientation value is written back so it still displays the right way up.'],
      ['Why is my PDF only partly cleaned?', 'PDF metadata can live in an uncompressed Info dictionary and XMP packet, which FileSanity blanks in place, or inside compressed object streams, which it does not read yet. When a file has the second kind, the result says so, and you should not treat it as cleaned.'],
    ],
  },
  {
    group: 'Trust',
    items: [
      ['Why not just use metacleaner?', 'metacleaner and the sites like it upload your file to a server, clean it there and send it back, so you have to trust their storage, their logs and their deletion policy. FileSanity never has the file. That is not a promise; it is how the page is built.'],
      ['Do you use cookies or analytics?', 'No. The site sets no cookies and loads no analytics or advertising script, which is why there is no cookie banner. The privacy policy is short because there is nothing to describe.'],
      ['Can I see the source?', 'Yes. The site is a static bundle with no server half: what your browser downloads is everything there is. View it with the browser\'s own tools. Every parser is a few hundred lines written for this page, with no metadata library behind it.'],
      ['Who is behind this?', 'A small company with no investors and no data business. The about page says what it is and what it will not do; the contact page has the address.'],
    ],
  },
]
