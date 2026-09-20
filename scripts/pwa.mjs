// Runs after prerender: walks dist/, lists the site's own files and writes dist/sw.js
// with that list and a version hashed from their contents. Hand-written worker, no library.
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
// Not precached: source maps, the worker itself, crawler files, the host's _headers and _redirects, the published parser text,
// the social image, and the <route>.html twins (the /<route> form is the one the browser asks for).
const skip = (p) => /\.map$|^sw\.js$|^sitemap\.xml$|^robots\.txt$|^_|^source\/.*\.txt$|^og\.png$|^server\/|\.(mjs|zip|md|jsonc)$/.test(p) || (p.endsWith('.html') && p !== '404.html' && !p.endsWith('index.html'))
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}${e.name}/`) : `${d}${e.name}`))
// Route URLs as the browser asks for them; never the .html form, which hosts redirect and Chrome then refuses for a navigation.
const url = (p) => (p === 'index.html' ? '/' : p.endsWith('/index.html') ? `/${p.slice(0, -11)}` : p === '404.html' ? '/404' : `/${p}`)

const files = walk(dist).map((f) => f.slice(dist.length)).filter((p) => !skip(p)).sort()
const list = files.map(url)
const hash = createHash('sha256')
for (const f of files) hash.update(url(f)).update(readFileSync(`${dist}${f}`))
const version = hash.digest('hex').slice(0, 10)

const sw = `// FileSanity offline worker. Precaches the site's own files; touches nothing else.
const V = 'fs-${version}', P = ${JSON.stringify(list)}
const has = new Set(P)
const key = (u) => u.pathname.replace(/\\/index\\.html$/, '').replace(/\\/+$/, '') || '/'
addEventListener('install', (e) => e.waitUntil(caches.open(V).then((c) => c.addAll(P.map((u) => new Request(u, { cache: 'no-cache' })))).then(() => skipWaiting())))
addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => clients.claim())))
addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url)
  if (r.method !== 'GET' || u.origin !== location.origin) return
  const k = key(u)
  if (r.mode === 'navigate') {
    // Network first, so an edited page shows on the next load; the cached page within 3 s if the network is slow or gone, 404 when neither exists.
    e.respondWith(caches.open(V).then(async (c) => {
      const net = fetch(r).then((res) => { if (res.ok && has.has(k)) c.put(k, res.clone()); return res }).catch(() => null)
      const slow = new Promise((ok) => setTimeout(() => ok(null), 3000))
      return (await Promise.race([net, slow])) || (await c.match(k)) || (await net) || c.match('/404')
    }))
  } else if (has.has(k)) e.respondWith(caches.match(k).then((hit) => hit || fetch(r)))
})
`
writeFileSync(`${dist}sw.js`, sw)
console.log(`sw.js: ${list.length} files precached, version ${version}, ${sw.length} bytes`)
