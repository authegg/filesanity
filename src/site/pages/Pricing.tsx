import { useEffect, useState } from 'react'
import { FAQ } from '../content'
import { PAID, PLANS, fmtPrice, type PlanKey } from '../plans'
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
  ['Largest API file', (k) => `${PLANS[k].maxBytes / 1e6} MB`],
  ['Signed API reports', (k) => (k === 'team' || k === 'api' ? 'Yes' : 'No')],
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
                    : p.price ? <a className="btn plan-btn" href={mine && mine !== 'free' ? '/account' : `/account?plan=${k}`}>{mine && mine !== 'free' ? `Switch to ${p.name}` : `Choose ${p.name}`}</a>
                    : <a className="btn ghost plan-btn" data-cta href="/#cleaner">Clean a file</a>}
                </div>
              )
            })}
          </div>
          <p className="fine">Prices are in US dollars; sales tax or VAT is added at checkout where it applies.</p>
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

      <section className="sec faq" aria-labelledby="bill">
        <div className="wrap faq-in">
          <h2 id="bill">Billing</h2>
          <dl>{FAQ[1].items.map(([q, a]) => <div key={q}><dt>{q}</dt><dd>{a}</dd></div>)}</dl>
        </div>
      </section>
    </>
  )
}
