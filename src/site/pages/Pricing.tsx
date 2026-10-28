import { useEffect, useState, type ReactNode } from 'react'
import { FAQ, MAIL } from '../content'
import { API_LIMITS, PAID, PLANS, fmtPrice, type PlanKey } from '../plans'
import { Head } from '../ui'
import { knownPlan } from '../useMe'

export const meta = {
  title: 'Pricing: free for one file, paid for batches, teams and the API',
  description: 'Cleaning one file at a time in your browser is free. Pro adds batches and a saved policy, Team adds five seats, API adds hosted cleaning by key with signed reports.',
}

const ALL: PlanKey[] = ['free', ...PAID]
const n = (x: number) => x.toLocaleString('en')
const ROWS: [string, (k: PlanKey) => string][] = [
  ['Clean single files in the browser', () => 'Yes'],
  ['Every format, the report per file', () => 'Yes'],
  ['Batches, one zip and a record', (k) => (PLANS[k].batch ? 'Yes' : 'One at a time')],
  ['Saved policy', (k) => (k === 'team' ? 'Shared by the team' : PLANS[k].batch ? 'Yes' : 'No')],
  ['People', (k) => String(PLANS[k].seats)],
  ['Hosted API files a month', (k) => n(PLANS[k].apiFiles)],
  ['Largest API file', (k) => `${PLANS[k].maxBytes / 1e6} MB${PLANS[k].maxBytes > API_LIMITS.whole ? `; JPEG, PDF ${API_LIMITS.whole / 1e6} MB` : ''}`],
  ['Signed API reports', (k) => (k === 'team' || k === 'api' ? 'Yes' : 'No')],
]

/** What a law firm or agency asks before it pays; each answer restates the privacy policy, not a new promise. */
const FIRMS: [string, ReactNode][] = [
  ['Do our client files reach FileSanity?', 'No. On this website and in the extension, files are read and cleaned inside each person\'s browser, batches included. We never receive them, so there is nothing of your clients\' for us to store, process or lose. Only the hosted API receives files, for one request.'],
  ['What do you keep about us?', 'The account holder\'s email address, the plan and its renewal date, your team members\' email addresses, your saved policy and a monthly count of API files. Nothing about the files you clean.'],
  ['How do five people share Team?', 'The account holder adds up to four colleagues by email on the account page. Each signs in with their own address, gets everything in Pro, and cleans under the one policy the team shares.'],
  ['Do we get an invoice?', 'Yes. Paddle sells the plans as merchant of record: it charges the payment, adds sales tax or VAT where it applies, and emails a receipt for every payment.'],
  ['Can we see it working first?', <>The free cleaner is the same one the paid plans use: try it on one of your own files. For a ten-minute walkthrough with your team, write to <a href={`mailto:${MAIL}`}>{MAIL}</a>.</>],
]

export default function Pricing() {
  const [mine, setMine] = useState<PlanKey | null>(null)
  useEffect(() => setMine(knownPlan()), [])
  return (
    <>
      <Head h1="Free for one file. Paid for many." lede="Cleaning a file in your browser is free, with no account, and stays free. You pay for convenience: batches, a saved policy, a team and the hosted API." />
      <section className="sec first" aria-label="Plans">
        <div className="wrap">
          <div className="plan-grid four">
            {ALL.map((k) => {
              const p = PLANS[k]
              return (
                <div className={`plan ${k === 'pro' ? 'lead' : ''}`} key={k}>
                  <h2 className="plan-name">{p.name}</h2>
                  <p className="plan-note">{p.who}</p>
                  <p className="plan-price"><b>{fmtPrice(p)}</b> a month</p>
                  <ul>{p.items.map((x) => <li key={x}>{x}</li>)}</ul>
                  {mine === k && p.price ? <a className="btn ghost plan-btn" href="/account">Your plan</a>
                    : p.price ? <a className="btn plan-btn" href={`/account?plan=${k}`}>{mine && mine !== 'free' ? `Switch to ${p.name}` : `Choose ${p.name}`}</a>
                    : <a className="btn ghost plan-btn" data-cta href="/#cleaner">Clean a file</a>}
                </div>
              )
            })}
          </div>
          <p className="fine">{PLANS.pro.checkout ? '' : 'Paid plans open soon; an account made now carries over. '}Prices are in US dollars; sales tax or VAT is added at checkout where it applies.</p>
        </div>
      </section>

      <section className="sec" aria-labelledby="cmp">
        <div className="wrap">
          <h2 id="cmp">Side by side</h2>
          <table className="cmp">
            <thead><tr><th scope="col"><span className="sr">Feature</span></th>{ALL.map((k) => <th scope="col" key={k}>{PLANS[k].name}</th>)}</tr></thead>
            <tbody>{ROWS.map(([label, f]) => (
              <tr key={label}><th scope="row">{label}</th>{ALL.map((k) => <td key={k} data-plan={PLANS[k].name}>{f(k)}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className="sec faq" aria-labelledby="firms">
        <div className="wrap faq-in">
          <h2 id="firms">For firms</h2>
          <dl>{FIRMS.map(([q, a]) => <div key={q}><dt>{q}</dt><dd>{a}</dd></div>)}</dl>
        </div>
      </section>

      <section className="sec faq" aria-labelledby="bill">
        <div className="wrap faq-in">
          <h2 id="bill">Billing</h2>
          <dl>{FAQ[1].items.map(([q, a]) => <div key={q}><dt>{q}</dt><dd>{a}</dd></div>)}</dl>
        </div>
      </section>
    </>
  )
}
