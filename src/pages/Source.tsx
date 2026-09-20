import { Closer, PageHead, Section } from '../ui/bits'

export const meta = {
  title: 'Source: the parsers, as plain text',
  description: 'The metadata parsers FileSanity runs in your browser, published as plain text, one file each, exactly as they are compiled into the site.',
}

/** Every file in src/lib, in the order they matter. The prerender checks this list against the folder and fails the build if they differ. */
export const SOURCE: [string, string][] = [
  ['index.ts', 'sniffs the format by its first bytes, dispatches, and holds the policy'],
  ['jpeg.ts', 'JPEG segments: EXIF, XMP, IPTC, comments removed; ICC kept; orientation written back'],
  ['png.ts', 'PNG chunks: text, eXIf and tIME removed; iCCP kept'],
  ['ooxml.ts', 'Word, Excel, PowerPoint packages: properties emptied, thumbnail dropped, zip rewritten'],
  ['pdf.ts', 'PDF: the Info dictionary and uncompressed XMP blanked in place, same length'],
  ['exif.ts', 'the TIFF reader behind EXIF, with GPS and the orientation-only writer'],
  ['xmp.ts', 'XMP packets and Photoshop IRB, IPTC datasets'],
  ['xml.ts', 'a small XML reader, so the same code runs in the browser, Node and a Worker'],
  ['zip.ts', 'the stored zip writer batch uses'],
  ['bytes.ts', 'byte helpers: slices, integers, CRC, inflate and deflate'],
  ['types.ts', 'the report shape every parser returns'],
]

export default function Source() {
  return (
    <>
      <PageHead eyebrow="Source" title="The parsers, as plain text." lede="These are the files that read and remove metadata, exactly as they are compiled into the site. The shipped script carries a source map too, so the developer tools show them under src/lib." />
      <Section>
        <div className="bezel bezel-lg" data-reveal="">
          <div className="plate p-6 sm:p-10">
            <ol className="rows border-b border-hair-2">
              {SOURCE.map(([f, what]) => (
                <li key={f} className="grid grid-cols-1 gap-1 py-4 md:grid-cols-12 md:gap-6">
                  <a href={`/source/${f}.txt`} className="link text-[0.9375rem] md:col-span-3"><code>{f}</code></a>
                  <span className="text-[0.9375rem] text-muted md:col-span-9">{what}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-[0.8125rem] text-muted">The same files build the <a href="/cli" className="link">command line tool</a>, the <a href="/api" className="link">API</a> and the <a href="/extension" className="link">extension</a>. No metadata library sits behind any of them.</p>
          </div>
        </div>
      </Section>
      <Closer title="Watch it run." text="Open the network panel, drop a file on the home page, and count the requests." />
    </>
  )
}
