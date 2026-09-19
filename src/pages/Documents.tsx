import { Closer, PageHead, Section } from '../ui/bits'

export const meta = {
  title: 'Documents: what Word, Excel and PowerPoint reveal',
  description: 'Author, company, last saved by, revision count, editing time and comment authors in .docx, .xlsx and .pptx files, and what FileSanity removes.',
}

const PARTS: [string, string, [string, string][]][] = [
  ['docProps/core.xml', 'The Dublin Core properties every Office file carries.', [
    ['creator', 'The name the software was registered with, or the account that made the file. A template made by one person names them in every document made from it.'],
    ['lastModifiedBy', 'Who saved it last. A file drafted by a lawyer and saved by a paralegal names both.'],
    ['created, modified, lastPrinted', 'When it was made, changed and printed, to the second.'],
    ['revision', 'How many times it was saved. A "final" offer at revision 41 tells a story.'],
    ['title, subject, description, keywords, category', 'Free text, often inherited from an older file the new one was saved over.'],
  ]],
  ['docProps/app.xml', 'Properties written by the application.', [
    ['Application, AppVersion', 'Which program and version. Word for Mac, LibreOffice, Google Docs export.'],
    ['Company, Manager', 'Taken from the licence or the account. A personal document made on a work laptop names the employer.'],
    ['TotalTime', 'Editing time in minutes. A quote that took four minutes and a report that took nine hours both say so.'],
    ['Pages, Words, Characters, Slides, Notes', 'Counts. Harmless alone; with revision and time they sketch the work.'],
    ['Template', 'The template file name, sometimes with a path.'],
  ]],
  ['docProps/custom.xml', 'Custom properties, set by people and by systems.', [
    ['Any name and value', 'Document management systems write matter numbers, client codes, classification labels and reviewer names here. They travel with the file when it leaves.'],
  ]],
  ['The rest of the package', 'Parts that are not properties but still say something.', [
    ['docProps/thumbnail.jpeg', 'A picture of the first page, kept even after the first page is changed.'],
    ['Zip entry timestamps', 'Every part in the package carries its own modified time.'],
    ['Comments and tracked changes', 'Each carries the author\'s name and the time. FileSanity shows them and leaves them, because removing them edits the document. Accept the changes and delete the comments in your editor first if they should not travel.'],
    ['Pictures inside the document', 'A pasted photo keeps its own EXIF inside the package. Not read yet.'],
  ]],
]

export default function Documents() {
  return (
    <>
      <PageHead
        eyebrow="Documents"
        title="A document knows who wrote it."
        lede="Word, Excel and PowerPoint files are zip packages, and three small XML parts inside them record the author, the company, the last person to save, the revision count and the time spent. Here is each part and what it reveals."
      />
      <Section>
        <div className="space-y-6">
          {PARTS.map(([name, what, fields], i) => (
            <div key={name} className="bezel" data-reveal="" style={{ '--d': `${i * 60}ms` } as React.CSSProperties}>
              <div className="plate grid grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-12">
                <div className="lg:col-span-4">
                  <h2 className="text-[1.375rem] break-words">{name}</h2>
                  <p className="mt-2 max-w-[36ch] text-muted">{what}</p>
                </div>
                <dl className="rows lg:col-span-8">
                  {fields.map(([f, why]) => (
                    <div key={f} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-12 sm:gap-6">
                      <dt className="text-[0.9375rem] font-medium sm:col-span-5">{f}</dt>
                      <dd className="text-[0.9375rem] text-muted sm:col-span-7">{why}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          ))}
        </div>
      </Section>
      <Section labelledBy="h-what">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <h2 id="h-what" className="text-[1.75rem] sm:text-[2.25rem] lg:col-span-4">What is removed.</h2>
          <div className="prose lg:col-span-8">
            <p>core.xml, app.xml and custom.xml are emptied, the thumbnail part and its relationship are dropped, and the package is rewritten part for part with every entry's timestamp reset to the zip epoch. The document body, the sheets and the slides are copied byte for byte and open as they did.</p>
            <p>Comment and tracked-change authors are listed in the table as shown, not removed. The old binary formats (.doc, .xls, .ppt) and OpenDocument are not read yet.</p>
          </div>
        </div>
      </Section>
      <Closer title="Clean a document before it leaves." text="Drop it on the home page. The author, the company and the editing time go; the text stays." />
    </>
  )
}
