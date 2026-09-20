import { LAUNCH, VERSION } from '../content'
import { PageHead, Section } from '../ui/bits'

export const meta = {
  title: 'Changelog: what changed, by version and date',
  description: 'Every change to FileSanity, by version and date: which formats are read, what is removed, and what the page says when it cannot reach a field.',
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
              <p>The tools that were listed as paid plans are built and free. Nothing sits behind a price or an account.</p>
              <ul>
                <li>Batch: drop a folder or many files, get one zip in the same shape, in the browser.</li>
                <li>Policy: the kinds a team keeps, carried in the page's address as a link and stored nowhere; the home page honours it too.</li>
                <li>Command line: one dependency-free file for Node 20 or newer, with the same switches.</li>
                <li>API: two routes to host yourself, on a Cloudflare Worker or a Node process, with a bearer token.</li>
                <li>Extension: cleans a file the moment it is chosen in any site's picker; loaded unpacked, not yet in a store.</li>
                <li>The parsers' XML reader is now our own, so the same code runs in the browser, in Node and in a Worker. The published source gains xml.ts and zip.ts.</li>
                <li>The site: a blog with five posts and a feed, installable as an app that works offline, per-page structured data.</li>
              </ul>
            </div>
          </li>
          <li className="grid grid-cols-1 gap-3 py-8 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-4">
              <h2 className="text-[1.375rem]">Version 1.0</h2>
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
