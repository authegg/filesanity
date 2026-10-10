/** FileSanity's one Worker. Static pages come from the assets binding; this code answers /api/* only.
 *
 *  Accounts (cookie session, same origin):
 *   POST /api/auth/start      { email, turnstile }   emails a sign-in link (15 minutes, one use)
 *   GET  /api/auth/verify?t=  opens a session and redirects to /account
 *   POST /api/auth/signout
 *   GET  /api/me              the account: plan, usage, keys, team, policy
 *   PUT  /api/policy          { keep: string[] }
 *   POST /api/keys            { name, scope? } -> the key, shown once; scope 'ext' pairs the browser extension      DELETE /api/keys/:id
 *   POST /api/team            { email }                            DELETE /api/team/:email
 *   POST /api/webhooks/lemonsqueezy   subscription events (HMAC-SHA256, X-Signature)
 *  Hosted API (bearer key, any origin):
 *   POST /api/v1/inspect, /api/v1/clean (?keep=, ?report=1)       GET /api/v1/usage
 *   GET  /api/report-key      the Ed25519 public key that signs reports
 *  Browser extension (bearer extension token, any origin):
 *   GET  /api/ext/me          { plan, policy } and nothing else; the extension never sends a file or a file name
 *
 *  Stored in KV: per account the email, plan, subscription state, key hashes and names, team emails, policy and a
 *  monthly API count. Never a file: the hosted API holds the file in memory for one request. */
import { handle } from './handler'
import { POLICY } from '../src/lib/index'
import { PLANS, type PlanKey } from '../src/site/plans'

export type Env = {
  ASSETS: Fetcher
  DB: KVNamespace
  EMAIL?: { send(m: { from: string | { email: string; name?: string }; to: string; subject: string; text: string; html?: string }): Promise<{ messageId: string }> } // Cloudflare Email Sending
  MAIL_FROM?: string // signin@filesanity.com
  TURNSTILE_SECRET: string
  LS_WEBHOOK_SECRET: string
  LS_VARIANT_PRO: string
  LS_VARIANT_TEAM: string
  LS_VARIANT_API: string
  REPORT_PRIVATE_KEY_JWK?: string
  DEV_LINKS?: string // "1" under wrangler dev: /api/auth/start returns the link instead of emailing it
}

export type Account = {
  email: string
  created: string
  plan: PlanKey // what this account pays for
  status?: string // Lemon Squeezy subscription status
  renews?: string
  ends?: string
  portal?: string // Lemon Squeezy customer portal
  team: string[] // emails this account has added (Team plan)
  owner?: string // the Team account this one belongs to
  keys: { id: string; name: string; hint: string; created: string; hash: string; scope?: 'ext' }[]
  keep: string[]
}

const enc = new TextEncoder()
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('')
const b64 = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b)))
const rand = (n = 24) => hex(crypto.getRandomValues(new Uint8Array(n)).buffer)
const sha = async (s: string) => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)))
const month = () => new Date().toISOString().slice(0, 7)
const EMAIL = /^[^@\s]{1,64}@[^@\s]+\.[^@\s]{2,}$/
const norm = (e: unknown) => (typeof e === 'string' ? e.trim().toLowerCase() : '')

const API_CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Filename', 'Access-Control-Expose-Headers': 'Content-Disposition, X-FileSanity-Removed, X-FileSanity-Kept, X-FileSanity-Note, X-FileSanity-Report, X-FileSanity-Report-Signature, X-FileSanity-Used' }
const NOSTORE = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' }
const json = (body: unknown, status = 200, extra: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...NOSTORE, ...extra } })

const get = (env: Env, email: string) => env.DB.get<Account>(`acct:${email}`, 'json')
const put = (env: Env, a: Account) => env.DB.put(`acct:${a.email}`, JSON.stringify(a))
const fresh = (email: string): Account => ({ email, created: new Date().toISOString(), plan: 'free', team: [], keys: [], keep: [] })
const active = (a: Account) => a.plan !== 'free' && ['active', 'on_trial', 'past_due', 'cancelled'].includes(a.status ?? '')

