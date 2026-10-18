/** FileSanity's one Worker. Static pages come from the assets binding; this code answers /api/* only.
 *
 *  Accounts (cookie session, same origin):
 *   POST /api/auth/start      { email, turnstile }   emails a sign-in link (15 minutes, one use)
 *   GET  /api/auth/verify?t=  redirects to /sign-in?t=, which asks to confirm (mail scanners open links; a GET consumes nothing)
 *   POST /api/auth/verify     { t }   opens a session; { t, peek: true } names the account without using the link
 *   POST /api/auth/signout
 *   GET  /api/me              the account: plan, usage, keys, team, policy
 *   PUT  /api/policy          { keep: string[] }
 *   POST /api/keys            { name, scope? } -> the key, shown once; scope 'ext' pairs the browser extension      DELETE /api/keys/:id
 *   POST /api/team            { email } invites      DELETE /api/team/:email      POST /api/team/join, /api/team/leave (the invited person)
 *   GET  /api/billing         redirects to the Paddle customer portal
 *   POST /api/plan            { plan }  switches the own paid subscription, prorated now; the webhook then moves the plan
 *   POST /api/webhooks/paddle subscription events, and refunds (a full one, or a chargeback, cancels) (Paddle-Signature)
 *  Hosted API (bearer key, any origin):
 *   POST /api/v1/inspect, /api/v1/clean (?keep=, ?report=1)       GET /api/v1/usage
 *   GET  /api/report-key      the Ed25519 public key that signs reports
 *  Browser extension (bearer extension token, any origin):
 *   GET  /api/ext/me          { plan, policy } and nothing else; the extension never sends a file or a file name
 *
 *  Stored in KV: per account the email, plan, subscription state, key hashes and names, team emails and policy. The
 *  monthly API count is a Durable Object per charged account. Never a file: the hosted API holds a file in memory for
 *  one request, or, over API_LIMITS.memory, in R2 (UPLOADS) for that request only. */
import { DurableObject } from 'cloudflare:workers'
import { handle, outputs } from './handler'
import { POLICY } from '../src/lib/index'
import { read, startsWith } from '../src/lib/bytes'
import { Ranged } from '../src/lib/ranged'
import { API_LIMITS, PAID, PLANS, type PlanKey } from '../src/site/plans'

export type Env = {
  ASSETS: Fetcher
  DB: KVNamespace
  QUOTA: DurableObjectNamespace<Quota>
  UPLOADS: R2Bucket // hosted API uploads over API_LIMITS.memory, for one request each
  EMAIL?: { send(m: { from: string | { email: string; name?: string }; to: string; subject: string; text: string; html?: string }): Promise<{ messageId: string }> } // Cloudflare Email Sending
  MAIL_FROM?: string // signin@filesanity.com
  TURNSTILE_SECRET: string
  PADDLE_API: string // https://sandbox-api.paddle.com or https://api.paddle.com
  PADDLE_API_KEY: string
  PADDLE_WEBHOOK_SECRET: string // pdl_ntfset_..., the notification destination's secret
  PADDLE_PRICE_PRO: string
  PADDLE_PRICE_TEAM: string
  PADDLE_PRICE_API: string
  REPORT_PRIVATE_KEY_JWK?: string
  DEV_LINKS?: string // "1" under wrangler dev: /api/auth/start returns the link instead of emailing it
}

