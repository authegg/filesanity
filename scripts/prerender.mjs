// Renders every route to dist/<route>/index.html with its own title and
// description, writes sitemap.xml and robots.txt, and guards the copy.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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
rmSync(`${dist}server`, { recursive: true, force: true })
