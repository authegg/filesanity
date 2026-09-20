// Renders every route to dist/<route>/index.html with its own title and
// description, writes sitemap.xml and robots.txt, and guards the copy.
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const SITE = 'https://filesanity.com' // CLIENT: placeholder until the domain is confirmed
const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const { render, routes, posts, FAQ, SOURCE } = await import(new URL('server/entry-server.js', `file://${dist}`))
const shell = readFileSync(`${dist}index.html`, 'utf8')
if (!shell.includes('<!--app-html-->')) throw new Error('prerender: <!--app-html--> missing')

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const pages = []
const post = (path) => posts.find((p) => path === `/blog/${p.slug}`)
const org = { '@type': 'Organization', '@id': `${SITE}/#org`, name: 'FileSanity', url: SITE, logo: `${SITE}/icons/icon-512.png` }
const crumbs = (list) => ({ '@type': 'BreadcrumbList', itemListElement: list.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE}${url}` })) })
// Structured data per page, written here so none of it reaches the client bundle.
const ld = (path, title, description) => {
  const url = `${SITE}${path}`
  if (path === '/') return [org,
    { '@type': 'WebSite', '@id': `${SITE}/#site`, name: 'FileSanity', url: SITE, publisher: { '@id': `${SITE}/#org` } },
    { '@type': 'SoftwareApplication', name: 'FileSanity', url: SITE, description, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (web browser)', browserRequirements: 'Requires JavaScript', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@id': `${SITE}/#org` } }]
  const p = post(path)
  if (p) return [
    { '@type': 'BlogPosting', headline: p.title, description: p.description, datePublished: p.date, dateModified: p.updated ?? p.date, url, mainEntityOfPage: url, image: `${SITE}/img/blog/${p.image.name}.avif`, author: org, publisher: org, isPartOf: { '@id': `${SITE}/blog#blog` } },
    crumbs([['Home', '/'], ['Blog', '/blog'], [p.title, path]])]
  if (path === '/blog') return [
    { '@type': 'Blog', '@id': `${SITE}/blog#blog`, name: 'FileSanity blog', url, description, publisher: { '@id': `${SITE}/#org` } },
    { '@type': 'ItemList', itemListElement: posts.map((q, i) => ({ '@type': 'ListItem', position: i + 1, name: q.title, url: `${SITE}/blog/${q.slug}` })) },
    crumbs([['Home', '/'], [short(title), path]])]
  if (path === '/faq') return [
    { '@type': 'FAQPage', mainEntity: FAQ.flatMap((g) => g.items).map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    crumbs([['Home', '/'], [short(title), path]])]
  return [crumbs([['Home', '/'], [short(title), path]])]
}
const short = (title) => title.split(':')[0] // the crumb is the page's name, not its whole title
// Everything per page that the shell cannot carry: og:type, article dates, the feed link, noindex on the 404, JSON-LD.
const head = (path, title, description) => {
  const p = post(path)
  const graph = ld(path, title, description)
  return [
    p ? `<meta property="og:type" content="article" />\n<meta property="article:published_time" content="${p.date}" />\n<meta property="article:modified_time" content="${p.updated ?? p.date}" />` : '<meta property="og:type" content="website" />',
    path.startsWith('/blog') ? `<link rel="alternate" type="application/rss+xml" title="FileSanity blog" href="${SITE}/blog/feed.xml" />` : '',
    path === '/404' ? '<meta name="robots" content="noindex" />' : '',
    path === '/404' ? '' : `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('</', '<\\/')}</script>`,
  ].filter(Boolean).join('\n')
}
// Last commit of the page's source, for the sitemap; posts carry their own dates.
const git = (file) => { try { return execSync(`git log -1 --format=%cI -- ${file}`, { encoding: 'utf8' }).trim().slice(0, 10) } catch { return '' } }
const today = new Date().toISOString().slice(0, 10)
const lastmod = (path) => {
  const p = post(path)
  if (p) return p.updated ?? p.date
  const name = path === '/' ? 'Home' : path.slice(1).replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())
  return git(`src/pages/${name}.tsx`) || today
}
for (const path of routes) {
  const { html, title: raw, description } = render(path)
  const title = raw.includes('FileSanity') ? raw : `${raw} | FileSanity`
  const url = path === '/404' ? `${SITE}/404` : `${SITE}${path === '/' ? '/' : path}`
  const out = shell
    .replaceAll('<!--title-->', esc(title))
    .replaceAll('<!--description-->', esc(description))
    .replaceAll('<!--url-->', url)
    .replace('<!--app-html-->', html)
    .replace('<!--head-->', head(path, raw, description))
  if (/[\u2013\u2014]/.test(out)) throw new Error(`prerender: em or en dash in ${path}`)
  // Both /faq/index.html and /faq.html, so every static host and vite preview serve /faq.
  if (path === '/') writeFileSync(`${dist}index.html`, out)
  else if (path === '/404') writeFileSync(`${dist}404.html`, out)
  else {
    mkdirSync(`${dist}${path.slice(1)}`, { recursive: true })
    writeFileSync(`${dist}${path.slice(1)}/index.html`, out)
    writeFileSync(`${dist}${path.slice(1)}.html`, out)
  }
  if (path !== '/404') pages.push([url, lastmod(path)])
  console.log(`prerendered ${path} (${(out.length / 1024).toFixed(1)} kB)`)
}
writeFileSync(`${dist}sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(([u, m]) => `  <url><loc>${u}</loc><lastmod>${m}</lastmod></url>`).join('\n')}\n</urlset>\n`)
const rfc = (iso) => new Date(`${iso}T00:00:00Z`).toUTCString()
const items = posts.map((p) => `  <item>\n    <title>${esc(p.title)}</title>\n    <link>${SITE}/blog/${p.slug}</link>\n    <guid>${SITE}/blog/${p.slug}</guid>\n    <pubDate>${rfc(p.date)}</pubDate>\n    <description>${esc(p.description)}</description>\n  </item>`).join('\n')
writeFileSync(`${dist}blog/feed.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n  <title>FileSanity blog</title>\n  <link>${SITE}/blog</link>\n  <description>Notes on the metadata inside photographs, Office documents and PDFs, and how FileSanity removes it in the browser.</description>\n  <language>en-gb</language>\n  <atom:link href="${SITE}/blog/feed.xml" rel="self" type="application/rss+xml" />\n${items}\n</channel>\n</rss>\n`)
console.log(`feed ${posts.length} posts`)
writeFileSync(`${dist}robots.txt`, `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`)
// The parsers, published as plain text at /source/ (a .txt suffix so every static host serves them as text, not video/mp2t).
const lib = fileURLToPath(new URL('../src/lib/', import.meta.url))
mkdirSync(`${dist}source`, { recursive: true })
const files = readdirSync(lib).filter((f) => f.endsWith('.ts')).sort()
const listed = SOURCE.map(([f]) => f).sort()
if (files.join() !== listed.join()) throw new Error(`prerender: src/lib has ${files.join(', ')} but src/pages/Source.tsx lists ${listed.join(', ')}`)
for (const f of files) writeFileSync(`${dist}source/${f}.txt`, readFileSync(`${lib}${f}`))
rmSync(`${dist}server`, { recursive: true, force: true })
