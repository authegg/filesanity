// Renders every route to dist/<route>/index.html with its own title and
// description, writes sitemap.xml and robots.txt, and guards the copy.
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const SITE = 'https://filesanity.com' // CLIENT: placeholder until the domain is confirmed
const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const { render, routes } = await import(new URL('server/entry-server.js', `file://${dist}`))
const shell = readFileSync(`${dist}index.html`, 'utf8')
if (!shell.includes('<!--app-html-->')) throw new Error('prerender: <!--app-html--> missing')

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const pages = []
for (const path of routes) {
  const { html, title, description } = render(path)
  const url = path === '/404' ? `${SITE}/404` : `${SITE}${path === '/' ? '/' : path}`
  const out = shell
    .replaceAll('<!--title-->', esc(title))
    .replaceAll('<!--description-->', esc(description))
    .replaceAll('<!--url-->', url)
    .replace('<!--app-html-->', html)
  if (/[–—]/.test(out)) throw new Error(`prerender: em or en dash in ${path}`)
  // Both /faq/index.html and /faq.html, so every static host and vite preview serve /faq.
  if (path === '/') writeFileSync(`${dist}index.html`, out)
  else if (path === '/404') writeFileSync(`${dist}404.html`, out)
  else {
    mkdirSync(`${dist}${path.slice(1)}`, { recursive: true })
    writeFileSync(`${dist}${path.slice(1)}/index.html`, out)
    writeFileSync(`${dist}${path.slice(1)}.html`, out)
  }
  if (path !== '/404') pages.push(url)
  console.log(`prerendered ${path} (${(out.length / 1024).toFixed(1)} kB)`)
}
writeFileSync(`${dist}sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`)
writeFileSync(`${dist}robots.txt`, `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`)
// The parsers, published as plain text at /source/ (a .txt suffix so every static host serves them as text, not video/mp2t).
const lib = fileURLToPath(new URL('../src/lib/', import.meta.url))
mkdirSync(`${dist}source`, { recursive: true })
const files = readdirSync(lib).filter((f) => f.endsWith('.ts')).sort()
for (const f of files) writeFileSync(`${dist}source/${f}.txt`, readFileSync(`${lib}${f}`))
const list = files.map((f) => `<li><a href="/source/${f}.txt">${f}</a></li>`).join('\n')
writeFileSync(`${dist}source/index.html`, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>FileSanity source: the parsers</title><meta name="description" content="The metadata parsers FileSanity runs in your browser, as plain text."><link rel="icon" href="/favicon.svg"><style>body{font:16px/1.6 system-ui,sans-serif;max-width:60ch;margin:3rem auto;padding:0 1rem;color:#18181b;background:#f1f1ef}a{color:#8c2f2a}</style></head><body><h1>The parsers</h1><p>These are the files that read and remove metadata, exactly as they are compiled into the site. The shipped script also carries a source map, so the browser's developer tools show them under <code>src/lib</code>.</p><ul>${list}</ul><p><a href="/">Back to FileSanity</a></p></body></html>`)
rmSync(`${dist}server`, { recursive: true, force: true })
