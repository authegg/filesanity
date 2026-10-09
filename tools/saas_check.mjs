// End-to-end check of the account API against `npx wrangler dev --port 8787` (DEV_LINKS=1 and the test secrets in .dev.vars).
// node tools/saas_check.mjs [base]
import { readFileSync } from 'node:fs'
import { createHmac, webcrypto as crypto } from 'node:crypto'
import assert from 'node:assert/strict'

const B = process.argv[2] ?? 'http://127.0.0.1:8787'
const vars = Object.fromEntries(readFileSync('.dev.vars', 'utf8').trim().split('\n').map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
const O = { Origin: B }
const run = Date.now().toString(36)
const A = `owner-${run}@example.com`, M = `member-${run}@example.com`
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
  r = await fetch(link, { redirect: 'manual' })
  assert.equal(r.status, 303); assert.equal(r.headers.get('location'), '/account')
  const cookie = r.headers.get('set-cookie').split(';')[0]
  assert.match(r.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/)
  r = await fetch(link, { redirect: 'manual' })
  assert.match(r.headers.get('location'), /expired=1/, 'a link works once')
  return cookie
}
const me = async (c) => (await fetch(`${B}/api/me`, { headers: { Cookie: c } })).json()
const acct = (c, method, path, body) => fetch(`${B}${path}`, { method, headers: { Cookie: c, ...O, 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) })
const hook = (event, variant, email, status = 'active', secret = vars.LS_WEBHOOK_SECRET) => {
  const raw = JSON.stringify({ meta: { event_name: event, custom_data: { email } }, data: { attributes: { variant_id: Number(variant), status, user_email: 'receipt@example.com', renews_at: '2026-11-08T00:00:00Z', ends_at: null, urls: { customer_portal: 'https://filesanity.lemonsqueezy.com/billing' } } } })
  return fetch(`${B}/api/webhooks/lemonsqueezy`, { method: 'POST', headers: { 'X-Signature': createHmac('sha256', secret).update(raw).digest('hex') }, body: raw })
}
const photo = readFileSync('tests/files/photo.jpg')
const ext = (t) => fetch(`${B}/api/ext/me`, { headers: { Authorization: `Bearer ${t}`, Origin: 'chrome-extension://abc' } })
const clean = (key, q = '') => { const f = new FormData(); f.append('file', new Blob([photo]), 'photo.jpg'); return fetch(`${B}/api/v1/clean${q}`, { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: f }) }

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

assert.equal((await hook('subscription_created', vars.LS_VARIANT_API, A, 'active', 'wrong')).status, 401); ok('webhook with a bad signature refused')
assert.equal((await hook('subscription_created', vars.LS_VARIANT_API, A)).status, 200)
m = await me(a); assert.equal(m.plan, 'api'); assert.equal(m.quota, 50000); assert.ok(m.portal); ok('webhook moves the account to API')

r = await clean(key, '?report=1'); assert.equal(r.status, 200)
const report = Buffer.from(r.headers.get('x-filesanity-report'), 'base64'), sig = Buffer.from(r.headers.get('x-filesanity-report-signature'), 'base64')
const out = Buffer.from(await r.arrayBuffer())
const jwk = await (await fetch(`${B}/api/report-key`)).json()
const pub = await crypto.subtle.importKey('jwk', jwk, { name: 'Ed25519' }, false, ['verify'])
assert.ok(await crypto.subtle.verify('Ed25519', pub, sig, report), 'signature verifies')
assert.equal(JSON.parse(report).sha256_out, Buffer.from(await crypto.subtle.digest('SHA-256', out)).toString('hex')); ok('signed report verifies and matches the clean file')

assert.equal((await acct(a, 'POST', '/api/team', { email: M })).status, 403); ok('team needs the Team plan')
await hook('subscription_updated', vars.LS_VARIANT_TEAM, A)
assert.equal((await acct(a, 'PUT', '/api/policy', { keep: ['exif', 'bogus'] })).status, 200)
r = await acct(a, 'POST', '/api/team', { email: M }); assert.deepEqual((await r.json()).team, [M])
assert.deepEqual(await (await ext(tok)).json(), { plan: 'team', policy: ['exif'] }); ok('extension token follows the plan and the saved policy')
assert.equal((await acct(a, 'DELETE', `/api/keys/${tokId}`)).status, 200); assert.equal((await ext(tok)).status, 401); ok('revoked extension token refused')
const b = await signIn(M); m = await me(b); assert.equal(m.plan, 'team'); assert.equal(m.via, A); assert.deepEqual(m.keep, ['exif']); ok('member gets Team and the owner\'s policy (unknown keys dropped)')
assert.equal((await acct(b, 'PUT', '/api/policy', { keep: [] })).status, 403); ok('member cannot change the team policy')
await acct(a, 'DELETE', `/api/team/${encodeURIComponent(M)}`); m = await me(b); assert.equal(m.plan, 'free'); ok('removed member drops to free')

assert.equal((await acct(a, 'DELETE', `/api/keys/${id}`)).status, 200)
assert.equal((await clean(key)).status, 401); ok('revoked key refused')
await hook('subscription_expired', vars.LS_VARIANT_TEAM, A, 'expired'); m = await me(a); assert.equal(m.plan, 'free'); ok('expired subscription drops to free')

assert.equal((await acct(a, 'POST', '/api/auth/signout')).status, 200)
assert.equal(await me(a), null); assert.equal((await acct(a, 'POST', '/api/keys', {})).status, 401); ok('signed out')
console.log(`all ${n} passed`)
