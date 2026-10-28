import { useEffect, useState } from 'react'
import { PADDLE, PAID, PLANS, fmtPrice, type PlanKey } from '../plans'
import { call, remember, useMe, type Me } from '../useMe'

export const meta = { title: 'Account', description: 'Your FileSanity plan, API keys, team and policy.' }
export const index = false

const day = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '')
type PaddleJs = { Environment: { set(e: string): void }; Initialize(o: { token: string; checkout?: object; eventCallback?: (e: { name?: string }) => void }): void; Checkout: { open(o: object): void } }
let paddle: Promise<PaddleJs> | undefined
// The open plan row listens here for checkout.loaded / .closed / .error.
let onPaddle: ((name: string) => void) | undefined

/** The site's own confirm: a cream sheet in a modal <dialog> (focus trap, Escape), resolving true on the action button only. */
const ask = (text: string, yes: string) => new Promise<boolean>((done) => {
  const d = document.createElement('dialog')
  d.className = 'sheet ask'
  d.setAttribute('aria-labelledby', 'ask-text')
  d.innerHTML = '<form method="dialog"><p id="ask-text"></p><div><button class="btn sm" value="y"></button><button class="btn sm ghost" value="" autofocus>Cancel</button></div></form>'
  d.querySelector('p')!.textContent = text
  d.querySelector('button')!.textContent = yes
  d.onclick = (e) => { if (e.target === d) d.close() } // a tap on the backdrop cancels (the padding sits on the form, so only the backdrop is the dialog itself)
  d.onclose = () => { done(d.returnValue === 'y'); d.remove() }
  ;(document.querySelector('.page') ?? document.body).append(d)
  d.showModal()
})
const DONE = () => `${location.origin}/account?paid=1`
// Paddle.js loads only here, on a click, so no other page fetches a third-party script.
const loadPaddle = () => (paddle ??= new Promise<PaddleJs>((ok, no) => {
  const s = Object.assign(document.createElement('script'), { src: 'https://cdn.paddle.com/paddle/v2/paddle.js' })
  s.onload = () => {
    const P = (window as unknown as { Paddle: PaddleJs }).Paddle
    if (PADDLE.env === 'sandbox') P.Environment.set('sandbox')
    // On a link carrying _ptxn (Paddle's recovery email, a card update from the billing page) Paddle.js opens that checkout itself.
    P.Initialize({ token: PADDLE.token, eventCallback: (e) => onPaddle?.(e.name ?? ''), checkout: { settings: { variant: 'one-page', allowLogout: false, successUrl: DONE() } } })
    ok(P)
  }
  s.onerror = () => { paddle = undefined; no(new Error('Paddle.js did not load')) }
  document.head.append(s)
}))
// The email rides along as custom data: it is how the webhook finds the account.
const checkout = async (k: PlanKey, email: string) => (await loadPaddle()).Checkout.open({ items: [{ priceId: PLANS[k].checkout, quantity: 1 }], customer: { email }, customData: { email }, settings: { variant: 'one-page', allowLogout: false, successUrl: DONE() } })

export default function Account() {
  const { me, reload } = useMe()
  // A checkout link (_ptxn) opens without signing in: the buyer may be on another device.
  const ptxn = typeof location !== 'undefined' && new URLSearchParams(location.search).has('_ptxn')
  const [ptxnErr, setPtxnErr] = useState(false)
  useEffect(() => { if (ptxn) loadPaddle().catch(() => setPtxnErr(true)) }, [ptxn])
  useEffect(() => {
    if (me !== null || ptxn) return
    // The plan picked on /pricing survives the sign-in link, which may open in another tab.
    const plan = new URLSearchParams(location.search).get('plan')
    try { if (plan) localStorage.setItem('fs-want', plan) } catch { /* storage blocked: the pick is lost, the account is not */ }
    location.replace('/sign-in')
  }, [me, ptxn])
  if (me === null && ptxn) return (
    <section className="head" aria-labelledby="h1">
      <div className="wrap acct">
        <div className="acct-top"><h1 id="h1">Account</h1></div>
        <div className="sheet group">
          {ptxnErr ? <p className="err" role="alert">The checkout did not load. Check your connection and reload this page.</p> : <p>Finish your payment in the checkout window.</p>}
          <p>To see your plan afterwards, <a href="/sign-in">sign in</a> with the email you paid with.</p>
        </div>
      </div>
    </section>
  )
  if (!me) return <Skeleton />
  return <Signed me={me} reload={reload} />
}

