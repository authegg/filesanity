/** FileSanity Cloud: the hosted API at api.filesanity.com. The same handler as the self-hosted API, behind keys and a
 *  monthly quota, sold as a subscription through Lemon Squeezy. This is the one place FileSanity runs a server; the
 *  file is held in Worker memory for the length of the request and nothing is written or logged by this code.
 *
 *   GET  /                 a page: plans, and a form that issues a free trial key
 *   POST /keys             { email } -> { key }  a trial key: 500 files once, 25 MB each
 *   POST /inspect, /clean  Authorization: Bearer <trial key or Lemon Squeezy licence key>; ?report=1 on /clean adds a signed report header
 *   GET  /usage            the key's plan, files used, quota and period
 *   GET  /.well-known/filesanity-report-key   the Ed25519 public key that signs clean-reports
 *   POST /webhooks/lemonsqueezy               licence and subscription events (HMAC-SHA256, X-Signature)
 */
import { handle } from '../api/handler'
import { PLANS, type PlanKey } from '../src/cloud'

export type Env = {
  KEYS: KVNamespace
  LS_API_BASE?: string // override for tests
  LS_STORE_ID: string
  LS_WEBHOOK_SECRET: string
  LS_VARIANT_STARTER: string
  LS_VARIANT_BUSINESS: string
  REPORT_PRIVATE_KEY_JWK?: string // Ed25519 private key as JWK; without it reports are unsigned
}

type Trial = { kind: 'trial'; email: string; created: string; used: number }
type Licence = { kind: 'licence'; plan: PlanKey; email: string; checked: number; valid: boolean }

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Filename', 'Access-Control-Expose-Headers': 'Content-Disposition, X-FileSanity-Removed, X-FileSanity-Kept, X-FileSanity-Note, X-FileSanity-Report' }
const json = (body: unknown, status = 200, extra: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS, ...extra } })
const month = () => new Date().toISOString().slice(0, 7)
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('')
const b64 = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b)))

const newKey = () => 'fs_trial_' + hex(crypto.getRandomValues(new Uint8Array(16)).buffer)
const trialUsed = (t: Trial) => t.used
const TRIAL_QUOTA = 500

/** Resolves a bearer token to a plan, quota and the usage counter key. */
async function resolve(token: string, env: Env): Promise<{ plan: PlanKey | 'trial'; quota: number; maxBytes: number; counter: string; rec: Trial | Licence } | { error: string; status: number }> {
  if (token.startsWith('fs_trial_')) {
    const rec = await env.KEYS.get<Trial>(`key:${token}`, 'json')
    if (!rec) return { error: 'unknown key', status: 401 }
    return { plan: 'trial', quota: TRIAL_QUOTA, maxBytes: 25e6, counter: `key:${token}`, rec }
  }
  // A Lemon Squeezy licence key. Validated with Lemon Squeezy and cached for an hour; a webhook clears the cache sooner.
  let rec = await env.KEYS.get<Licence>(`lic:${token}`, 'json')
  if (!rec || Date.now() - rec.checked > 3600e3) {
    const r = await fetch(`${env.LS_API_BASE ?? 'https://api.lemonsqueezy.com'}/v1/licenses/validate`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: new URLSearchParams({ license_key: token }) })
    const v = (await r.json().catch(() => ({}))) as { valid?: boolean; license_key?: { status: string }; meta?: { store_id: number; variant_id: number; customer_email: string } }
    const variant = String(v.meta?.variant_id ?? '')
    const plan: PlanKey | null = variant === env.LS_VARIANT_STARTER ? 'starter' : variant === env.LS_VARIANT_BUSINESS ? 'business' : null
    const valid = !!v.valid && String(v.meta?.store_id ?? '') === env.LS_STORE_ID && plan !== null && ['active', 'inactive'].includes(v.license_key?.status ?? '')
    rec = { kind: 'licence', plan: plan ?? 'starter', email: v.meta?.customer_email ?? '', checked: Date.now(), valid }
    await env.KEYS.put(`lic:${token}`, JSON.stringify(rec), { expirationTtl: 86400 })
  }
  if (!rec.valid) return { error: 'this licence key is not active', status: 401 }
  const p = PLANS[rec.plan]
  return { plan: rec.plan, quota: p.files, maxBytes: p.maxBytes, counter: `use:${token}:${month()}`, rec }
}

