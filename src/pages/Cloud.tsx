import { Check } from '@phosphor-icons/react'
import { CLOUD, PLANS, TRIAL } from '../cloud'
import { Closer, PageHead, Pill, Section } from '../ui/bits'

export const meta = {
  title: 'Cloud API: the hosted cleaner, with a key',
  description: 'The self-hosted API run for you at api.filesanity.com with a key and a monthly quota. A 500-file trial, then Starter or Business. Nothing is stored.',
}

const ROWS: [string, string, string, string][] = [
  ['Files a month', TRIAL.files.toLocaleString('en') + ' once', PLANS.starter.files.toLocaleString('en'), PLANS.business.files.toLocaleString('en')],
  ['File size', `${TRIAL.maxBytes / 1e6} MB`, `${PLANS.starter.maxBytes / 1e6} MB`, `${PLANS.business.maxBytes / 1e6} MB`],
  ['Signed clean-reports', 'yes', 'yes', 'yes'],
  ['Policy per request', 'yes', 'yes', 'yes'],
  ['Over the quota', 'stops', `stops, or the next plan`, `$1 per 1,000 more`],
  ['Support', 'the docs', 'email, two days', 'email, one day'],
]

export default function Cloud() {
  return (
    <>
      <PageHead
        eyebrow="Cloud API"
        title="The hosted cleaner, with a key."
        lede={<>The <a href="/api" className="link">self-hosted API</a> is free and always will be. If you would rather not host it, the same two routes run at <code>{CLOUD.replace('https://', '')}</code> with a key and a quota. This is the one FileSanity service where a file does leave your machine: it is held in memory for one request on Cloudflare's network and nothing is stored. <a href="/cloud/terms" className="link">Its own terms and privacy.</a></>}
      />
      <Section>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {[TRIAL, PLANS.starter, PLANS.business].map((p, i) => (
            <div key={p.name} className="bezel" data-reveal="" style={{ '--d': `${i * 80}ms` } as React.CSSProperties}>
              <div className="plate flex h-full flex-col p-6 sm:p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="text-[1.5rem]">{p.name}</h2>
                  <span className="text-[1.125rem] tabular-nums text-muted">{p.price ? `$${p.price} a month` : 'Free'}</span>
                </div>
                <p className="mt-2 text-muted">{p.who}</p>
                <ul className="rows mt-6 border-b border-hair-2">
                  {ROWS.map(([label, ...vals]) => (
                    <li key={label} className="flex items-start justify-between gap-4 py-2.5 text-[0.9375rem]">
                      <span className="text-muted">{label}</span>
                      <span className="text-right tabular-nums">{vals[i] === 'yes' ? <Check size={16} weight="light" className="inline text-accent" aria-label="yes" /> : vals[i]}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  {p.checkout ? <Pill href={p.checkout}>Subscribe</Pill> : <Pill href={`${CLOUD}/`} ghost>Get a trial key</Pill>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>
      <Section>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-5">
            <h2 className="text-[1.75rem] sm:text-[2.25rem]">How a key works.</h2>
          </div>
          <div className="prose md:col-span-7">
            <p>A trial key is issued on the API's page against an email address and works for {TRIAL.files} files, once. A paid key is the licence key printed on your Lemon Squeezy receipt; it works while the subscription does and stops when it lapses. Either goes in <code>Authorization: Bearer</code>; <code>GET /usage</code> shows what is left.</p>
            <p>Checkout, invoices, VAT and card details are handled by Lemon Squeezy, the merchant of record. FileSanity keeps, per key, the email and a count. Nothing about any file is written anywhere; Cloudflare's request logs record the request's size and time as they do for any Worker.</p>
            <p>The parsers are the ones published at <a href="/source" className="link">/source</a>, so a report from the cloud and a report from the page say the same thing about the same file. Add <code>?report=1</code> to <code>/clean</code> and the reply carries a JSON record of what was removed and the SHA-256 of the clean bytes, signed with a key you can fetch from <code>{CLOUD.replace('https://', '')}/.well-known/filesanity-report-key</code>.</p>
          </div>
        </div>
      </Section>
      <Closer title="Rather host it yourself?" text="The API is one file, MIT licensed, and runs on a free Cloudflare Worker or a Node process." cta={<Pill href="/api">Self-host it</Pill>} />
    </>
  )
}