/** The signed-in layout with bars where the account's values go, so nothing jumps or flashes when they arrive. */
function Skeleton() {
  const bars = (...w: number[]) => w.map((n, i) => <span key={i} className="bar" style={{ width: `${n}%` }} />)
  return (
    <section className="head" aria-labelledby="h1" aria-busy="true">
      <div className="wrap acct skel">
        <div className="acct-top"><h1 id="h1">Account</h1><p>{bars(100)}<span className="sr">Loading your account</span></p></div>
        <div className="sheet group"><h2>Plan</h2>{bars(70, 100, 100, 100)}</div>
        <div className="sheet group"><h2>API keys</h2>{bars(60, 100)}</div>
      </div>
    </section>
  )
}

function Signed({ me, reload }: { me: Me; reload: () => void }) {
  // The plan picked on /pricing, then the last one opened here: a closed checkout leaves that row marked.
  const [want, setWant] = useState(() => new URLSearchParams(location.search).get('plan') as PlanKey | null)
  const [err, setErr] = useState('')
  const [opening, setOpening] = useState<PlanKey | null>(null)
  const failed = () => { setOpening(null); setErr('The checkout did not load. Check your connection and try again.') }
  // The row is marked only once Paddle shows the checkout, so the label never runs ahead of it.
  const pick = (k: PlanKey) => {
    setOpening(k); setErr('')
    onPaddle = (n) => {
      if (n === 'checkout.loaded') { setOpening(null); setWant(k); history.replaceState(null, '', `/account?plan=${k}`) }
      else if (n === 'checkout.closed') setOpening(null)
      else if (n === 'checkout.error') failed()
    }
    checkout(k, me.email).catch(failed)
  }
  // Paddle sends a finished checkout back with ?paid=1; the plan lands when the webhook does, so ask again until it shows.
  const [paid] = useState(() => new URLSearchParams(location.search).has('paid'))
  const [billingErr] = useState(() => new URLSearchParams(location.search).has('billing'))
  const [waited, setWaited] = useState(false)
  const on = me.plan !== 'free'
  useEffect(() => { if (paid || billingErr) history.replaceState(null, '', '/account') }, [paid, billingErr]) // a later reload shows the plan, not the note
  useEffect(() => {
    if (!paid || on) return
    let n = 0
    const t = setInterval(() => { if (++n > 30) { clearInterval(t); setWaited(true) } else reload() }, 3000)
    return () => clearInterval(t)
  }, [paid, on, reload])
  const signout = async () => { await call('POST', '/api/auth/signout').catch(() => {}); remember(); location.href = '/' }
  const p = PLANS[me.plan]
  return (
    <section className="head" aria-labelledby="h1">
      <div className="wrap acct">
        <div className="acct-top"><h1 id="h1">Account</h1><p>{me.email} <button className="link-btn" onClick={signout}>Sign out</button></p></div>

        <div className="sheet group" aria-labelledby="g-plan">
          <h2 id="g-plan">Plan</h2>
          {paid && <p className="note" role="status">{on ? <>Checkout complete. You are on <b>{PLANS[me.plan].name}</b>; Paddle emails the receipt.</> : waited ? 'Checkout complete. Your plan is taking longer than usual to show; reload in a minute. The receipt from Paddle confirms the payment.' : 'Checkout complete. Turning on your plan…'}</p>}
          {billingErr && <p className="err" role="alert">The billing page did not open. Try again in a minute, or write to us.</p>}
          {me.invite && <Invite by={me.invite} reload={reload} />}
          {me.via ? <p>You are on <b>{me.via}</b>'s Team plan. They manage billing and set your policy. <button className="link-btn" onClick={() => leave(reload, setErr)}>Leave the team</button></p> : me.plan !== 'free' ? (
            <>
              <p><b>{p.name}</b>, {fmtPrice(p)} a month. {me.status === 'cancelled' ? `Cancelled; runs until ${day(me.ends)}.` : me.status === 'past_due' ? 'The last payment failed; update your card.' : me.renews ? `Renews ${day(me.renews)}.` : ''}</p>
              {(me.status === 'active' || me.status === 'trialing') && me.portal && <Switch me={me} want={want} reload={reload} />}
              {me.portal && <><a className="btn" href={me.portal}>Manage billing</a><p className="small">Change your card, see receipts, or cancel, on the billing page.</p></>}
            </>
          ) : paid ? null : ( // just paid: no plan buttons while the plan lands, so nobody pays twice
            <>
              <p>Free. Single files in the browser, and {PLANS.free.apiFiles} API files a month to try the API.</p>
              <div className="up">
                {PAID.map((k) => (
                  <div key={k} className={`up-row ${want === k ? 'want' : ''}`}>
                    <div><b>{PLANS[k].name}</b> {fmtPrice(PLANS[k])} a month<span>{PLANS[k].items[0]}</span></div>
                    {PLANS[k].checkout ? <button className={`btn sm ${want === k ? '' : 'ghost'}`} disabled={!!opening} aria-busy={opening === k} onClick={() => pick(k)}>{opening === k ? 'Opening checkout…' : want === k ? 'Continue to checkout' : `Choose ${PLANS[k].name}`}</button> : <span className="small">Opens soon</span>}
                  </div>
                ))}
              </div>
              <p className="small">{PLANS.pro.checkout ? 'Your plan shows here a few seconds after paying; reload if it does not.' : 'Paid plans open soon. Your free account carries over.'}</p>
            </>
          )}
          {err && <p className="err" role="alert">{err}</p>}
        </div>

        <Keys me={me} reload={reload} />
        <Extension me={me} reload={reload} />
        {me.plan === 'team' && !me.via && <Team me={me} reload={reload} />}

        <div className="sheet group" aria-labelledby="g-pol">
          <h2 id="g-pol">Policy</h2>
          <p>{me.keep.length ? `Keeps ${me.keep.join(', ')}; everything else is removed.` : 'Removes everything FileSanity can remove.'} {me.via ? `Set by ${me.via}.` : p.batch ? <a href="/batch">Change it on the batch page</a> : 'Saved policies come with Pro.'}</p>
        </div>
      </div>
    </section>
  )
}

