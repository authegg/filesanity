import { LAUNCH, VERSION } from '../content'
import { PageHead, Section } from '../ui/bits'

export const meta = {
  title: 'Changelog',
  description: 'What changed in FileSanity, by version and date.',
}

export default function Changelog() {
  return (
    <>
      <PageHead eyebrow="Changelog" title="What changed." lede="One entry per release. Changes to the privacy policy or the terms are listed here too." />
      <Section>
        <ol className="rows border-b border-hair-2">
          <li className="grid grid-cols-1 gap-3 py-8 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-4">
              <h2 className="text-[1.375rem]">Version {VERSION}</h2>
              <p className="mt-1 text-muted">{LAUNCH}</p>
            </div>
            <div className="prose md:col-span-8">
              <p>Launch. Reads and removes metadata from JPEG, PNG, Word, Excel and PowerPoint (.docx, .xlsx, .pptx) and PDF, entirely in the browser.</p>
              <ul>
                <li>JPEG: EXIF, XMP, IPTC, Photoshop resources and comments removed; the ICC profile kept; orientation preserved.</li>
                <li>PNG: text chunks, eXIf and tIME removed; the colour profile kept.</li>
                <li>Office: core, app and custom properties emptied, thumbnail dropped, zip timestamps reset; comment and tracked-change authors shown and kept.</li>
                <li>PDF: Info dictionary and uncompressed XMP blanked in place; compressed XMP and object streams shown and kept, with a note.</li>
                <li>The site: fourteen pages, no account, no cookies, no analytics, a privacy policy and terms.</li>
              </ul>
            </div>
          </li>
        </ol>
      </Section>
    </>
  )
}