/** The plan an account works under: its own if paid and running, else its Team owner's, else free. */
async function effective(env: Env, a: Account): Promise<{ plan: PlanKey; via?: string }> {
  if (active(a)) return { plan: a.plan }
  if (a.owner) {
    const o = await get(env, a.owner)
    if (o && o.plan === 'team' && active(o) && o.team.includes(a.email)) return { plan: 'team', via: o.email }
  }
  return { plan: 'free' }
}

// ---- sessions ----
const COOKIE = 'fs_s'
const cookieOf = (req: Request) => req.headers.get('Cookie')?.match(/(?:^|;\s*)fs_s=([a-f0-9]{48})/)?.[1]
async function session(req: Request, env: Env): Promise<Account | null> {
  const id = cookieOf(req)
  if (!id) return null
  const email = await env.DB.get(`sess:${await sha(id)}`)
  return email ? get(env, email) : null
}
/** State-changing account calls must come from this site's own pages. */
const sameOrigin = (req: Request, url: URL) => req.headers.get('Origin') === url.origin

async function turnstile(env: Env, token: unknown, ip: string) {
  if (typeof token !== 'string' || !token) return false
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }) })
  return ((await r.json().catch(() => ({}))) as { success?: boolean }).success === true
}

async function sendLink(env: Env, to: string, link: string) {
  if (!env.EMAIL) throw new Error('mail is not configured')
  await env.EMAIL.send({
    from: { email: env.MAIL_FROM ?? 'signin@filesanity.com', name: 'FileSanity' }, to, subject: 'Your FileSanity sign-in link',
    text: `Open this link to sign in to FileSanity. It works once, for 15 minutes.\n\n${link}\n\nIf you did not ask for it, ignore this email; nothing happens without the link.`,
    html: signInHtml(link.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')),
  })
}

// Tables and inline styles because mail clients ignore most CSS; no images, so nothing is blocked or tracked. Colours are J1's.
const signInHtml = (href: string) => `<!doctype html><html><body style="margin:0;padding:0;background:#0d5641">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d5641"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;font-family:Arial,Helvetica,sans-serif">
<tr><td style="padding:0 4px 20px;font-size:22px;font-weight:800;color:#f4f1e6">File<span style="color:#e3f07a">Sanity</span></td></tr>
<tr><td style="background:#f4f1e6;border-radius:6px;padding:32px 28px;color:#10261d">
<h1 style="margin:0 0 12px;font-size:24px;line-height:1.2;color:#10261d">Sign in to FileSanity</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:1.5">This link works once, for 15 minutes.</p>
<a href="${href}" style="display:inline-block;background:#0d5641;color:#f4f1e6;font-size:16px;font-weight:700;text-decoration:none;padding:14px 24px;border-radius:6px">Sign in</a>
<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#4a5a52">If the button does not work, paste this into your browser:<br><a href="${href}" style="color:#0d5641;word-break:break-all">${href}</a></p>
</td></tr>
<tr><td style="padding:20px 4px 0;font-size:13px;line-height:1.5;color:#c4d6cc">If you did not ask for this, ignore it; nothing happens without the link.</td></tr>
</table></td></tr></table></body></html>`

async function auth(req: Request, env: Env, url: URL): Promise<Response> {
  const ip = req.headers.get('CF-Connecting-IP') ?? 'local'
  if (url.pathname === '/api/auth/start' && req.method === 'POST') {
    if (!sameOrigin(req, url)) return json({ error: 'cross-origin' }, 403)
    const body = (await req.json().catch(() => ({}))) as { email?: string; turnstile?: string }
    const email = norm(body.email)
    if (!EMAIL.test(email)) return json({ error: 'Enter a valid email address.' }, 400)
    if (!(await turnstile(env, body.turnstile, ip))) return json({ error: 'The check did not pass. Reload the page and try again.' }, 400)
    // Five links per address and twenty per network an hour. ponytail: KV counters are not atomic; fine for abuse control.
    const hour = new Date().toISOString().slice(0, 13)
    for (const [k, max] of [[`rl:e:${email}:${hour}`, 5], [`rl:i:${ip}:${hour}`, 20]] as const) {
      const n = Number((await env.DB.get(k)) ?? 0)
      if (n >= max) return json({ error: 'Too many links asked for. Try again in an hour.' }, 429)
      await env.DB.put(k, String(n + 1), { expirationTtl: 3600 })
    }
    const t = rand()
    await env.DB.put(`login:${await sha(t)}`, email, { expirationTtl: 900 })
    const link = `${url.origin}/api/auth/verify?t=${t}`
    if (env.DEV_LINKS === '1') return json({ ok: true, link })
    try { await sendLink(env, email, link) } catch { return json({ error: 'The email could not be sent. Try again in a minute.' }, 502) }
    return json({ ok: true })
  }
  if (url.pathname === '/api/auth/verify' && req.method === 'GET') {
    const t = url.searchParams.get('t') ?? ''
    const k = `login:${await sha(t)}`
    const email = /^[a-f0-9]{48}$/.test(t) ? await env.DB.get(k) : null
    if (!email) return Response.redirect(`${url.origin}/sign-in?expired=1`, 303)
    await env.DB.delete(k)
    if (!(await get(env, email))) await put(env, fresh(email))
    const id = rand()
    await env.DB.put(`sess:${await sha(id)}`, email, { expirationTtl: 30 * 86400 })
    return new Response(null, { status: 303, headers: { Location: '/account', 'Set-Cookie': `${COOKIE}=${id}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 86400}`, ...NOSTORE } })
  }
  if (url.pathname === '/api/auth/signout' && req.method === 'POST') {
    if (!sameOrigin(req, url)) return json({ error: 'cross-origin' }, 403)
    const id = cookieOf(req)
    if (id) await env.DB.delete(`sess:${await sha(id)}`)
    return json({ ok: true }, 200, { 'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` })
  }
  return json({ error: 'not found' }, 404)
}

async function account(req: Request, env: Env, url: URL): Promise<Response> {
  const a = await session(req, env)
  if (!a) return req.method === 'GET' && url.pathname === '/api/me' ? json(null) : json({ error: 'Signed out. Sign in again.' }, 401)
  if (req.method !== 'GET' && !sameOrigin(req, url)) return json({ error: 'cross-origin' }, 403)
  const { plan, via } = await effective(env, a)
  const p = url.pathname

  if (p === '/api/me' && req.method === 'GET') {
    const used = Number((await env.DB.get(`use:${a.email}:${month()}`)) ?? 0)
    // A Team member works under the owner's policy.
    const keep = via ? ((await get(env, via))?.keep ?? []) : a.keep
    return json({ email: a.email, plan, via, own: a.plan, status: a.status, renews: a.renews, ends: a.ends, portal: a.portal, team: a.team, keys: a.keys.map(({ hash: _, ...k }) => k), keep, used, quota: PLANS[plan].apiFiles, period: month() })
  }
  if (p === '/api/policy' && req.method === 'PUT') {
    if (via) return json({ error: 'Your team owner sets the policy.' }, 403)
    const { keep } = (await req.json().catch(() => ({}))) as { keep?: unknown }
    a.keep = Array.isArray(keep) ? keep.filter((k): k is string => POLICY.some((x) => x.key === k)) : []
    await put(env, a)
    return json({ keep: a.keep })
  }
  if (p === '/api/keys' && req.method === 'POST') {
    const { name, scope } = (await req.json().catch(() => ({}))) as { name?: unknown; scope?: unknown }
    if (a.keys.length >= 10) return json({ error: 'Ten keys at most. Revoke one first.' }, 400)
    // An extension token reads the plan and policy only; the hosted API accepts fs_live_ keys alone.
    const ext = scope === 'ext'
    const key = `${ext ? 'fs_ext_' : 'fs_live_'}${rand(20)}`
    const id = rand(6), hash = await sha(key)
    const label = typeof name === 'string' && name.trim() ? name.trim().slice(0, 40) : ext ? 'Browser extension' : 'Key'
    a.keys.push({ id, name: label, hint: key.slice(-4), created: new Date().toISOString(), hash, ...(ext ? { scope: 'ext' as const } : {}) })
    await Promise.all([put(env, a), env.DB.put(`key:${hash}`, a.email)])
    return json({ key, id }, 201)
  }
  const del = p.match(/^\/api\/keys\/([a-f0-9]{12})$/)
  if (del && req.method === 'DELETE') {
    const k = a.keys.find((x) => x.id === del[1])
    if (!k) return json({ error: 'no such key' }, 404)
    a.keys = a.keys.filter((x) => x !== k)
    await Promise.all([put(env, a), env.DB.delete(`key:${k.hash}`)])
    return json({ ok: true })
  }
  if (p === '/api/team' && req.method === 'POST') {
    if (plan !== 'team' || via) return json({ error: 'Adding people needs your own Team plan.' }, 403)
    const email = norm(((await req.json().catch(() => ({}))) as { email?: unknown }).email)
    if (!EMAIL.test(email) || email === a.email) return json({ error: 'Enter another person\'s email address.' }, 400)
    if (a.team.includes(email)) return json({ team: a.team })
    if (a.team.length + 1 >= PLANS.team.seats) return json({ error: `The Team plan has ${PLANS.team.seats} seats, yours included.` }, 400)
    const m = (await get(env, email)) ?? fresh(email)
    if (m.owner && m.owner !== a.email) return json({ error: 'That person is already on another team.' }, 409)
    m.owner = a.email
    a.team.push(email)
    await Promise.all([put(env, a), put(env, m)])
    return json({ team: a.team })
  }
  const out = p.match(/^\/api\/team\/(.+)$/)
  if (out && req.method === 'DELETE') {
    const email = norm(decodeURIComponent(out[1]))
    a.team = a.team.filter((e) => e !== email)
    const m = await get(env, email)
    if (m?.owner === a.email) { delete m.owner; await put(env, m) }
    await put(env, a)
    return json({ team: a.team })
  }
  return json({ error: 'not found' }, 404)
}

/** The extension's one call: the plan and the policy to apply, for a bearer extension token. No cookie, so any origin may read it. */
async function extMe(req: Request, env: Env): Promise<Response> {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization' }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'GET') return json({ error: 'GET only' }, 405, cors)
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  const email = /^fs_ext_[a-f0-9]{40}$/.test(token) ? await env.DB.get(`key:${await sha(token)}`) : null
  const a = email ? await get(env, email) : null
  if (!a) return json({ error: 'unknown token' }, 401, cors)
  const { plan, via } = await effective(env, a)
  const policy = via ? ((await get(env, via))?.keep ?? []) : a.keep
  return json({ plan, policy }, 200, cors)
}

async function webhook(req: Request, env: Env): Promise<Response> {
  const raw = await req.text()
  const key = await crypto.subtle.importKey('raw', enc.encode(env.LS_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const expect = enc.encode(hex(await crypto.subtle.sign('HMAC', key, enc.encode(raw))))
  const got = enc.encode(req.headers.get('X-Signature') ?? '')
  if (got.length !== expect.length || !crypto.subtle.timingSafeEqual(got, expect)) return json({ error: 'bad signature' }, 401)
  const ev = JSON.parse(raw) as { meta: { event_name: string; custom_data?: { email?: string } }; data: { attributes: Record<string, unknown> } }
  if (!ev.meta.event_name.startsWith('subscription_')) return json({ ok: true })
  const at = ev.data.attributes
  // The checkout link carries the signed-in email as custom data; the receipt email is the fallback.
  const email = norm(ev.meta.custom_data?.email) || norm(at.user_email)
  if (!EMAIL.test(email)) return json({ error: 'no email' }, 400)
  const variant = String(at.variant_id ?? '')
  const plan: PlanKey | null = variant === env.LS_VARIANT_PRO ? 'pro' : variant === env.LS_VARIANT_TEAM ? 'team' : variant === env.LS_VARIANT_API ? 'api' : null
  if (!plan) return json({ error: 'unknown variant' }, 400)
  const a = (await get(env, email)) ?? fresh(email)
  Object.assign(a, { plan, status: String(at.status ?? ''), renews: (at.renews_at as string) ?? undefined, ends: (at.ends_at as string) ?? undefined, portal: (at.urls as { customer_portal?: string } | undefined)?.customer_portal })
  if (!['active', 'on_trial', 'past_due', 'cancelled'].includes(a.status ?? '')) a.plan = 'free'
  await put(env, a)
  return json({ ok: true })
}

async function sign(env: Env, body: string) {
  if (!env.REPORT_PRIVATE_KEY_JWK) return null
  const k = await crypto.subtle.importKey('jwk', JSON.parse(env.REPORT_PRIVATE_KEY_JWK), { name: 'Ed25519' }, false, ['sign'])
  return b64(await crypto.subtle.sign('Ed25519', k, enc.encode(body)))
}

async function hosted(req: Request, env: Env, url: URL): Promise<Response> {
  const cors = (r: Response) => { const h = new Headers(r.headers); for (const [k, v] of Object.entries(API_CORS)) h.set(k, v); return new Response(r.body, { status: r.status, headers: h }) }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: API_CORS })
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  const email = token.startsWith('fs_live_') ? await env.DB.get(`key:${await sha(token)}`) : null
  const a = email ? await get(env, email) : null
  if (!a) return cors(json({ error: 'unknown key' }, 401))
  const { plan } = await effective(env, a)
  const P = PLANS[plan]
  // Team members count against the owner's quota.
  const counter = `use:${a.owner && plan === 'team' ? a.owner : a.email}:${month()}`
  const used = Number((await env.DB.get(counter)) ?? 0)
  if (url.pathname === '/api/v1/usage' && req.method === 'GET') return cors(json({ plan, used, quota: P.apiFiles, maxBytes: P.maxBytes, period: month() }))
  if (req.method !== 'POST' || !['/api/v1/inspect', '/api/v1/clean'].includes(url.pathname)) return cors(json({ error: 'POST /api/v1/inspect or /api/v1/clean' }, 404))
  if (used >= P.apiFiles) return cors(json({ error: 'This month\'s files are used up. A larger plan is at https://filesanity.com/pricing' }, 402))
  if (Number(req.headers.get('Content-Length') ?? 0) > P.maxBytes) return cors(json({ error: `Files over ${P.maxBytes / 1e6} MB need a larger plan.` }, 413))

  const inner = new URL(url); inner.pathname = url.pathname.slice('/api/v1'.length)
  const res = await handle(new Request(inner, req), {})
  if (res.status >= 400) return cors(res)
  await env.DB.put(counter, String(used + 1), { expirationTtl: 40 * 86400 })
  const h = new Headers(res.headers)
  h.set('X-FileSanity-Used', `${used + 1}/${P.apiFiles}`)
  if (url.pathname === '/api/v1/clean' && url.searchParams.get('report') === '1' && plan !== 'free' && plan !== 'pro') {
    const out = await res.arrayBuffer()
    const report = JSON.stringify({ at: new Date().toISOString(), removed: Number(res.headers.get('X-FileSanity-Removed')), kept: Number(res.headers.get('X-FileSanity-Kept')), note: res.headers.get('X-FileSanity-Note') ?? undefined, sha256_out: hex(await crypto.subtle.digest('SHA-256', out)), bytes_out: out.byteLength })
    h.set('X-FileSanity-Report', b64(enc.encode(report).buffer as ArrayBuffer))
    const sig = await sign(env, report)
    if (sig) h.set('X-FileSanity-Report-Signature', sig)
    return cors(new Response(out, { status: res.status, headers: h }))
  }
  return cors(new Response(res.body, { status: res.status, headers: h }))
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    const p = url.pathname
    // The share sheet's POST normally stops in the service worker. If it arrives here (worker not installed yet), the body
    // is never read and the page says to try again.
    if (p === '/share-target') return Response.redirect(new URL('/?shared=0#cleaner', url).href, 303)
    if (!p.startsWith('/api/')) return env.ASSETS.fetch(req)
    try {
      if (p.startsWith('/api/v1/')) return await hosted(req, env, url)
      if (p.startsWith('/api/auth/')) return await auth(req, env, url)
      if (p === '/api/ext/me') return await extMe(req, env)
      if (p === '/api/webhooks/lemonsqueezy' && req.method === 'POST') return await webhook(req, env)
      if (p === '/api/report-key') {
        if (!env.REPORT_PRIVATE_KEY_JWK) return json({ error: 'reports are not signed on this deployment' }, 404)
        const { kty, crv, x } = JSON.parse(env.REPORT_PRIVATE_KEY_JWK)
        return json({ kty, crv, x }, 200, { 'Access-Control-Allow-Origin': '*' })
      }
      return await account(req, env, url)
    } catch (e) {
      console.error(e)
      return json({ error: 'Something went wrong on our side.' }, 500)
    }
  },
}