/** The other paid plans, for an owner whose subscription runs. Paddle charges or credits the difference now; the plan
 *  shows when its webhook lands, so ask again until it does. */
function Switch({ me, want, reload }: { me: Me; want: PlanKey | null; reload: () => void }) {
  const [to, setTo] = useState<PlanKey | null>(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    if (!to) return
    if (me.plan === to) { setTo(null); return }
    let n = 0
    const t = setInterval(() => { if (++n > 30) { clearInterval(t); setTo(null); setErr('Your new plan is taking longer than usual to show; reload in a minute.') } else reload() }, 3000)
    return () => clearInterval(t)
  }, [to, me.plan, reload])
  const go = async (k: PlanKey) => {
    const left = me.plan === 'team' && me.team.length ? ` Your ${me.team.length === 1 ? 'team member goes' : `${me.team.length} team members go`} back to Free.` : ''
    if (!await ask(`Switch to ${PLANS[k].name}, ${fmtPrice(PLANS[k])} a month? The difference is charged or credited now, prorated.${left}`, `Switch to ${PLANS[k].name}`)) return
    setErr(''); setTo(k) // disables every switch button before the request, so a second tap cannot send a second change
    try { await call('POST', '/api/plan', { plan: k }) } catch (x) { setTo(null); setErr((x as Error).message) }
  }
  return (
    <>
      <div className="up">
        {PAID.filter((k) => k !== me.plan).map((k) => (
          <div key={k} className={`up-row ${want === k ? 'want' : ''}`}>
            <div><b>{PLANS[k].name}</b> {fmtPrice(PLANS[k])} a month<span>{PLANS[k].items[0]}</span></div>
            <button className={`btn sm ${want === k ? '' : 'ghost'}`} disabled={!!to} onClick={() => go(k)}>{to === k ? 'Switching…' : `Switch to ${PLANS[k].name}`}</button>
          </div>
        ))}
      </div>
      <p className="small">Switching charges or credits the difference now, prorated to the day.</p>
      <p className="err" role="alert">{err}</p>
    </>
  )
}

