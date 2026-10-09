// Renders every route to dist/<route>/index.html with its own title, description and JSON-LD, then writes
// sitemap.xml and robots.txt. Fails the build on an em or en dash in shipped copy.
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE = 'https://filesanity.com'
const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const { render, routes, FAQ, GUIDES, GUIDES_CHECKED } = await import(new URL('server/entry-server.js', `file://${dist}`))
const shell = readFileSync(`${dist}index.html`, 'utf8')
if (!shell.includes('<!--app-html-->')) throw new Error('prerender: <!--app-html--> missing')

// Preload the Latin display face so the first paint is already in Archivo (no swap, no shift).
const font = readdirSync(`${dist}assets`).find((f) => /^archivo-latin-standard-normal-.*\.woff2$/.test(f))
if (!font) throw new Error('prerender: Archivo latin woff2 not found')
const preload = `<link rel="preload" href="/assets/${font}" as="font" type="font/woff2" crossorigin />`
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const org = { '@type': 'Organization', '@id': `${SITE}/#org`, name: 'FileSanity', url: SITE, logo: `${SITE}/icons/icon-512.png` }
const crumbs = (name, path) => ({ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name, item: `${SITE}${path}` }] })
const ld = (path, title, description) => {
  if (path === '/') return [org, { '@type': 'WebSite', '@id': `${SITE}/#site`, name: 'FileSanity', url: SITE, publisher: { '@id': `${SITE}/#org` } },
    { '@type': 'SoftwareApplication', name: 'FileSanity', url: SITE, description, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (web browser)', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@id': `${SITE}/#org` } }]
  if (path === '/faq') return [{ '@type': 'FAQPage', mainEntity: FAQ.flatMap((g) => g.items).map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }, crumbs('FAQ', path)]
  const guide = GUIDES.find((g) => path === `/guides/${g.slug}`)
  if (guide) {
    const iso = new Date(`${GUIDES_CHECKED} UTC`).toISOString().slice(0, 10)
    const trail = crumbs('Guides', '/guides')
    trail.itemListElement.push({ '@type': 'ListItem', position: 3, name: title, item: `${SITE}${path}` })
    return [{ '@type': 'Article', headline: title, description, url: `${SITE}${path}`, mainEntityOfPage: `${SITE}${path}`, datePublished: iso, dateModified: iso, inLanguage: 'en', author: org, publisher: org }, trail]
  }
  return [crumbs(title.split(':')[0], path)]
}
const today = new Date().toISOString().slice(0, 10)
const pages = []
for (const path of routes) {
  const { html, title: raw, description, index } = render(path)
  const title = raw.includes('FileSanity') ? raw : `${raw} | FileSanity`
  const url = `${SITE}${path}`
  const head = index
    ? `<meta property="og:type" content="website" />\n<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': ld(path, raw, description) }).replaceAll('</', '<\\/')}</script>`
    : '<meta name="robots" content="noindex" />'
  const out = shell.replaceAll('<!--title-->', esc(title)).replaceAll('<!--description-->', esc(description)).replaceAll('<!--url-->', url)
    .replace('<!--app-html-->', html).replace('<!--head-->', `${preload}\n${head}`)
  if (/[–—]/.test(out)) throw new Error(`prerender: em or en dash in ${path}`)
  if (path === '/') writeFileSync(`${dist}index.html`, out)
  else if (path === '/404') writeFileSync(`${dist}404.html`, out)
  else { mkdirSync(dirname(`${dist}${path.slice(1)}`), { recursive: true }); writeFileSync(`${dist}${path.slice(1)}.html`, out) } // served at /pricing, no trailing slash, by auto-trailing-slash
  if (index) pages.push(url)
  console.log(`prerendered ${path} (${(out.length / 1024).toFixed(1)} kB)`)
}
writeFileSync(`${dist}sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`)
writeFileSync(`${dist}robots.txt`, `User-agent: *\nAllow: /\nDisallow: /account\nDisallow: /sign-in\nDisallow: /api/\nSitemap: ${SITE}/sitemap.xml\n`)
rmSync(`${dist}server`, { recursive: true, force: true })