export type Account = {
  email: string
  created: string
  plan: PlanKey // what this account pays for
  status?: string // Paddle subscription status; 'cancelled' also while it runs to the period end
  renews?: string
  ends?: string
  customer?: string // Paddle customer id, for the billing portal
  sub?: string // Paddle subscription id the plan comes from
  at?: string // occurred_at of the last subscription event applied
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

// Billing state has its own key that only the webhook writes: KV serves copies up to a minute old, so an account save
// (policy, keys, team) from a stale copy could otherwise put back a plan the webhook just ended. Its fields override the
// account's own, which only accounts from before this key still read.
const BILL = ['plan', 'status', 'renews', 'ends', 'customer', 'sub', 'at'] as const
const get = async (env: Env, email: string) => {
  const [a, b] = await Promise.all([env.DB.get<Account>(`acct:${email}`, 'json'), env.DB.get<Partial<Account>>(`bill:${email}`, 'json')])
  return a && ({ ...a, ...b } as Account)
}
const put = (env: Env, a: Account) => env.DB.put(`acct:${a.email}`, JSON.stringify(a))
// null, not undefined, so a cleared field (renews after a cancel) also overrides the account's old value.
const putBill = (env: Env, a: Account) => env.DB.put(`bill:${a.email}`, JSON.stringify(Object.fromEntries(BILL.map((k) => [k, a[k] ?? null]))))
const fresh = (email: string): Account => ({ email, created: new Date().toISOString(), plan: 'free', team: [], keys: [], keep: [] })
// Our 'cancelled' is Paddle's scheduled cancel: paid until it ends.
const active = (a: Account) => a.plan !== 'free' && (['active', 'trialing', 'past_due'].includes(a.status ?? '') || (a.status === 'cancelled' && Date.parse(a.ends ?? '') > Date.now()))

/** The plan an account works under: its own if paid and running, else its Team owner's, else free. */
async function effective(env: Env, a: Account): Promise<{ plan: PlanKey; via?: string }> {
  if (active(a)) return { plan: a.plan }
  if (await member(env, a)) return { plan: 'team', via: a.owner }
  return { plan: 'free' }
}
/** Whether the account's owner link still holds: a running Team plan that lists it. A link left by an ended plan holds nobody. */
const member = async (env: Env, a: Account) => {
  const o = a.owner ? await get(env, a.owner) : null
  return !!o && o.plan === 'team' && active(o) && o.team.includes(a.email)
}

/** A month's hosted-API count, one object per charged account (a Team member's owner), so parallel calls queue on it. */
export class Quota extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS months (month TEXT PRIMARY KEY, n INTEGER NOT NULL)')
  }
  used(month: string) { return this.ctx.storage.sql.exec<{ n: number }>('SELECT n FROM months WHERE month = ?', month).toArray()[0]?.n ?? 0 }
  /** Counts one file if the month is under the limit: the new count, or null when it is used up. */
  take(month: string, limit: number) { return this.ctx.storage.sql.exec<{ n: number }>('INSERT INTO months VALUES (?, 1) ON CONFLICT(month) DO UPDATE SET n = n + 1 WHERE n < ? RETURNING n', month, limit).toArray()[0]?.n ?? null }
  give(month: string) { this.ctx.storage.sql.exec('UPDATE months SET n = n - 1 WHERE month = ? AND n > 0', month) }
}
const quota = (env: Env, a: Account, via?: string) => env.QUOTA.get(env.QUOTA.idFromName(via ?? a.email))

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
// Dark-mode readers recolour mail that does not declare a color-scheme (Apple Mail), and Gmail inverts background-color but
// not background-image, so each fill is also set as a one-colour gradient.
const fill = (c: string) => `background:${c};background-image:linear-gradient(${c},${c})`
const signInHtml = (href: string) => `<!doctype html><html><head><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><style>:root{color-scheme:light dark}</style></head><body style="margin:0;padding:0;${fill('#0d5641')}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${fill('#0d5641')}"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;font-family:Arial,Helvetica,sans-serif">
<tr><td style="padding:0 4px 20px;font-size:22px;font-weight:800;color:#f4f1e6">File<span style="color:#e3f07a">Sanity</span></td></tr>
<tr><td style="${fill('#f4f1e6')};border-radius:6px;padding:32px 28px;color:#10261d">
<h1 style="margin:0 0 12px;font-size:24px;line-height:1.2;color:#10261d">Sign in to FileSanity</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:1.5">This link works once, for 15 minutes.</p>
<a href="${href}" style="display:inline-block;${fill('#0d5641')};color:#f4f1e6;font-size:16px;font-weight:700;text-decoration:none;padding:14px 24px;border-radius:6px">Sign in</a>
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
  // Mail scanners (Safe Links, Mimecast) open every link in a message, so the link only leads to a page that asks.
  if (url.pathname === '/api/auth/verify' && req.method === 'GET') {
    const t = url.searchParams.get('t') ?? ''
    return Response.redirect(`${url.origin}/sign-in?${/^[a-f0-9]{48}$/.test(t) ? `t=${t}` : 'expired=1'}`, 303)
  }
  if (url.pathname === '/api/auth/verify' && req.method === 'POST') {
    if (!sameOrigin(req, url)) return json({ error: 'cross-origin' }, 403)
    const body = (await req.json().catch(() => ({}))) as { t?: unknown; peek?: unknown }
    const t = norm(body.t)
    const k = `login:${await sha(t)}`
    const email = /^[a-f0-9]{48}$/.test(t) ? await env.DB.get(k) : null
    if (!email) return json({ error: 'expired' }, 400)
    // The confirm page names the account first, so a link someone else sent cannot sign you in to their account unnoticed.
    if (body.peek === true) return json({ email })
    await env.DB.delete(k)
    if (!(await get(env, email))) await put(env, fresh(email))
    const id = rand()
    await env.DB.put(`sess:${await sha(id)}`, email, { expirationTtl: 30 * 86400 })
    return json({ ok: true }, 200, { 'Set-Cookie': `${COOKIE}=${id}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 86400}` })
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
  if (!a) return req.method === 'GET' && url.pathname === '/api/me' ? json(null) : url.pathname === '/api/billing' ? Response.redirect(new URL('/sign-in', url).href, 303) : json({ error: 'Signed out. Sign in again.' }, 401)
  if (req.method !== 'GET' && !sameOrigin(req, url)) return json({ error: 'cross-origin' }, 403)
  const { plan, via } = await effective(env, a)
  const p = url.pathname

  if (p === '/api/me' && req.method === 'GET') {
    const used = await quota(env, a, via).used(month()) // the count the API charges, the owner's for a Team member
    // A Team member works under the owner's policy.
    const keep = via ? ((await get(env, via))?.keep ?? []) : a.keep
    const invite = via ? null : await env.DB.get(`invite:${a.email}`)
    const pending = (await Promise.all(a.team.map(async (e) => ((await env.DB.get(`invite:${e}`)) === a.email ? e : null)))).filter(Boolean)
    // An invitation that expired unanswered frees its seat, rather than turning into a member who never joined.
    const lapsed = (await Promise.all(a.team.filter((e) => !pending.includes(e)).map(async (e) => ((await get(env, e))?.owner === a.email ? null : e)))).filter(Boolean)
    if (lapsed.length) { a.team = a.team.filter((e) => !lapsed.includes(e)); await put(env, a) }
    return json({ email: a.email, plan, via, invite: invite ?? undefined, pending, own: a.plan, status: a.status, renews: a.renews, ends: a.ends, portal: a.customer ? '/api/billing' : undefined, team: a.team, keys: a.keys.map(({ hash: _, ...k }) => k), keep, used, quota: PLANS[plan].apiFiles, period: month() })
  }
  if (p === '/api/billing' && req.method === 'GET') {
    if (!a.customer) return Response.redirect(new URL('/account', url).href, 303)
    const r = await paddle<{ urls: { general: { overview: string } } }>(env, `/customers/${a.customer}/portal-sessions`, 'POST', {}).catch(() => null)
    if (!r || r.status >= 300) return Response.redirect(new URL('/account?billing=failed', url).href, 303) // a link, not a fetch: the page says what went wrong
    return Response.redirect(r.data.urls.general.overview, 303)
  }
  if (p === '/api/plan' && req.method === 'POST') {
    const to = ((await req.json().catch(() => ({}))) as { plan?: PlanKey }).plan
    if (via || !active(a)) return json({ error: 'Switching needs your own paid plan.' }, 403)
    if (!to || !PAID.includes(to) || to === a.plan) return json({ error: 'Choose another paid plan.' }, 400)
    if (a.status === 'cancelled' || a.status === 'past_due') return json({ error: a.status === 'past_due' ? 'Update your card on the billing page first.' : 'Your plan is cancelled. Resume it on the billing page first.' }, 409)
    // Accounts from before the subscription id was stored find it by customer.
    if (!a.sub && !a.customer) return json({ error: 'Your plan cannot be switched here. Write to us and we will move it.' }, 409)
    const sub = a.sub ?? (await paddle<Sub[]>(env, `/subscriptions?customer_id=${a.customer}&status=active,trialing`)).data?.[0]?.id
    if (!sub) return json({ error: 'Your subscription was not found. Use the billing page.' }, 409)
    const price = ({ pro: env.PADDLE_PRICE_PRO, team: env.PADDLE_PRICE_TEAM, api: env.PADDLE_PRICE_API } as Record<PlanKey, string>)[to]
    const r = await paddle(env, `/subscriptions/${sub}`, 'PATCH', { items: [{ price_id: price, quantity: 1 }], proration_billing_mode: 'prorated_immediately' })
    if (r.status >= 500) return json({ error: 'Paddle did not answer. Try again in a minute.' }, 502)
    if (r.status >= 300) { console.warn('plan switch refused', sub, r.status, r.code); return json({ error: r.code === 'subscription_locked_renewal' ? 'Your plan renews within the half hour. Try again after.' : 'Paddle refused the switch. Use the billing page or write to us.' }, 409) }
    return json({ ok: true, plan: to })
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
    const m = await get(env, email), inv = await env.DB.get(`invite:${email}`)
    if ((m?.owner && m.owner !== a.email && (await member(env, m))) || (inv && inv !== a.email)) return json({ error: 'That person is already on another team.' }, 409)
    // An invitation, not a membership: the person joins from their own account page, so nobody is put under a policy unasked.
    a.team.push(email)
    await Promise.all([put(env, a), env.DB.put(`invite:${email}`, a.email, { expirationTtl: 30 * 86400 })])
    return json({ team: a.team })
  }
  if (p === '/api/team/join' && req.method === 'POST') {
    const by = await env.DB.get(`invite:${a.email}`), o = by ? await get(env, by) : null
    if (!o || !o.team.includes(a.email) || o.plan !== 'team' || !active(o)) { await env.DB.delete(`invite:${a.email}`); return json({ error: 'That invitation is no longer open.' }, 409) }
    if (a.owner && a.owner !== o.email && (await member(env, a))) return json({ error: 'Leave your current team first.' }, 409)
    a.owner = o.email
    await Promise.all([put(env, a), env.DB.delete(`invite:${a.email}`)])
    return json({ ok: true })
  }
  if (p === '/api/team/leave' && req.method === 'POST') {
    // Declines an open invitation, or leaves the team: either way the owner's seat frees up.
    const by = a.owner ?? (await env.DB.get(`invite:${a.email}`)), o = by ? await get(env, by) : null
    if (o) { o.team = o.team.filter((e) => e !== a.email); await put(env, o) }
    delete a.owner
    await Promise.all([put(env, a), env.DB.delete(`invite:${a.email}`)])
    return json({ ok: true })
  }
  const out = p.match(/^\/api\/team\/(.+)$/)
  if (out && req.method === 'DELETE') {
    const email = norm(decodeURIComponent(out[1]))
    a.team = a.team.filter((e) => e !== email)
    const m = await get(env, email)
    if (m?.owner === a.email) { delete m.owner; await put(env, m) }
    if ((await env.DB.get(`invite:${email}`)) === a.email) await env.DB.delete(`invite:${email}`)
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

// ---- Paddle ----
class PaddleError extends Error {
  constructor(readonly status: number, readonly code: string, what: string) { super(`paddle ${what} ${status} ${code}`) }
}
/** One authenticated Paddle call. A network failure throws; an HTTP error comes back as its status and error code. */
async function paddle<T>(env: Env, path: string, method = 'GET', body?: object): Promise<{ status: number; code: string; data: T }> {
  const r = await fetch(`${env.PADDLE_API}${path}`, { method, headers: { Authorization: `Bearer ${env.PADDLE_API_KEY}`, 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) })
  const j = (await r.json().catch(() => ({}))) as { data: T; error?: { code?: string } }
  return { status: r.status, code: j.error?.code ?? '', data: j.data }
}
const must = <T>(r: { status: number; code: string; data: T }, what: string) => { if (r.status >= 300) throw new PaddleError(r.status, r.code, what); return r.data }
// Paddle retries a webhook answered 5xx for three days; these will not get better by asking again.
const permanent = (e: unknown) => e instanceof PaddleError && [403, 404, 422].includes(e.status)

type Sub = { id: string; status: string; customer_id: string; next_billed_at?: string | null; scheduled_change?: { action: string; effective_at: string } | null; custom_data?: { email?: string } | null; items: { price: { id: string } }[] }

/** Cancels now. Cancelling is not read-then-act: an "already canceled" refusal is success, and a pending scheduled change
 *  (a cancel at period end) is removed first if Paddle refuses on it (subscription_locked_pending_changes). */
async function cancelNow(env: Env, id: string) {
  for (let i = 0; i < 2; i++) {
    const r = await paddle(env, `/subscriptions/${id}/cancel`, 'POST', { effective_from: 'immediately' })
    if (r.status < 300) return
    if (r.status >= 500 || [403, 404, 422].includes(r.status)) throw new PaddleError(r.status, r.code, 'cancel')
    const sub = must(await paddle<Sub>(env, `/subscriptions/${id}`), 'subscription')
    if (sub.status === 'canceled') return
    if (!sub.scheduled_change || i) throw new PaddleError(r.status, r.code, 'cancel') // e.g. the renewal lock: a 500 has Paddle retry
    must(await paddle(env, `/subscriptions/${id}`, 'PATCH', { scheduled_change: null }), 'drop scheduled change')
  }
}

type Adjustment = { id: string; action: string; status: string; transaction_id: string; subscription_id?: string | null; totals: { total: string } }
// A full refund ends the plan now: the refund policy is "within 14 days, in full", and that buyer is leaving. A partial
// refund is goodwill and leaves it running; refunds that add up to the whole payment are full. A chargeback is the
// money taken back, so it ends the plan too. The cancel sends subscription.canceled, which drops the account to Free.
async function refunded(env: Env, d: Adjustment): Promise<Response> {
  if (!['refund', 'chargeback'].includes(d.action) || d.status !== 'approved' || !d.subscription_id) return json({ ok: true })
  try {
    if (d.action === 'refund') {
      const txn = must(await paddle<{ details: { totals: { grand_total: string } } }>(env, `/transactions/${d.transaction_id}`), 'transaction')
      const list = must(await paddle<Adjustment[]>(env, `/adjustments?transaction_id=${d.transaction_id}&action=refund&status=approved&per_page=50`), 'adjustments')
      const all = new Map([...list, d].map((x) => [x.id, x])) // the list may not show this event's adjustment yet
      const sum = [...all.values()].reduce((n, x) => n + Number(x.totals.total), 0)
      if (sum < Number(txn.details.totals.grand_total)) return json({ ok: true })
    }
    await cancelNow(env, d.subscription_id)
  } catch (e) {
    if (!permanent(e)) throw e
    console.error('refund cancel gave up', d.id, e)
  }
  return json({ ok: true })
}

// Paddle's sender addresses come from its /ips endpoint, not a pinned list, and are cached per isolate for an hour.
let senders: { at: number; ips: Set<string> } | undefined
async function fromPaddle(req: Request, env: Env): Promise<boolean> {
  if (!env.PADDLE_API.startsWith('https:')) return true // local dev posts from localhost
  if (!senders || Date.now() - senders.at > 3600e3) {
    const r = await fetch(`${env.PADDLE_API}/ips`)
    if (!r.ok) throw new Error(`paddle ips ${r.status}`) // a 500 makes Paddle retry
    const { data } = (await r.json()) as { data: { ipv4_cidrs: string[] } }
    // shortcut: matches /32 entries only (all Paddle publishes today); wider CIDRs would need a range check.
    senders = { at: Date.now(), ips: new Set(data.ipv4_cidrs.map((c) => c.replace(/\/32$/, ''))) }
  }
  return senders.ips.has(req.headers.get('CF-Connecting-IP') ?? '')
}

// Paddle-Signature "ts=<unix>;h1=<hex>": hex HMAC-SHA256 of "ts:body" under the destination's secret.
async function webhook(req: Request, env: Env): Promise<Response> {
  if (!(await fromPaddle(req, env))) return json({ error: 'not a Paddle address' }, 403)
  const raw = await req.text()
  const parts = Object.fromEntries((req.headers.get('paddle-signature') ?? '').split(';').map((kv) => kv.split('=')))
  if (!parts.ts || Math.abs(Date.now() / 1000 - Number(parts.ts)) > 300) return json({ error: 'bad signature' }, 401)
  const key = await crypto.subtle.importKey('raw', enc.encode(env.PADDLE_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const expect = enc.encode(hex(await crypto.subtle.sign('HMAC', key, enc.encode(`${parts.ts}:${raw}`)))), got = enc.encode(parts.h1 ?? '')
  if (got.length !== expect.length || !crypto.subtle.timingSafeEqual(got, expect)) return json({ error: 'bad signature' }, 401)
  const ev = JSON.parse(raw) as { event_type: string; occurred_at: string; data: Sub }
  if (ev.event_type.startsWith('adjustment.')) return await refunded(env, ev.data as unknown as Adjustment)
  if (!ev.event_type.startsWith('subscription.')) return json({ ok: true })
  const d = ev.data
  // The checkout carries the signed-in email as custom data; Paddle's subscription payload has no email of its own.
  const email = norm(d.custom_data?.email)
  if (!EMAIL.test(email)) return json({ error: 'no email' }, 400)
  const price = d.items[0]?.price.id
  const plan: PlanKey | null = price === env.PADDLE_PRICE_PRO ? 'pro' : price === env.PADDLE_PRICE_TEAM ? 'team' : price === env.PADDLE_PRICE_API ? 'api' : null
  if (!plan) return json({ error: 'unknown price' }, 400)
  const known = await get(env, email), a = known ?? fresh(email)
  // Paddle does not promise order; a payload is the subscription as it was when the event occurred.
  if (a.at && Date.parse(ev.occurred_at) < Date.parse(a.at)) return json({ ok: true })
  if (a.sub !== d.id) {
    // Custom data is the buyer's to write (Paddle.js runs in their browser), so a new subscription binds to an account
    // only when its Paddle customer has that email, and never replaces one that is still running.
    if (a.sub && active(a)) {
      // A second checkout for a running account would bill every month for nothing; stop it now (the owner refunds the first charge).
      console.warn(`webhook: ${d.id} ignored, ${email} runs on ${a.sub}`)
      if (['active', 'trialing', 'past_due'].includes(d.status)) await cancelNow(env, d.id).catch((e) => { if (!permanent(e)) throw e; console.error('duplicate cancel gave up', d.id, e) })
      return json({ ok: true })
    }
    const c = await paddle<{ email: string }>(env, `/customers/${d.customer_id}`)
    if (c.status >= 300 && c.status !== 404) throw new PaddleError(c.status, c.code, 'customer') // a 500 has Paddle retry
    if (norm(c.data?.email) !== email) { console.warn(`webhook: ${d.id} ignored, customer ${d.customer_id} is not ${email}`); return json({ ok: true }) }
  }
  const live = ['active', 'trialing', 'past_due'].includes(d.status), ending = live && d.scheduled_change?.action === 'cancel'
  Object.assign(a, { plan: live ? plan : 'free', status: ending ? 'cancelled' : d.status, renews: ending ? undefined : (d.next_billed_at ?? undefined), ends: ending ? d.scheduled_change!.effective_at : undefined, customer: d.customer_id, sub: d.id, at: ev.occurred_at })
  await Promise.all([putBill(env, a), known ? null : put(env, a)])
  return json({ ok: true })
}

async function sign(env: Env, body: string) {
  if (!env.REPORT_PRIVATE_KEY_JWK) return null
  const k = await crypto.subtle.importKey('jwk', JSON.parse(env.REPORT_PRIVATE_KEY_JWK), { name: 'Ed25519' }, false, ['sign'])
  return b64(await crypto.subtle.sign('Ed25519', k, enc.encode(body)))
}

async function hosted(req: Request, env: Env, url: URL, ctx: ExecutionContext): Promise<Response> {
  const cors = (r: Response) => { const h = new Headers(r.headers); for (const [k, v] of Object.entries(API_CORS)) h.set(k, v); return new Response(r.body, { status: r.status, headers: h }) }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: API_CORS })
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  const email = token.startsWith('fs_live_') ? await env.DB.get(`key:${await sha(token)}`) : null
  const a = email ? await get(env, email) : null
  if (!a) return cors(json({ error: 'unknown key' }, 401))
  const { plan, via } = await effective(env, a)
  const P = PLANS[plan], q = quota(env, a, via), m = month()
  if (url.pathname === '/api/v1/usage' && req.method === 'GET') return cors(json({ plan, used: await q.used(m), quota: P.apiFiles, maxBytes: P.maxBytes, period: m }))
  if (req.method !== 'POST' || !['/api/v1/inspect', '/api/v1/clean'].includes(url.pathname)) return cors(json({ error: 'POST /api/v1/inspect or /api/v1/clean' }, 404))
  const size = req.headers.get('Content-Length')
  const big = () => cors(json({ error: `Files over ${P.maxBytes / 1e6} MB are over this plan's API limit${plan === 'free' ? `; paid plans take ${PLANS.pro.maxBytes / 1e6} MB` : ''}. The browser cleaner at filesanity.com sets no size limit.` }, 413))
  if (size === null) return cors(json({ error: 'Send the file with a Content-Length header; chunked uploads are not taken.' }, 411))
  const n = Number(size), ranged = n > API_LIMITS.memory
  if (n > P.maxBytes) return big()
  if (ranged && (req.headers.get('Content-Type') ?? '').startsWith('multipart/')) return cors(json({ error: `Files over ${API_LIMITS.memory / 1e6} MB go as the raw request body with an X-Filename header, not as a multipart form: curl --data-binary @file -H "X-Filename: name.pdf"` }, 413))
  const used = await q.take(m, P.apiFiles)
  if (used === null) return cors(json({ error: 'This month\'s files are used up. A larger plan is at https://filesanity.com/pricing' }, 402))

  const inner = new URL(url); inner.pathname = url.pathname.slice('/api/v1'.length)
  let seen = 0, res: Response, key = ''
  const fail = async (r: Response) => { await q.give(m); if (key) ctx.waitUntil(env.UPLOADS.delete(key)); return cors(r) }
  if (ranged) {
    // Over the in-memory size the body streams into R2 under a random key, the cleaner reads it by ranges, and the object
    // is deleted once the reply has been read out (a 1-day lifecycle rule on the bucket catches a dropped request).
    key = crypto.randomUUID()
    if (!(await env.UPLOADS.put(key, req.body!.pipeThrough(new FixedLengthStream(n))).catch(() => null))) return fail(json({ error: 'The body did not match its Content-Length.' }, 400))
    const file = new Ranged(req.headers.get('X-Filename') || url.searchParams.get('name') || 'file', n, req.headers.get('Content-Type') ?? '', async (offset, length) => (await env.UPLOADS.get(key, { range: { offset, length } }))!.body)
    const head = await read(file as unknown as Blob, 0, 8)
    if (n > API_LIMITS.whole && (startsWith(head, [0xff, 0xd8, 0xff]) || startsWith(head, [0x25, 0x50, 0x44, 0x46]))) return fail(json({ error: `JPEG and PDF files are read whole, so the API takes them up to ${API_LIMITS.whole / 1e6} MB. The browser cleaner at filesanity.com sets no size limit.` }, 413))
    res = await handle(new Request(inner, { method: 'POST' }), {}, file as unknown as File)
  } else {
    // The header is the client's word; the bytes are counted too, and the read stops past the limit.
    const body = req.body?.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({ transform(c, ctl) { if ((seen += c.byteLength) > P.maxBytes) ctl.error(new Error('too large')); else ctl.enqueue(c) } }))
    res = await handle(new Request(inner, { method: 'POST', headers: req.headers, body }), {})
  }
  if (res.status >= 400 || seen > P.maxBytes) return fail(seen > P.maxBytes ? big() : res)
  const h = new Headers(res.headers)
  h.set('X-FileSanity-Used', `${used}/${P.apiFiles}`)
  const out = outputs.get(res)
  if (out && url.searchParams.get('report') === '1' && plan !== 'free' && plan !== 'pro') {
    // Hashed as a stream: a second read of the output, never the whole file in memory.
    const d = new crypto.DigestStream('SHA-256')
    await out.stream().pipeTo(d)
    const report = JSON.stringify({ at: new Date().toISOString(), removed: Number(res.headers.get('X-FileSanity-Removed')), kept: Number(res.headers.get('X-FileSanity-Kept')), note: res.headers.get('X-FileSanity-Note') ?? undefined, sha256_out: hex(await d.digest), bytes_out: out.size })
    h.set('X-FileSanity-Report', b64(enc.encode(report).buffer as ArrayBuffer))
    const sig = await sign(env, report)
    if (sig) h.set('X-FileSanity-Report-Signature', sig)
  }
  let body = res.body
  if (key && body) {
    // The object goes once every range has been read out; FixedLengthStream gives the reply its Content-Length.
    const t = out ? new FixedLengthStream(out.size) : new TransformStream()
    ctx.waitUntil(body.pipeTo(t.writable).catch(() => {}).then(() => env.UPLOADS.delete(key)))
    body = t.readable
  }
  return cors(new Response(body, { status: res.status, headers: h }))
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url)
    const p = url.pathname
    // The share sheet's POST normally stops in the service worker. If it arrives here (worker not installed yet), the body
    // is never read and the page says to try again.
    if (p === '/share-target') return Response.redirect(new URL('/?shared=0#cleaner', url).href, 303)
    if (!p.startsWith('/api/')) return env.ASSETS.fetch(req)
    try {
      if (p.startsWith('/api/v1/')) return await hosted(req, env, url, ctx)
      if (p.startsWith('/api/auth/')) return await auth(req, env, url)
      if (p === '/api/ext/me') return await extMe(req, env)
      if (p === '/api/webhooks/paddle' && req.method === 'POST') return await webhook(req, env)
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