function Keys({ me, reload }: { me: Me; reload: () => void }) {
  const [name, setName] = useState('')
  const [fresh, setFresh] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try { const r = await call<{ key: string }>('POST', '/api/keys', { name }); setFresh(r.key); setName(''); reload() } catch (x) { setErr((x as Error).message) }
    setBusy(false)
  }
  const revoke = async (id: string, n: string) => {
    if (!await ask(`Revoke "${n}"? Anything using it stops working.`, 'Revoke key')) return
    try { await call('DELETE', `/api/keys/${id}`); reload() } catch (x) { setErr((x as Error).message) }
  }
  const api = me.keys.filter((k) => k.scope !== 'ext')
  const pct = Math.min(100, Math.round((me.used / me.quota) * 100))
  return (
    <div className="sheet group" aria-labelledby="g-keys">
      <h2 id="g-keys">API keys</h2>
      <p>{me.used.toLocaleString('en')} of {me.quota.toLocaleString('en')} files used this month. <a href="/developers">How to use the API</a></p>
      <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={me.quota} aria-valuenow={me.used} aria-label="API files used this month"><span style={{ width: `${pct}%` }} /></div>
      {fresh && <div className="fresh" role="status"><p>Your new key. Copy it now; it is not shown again.</p><code>{fresh}</code><button className="btn sm" onClick={() => navigator.clipboard.writeText(fresh)}>Copy</button></div>}
      {api.length > 0 && (
        <table className="keys"><tbody>{api.map((k) => (
          <tr key={k.id}><th scope="row">{k.name}</th><td><code>fs_live_…{k.hint}</code></td><td>{day(k.created)}</td><td><button className="link-btn" onClick={() => revoke(k.id, k.name)}>Revoke</button></td></tr>
        ))}</tbody></table>
      )}
      <form className="inline" onSubmit={create}>
        <label htmlFor="kname">New key name</label>
        <div><input id="kname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. upload form" maxLength={40} /><button className="btn sm" disabled={busy}>{busy ? 'Creating…' : 'Create key'}</button></div>
      </form>
      <p className="err" role="alert">{err}</p>
    </div>
  )
}

const leave = async (reload: () => void, setErr: (m: string) => void) => {
  if (!await ask('Leave this team? You go back to your own plan.', 'Leave team')) return
  try { await call('POST', '/api/team/leave'); reload() } catch (x) { setErr((x as Error).message) }
}

/** A Team owner's invitation: joining puts this account under their plan and their policy, so it takes the person's own click. */
function Invite({ by, reload }: { by: string; reload: () => void }) {
  const [err, setErr] = useState('')
  const join = async () => { try { await call('POST', '/api/team/join'); reload() } catch (x) { setErr((x as Error).message) } }
  return (
    <div className="note" role="status">
      <p><b>{by}</b> invited you to their Team plan. Joining gives you Team features and their cleaning policy, which only they can change.</p>
      <p><button className="btn sm" onClick={join}>Join the team</button> <button className="link-btn" onClick={async () => { try { await call('POST', '/api/team/leave'); reload() } catch (x) { setErr((x as Error).message) } }}>Decline</button></p>
      {err && <p className="err" role="alert">{err}</p>}
    </div>
  )
}

