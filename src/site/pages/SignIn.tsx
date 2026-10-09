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

  useEffect(() => {
    setExpired(location.search.includes('expired=1'))
    const w = window as unknown as { turnstile?: TS; onTs?: () => void }
    w.onTs = () => { if (box.current && w.turnstile) wid.current = w.turnstile.render(box.current, { sitekey: SITEKEY, callback: setToken, 'expired-callback': () => setToken(''), theme: 'light', size: box.current.clientWidth < 300 ? 'compact' : 'normal' }) }
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTs'
    s.async = true
    document.head.append(s)
    return () => s.remove()
  }, [])

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

  return (
    <section className="head" aria-labelledby="h1">
      <div className="wrap signin-in">
        <h1 id="h1">Sign in</h1>
        {state === 'sent' ? (
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
