"""SEO check of the built site as the host serves it: every URL in sitemap.xml
plus a missing page and /faq.html. One h1, a title, a description, a canonical, an
og:image, JSON-LD that parses, and no CSP violation in the console
(Chromium only: Firefox does not pass CSP reports to Playwright).

Needs the built site served with its _headers: npx wrangler dev --port 4188
Usage: python3 tools/seo_check.py [http://127.0.0.1:4188] [firefox]
"""
import json
import re
import sys
import urllib.request

from playwright.sync_api import sync_playwright

URL = next((a for a in sys.argv[1:] if a.startswith('http')), 'http://127.0.0.1:4188').rstrip('/')
SITE = 'https://filesanity.com'
fails = []


def check(ok, msg):
    print(('  ok   ' if ok else '  FAIL ') + msg)
    if not ok:
        fails.append(msg)


sitemap = urllib.request.urlopen(f'{URL}/sitemap.xml').read().decode()
locs = re.findall(r'<loc>(.*?)</loc>', sitemap)
check(all(l.startswith(SITE) for l in locs), f'sitemap: {len(locs)} URLs, all on {SITE}')
check(not any('//www.' in l or l.endswith('/404') or l.endswith('.html') for l in locs), 'sitemap: no www, no 404, no .html twins')
check(len(re.findall(r'<lastmod>\d{4}-\d\d-\d\d</lastmod>', sitemap)) == len(locs), 'sitemap: a lastmod on every URL')
paths = [l[len(SITE):] or '/' for l in locs] + ['/no-such-page', '/faq.html']

with sync_playwright() as p:
    b = (p.firefox if 'firefox' in sys.argv else p.chromium).launch()
    page = b.new_page()
    console = []
    page.on('console', lambda m: console.append(m.text))
    seen = set()
    for path in paths:
        console.clear()
        res = page.goto(f'{URL}{path}', wait_until='networkidle')
        print(path, res.status)
        want = 404 if path == '/no-such-page' else 200
        check(res.status == want, f'{path}: status {res.status}')
        if path == '/faq.html':
            check(page.url.endswith('/faq'), f'{path}: redirected to {page.url}')
            continue
        h = res.headers
        check('nosniff' in h.get('x-content-type-options', ''), f'{path}: X-Content-Type-Options')
        check("script-src 'self'" in h.get('content-security-policy', ''), f'{path}: CSP present')
        check(page.locator('h1').count() == 1, f'{path}: one h1')
        title = page.title()
        check(10 <= len(title) <= 70, f'{path}: title {len(title)} chars: {title!r}')
        check(title not in seen, f'{path}: title unique')
        seen.add(title)
        desc = page.get_attribute('meta[name=description]', 'content') or ''
        check(50 <= len(desc) <= 160, f'{path}: description {len(desc)} chars')
        canon = page.get_attribute('link[rel=canonical]', 'href')
        check(canon == f'{SITE}{"/404" if path == "/no-such-page" else path}', f'{path}: canonical {canon}')
        check(page.get_attribute('meta[property="og:image"]', 'content') == f'{SITE}/og.png', f'{path}: og:image')
        check(page.get_attribute('meta[name="twitter:card"]', 'content') == 'summary_large_image', f'{path}: twitter:card')
        ogtype = page.get_attribute('meta[property="og:type"]', 'content')
        check(ogtype == ('article' if path.startswith('/blog/') else 'website'), f'{path}: og:type {ogtype}')
        check((page.locator('link[type="application/rss+xml"]').count() == 1) == path.startswith('/blog'), f'{path}: RSS link only on blog pages')
        if path == '/no-such-page':
            check(page.get_attribute('meta[name=robots]', 'content') == 'noindex', f'{path}: noindex')
        else:
            lds = page.locator('script[type="application/ld+json"]').all_text_contents()
            check(len(lds) == 1, f'{path}: one JSON-LD block')
            try:
                graph = json.loads(lds[0])['@graph']
                types = [g['@type'] for g in graph]
                check(all(re.match(r'\d{4}-\d\d-\d\d', g[k]) for g in graph for k in ('datePublished', 'dateModified') if k in g), f'{path}: ISO dates')
                check(all(v.startswith(SITE) for g in graph for k, v in g.items() if k in ('url', 'item', 'mainEntityOfPage', 'image', 'logo')), f'{path}: absolute URLs')
                check(bool(types), f'{path}: JSON-LD {types}')
            except (ValueError, KeyError) as e:
                check(False, f'{path}: JSON-LD parse: {e}')
        # Every image has alt text; every anchor has text.
        check(page.locator('img:not([alt])').count() == 0, f'{path}: img alt')
        empty = [a for a in page.locator('a[href]').all_inner_texts() if not a.strip()]
        labelled = page.locator('a[href][aria-label]').count()
        check(len(empty) <= labelled, f'{path}: no empty link text')
        csp = [m for m in console if 'Content Security Policy' in m or 'CSP' in m]
        check(not csp, f'{path}: CSP violations {csp[:2]}')
    b.close()

print(f'\n{len(fails)} failures')
for f in fails:
    print(' ', f)
sys.exit(1 if fails else 0)
