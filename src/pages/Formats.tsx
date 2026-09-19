import { FORMATS } from '../content'
import { Closer, PageHead, Section } from '../ui/bits'

export const meta = {
  title: 'Formats: what is read and removed, per format',
  description: 'The full table of what FileSanity reads and removes for JPEG, PNG, Word, Excel, PowerPoint and PDF, and which formats are not supported yet.',
}

export default function Formats() {
  const read = FORMATS.filter((f) => f.status === 'read')
  const later = FORMATS.filter((f) => f.status !== 'read')
  return (
    <>
      <PageHead
        eyebrow="Formats"
        title="Every format, read and removed."
        lede="Files are told apart by their first bytes, not their names. Each format has its own parser, written for this page and small enough to read. This is the whole list."
      />
      <Section labelledBy="h-read">
        <h2 id="h-read" className="text-[1.75rem] sm:text-[2.25rem]">Read and cleaned</h2>
        {/* Below 768px the comparison stacks; above it is a three-column table with no inner scroll. */}
        <div className="mt-8 hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted">
                <th scope="col" className="w-[11rem] pb-3 pr-6 font-medium">Format</th>
                <th scope="col" className="w-[38%] pb-3 pr-6 font-medium">Read</th>
                <th scope="col" className="pb-3 font-medium">Removed</th>
              </tr>
            </thead>
            <tbody>
              {read.map((f) => (
                <tr key={f.name} className="border-t border-hair-2 align-top">
                  <th scope="row" className="py-5 pr-6 text-left font-medium">
                    {f.name}
                    <span className="block text-[0.8125rem] font-normal text-muted">{f.ext}</span>
                  </th>
                  <td className="py-5 pr-6 text-[0.9375rem] text-muted">{f.read}</td>
                  <td className="py-5 text-[0.9375rem]">{f.removed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="rows mt-8 border-b border-hair-2 md:hidden">
          {read.map((f) => (
            <li key={f.name} className="py-5">
              <h3 className="text-[1.125rem]">{f.name} <span className="text-[0.8125rem] font-normal text-muted">{f.ext}</span></h3>
              <dl className="mt-3 space-y-3 text-[0.9375rem]">
                <div><dt className="text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted">Read</dt><dd className="mt-1 text-muted">{f.read}</dd></div>
                <div><dt className="text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted">Removed</dt><dd className="mt-1">{f.removed}</dd></div>
              </dl>
            </li>
          ))}
        </ul>
      </Section>
      <Section labelledBy="h-later">
        <h2 id="h-later" className="text-[1.75rem] sm:text-[2.25rem]">Not yet</h2>
        <p className="mt-3 max-w-[60ch] text-muted">Dropping one of these tells you it cannot be read. Nothing is sent either way.</p>
        <ul className="rows mt-8 border-b border-hair-2">
          {later.map((f) => (
            <li key={f.name} className="grid grid-cols-1 gap-1 py-4 md:grid-cols-12 md:gap-6">
              <span className="font-medium md:col-span-3">{f.name} <span className="block text-[0.8125rem] font-normal text-muted">{f.ext}</span></span>
              <span className="text-[0.9375rem] text-muted md:col-span-9">{f.removed}</span>
            </li>
          ))}
        </ul>
      </Section>
      <Closer title="Six formats, all of them on your machine." text="Drop one on the home page and see the table for your own file." />
    </>
  )
}
