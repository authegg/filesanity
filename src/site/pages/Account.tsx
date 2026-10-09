import { useEffect, useState } from 'react'
import { PAID, PLANS, fmtPrice, type PlanKey } from '../plans'
import { call, useMe, type Me } from '../useMe'

export const meta = { title: 'Account', description: 'Your FileSanity plan, API keys, team and policy.' }
export const index = false

const day = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '')
const checkout = (k: PlanKey, email: string) => `${PLANS[k].checkout}?${new URLSearchParams({ 'checkout[email]': email, 'checkout[custom][email]': email })}`

export default function Account() {
  const { me, reload } = useMe()
  useEffect(() => { if (me === null) location.replace(`/sign-in`) }, [me])
  if (!me) return <section className="head"><div className="wrap acct"><h1 id="h1">Account</h1><div className="sheet skel" aria-busy="true"><p>Loading your account…</p></div></div></section>
  return <Signed me={me} reload={reload} />
}

function Signed({ me, reload }: { me: Me; reload: () => void }) {
  const want = new URLSearchParams(location.search).get('plan') as PlanKey | null
  const signout = async () => { await call('POST', '/api/auth/signout').catch(() => {}); location.href = '/' }
  const p = PLANS[me.plan]
  return (
    <section className="head" aria-labelledby="h1">
      <div className="wrap acct">
        <div className="acct-top"><h1 id="h1">Account</h1><p>{me.email} <button className="link-btn" onClick={signout}>Sign out</button></p></div>

        <div className="sheet group" aria-labelledby="g-plan">
          <h2 id="g-plan">Plan</h2>
          {me.via ? <p>You are on <b>{me.via}</b>'s Team plan. They manage billing.</p> : me.plan !== 'free' ? (
            <>
              <p><b>{p.name}</b>, {fmtPrice(p)} a month. {me.status === 'cancelled' ? `Cancelled; runs until ${day(me.ends)}.` : me.status === 'past_due' ? 'The last payment failed; update your card.' : me.renews ? `Renews ${day(me.renews)}.` : ''}</p>
              {me.portal && <a className="btn" href={me.portal}>Manage billing</a>}
            </>
          ) : (
            <>
              <p>Free. Single files in the browser, and {PLANS.free.apiFiles} API files a month to try the API.</p>
              <div className="up">
                {PAID.map((k) => (
                  <div key={k} className={`up-row ${want === k ? 'want' : ''}`}>
                    <div><b>{PLANS[k].name}</b> {fmtPrice(PLANS[k])} a month<span>{PLANS[k].items[0]}</span></div>
                    {PLANS[k].checkout ? <a className={`btn sm ${want === k ? '' : 'ghost'}`} href={checkout(k, me.email)}>{want === k ? 'Continue to checkout' : `Choose ${PLANS[k].name}`}</a> : <span className="small">Opens soon</span>}
                  </div>
                ))}
              </div>
              <p className="small">{PLANS.pro.checkout ? 'Checkout is on Lemon Squeezy. Your plan shows here a few seconds after paying; reload if it does not.' : 'Paid plans open in a few days. Your free account carries over.'}</p>
            </>
          )}
        </div>

        <Keys me={me} reload={reload} />
        <Extension me={me} reload={reload} />
        {me.plan === 'team' && !me.via && <Team me={me} reload={reload} />}

        <div className="sheet group" aria-labelledby="g-pol">
          <h2 id="g-pol">Policy</h2>
          <p>{me.keep.length ? `Keeps ${me.keep.join(', ')}; everything else is removed.` : 'Removes everything FileSanity can remove.'} {p.batch ? <a href="/batch">Change it on the batch page</a> : 'Saved policies come with Pro.'}</p>
        </div>
      </div>
    </section>
  )
}

function Keys({ me, reload }: { me: Me; reload: () => void }) {
  const [name, setName] = useState('')
  const [fresh, setFresh] = useState('')
  const [err, setErr] = useState('')
  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('')
    try { const r = await call<{ key: string }>('POST', '/api/keys', { name }); setFresh(r.key); setName(''); reload() } catch (x) { setErr((x as Error).message) }
  }
  const revoke = async (id: string, n: string) => {
    if (!confirm(`Revoke "${n}"? Anything using it stops working.`)) return
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
        <div><input id="kname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. upload form" maxLength={40} /><button className="btn sm">Create key</button></div>
      </form>
      <p className="err" role="alert">{err}</p>
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
  const remove = async (m: string) => { try { await call('DELETE', `/api/team/${encodeURIComponent(m)}`); reload() } catch (x) { setErr((x as Error).message) } }
  return (
    <div className="sheet group" aria-labelledby="g-team">
      <h2 id="g-team">Team</h2>
      <p>{me.team.length + 1} of {PLANS.team.seats} seats used. People you add sign in with their own email and get Team features and your policy.</p>
      {me.team.length > 0 && <table className="keys"><tbody>{me.team.map((m) => <tr key={m}><th scope="row">{m}</th><td><button className="link-btn" onClick={() => remove(m)}>Remove</button></td></tr>)}</tbody></table>}
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
  const create = async () => {
    setErr('')
    try { const r = await call<{ key: string }>('POST', '/api/keys', { scope: 'ext', name: 'Browser extension' }); setFresh(r.key); reload() } catch (x) { setErr((x as Error).message) }
  }
  const revoke = async (id: string) => {
    if (!confirm('Disconnect this extension? It goes back to the free features.')) return
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
      <button className="btn sm" onClick={create}>Create a connection token</button>
      <p className="err" role="alert">{err}</p>
    </div>
  )
}