/** Ed25519 signature over the report JSON, so a third party can check it against the published public key. */
async function sign(env: Env, body: string): Promise<string | null> {
  if (!env.REPORT_PRIVATE_KEY_JWK) return null
  const key = await crypto.subtle.importKey('jwk', JSON.parse(env.REPORT_PRIVATE_KEY_JWK), { name: 'Ed25519' }, false, ['sign'])
  return b64(await crypto.subtle.sign('Ed25519', key, new TextEncoder().encode(body)))
}

async function webhook(req: Request, env: Env): Promise<Response> {
  const raw = await req.text()
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.LS_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const expect = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw)))
  const got = req.headers.get('X-Signature') ?? ''
  if (got.length !== expect.length || !crypto.subtle.timingSafeEqual(new TextEncoder().encode(got), new TextEncoder().encode(expect))) return json({ error: 'bad signature' }, 401)
  const ev = JSON.parse(raw) as { meta: { event_name: string }; data: { attributes: Record<string, unknown> } }
  // Any licence event drops the cached validation, so the next call asks Lemon Squeezy again.
  if (ev.meta.event_name.startsWith('license_key_')) {
    const k = ev.data.attributes.key as string | undefined
    if (k) await env.KEYS.delete(`lic:${k}`)
  }
  return json({ ok: true })
}

