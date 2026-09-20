import { FAQ } from '../content'
import { Closer, PageHead, Section } from '../ui/bits'

export const meta = {
  title: 'FAQ: twelve questions, answered in full',
  description: 'Is it really free, does it work offline, what about video, why not metacleaner, what happens to my file, and eight more.',
}

export default function Faq() {
  return (
    <>
      <PageHead eyebrow="FAQ" title="Twelve questions." lede="Everything is open; there is nothing to expand. If yours is not here, the contact page has an address." />
      {FAQ.map(({ group, items }) => (
        <Section key={group} labelledBy={`h-${group.replace(/\W+/g, '-').toLowerCase()}`}>
          <h2 id={`h-${group.replace(/\W+/g, '-').toLowerCase()}`} className="text-[1.5rem] sm:text-[1.75rem]">{group}</h2>
          <dl className="mt-6 grid grid-cols-1 gap-x-10 md:grid-cols-2">
            {items.map(([q, a], i) => (
              <div key={q} className="border-t border-hair-2 py-6" data-reveal="" style={{ '--d': `${i * 50}ms` } as React.CSSProperties}>
                <dt className="text-[1.125rem] font-medium">{q}</dt>
                <dd className="mt-2 max-w-[60ch] text-[0.9375rem] text-muted">{a}</dd>
              </div>
            ))}
          </dl>
        </Section>
      ))}
      <Closer title="The rest is quicker to try than to ask." text="Drop a file on the home page and read the table." />
    </>
  )
}
