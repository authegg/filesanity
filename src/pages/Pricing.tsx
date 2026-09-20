import { Check } from '@phosphor-icons/react'
import { Closer, PageHead, Pill, Section } from '../ui/bits'

export const meta = {
  title: 'Pricing: free, no account, no upload',
  description: 'Everything is free, with no account and no limit: the page, batch, the command line tool, the self-hosted API, the browser extension and team policies.',
}

const FREE = ['Every format on the formats page', 'No file size limit and no daily count', 'No account, no email, no cookie', 'Works offline once loaded', 'The parser source, published as plain text']

const TOOLS: [string, string, string, string][] = [
  ['/batch', 'Batch', 'For one person with many files.', 'Drop a folder, get a clean folder as one zip, in the browser.'],
  ['/cli', 'Command line', 'For a shell or a script.', 'One file, no dependencies, Node 20 or newer, the same switches.'],
  ['/extension', 'Extension', 'For every upload.', 'Cleans a file the moment you choose it in any site\'s picker.'],
  ['/api', 'API', 'For a desk that sends files all day.', 'Two routes you host yourself, on a Worker or a Node process.'],
  ['/batch', 'Policy', 'For a team with a rule.', 'Which kinds stay, as a link the whole desk uses, stored nowhere.'],
]

export default function Pricing() {
  return (
    <>
      <PageHead
        eyebrow="Pricing"
        title="Everything is free."
        lede="There is no server behind the page, so there is nothing to charge you for. The tools that were planned as paid plans are built and free too: nothing on this site sits behind a price or an account."
      />
      <Section>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="bezel bezel-lg lg:col-span-5" data-reveal="">
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
          <div className="bezel bezel-lg lg:col-span-7" data-reveal="" style={{ '--d': '80ms' } as React.CSSProperties}>
            <div className="plate p-6 sm:p-10">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <h2 className="text-[1.75rem] sm:text-[2.25rem]">Also free</h2>
                <span className="text-[1.125rem] text-muted">Built, not planned</span>
              </div>
              <ol className="rows mt-8 border-b border-hair-2">
                {TOOLS.map(([href, name, who, what]) => (
                  <li key={name} className="grid grid-cols-1 gap-1 py-4 md:grid-cols-12 md:gap-6">
                    <a href={href} className="text-[1.0625rem] font-medium hover:text-accent md:col-span-3">{name}</a>
                    <span className="text-[0.9375rem] text-muted md:col-span-4">{who}</span>
                    <span className="text-[0.9375rem] md:col-span-5">{what}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </Section>
      <Closer
        title="Nothing to pay for, nothing to sign up for."
        text="If a paid plan ever appears, it will be for something a page cannot do, and the changelog will say so first."
      />
    </>
  )
}
