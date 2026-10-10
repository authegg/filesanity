import type { ReactNode } from 'react'
import { Tray } from '../../shared/Tray'
import type { Cleaner } from '../../shared/useCleaner'
import { Block, Head } from '../ui'

type Spec = {
  meta: { title: string; description: string }
  h1: string
  lede: string
  removes: [string, string][]
  keeps: string[]
  note?: string
  guide: ReactNode
}

function page(s: Spec) {
  function FormatPage({ c }: { c: Cleaner }) {
    return (
      <>
        <Head h1={s.h1} lede={s.lede}><div className="head-tool" id="cleaner"><Tray c={c} /></div></Head>
        <Block id="h-removes" title="What it removes">
          <table className="spec"><tbody>{s.removes.map(([k, v]) => <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>)}</tbody></table>
        </Block>
        <Block id="h-keeps" title="What it leaves alone">
          <ul>{s.keeps.map((k) => <li key={k}>{k}</li>)}</ul>
          {s.note && <p>{s.note}</p>}
        </Block>
        <Block id="h-hand" title="Doing it by hand">
          <p>{s.guide}</p>
        </Block>
        <Block id="h-many" title="Many files at once">
          <p>Clean a folder's worth in one go on the <a href="/batch">batch page</a>: one zip back, with a record of what was removed from each file.</p>
        </Block>
      </>
    )
  }
  return { meta: s.meta, default: FormatPage, tool: true }
}

export const Photos = page({
  meta: { title: 'Remove metadata from photos and videos: JPEG, PNG, HEIC, MP4, MOV', description: 'Remove GPS position, camera serial number, dates and names from JPEG, PNG and iPhone HEIC photos and MP4 and MOV videos, inside your browser. Nothing is re-encoded and nothing is uploaded.' },
  h1: 'Photos carry the place they were taken.',
  lede: 'A phone writes the GPS position, the time and its own serial number into every picture and video. Remove them here before the file goes to a buyer, a client or a stranger.',
  removes: [
    ['Place', 'GPS latitude, longitude, altitude and direction; city, region and country in XMP and IPTC'],
    ['Person', 'Artist, author, copyright owner, camera owner name, IPTC by-line'],
    ['Time', 'Date taken, digitised and modified, GPS time stamp, PNG last-modified time'],
    ['Device', 'Make, model, lens, body serial number, editing software'],
    ['AI and provenance', 'C2PA Content Credentials (the app that made the image, who signed it, whether it says AI made it, its edit history), the IPTC "made by AI" source type, and the prompt and settings AI image tools write into PNG text'],
    ['Video', 'MP4 and MOV: GPS position, camera make and model, software, title and the recording time'],
    ['Other', 'Comments, keywords, embedded thumbnail, exposure settings'],
  ],
  keeps: ['The picture, video and sound: nothing is re-encoded, so no quality is lost', 'The colour profile, so colours look the same', 'Orientation, so the photo stays the right way up'],
  guide: <>To do it with your phone's own settings, read <a href="/guides/remove-location-from-photos">remove the location from a photo</a>, and for every field a photo can carry, <a href="/guides/photo-metadata-explained">what a photo carries</a>.</>,
  note: 'iPhone HEIC photos and videos are cleaned in place: the GPS, camera and names are blanked inside the file, which keeps its size and its picture exactly. A video is read from its header alone, so even a long one cleans in seconds.',
})

export const Documents = page({
  meta: { title: 'Remove metadata from Word, Excel and PowerPoint files', description: 'Remove author, last editor, company, editing time, custom properties and the preview thumbnail from .docx, .xlsx and .pptx files, inside your browser.' },
  h1: 'Documents carry who wrote them.',
  lede: 'Word, Excel and PowerPoint save the author, the last person to edit, the company and the minutes spent editing. Remove them before the file goes outside.',
  removes: [
    ['Person', 'Author, last modified by, manager, company'],
    ['Time', 'Created and modified dates, total editing time, revision number'],
    ['Device', 'Application name and version, template'],
    ['Custom fields', 'Every custom property: client numbers, matter numbers, internal tags'],
    ['Preview', 'The thumbnail picture of the first page'],
  ],
  keeps: ['Every word, cell, formula, slide and picture in the document', 'Styles, layout and formatting'],
  guide: <>To do it in Office with Document Inspector, read <a href="/guides/remove-author-from-office-files">remove the author and company from Word, Excel and PowerPoint</a>.</>,
  note: 'Some of what leaks is content, not metadata: hidden sheets, rows and columns, the data behind a pivot table, hidden text, deleted text kept as a tracked change, comments, speaker notes, hidden slides, embedded files, and pictures or templates fetched from the web when the file opens. FileSanity lists each one before you clean and leaves it as it is, because removing it would change the document; remove it in Office. Legacy .doc, .xls and .ppt files are not read yet.',
})

export const Pdf = page({
  meta: { title: 'Remove metadata from PDF files', description: 'Blank the author, title, subject, creator program, dates and XMP in a PDF, inside your browser. Says plainly when a PDF keeps metadata it cannot reach.' },
  h1: 'PDFs carry the program and the person.',
  lede: 'A PDF records who made it, with what program and when. FileSanity blanks those fields in place, so the PDF still opens exactly as before.',
  removes: [
    ['Person', 'Author'],
    ['Content', 'Title, subject and keywords in the document information'],
    ['Device', 'Creator and producer: the programs that made the PDF'],
    ['Time', 'Created and modified dates'],
    ['XMP', 'The XMP metadata packet, when it is stored uncompressed'],
  ],
  keeps: ['Every page, as it was', 'Links, bookmarks and form fields'],
  guide: <>To do it with Acrobat Pro or on the command line, read <a href="/guides/remove-pdf-metadata">see and remove the metadata in a PDF</a>.</>,
  note: 'Some PDFs keep their metadata inside compressed streams. FileSanity cannot reach those yet. It shows what it found, keeps it, and tells you the file is not fully clean. It also warns when a PDF still holds earlier saved versions, where deleted or covered text may be readable, and when it runs JavaScript or contacts a web address as it opens.',
})
