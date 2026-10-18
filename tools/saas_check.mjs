// End-to-end check of the account API against `npx wrangler dev --port 8787` (DEV_LINKS=1, the test secrets and
// PADDLE_API=http://127.0.0.1:8799 in .dev.vars). It runs a Paddle stub on that port, which records every call.
// node tools/saas_check.mjs [base]        node tools/saas_check.mjs --stub   (the stub alone, for layout_check and ext_check)
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { createHmac, webcrypto as crypto } from 'node:crypto'
import assert from 'node:assert/strict'

// ---- Paddle stub: customers are ctm_<hex of the email>, so any tool can make a matching one; the rest is canned here ----
export const cust = (email) => `ctm_${Buffer.from(email).toString('hex')}`
const S = { calls: [], subs: {}, txns: {}, adjs: [] }
const stub = createServer(async (req, res) => {
  let raw = ''; for await (const c of req) raw += c
  const u = new URL(req.url, 'http://stub'), p = u.pathname, body = raw ? JSON.parse(raw) : undefined, q = (k) => u.searchParams.get(k)
  S.calls.push({ method: req.method, path: p + u.search, body })
  const send = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(status < 300 ? { data } : { error: { type: 'request_error', code: data } })) }
  let m
  if ((m = p.match(/^\/customers\/ctm_([0-9a-f]+)$/))) return send(200, { id: `ctm_${m[1]}`, email: Buffer.from(m[1], 'hex').toString() })
  if ((m = p.match(/^\/customers\/([^/]+)\/portal-sessions$/)) && req.method === 'POST') return send(201, { urls: { general: { overview: `https://customer-portal.paddle.test/${m[1]}` } } })
  if ((m = p.match(/^\/transactions\/([^/]+)$/))) return S.txns[m[1]] ? send(200, S.txns[m[1]]) : send(404, 'not_found')
  if (p === '/adjustments') return send(200, S.adjs.filter((a) => a.transaction_id === q('transaction_id') && (!q('action') || a.action === q('action')) && (!q('status') || a.status === q('status'))))
  if ((m = p.match(/^\/subscriptions\/([^/]+)(\/cancel)?$/))) {
    const s = S.subs[m[1]]
    if (!s) return send(404, 'not_found')
    if (s.down) return send(500, 'internal_error')
    if (m[2]) {
      if (s.status === 'canceled') return send(400, 'subscription_is_canceled_action_invalid')
      if (s.scheduled_change) return send(400, 'subscription_locked_pending_changes')
      s.status = 'canceled'; return send(200, s)
    }
    if (req.method === 'PATCH') { if ('scheduled_change' in body) s.scheduled_change = body.scheduled_change; if (body.items) s.items = body.items; return send(200, s) }
    return send(200, s)
  }
  send(404, 'not_found')
})
await new Promise((ok, no) => stub.once('error', no).listen(8799, '127.0.0.1', ok))
if (process.argv.includes('--stub')) { console.log('Paddle stub on 127.0.0.1:8799'); await new Promise(() => {}) }
const calls = (method, path) => S.calls.filter((c) => c.method === method && c.path.startsWith(path))

