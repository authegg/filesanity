import { Closer, PageHead, Section } from '../ui/bits'

export const meta = {
  title: 'PDF: what the Info dictionary and XMP reveal',
  description: 'What a PDF reveals in its Info dictionary and XMP packet, what FileSanity blanks, and an honest note on compressed object streams.',
}

export default function Pdf() {
  return (
    <>
      <PageHead
        eyebrow="PDF"
        title="A PDF knows what made it, and when."
        lede="PDF metadata lives in two places, and one of them is sometimes out of reach. This page says exactly what is read, what is blanked, and when you should not treat the result as clean."
      />
      <Section>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bezel" data-reveal="">
            <div className="plate p-6 sm:p-8">
              <h2 className="text-[1.5rem]">The Info dictionary</h2>
              <p className="mt-2 text-muted">The original PDF metadata, a small dictionary the trailer points to.</p>
              <dl className="rows mt-6">
                {[
                  ['Author', 'Usually the account name of whoever exported the file.'],
                  ['Creator', 'The program the document was written in: Word, InDesign, a browser.'],
                  ['Producer', 'The library that wrote the PDF, with its version.'],
                  ['Title, Subject, Keywords', 'Often the original file name, including a draft number or a client name.'],
                  ['CreationDate, ModDate', 'To the second, with time zone.'],
                ].map(([f, why]) => (
                  <div key={f} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-12 sm:gap-4">
                    <dt className="text-[0.9375rem] font-medium sm:col-span-5">{f}</dt>
                    <dd className="text-[0.9375rem] text-muted sm:col-span-7">{why}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <div className="bezel" data-reveal="" style={{ '--d': '80ms' } as React.CSSProperties}>
            <div className="plate p-6 sm:p-8">
              <h2 className="text-[1.5rem]">The XMP packet</h2>
              <p className="mt-2 text-muted">An XML stream in the document catalog, written by most modern producers.</p>
              <dl className="rows mt-6">
                {[
                  ['dc:creator, dc:title', 'Author and title again, as text.'],
                  ['xmp:CreatorTool, pdf:Producer', 'The software, again.'],
                  ['xmp:CreateDate, xmp:ModifyDate, xmp:MetadataDate', 'The dates, again.'],
                  ['xmpMM:DocumentID, xmpMM:InstanceID', 'Identifiers that link this file to the versions before it.'],
                ].map(([f, why]) => (
                  <div key={f} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-12 sm:gap-4">
                    <dt className="text-[0.9375rem] font-medium sm:col-span-5">{f}</dt>
                    <dd className="text-[0.9375rem] text-muted sm:col-span-7">{why}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </Section>
      <Section labelledBy="h-what">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <h2 id="h-what" className="text-[1.75rem] sm:text-[2.25rem] lg:col-span-4">What is blanked, and what is not.</h2>
          <div className="prose lg:col-span-8">
            <p>Every value in the Info dictionary, and every value in an uncompressed XMP packet, is overwritten in place with spaces of the same length. Same length matters: a PDF is a table of byte offsets, and a file whose values are blanked without moving anything opens exactly as before. Every copy of the Info dictionary is treated, including the ones left behind by incremental saves.</p>
            <p>An XMP packet that has been compressed, which is what Word and Acrobat usually write, is detected and shown, but it is not opened. Blanking it would mean re-compressing the stream and rewriting the cross-reference table, and that is not done yet. The result says "shown and kept" for that row and counts it in the after figure.</p>
            <p>Metadata inside compressed object streams, which newer producers use for the whole file, is neither read nor removed. When a file has object streams and no readable Info dictionary, the result says to treat the file as not cleaned. This is the one format where FileSanity may not finish the job, and it tells you when that is so.</p>
            <p>If a PDF has to be clean, the sure way is to print it to a new PDF, which drops the old metadata with the old structure, and then clean the new file here.</p>
          </div>
        </div>
      </Section>
      <Closer title="Clean a PDF, and read what the result says." text="Drop it on the home page. If a compressed stream is kept, the page tells you so." />
    </>
  )
}
