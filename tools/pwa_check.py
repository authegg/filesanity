"""Installable and offline: the manifest and worker are served, the worker
activates on the home page, and with the network cut / and /pricing still
render from the cache, as does an uncached path via the 404 page.

Needs the built site served: npx wrangler dev --port 4187  (or npx vite preview --port 4187)
Run: python3 tools/pwa_check.py [url]
"""
import sys

from playwright.sync_api import sync_playwright

URL = next((a for a in sys.argv[1:] if a.startswith('http')), 'http://127.0.0.1:4187/').rstrip('/')
failures = []


def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond:
        failures.append(msg)


with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context()
    page = ctx.new_page()
    page.goto(URL + '/', wait_until='load')
    m = page.evaluate("fetch('/manifest.webmanifest').then(r => r.json())")
    check(m.get('name') == 'FileSanity' and m.get('display') == 'standalone' and len(m.get('icons', [])) == 3, f'manifest served ({m.get("name")}, {m.get("display")}, {len(m.get("icons", []))} icons)')
    check(page.evaluate("document.querySelector('link[rel=manifest]')?.getAttribute('href')") == '/manifest.webmanifest', 'manifest linked')
    state = page.evaluate("navigator.serviceWorker.ready.then(r => new Promise(res => { const w = r.active; if (w.state === 'activated') return res(w.state); w.addEventListener('statechange', () => w.state === 'activated' && res(w.state)) }))")
    check(state == 'activated', f'worker activated ({state})')
    # Wait until the precache is complete: the worker's cache holds every listed file.
    n = page.evaluate("""async () => { for (let i = 0; i < 100; i++) { const ks = await caches.keys(); const c = ks.length && await caches.open(ks[0]); const l = c ? (await c.keys()).length : 0; if (l >= 31) return l; await new Promise(r => setTimeout(r, 100)) } return -1 }""")
    check(n >= 31, f'precache holds {n} files')
    icons = page.evaluate("Promise.all(['/icons/icon-192.png','/icons/icon-512.png','/icons/maskable-512.png','/icons/apple-touch-icon.png'].map(u => fetch(u).then(r => r.ok && r.headers.get('content-type'))))")
    check(all(t == 'image/png' for t in icons), f'icons served as png ({icons})')
    ctx.set_offline(True)
    for path, want in (('/', 'The file never leaves your browser'), ('/pricing', 'Pricing')):
        page.goto(URL + path, wait_until='load')
        t = page.title()
        check(bool(t) and want.lower() in page.content().lower(), f'offline {path}: title {t!r}')
        check(page.evaluate("document.styleSheets.length > 0 && document.fonts.check('16px \"Geist Variable\"')"), f'offline {path}: stylesheet and font applied')
    page.reload(wait_until='load')
    check('Pricing' in page.title(), 'offline reload mid-site keeps the page')
    page.goto(URL + '/nope', wait_until='load')
    check('404' in page.title() or 'not found' in page.title().lower(), f'offline unknown path falls back to the 404 page ({page.title()!r})')
    ctx.set_offline(False)
    b.close()

print('\nFAILED' if failures else '\nALL PASS', len(failures))
sys.exit(1 if failures else 0)