const B = process.argv.slice(2).find((x) => !x.startsWith('--')) ?? 'http://127.0.0.1:8787'
const vars = Object.fromEntries(readFileSync('.dev.vars', 'utf8').trim().split('\n').map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
assert.equal(vars.PADDLE_API, 'http://127.0.0.1:8799', '.dev.vars points PADDLE_API at the stub')
const O = { Origin: B }
const run = Date.now().toString(36)
const A = `owner-${run}@example.com`, M = `member-${run}@example.com`, C = `quota-${run}@example.com`
let n = 0
const ok = (msg) => console.log(`ok ${++n} ${msg}`)

async function signIn(email) {
  let r = await fetch(`${B}/api/auth/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, turnstile: 'x' }) })
  assert.equal(r.status, 403, 'start without Origin is refused')
  r = await fetch(`${B}/api/auth/start`, { method: 'POST', headers: { ...O, 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
  assert.equal(r.status, 400, 'start without a Turnstile token is refused')
  r = await fetch(`${B}/api/auth/start`, { method: 'POST', headers: { ...O, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, turnstile: 'XXXX.DUMMY.TOKEN.XXXX' }) })
  const link = (await r.json()).link?.replace(/^https?:\/\/[^/]+/, B) // wrangler dev reports the route's host
  assert.ok(link, 'dev returns the link')
  const t = new URL(link).searchParams.get('t')
  for (const _ of [1, 2]) { // a mail scanner opens it first; the human's open still works
    r = await fetch(link, { redirect: 'manual' })
    assert.equal(r.status, 303); assert.equal(new URL(r.headers.get('location')).pathname + new URL(r.headers.get('location')).search, `/sign-in?t=${t}`)
    assert.equal(r.headers.get('set-cookie'), null, 'opening the link signs nobody in')
  }
  const verify = (h) => fetch(`${B}/api/auth/verify`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ t }) })
  assert.equal((await verify({ Origin: 'https://evil.example' })).status, 403, 'confirm from another origin is refused')
  r = await fetch(`${B}/api/auth/verify`, { method: 'POST', headers: { ...O, 'Content-Type': 'application/json' }, body: JSON.stringify({ t, peek: true }) })
  assert.deepEqual(await r.json(), { email }, 'the confirm page can name the account'); assert.equal(r.headers.get('set-cookie'), null, 'naming it signs nobody in')
  r = await verify(O); assert.equal(r.status, 200)
  const cookie = r.headers.get('set-cookie').split(';')[0]
  assert.match(r.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/)
  assert.equal((await verify(O)).status, 400, 'a link works once')
  return cookie
}
const me = async (c) => (await fetch(`${B}/api/me`, { headers: { Cookie: c } })).json()
const acct = (c, method, path, body) => fetch(`${B}${path}`, { method, headers: { Cookie: c, ...O, 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) })
// Paddle subscription event, signed the Paddle way (hex HMAC-SHA256 of "ts:body", header "ts=..;h1=.."). Each event occurs a
// second after the last unless `at` says when; the stub learns the subscription so it can be switched or cancelled.
const T0 = Date.now()
let tick = 0
const sid = (email) => `sub_${Buffer.from(email).toString('hex').slice(0, 20)}`
const hook = (event_type, price, email, { status = 'active', secret, at, ...extra } = {}) => {
  const data = { id: sid(email), status, customer_id: cust(email), next_billed_at: '2026-11-08T00:00:00Z', scheduled_change: null, custom_data: { email }, items: [{ price: { id: price } }], ...extra }
  S.subs[data.id] ??= { id: data.id, status, scheduled_change: null }
  return signed(event_type, data, secret, at)
}
const signed = (event_type, data, secret = vars.PADDLE_WEBHOOK_SECRET, at = new Date(T0 + ++tick * 1000).toISOString()) => {
  const raw = JSON.stringify({ event_id: `evt_${Math.random().toString(36).slice(2)}`, event_type, occurred_at: at, data })
  const ts = Math.floor(Date.now() / 1000)
  const sig = createHmac('sha256', secret).update(`${ts}:${raw}`).digest('hex')
  return fetch(`${B}/api/webhooks/paddle`, { method: 'POST', headers: { 'Paddle-Signature': `ts=${ts};h1=${sig}` }, body: raw })
}
const photo = readFileSync('tests/files/photo.jpg')
const ext = (t) => fetch(`${B}/api/ext/me`, { headers: { Authorization: `Bearer ${t}`, Origin: 'chrome-extension://abc' } })
const clean = (key, q = '', name = 'photo.jpg') => { const f = new FormData(); f.append('file', new Blob([photo]), name); return fetch(`${B}/api/v1/clean${q}`, { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: f }) }
const future = new Date(Date.now() + 30 * 86400e3).toISOString(), past = new Date(Date.now() - 86400e3).toISOString()

const a = await signIn(A); ok('sign-in: Origin and Turnstile required, link once, session cookie')
let m = await me(a); assert.equal(m.plan, 'free'); assert.equal(m.quota, 50); ok('new account is free with 50 API files')
assert.equal((await fetch(`${B}/api/keys`, { method: 'POST', headers: { Cookie: a, Origin: 'https://evil.example' } })).status, 403); ok('cross-origin account call refused')

let r = await acct(a, 'POST', '/api/keys', { name: 'upload form' }); const { key, id } = await r.json()
assert.equal(r.status, 201); assert.match(key, /^fs_live_[a-f0-9]{40}$/)
m = await me(a); assert.equal(m.keys[0].hint, key.slice(-4)); assert.equal(m.keys[0].hash, undefined); ok('key created, shown once, hash not returned')

r = await clean(key); assert.equal(r.status, 200); assert.ok(Number(r.headers.get('x-filesanity-removed')) > 0); assert.equal(r.headers.get('x-filesanity-used'), '1/50')
assert.equal(r.headers.get('x-filesanity-report'), null, 'no signed report on free'); ok('free key cleans a photo and counts it')
assert.equal((await clean('fs_live_nope')).status, 401); ok('unknown key refused')

r = await acct(a, 'POST', '/api/keys', { scope: 'ext' }); const { key: tok, id: tokId } = await r.json()
assert.equal(r.status, 201); assert.match(tok, /^fs_ext_[a-f0-9]{40}$/)
r = await ext(tok); assert.equal(r.status, 200); assert.equal(r.headers.get('access-control-allow-origin'), '*')
assert.deepEqual(await r.json(), { plan: 'free', policy: [] }, 'plan and policy only')
assert.equal((await ext(key)).status, 401, 'an API key is not an extension token'); assert.equal((await clean(tok)).status, 401, 'an extension token cannot use the hosted API')
assert.equal((await ext('fs_ext_' + '0'.repeat(40))).status, 401); ok('extension token: plan and policy only, scoped apart from API keys')

assert.equal((await hook('subscription.created', vars.PADDLE_PRICE_API, A, { secret: 'pdl_ntfset_wrong' })).status, 401); ok('webhook with a bad signature refused')
// Custom data is written in the buyer's browser: someone else's checkout naming A must not land on A.
assert.equal((await hook('subscription.created', vars.PADDLE_PRICE_API, A, { id: 'sub_evil', customer_id: cust('evil@example.com') })).status, 200)
m = await me(a); assert.equal(m.plan, 'free'); assert.equal(m.portal, undefined); ok('event whose Paddle customer is another email is ignored')
assert.equal((await hook('subscription.created', vars.PADDLE_PRICE_API, A)).status, 200)
m = await me(a); assert.equal(m.plan, 'api'); assert.equal(m.quota, 50000); assert.ok(m.portal); ok('webhook moves the account to API')
assert.equal(calls('GET', `/customers/${cust(A)}`).length, 1, 'customer looked up once, when the subscription binds')
await hook('subscription.created', vars.PADDLE_PRICE_PRO, A, { id: 'sub_second' }); m = await me(a); assert.equal(m.plan, 'api'); ok('another subscription does not replace a running one')
await hook('subscription.updated', vars.PADDLE_PRICE_API, A, { status: 'canceled', at: new Date(T0).toISOString() }); m = await me(a); assert.equal(m.plan, 'api'); ok('an event older than the last applied is ignored')

r = await clean(key, '?report=1'); assert.equal(r.status, 200)
const report = Buffer.from(r.headers.get('x-filesanity-report'), 'base64'), sig = Buffer.from(r.headers.get('x-filesanity-report-signature'), 'base64')
const out = Buffer.from(await r.arrayBuffer())
const jwk = await (await fetch(`${B}/api/report-key`)).json()
const pub = await crypto.subtle.importKey('jwk', jwk, { name: 'Ed25519' }, false, ['verify'])
assert.ok(await crypto.subtle.verify('Ed25519', pub, sig, report), 'signature verifies')
assert.equal(JSON.parse(report).sha256_out, Buffer.from(await crypto.subtle.digest('SHA-256', out)).toString('hex')); ok('signed report verifies and matches the clean file')
r = await clean(key, '', 'фото «отпуск».jpg'); assert.equal(r.status, 200)
const cd = r.headers.get('content-disposition'); assert.match(cd, /^attachment; filename="[\x20-\x7e]+"; filename\*=UTF-8''[A-Za-z0-9%._~!-]+$/)
assert.match(decodeURIComponent(cd.split("''")[1]), /^фото «отпуск»/); ok('a non-ASCII file name cleans, with an ASCII name and the UTF-8 one')

assert.equal((await acct(a, 'POST', '/api/team', { email: M })).status, 403); ok('team needs the Team plan')
await hook('subscription.updated', vars.PADDLE_PRICE_TEAM, A)
assert.equal((await acct(a, 'PUT', '/api/policy', { keep: ['exif', 'bogus'] })).status, 200)
r = await acct(a, 'POST', '/api/team', { email: M }); assert.deepEqual((await r.json()).team, [M])
assert.deepEqual(await (await ext(tok)).json(), { plan: 'team', policy: ['exif'] }); ok('extension token follows the plan and the saved policy')
assert.equal((await acct(a, 'DELETE', `/api/keys/${tokId}`)).status, 200); assert.equal((await ext(tok)).status, 401); ok('revoked extension token refused')
const b = await signIn(M); m = await me(b); assert.equal(m.plan, 'free'); assert.equal(m.invite, A); assert.deepEqual((await me(a)).pending, [M]); ok('adding a person invites them; nothing changes until they join')
assert.equal((await acct(b, 'POST', '/api/team/join')).status, 200); assert.deepEqual((await me(a)).pending, [])
m = await me(b); assert.equal(m.plan, 'team'); assert.equal(m.via, A); assert.equal(m.invite, undefined); assert.deepEqual(m.keep, ['exif']); ok('member gets Team and the owner\'s policy (unknown keys dropped)')
assert.equal((await acct(b, 'PUT', '/api/policy', { keep: [] })).status, 403); ok('member cannot change the team policy')
const { key: bkey } = await (await acct(b, 'POST', '/api/keys', { name: 'member' })).json()
const before = (await me(a)).used
r = await clean(bkey); assert.equal(r.headers.get('x-filesanity-used'), `${before + 1}/5000`)
assert.equal((await me(a)).used, before + 1); assert.equal((await me(b)).used, before + 1); ok('a member\'s call counts on the owner, and the member sees that count')

assert.equal((await acct(b, 'POST', '/api/plan', { plan: 'api' })).status, 403, 'a member cannot switch')
assert.equal((await acct(a, 'POST', '/api/plan', { plan: 'team' })).status, 400, 'not to the same plan')
assert.equal((await acct(a, 'POST', '/api/plan', { plan: 'constructor' })).status, 400, 'nor to a made-up one')
r = await acct(a, 'POST', '/api/plan', { plan: 'api' }); assert.equal(r.status, 200)
const sw = calls('PATCH', `/subscriptions/${sid(A)}`).at(-1); assert.deepEqual(sw?.body, { items: [{ price_id: vars.PADDLE_PRICE_API, quantity: 1 }], proration_billing_mode: 'prorated_immediately' })
assert.equal((await me(a)).plan, 'team', 'the plan moves when the webhook says so'); ok('owner switches plan: one prorated PATCH to Paddle')
await acct(a, 'DELETE', `/api/team/${encodeURIComponent(M)}`); m = await me(b); assert.equal(m.plan, 'free'); ok('removed member drops to free')
await acct(a, 'POST', '/api/team', { email: M }); assert.equal((await acct(b, 'POST', '/api/team/leave')).status, 200)
assert.deepEqual((await me(a)).team, []); assert.equal((await me(b)).invite, undefined); assert.equal((await acct(b, 'POST', '/api/team/join')).status, 409); ok('a declined invitation frees the seat and cannot be joined')
await acct(a, 'POST', '/api/team', { email: M }); await acct(b, 'POST', '/api/team/join'); assert.equal((await me(b)).via, A)
await acct(b, 'POST', '/api/team/leave'); m = await me(b); assert.equal(m.plan, 'free'); assert.equal(m.via, undefined); assert.deepEqual((await me(a)).team, []); ok('a member can leave the team')

assert.equal((await acct(a, 'DELETE', `/api/keys/${id}`)).status, 200)
assert.equal((await clean(key)).status, 401); ok('revoked key refused')
await hook('subscription.updated', vars.PADDLE_PRICE_TEAM, A, { next_billed_at: null, scheduled_change: { action: 'cancel', effective_at: future } }); m = await me(a)
assert.equal(m.plan, 'team'); assert.equal(m.status, 'cancelled'); assert.equal(m.ends, future); ok('cancel at period end keeps the plan until it ends')
assert.equal((await acct(a, 'POST', '/api/plan', { plan: 'pro' })).status, 409); ok('a cancelled plan is resumed on the billing page before switching')
r = await fetch(`${B}/api/billing`, { headers: { Cookie: a }, redirect: 'manual' })
assert.equal(r.status, 303); assert.equal(r.headers.get('location'), `https://customer-portal.paddle.test/${cust(A)}`)
assert.equal(calls('POST', `/customers/${cust(A)}/portal-sessions`).length, 1); ok('billing portal: a Paddle portal session for the account\'s customer')

// Refunds and chargebacks, against canned Paddle state.
S.txns.txn_r = { details: { totals: { grand_total: '2400' } } }
for (const id of ['sub_r1', 'sub_r2', 'sub_r3', 'sub_down']) S.subs[id] = { id, status: 'active', scheduled_change: null }
S.subs.sub_r3.scheduled_change = { action: 'cancel', effective_at: future }; S.subs.sub_down.down = true
const adj = (id, action, status, subscription_id, total = '1200') => ({ id, action, status, transaction_id: 'txn_r', subscription_id, totals: { total } })
const adjust = (d) => signed('adjustment.updated', d)
assert.equal((await adjust(adj('adj_0', 'refund', 'pending_approval', 'sub_r1', '2400'))).status, 200); ok('refund awaiting approval changes nothing')
assert.equal((await adjust(adj('adj_9', 'refund', 'approved', null, '2400'))).status, 200); ok('refund of a one-off payment changes nothing')
S.adjs.push(adj('adj_1', 'refund', 'approved', 'sub_r1'))
assert.equal((await adjust(S.adjs[0])).status, 200); assert.equal(S.subs.sub_r1.status, 'active'); ok('a partial refund leaves the plan running')
assert.equal((await adjust(adj('adj_2', 'refund', 'approved', 'sub_r1'))).status, 200); assert.equal(S.subs.sub_r1.status, 'canceled'); ok('refunds adding up to the payment cancel it (this one not yet listed by Paddle)')
assert.equal((await adjust(adj('adj_2', 'refund', 'approved', 'sub_r1'))).status, 200); assert.equal(calls('POST', '/subscriptions/sub_r1/cancel').length, 2); ok('cancelling an already canceled subscription is success, not a retry')
assert.equal((await adjust(adj('adj_3', 'chargeback', 'approved', 'sub_r2', '1'))).status, 200); assert.equal(S.subs.sub_r2.status, 'canceled'); ok('a chargeback cancels at once, whatever the amount')
assert.equal((await adjust(adj('adj_4', 'chargeback', 'approved', 'sub_r3'))).status, 200); assert.equal(S.subs.sub_r3.status, 'canceled')
assert.deepEqual(calls('PATCH', '/subscriptions/sub_r3').at(-1)?.body, { scheduled_change: null }); ok('a scheduled cancel is dropped so the cancel can take effect now')
assert.equal((await adjust(adj('adj_5', 'chargeback', 'approved', 'sub_gone'))).status, 200); ok('an unknown subscription is logged, not retried for three days')
assert.equal((await adjust(adj('adj_6', 'chargeback', 'approved', 'sub_down'))).status, 500); ok('Paddle down: a 500, so Paddle retries')
await hook('subscription.canceled', vars.PADDLE_PRICE_TEAM, A, { status: 'canceled' }); m = await me(a); assert.equal(m.plan, 'free'); ok('canceled subscription drops to free')

// A trial is paid; a scheduled cancel whose date passed is not. Then the quota under 60 parallel calls.
const c = await signIn(C)
await hook('subscription.created', vars.PADDLE_PRICE_PRO, C, { status: 'trialing' }); m = await me(c); assert.equal(m.plan, 'pro'); ok('a trialing subscription is on its plan')
await hook('subscription.updated', vars.PADDLE_PRICE_PRO, C, { next_billed_at: null, scheduled_change: { action: 'cancel', effective_at: past } }); m = await me(c)
assert.equal(m.plan, 'free'); assert.equal(m.own, 'pro'); ok('a cancel whose end date has passed is free, webhook or not')
const { key: ckey } = await (await acct(c, 'POST', '/api/keys', { name: 'quota' })).json()
r = await fetch(`${B}/api/v1/clean`, { method: 'POST', headers: { Authorization: `Bearer ${ckey}` }, body: new ReadableStream({ start(s) { s.enqueue(photo); s.close() } }), duplex: 'half' })
assert.equal(r.status, 411); ok('an upload without Content-Length is refused')
r = await fetch(`${B}/api/v1/clean`, { method: 'POST', headers: { Authorization: `Bearer ${ckey}` }, body: new Uint8Array(10e6 + 1) }).catch((e) => ({ status: e.cause?.code }))
assert.equal(r.status, 413); ok('an upload over the plan\'s size is refused')
const codes = (await Promise.all(Array.from({ length: 60 }, () => clean(ckey)))).map((x) => x.status)
assert.equal(codes.filter((x) => x === 200).length, 50, `60 parallel calls on 50 files: ${codes.join(',')}`); assert.equal(codes.filter((x) => x === 402).length, 10)
assert.equal((await (await fetch(`${B}/api/v1/usage`, { headers: { Authorization: `Bearer ${ckey}` } })).json()).used, 50); ok('60 parallel cleans on a 50-file key: exactly 50 go through')

assert.equal((await acct(a, 'POST', '/api/auth/signout')).status, 200)
assert.equal(await me(a), null); assert.equal((await acct(a, 'POST', '/api/keys', {})).status, 401); ok('signed out')
console.log(`all ${n} passed`)
stub.close()