const PAGE = (plans: typeof PLANS) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FileSanity Cloud API</title><meta name="robots" content="noindex">
<style>body{font:16px/1.55 system-ui,sans-serif;max-width:60ch;margin:3rem auto;padding:0 1rem;color:#18181b;background:#f1f1ef}h1{font-size:1.6rem}code{font-size:.9em}input,button{font:inherit;padding:.5rem .75rem;border:1px solid #c9c9c5;border-radius:999px}button{background:#8c2f2a;color:#fff;border-color:#8c2f2a;cursor:pointer}a{color:#8c2f2a}.k{word-break:break-all;background:#fff;padding:.75rem;border-radius:.75rem;border:1px solid #d9d9d5}small{color:#5c5c63}</style></head><body>
<h1>FileSanity Cloud API</h1>
<p>The hosted version of the <a href="https://filesanity.com/api">self-hosted API</a>. Unlike the rest of FileSanity, a file you send here does leave your machine: it is held in memory for the length of one request on Cloudflare's network and nothing is stored. <a href="https://filesanity.com/cloud/terms">Terms and privacy for the Cloud API.</a></p>
<h2>Plans</h2>
<ul>${Object.values(plans).map((p) => `<li><strong>${p.name}</strong>: ${p.price ? `$${p.price}/month, ` : ''}${p.files.toLocaleString('en')} files${p.price ? ' a month' : ' once'}, ${p.maxBytes / 1e6} MB each${p.checkout ? ` &middot; <a href="${p.checkout}">Subscribe</a>` : ''}</li>`).join('')}</ul>
<h2>Free trial key</h2>
<form id="f"><input type="email" name="email" placeholder="you@example.com" required> <button>Get a key</button></form>
<p id="out"></p>
<p><small>The email is kept with the key so we can reply if it is abused; it is used for nothing else.</small></p>
<h2>Use it</h2>
<pre><code>curl -H "Authorization: Bearer $KEY" -F file=@photo.jpg "https://api.filesanity.com/clean?report=1" -o photo-clean.jpg -D -
curl -H "Authorization: Bearer $KEY" https://api.filesanity.com/usage</code></pre>
<p>A subscription's key is the licence key on your Lemon Squeezy receipt. <code>?keep=exif,xmp</code> applies a <a href="https://filesanity.com/batch">policy</a>; <code>?report=1</code> adds <code>X-FileSanity-Report</code>, a signed JSON record of what was removed, verifiable with the key at <code>/.well-known/filesanity-report-key</code>.</p>
<script>document.getElementById('f').addEventListener('submit',async(e)=>{e.preventDefault();const o=document.getElementById('out');o.textContent='...';const r=await fetch('/keys',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:e.target.email.value})});const j=await r.json();o.innerHTML=r.ok?'Your key, shown once:<div class="k">'+j.key+'</div>':(j.error||'failed')})</script>
</body></html>`

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
    if (req.method === 'GET' && url.pathname === '/') return new Response(PAGE(PLANS), { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    if (req.method === 'GET' && url.pathname === '/.well-known/filesanity-report-key') {
      if (!env.REPORT_PRIVATE_KEY_JWK) return json({ error: 'reports are not signed on this deployment' }, 404)
      const { x, crv, kty } = JSON.parse(env.REPORT_PRIVATE_KEY_JWK)
      return json({ kty, crv, x })
    }
    if (req.method === 'POST' && url.pathname === '/webhooks/lemonsqueezy') return webhook(req, env)
    if (req.method === 'POST' && url.pathname === '/keys') {
      const { email } = (await req.json().catch(() => ({}))) as { email?: string }
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'a valid email is needed' }, 400)
      // One trial per address, three per network address a day. ponytail: KV counters are not atomic; good enough for abuse control.
      if (await env.KEYS.get(`trial-email:${email.toLowerCase()}`)) return json({ error: 'this address already has a trial key' }, 409)
      const ip = req.headers.get('CF-Connecting-IP') ?? 'unknown'
      const ipKey = `trial-ip:${ip}:${new Date().toISOString().slice(0, 10)}`
      const n = Number((await env.KEYS.get(ipKey)) ?? 0)
      if (n >= 3) return json({ error: 'too many trial keys from this network today' }, 429)
      const key = newKey()
      const rec: Trial = { kind: 'trial', email, created: new Date().toISOString(), used: 0 }
      await Promise.all([env.KEYS.put(`key:${key}`, JSON.stringify(rec)), env.KEYS.put(`trial-email:${email.toLowerCase()}`, key), env.KEYS.put(ipKey, String(n + 1), { expirationTtl: 86400 })])
      return json({ key, plan: 'trial', files: TRIAL_QUOTA, maxBytes: 25e6 }, 201)
    }

    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
    if (!token) return json({ error: 'Authorization: Bearer <key> is needed' }, 401)
    const r = await resolve(token, env)
    if ('error' in r) return json({ error: r.error }, r.status)
    const used = r.plan === 'trial' ? trialUsed(r.rec as Trial) : Number((await env.KEYS.get(r.counter)) ?? 0)

    if (req.method === 'GET' && url.pathname === '/usage') return json({ plan: r.plan, used, quota: r.quota, maxBytes: r.maxBytes, period: r.plan === 'trial' ? 'once' : month() })
    if (req.method !== 'POST' || !['/inspect', '/clean'].includes(url.pathname)) return json({ error: 'POST /inspect or POST /clean' }, 404)
    if (used >= r.quota) return json({ error: r.plan === 'trial' ? 'the trial is used up; subscribe at https://filesanity.com/cloud' : 'this month\'s quota is used up; the next plan is at https://filesanity.com/cloud' }, 402)
    const len = Number(req.headers.get('Content-Length') ?? 0)
    if (len > r.maxBytes) return json({ error: `files over ${r.maxBytes / 1e6} MB need a larger plan` }, 413)

    const res = await handle(req, {})
    if (res.status >= 400) return res
    // Count the file, then hand back the handler's reply with the report if asked.
    if (r.plan === 'trial') await env.KEYS.put(r.counter, JSON.stringify({ ...(r.rec as Trial), used: used + 1 }))
    else await env.KEYS.put(r.counter, String(used + 1), { expirationTtl: 40 * 86400 })
    if (url.pathname === '/clean' && url.searchParams.get('report') === '1') {
      const out = await res.arrayBuffer()
      const report = JSON.stringify({ at: new Date().toISOString(), plan: r.plan, removed: Number(res.headers.get('X-FileSanity-Removed')), kept: Number(res.headers.get('X-FileSanity-Kept')), note: res.headers.get('X-FileSanity-Note') ?? undefined, sha256_out: hex(await crypto.subtle.digest('SHA-256', out)), bytes_out: out.byteLength })
      const sig = await sign(env, report)
      const h = new Headers(res.headers)
      h.set('X-FileSanity-Report', b64(new TextEncoder().encode(report).buffer as ArrayBuffer))
      if (sig) h.set('X-FileSanity-Report-Signature', sig)
      h.set('X-FileSanity-Used', `${used + 1}/${r.quota}`)
      return new Response(out, { status: res.status, headers: h })
    }
    const h = new Headers(res.headers)
    h.set('X-FileSanity-Used', `${used + 1}/${r.quota}`)
    return new Response(res.body, { status: res.status, headers: h })
  },
}
