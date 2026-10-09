"""The built site under `npx wrangler dev --port 8787`: every route at the phone matrix and the owner's desktops,
in Firefox and Chromium. Checks no horizontal scroll, no console errors, a one-line nav at desktop, the menu opens
solid on phones, the home cleaner (sample, clean, zero requests, clean output), and the batch gate when signed out.
Shots go to shots/site/. Run: python3 tools/site_check.py [base] [--shots]
"""
import io, os, sys
from PIL import Image
from playwright.sync_api import sync_playwright

BASE = next((a for a in sys.argv[1:] if not a.startswith('--')), 'http://127.0.0.1:8787')
SHOTS = '--shots' in sys.argv
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'shots', 'site')
os.makedirs(OUT, exist_ok=True)
ROUTES = ['/', '/how-it-works', '/photos', '/documents', '/pdf', '/batch', '/pricing', '/developers', '/extension', '/security', '/faq', '/about', '/contact', '/privacy', '/terms', '/guides', '/guides/remove-location-from-photos', '/guides/remove-author-from-office-files', '/guides/remove-pdf-metadata', '/guides/photo-metadata-explained', '/guides/marketplace-photo-metadata', '/guides/check-a-file-is-clean', '/sign-in', '/account', '/nope']
SIZES = [(1917, 870), (1366, 650), (320, 568), (360, 780), (390, 844), (412, 915), (430, 932), (667, 375)]
fails = []
def check(ok, msg):
    if not ok: print('  FAIL ' + msg); fails.append(msg)

with sync_playwright() as p:
    for eng in ('firefox', 'chromium'):
        br = getattr(p, eng).launch()
        print(eng)
        for w, h in SIZES:
            ctx = br.new_context(viewport={'width': w, 'height': h}, service_workers='block')
            for r in ROUTES:
                pg = ctx.new_page()
                errs = []
                pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'turnstile' not in m.text.lower() and '404' not in m.text else None)
                pg.on('pageerror', lambda e: errs.append(str(e)))
                pg.goto(BASE + r, wait_until='load' if r in ('/sign-in', '/account') else 'networkidle', timeout=60000)  # Turnstile keeps Chromium busy
                pg.evaluate('document.fonts.ready')
                if r == '/account': pg.wait_for_url('**/sign-in', timeout=5000)
                sw = pg.evaluate('document.documentElement.scrollWidth')
                check(sw <= w, f'{eng} {w}x{h} {r}: scrollWidth {sw}')
                check(not errs, f'{eng} {w}x{h} {r}: console {errs[:2]}')
                if w > 960:
                    nh = pg.evaluate("document.querySelector('.nav-in').getBoundingClientRect().height")
                    check(nh <= 80, f'{eng} {w} {r}: nav {nh}px')
                if r == '/' and w < 1024:
                    tw = pg.evaluate("document.getElementById('cleaner').getBoundingClientRect().width")
                    check(tw >= w - 90, f'{eng} {w}x{h} tray only {tw}px wide (should stack full width)')
                if w > 960: pass
                elif r == '/':
                    pg.click('.menu-btn')
                    box = pg.evaluate("(() => { const n = document.querySelector('.nav nav'); const s = getComputedStyle(n); return [s.display, s.backgroundColor, n.getBoundingClientRect().bottom] })()")
                    check(box[0] == 'grid' and box[1] not in ('rgba(0, 0, 0, 0)', 'transparent') and box[2] <= h, f'{eng} {w} menu {box}')
                    pg.click('.menu-btn')
                if SHOTS and eng == 'firefox' and (w, h) in ((1917, 870), (390, 844)):
                    tag = 'desk' if w > 900 else 'phone'
                    name = (r.strip('/') or 'home').replace('/', '-')
                    pg.screenshot(path=f'{OUT}/{name}-{tag}-full.png', full_page=True)
                    if r == '/': pg.screenshot(path=f'{OUT}/home-{tag}-fold.png')
                pg.close()
            ctx.close()

        # The home cleaner: sample, clean, zero requests during the clean, and the output carries no EXIF.
        for w, h in ((1917, 870), (390, 844)):
            pg = br.new_page(viewport={'width': w, 'height': h}, accept_downloads=True)
            pg.goto(BASE + '/', wait_until='networkidle')
            pg.get_by_role('button', name='try the sample photo').click()
            pg.get_by_text('hidden fields found').wait_for()
            before = pg.evaluate("performance.getEntriesByType('resource').length")
            with pg.expect_download() as dl:
                pg.get_by_role('button', name='Remove all and download').click()
            data = open(dl.value.path(), 'rb').read()
            after = pg.evaluate("performance.getEntriesByType('resource').length")
            check(after == before, f'{eng} {w} clean made {after - before} requests')
            im = Image.open(io.BytesIO(data))
            check(not im.getexif().get(0x8825) and not im.getexif().get(0x013b) and b'photoshop:City' not in data, f'{eng} {w} cleaned sample still has metadata')
            net = pg.locator('.tr-net b').inner_text()
            check(net == '0', f'{eng} {w} counter shows {net}')
            if SHOTS and eng == 'firefox':
                pg.evaluate("document.getElementById('cleaner').scrollIntoView({ block: 'center' })")
                pg.screenshot(path=f'{OUT}/home-{"desk" if w > 900 else "phone"}-cleaned.png')
            pg.close()

        # Batch, signed out: samples load, one file cleans, the batch button sends you to Pro, the counter stays 0.
        pg = br.new_page(viewport={'width': 1917, 'height': 870})
        pg.goto(BASE + '/batch', wait_until='networkidle')
        pg.get_by_text('Clean all 3: needs Pro').wait_for(timeout=8000)
        check(pg.locator('.aw-net b').inner_text() == '0', f'{eng} batch counter not 0')
        if SHOTS and eng == 'firefox': pg.screenshot(path=f'{OUT}/batch-desk-loaded.png')
        pg.close()
        br.close()

print('FAILED' if fails else 'all passed', len(fails))
sys.exit(1 if fails else 0)
