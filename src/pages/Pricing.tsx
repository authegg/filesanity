import { Check } from '@phosphor-icons/react'
import { MAIL } from '../content'
import { Closer, Mailbox, PageHead, Pill, Section } from '../ui/bits'

export const meta = {
  title: 'Pricing: free, no account, no upload',
  description: 'Everything on this site is free with no account and no limit. Pro and Teams plans for batches, an API and a browser extension are coming; no prices are set yet.',
}

const FREE = ['Every format on the formats page', 'No file size limit and no daily count', 'No account, no email, no cookie', 'Works offline once loaded', 'The parser source, published as plain text']

export default function Pricing() {
  const subject = encodeURIComponent('Tell me when Pro is ready')
  const body = encodeURIComponent('I would like to hear when FileSanity Pro or Teams is available.\n\nWhat I would use it for:\n')
  return (
    <>
      <PageHead
        eyebrow="Pricing"
        title="Everything on this site is free."
        lede="There is no server behind the page, so there is nothing to charge you for. Paid plans will add things a page alone cannot do. They are not priced yet, and nothing here will move behind them."
      />
      <Section>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="bezel bezel-lg lg:col-span-7" data-reveal="">
            <div className="plate flex h-full flex-col p-6 sm:p-10">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <h2 className="text-[1.75rem] sm:text-[2.25rem]">Free</h2>
                <span className="text-[1.125rem] text-muted">No account</span>
              </div>
              <p className="mt-3 max-w-[48ch] text-muted">The whole tool, today, in your browser.</p>
              <ul className="rows mt-8 border-b border-hair-2">
                {FREE.map((f) => (
                  <li key={f} className="flex items-start gap-3 py-3 text-[0.9375rem]">
                    <Check size={16} weight="light" className="mt-1 flex-none text-accent" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Pill href="/">Clean a file</Pill>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6 lg:col-span-5">
            {[
              ['Pro', 'For one person with many files.', ['Batch: drop a folder, get a clean folder', 'A command line tool', 'A browser extension that cleans before upload']],
              ['Teams', 'For a desk that sends files all day.', ['Everything in Pro', 'An API you host yourself', 'A policy: which fields a team always removes']],
            ].map(([name, who, items], i) => (
              <div key={name as string} className="bezel" data-reveal="" style={{ '--d': `${80 + i * 80}ms` } as React.CSSProperties}>
                <div className="plate p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-[1.5rem]">{name}</h2>
                    <span className="eyebrow eyebrow-accent">Coming soon</span>
                  </div>
                  <p className="mt-2 text-muted">{who}</p>
                  <ul className="mt-5 space-y-2 text-[0.9375rem] text-muted">
                    {(items as string[]).map((it) => <li key={it}>{it}</li>)}
                  </ul>
                  <p className="mt-5 text-[0.8125rem] text-muted">Not priced yet. Nothing on this site moves behind it.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>
      <Closer
        title="Hear when Pro is ready."
        text={<>A plain email, no list to join. Write to <Mailbox /> and you will get one reply when there is something to try.</>}
        cta={<Pill href={`mailto:${MAIL}?subject=${subject}&body=${body}`}>Email us</Pill>}
      />
    </>
  )
}
