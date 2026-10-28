import { useEffect, useRef, useState } from 'react'
import { call } from '../useMe'

export const meta = { title: 'Sign in', description: 'Sign in to FileSanity with your email address. No password.' }
export const index = false

// Cloudflare's always-pass test key until the real one is set at build (VITE_TURNSTILE_SITEKEY).
const SITEKEY = import.meta.env.VITE_TURNSTILE_SITEKEY ?? '1x00000000000000000000AA'
type TS = { render: (el: HTMLElement, o: { sitekey: string; callback: (t: string) => void; 'expired-callback': () => void; theme: string; size: string }) => string; reset: (id: string) => void }

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  const [dev, setDev] = useState('')
  const box = useRef<HTMLDivElement>(null)
  const wid = useRef('')
  const [expired, setExpired] = useState(false)
  // The emailed link lands here with ?t=; signing in takes a click, so a mail scanner that opens the link uses nothing up.
  const [link, setLink] = useState('')
  const [who, setWho] = useState('')

  useEffect(() => {
    const q = new URLSearchParams(location.search)
    setExpired(q.has('expired'))
    const t = q.get('t') ?? ''
    setLink(t)
    // The link stays in memory only: out of the address bar, history and the page counter.
    if (t) {
      history.replaceState(null, '', '/sign-in')
      call<{ email: string }>('POST', '/api/auth/verify', { t, peek: true }).then((r) => setWho(r.email), () => { setLink(''); setExpired(true) })
    }
    const w = window as unknown as { turnstile?: TS; onTs?: () => void }
    w.onTs = () => { if (box.current && w.turnstile && !wid.current) wid.current = w.turnstile.render(box.current, { sitekey: SITEKEY, callback: setToken, 'expired-callback': () => setToken(''), theme: 'light', size: box.current.clientWidth < 300 ? 'compact' : 'normal' }) }
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTs'
    s.async = true
    document.head.append(s)
    return () => s.remove()
  }, [])
  // The form (and its check) mounts late when a confirm link turns out expired.
  useEffect(() => { if (!link) (window as unknown as { onTs?: () => void }).onTs?.() }, [link])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email.trim())) { setState('error'); setMsg('Enter a valid email address.'); return }
    if (!token) { setState('error'); setMsg('Wait for the check under the field to finish.'); return }
    setState('sending')
    try {
      const r = await call<{ link?: string }>('POST', '/api/auth/start', { email: email.trim(), turnstile: token })
      setDev(r.link ?? '')
      setState('sent')
    } catch (err) {
      setState('error'); setMsg((err as Error).message)
      setToken('');(window as unknown as { turnstile?: TS }).turnstile?.reset(wid.current)
    }
  }

  const confirm = async () => {
    setState('sending')
    try {
      await call('POST', '/api/auth/verify', { t: link })
      let plan: string | null = null
      try { plan = localStorage.getItem('fs-want'); localStorage.removeItem('fs-want') } catch { /* storage blocked */ }
      location.replace(plan ? `/account?plan=${encodeURIComponent(plan)}` : '/account')
    } catch {
      setState('idle'); setLink(''); setExpired(true); history.replaceState(null, '', '/sign-in?expired=1')
    }
  }

  return (
    <section className="head" aria-labelledby="h1">
      <div className="wrap signin-in">
        <h1 id="h1">Sign in</h1>
        {link ? (
          <div className="sheet">
            <p className="sheet-lede">{who ? <>Sign in as <b>{who}</b> on this device.</> : 'Checking your link…'}</p>
            <button className="btn" onClick={confirm} disabled={state === 'sending' || !who}>{state === 'sending' ? 'Signing in…' : 'Confirm sign-in'}</button>
            <p className="small">Not your address, or did not ask to sign in? Close this tab; nothing happens without the click.</p>
          </div>
        ) : state === 'sent' ? (
          <div className="sheet" role="status">
            <p className="sheet-big">Check your inbox.</p>
            <p>We sent a sign-in link to <b>{email.trim()}</b>. It works once, for 15 minutes. You can close this tab.</p>
            {dev && <p><a href={dev}>Development: open the link</a></p>}
          </div>
        ) : (
          <form className="sheet" onSubmit={submit} noValidate>
            <p className="sheet-lede">{expired ? 'That link has expired or was already used. Ask for a new one.' : 'No password. We email you a link that signs you in. New here? The same link creates your account.'}</p>
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={state === 'error'} aria-describedby="email-err" />
            <div className="ts" ref={box} />
            <p id="email-err" className="err" role="alert">{state === 'error' ? msg : ''}</p>
            <button className="btn" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Email me a link'}</button>
            <p className="small">You do not need an account to clean files. <a href="/">Clean a file now</a>.</p>
          </form>
        )}
      </div>
    </section>
  )
}