function Team({ me, reload }: { me: Me; reload: () => void }) {
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')
  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('')
    try { await call('POST', '/api/team', { email }); setEmail(''); reload() } catch (x) { setErr((x as Error).message) }
  }
  const remove = async (m: string) => {
    if (!await ask(`Remove ${m}? They go back to Free and lose your policy.`, 'Remove')) return
    try { await call('DELETE', `/api/team/${encodeURIComponent(m)}`); reload() } catch (x) { setErr((x as Error).message) } }
  return (
    <div className="sheet group" aria-labelledby="g-team">
      <h2 id="g-team">Team</h2>
      <p>{me.team.length + 1} of {PLANS.team.seats} seats used. People you add are invited: they sign in with their own email and join from their account page, then get Team features and your policy.</p>
      {me.team.length > 0 && <table className="keys"><tbody>{me.team.map((m) => <tr key={m}><th scope="row">{m}{me.pending.includes(m) && <span className="small"> invited</span>}</th><td><button className="link-btn" onClick={() => remove(m)}>Remove</button></td></tr>)}</tbody></table>}
      {me.team.length + 1 < PLANS.team.seats && (
        <form className="inline" onSubmit={add}>
          <label htmlFor="tmail">Add a person</label>
          <div><input id="tmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@yourfirm.com" required /><button className="btn sm">Add</button></div>
        </form>
      )}
      <p className="err" role="alert">{err}</p>
    </div>
  )
}

/** Pairs the browser extension: a token scoped to reading the plan and policy, made by the same key machinery, shown once. */
function Extension({ me, reload }: { me: Me; reload: () => void }) {
  const [fresh, setFresh] = useState('')
  const [err, setErr] = useState('')
  const tokens = me.keys.filter((k) => k.scope === 'ext')
  const [busy, setBusy] = useState(false)
  const create = async () => {
    setErr(''); setBusy(true)
    try { const r = await call<{ key: string }>('POST', '/api/keys', { scope: 'ext', name: 'Browser extension' }); setFresh(r.key); reload() } catch (x) { setErr((x as Error).message) }
    setBusy(false)
  }
  const revoke = async (id: string) => {
    if (!await ask('Disconnect this extension? It goes back to the free features.', 'Disconnect')) return
    try { await call('DELETE', `/api/keys/${id}`); reload() } catch (x) { setErr((x as Error).message) }
  }
  return (
    <div className="sheet group" aria-labelledby="g-ext">
      <h2 id="g-ext">Connect the browser extension</h2>
      <p>{me.plan === 'free' ? 'The extension cleans uploads for free without an account. Connecting it adds your saved policy, site rules, "Save without metadata" and a local log, which come with Pro, Team and API.' : 'Connecting it brings your saved policy, site rules, "Save without metadata" and a local log to the extension.'} The extension reads your plan and policy with this token. It never sends a file or a file name. <a href="/extension">About the extension</a></p>
      {fresh && <div className="fresh" role="status"><p>Paste this into the extension's options. It is not shown again.</p><code>{fresh}</code><button className="btn sm" onClick={() => navigator.clipboard.writeText(fresh)}>Copy</button></div>}
      {tokens.length > 0 && (
        <table className="keys"><tbody>{tokens.map((k) => (
          <tr key={k.id}><th scope="row">{k.name}</th><td><code>fs_ext_…{k.hint}</code></td><td>{day(k.created)}</td><td><button className="link-btn" onClick={() => revoke(k.id)}>Disconnect</button></td></tr>
        ))}</tbody></table>
      )}
      <button className="btn sm" onClick={create} disabled={busy}>{busy ? 'Creating…' : 'Create a connection token'}</button>
      <p className="err" role="alert">{err}</p>
    </div>
  )
}
