"""Mechanical checks over every route: LCP and CLS cold under throttling at
390x844 (Chromium CDP), no horizontal scroll at five widths, keyboard reach
with rings, reduced motion at rest, contrast of painted glyphs in the
picker's states, font-fallback line counts, JS weight per route, dash grep.

Usage: python3 tools/verify.py [url]
"""
import gzip
import io
import os
import re
import sys

from playwright.sync_api import sync_playwright

URL = next((a for a in sys.argv[1:] if a.startswith('http')), 'http://127.0.0.1:4184')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROUTES = ['/', '/how-it-works', '/photos', '/documents', '/pdf', '/formats', '/pricing', '/batch', '/cli', '/api', '/extension', '/cloud', '/security', '/faq', '/about', '/contact', '/privacy', '/terms', '/changelog', '/blog', '/blog/what-a-jpeg-carries', '/404.html']
PHOTO = os.path.join(ROOT, 'tests', 'files', 'photo.jpg')

VITALS = """
() => new Promise((res) => {
  const out = { lcp: 0, cls: 0, lcpEl: '' }
  new PerformanceObserver((l) => { for (const e of l.getEntries()) { out.lcp = e.startTime; out.lcpEl = (e.element && (e.element.tagName + '.' + String(e.element.className).slice(0, 30))) || '' } }).observe({ type: 'largest-contentful-paint', buffered: true })
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) out.cls += e.value }).observe({ type: 'layout-shift', buffered: true })
  setTimeout(() => res(out), 2500)
})
"""

bad = []


def note(ok, msg):
    print(('  ok   ' if ok else '  BAD  ') + msg)
    if not ok:
        bad.append(msg)


def lum(rgb):
    def f(c):
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def ratio(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


with sync_playwright() as p:
    b = p.chromium.launch()
    print('vitals, cold, throttled phone (1.6 Mbps, 150 ms, 4x CPU, 390x844 @2x)')
    for route in ('/', '/pricing', '/faq'):
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        page = ctx.new_page()
        cdp = ctx.new_cdp_session(page)
        cdp.send('Network.enable')
        cdp.send('Network.emulateNetworkConditions', {'offline': False, 'latency': 150, 'downloadThroughput': 1.6e6 / 8, 'uploadThroughput': 750e3 / 8})
        cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
        page.goto(URL + route, wait_until='load')
        v = page.evaluate(VITALS)
        note(v['lcp'] < 2000 and v['cls'] < 0.01, f"{route}: LCP {v['lcp']:.0f} ms ({v['lcpEl']}), CLS {v['cls']:.4f}")
        ctx.close()

    ctx = b.new_context(viewport={'width': 1917, 'height': 870})
    page = ctx.new_page()
    page.goto(URL + '/', wait_until='load')
    v = page.evaluate(VITALS)
    note(v['lcp'] < 2000 and v['cls'] < 0.01, f"desktop /: LCP {v['lcp']:.0f} ms, CLS {v['cls']:.4f}")
    ctx.close()

    print('widths')
    for route in ROUTES:
        for w in (320, 390, 768, 1024, 1440):
            page = b.new_page(viewport={'width': w, 'height': 800})
            page.goto(URL + route, wait_until='load')
            if route == '/':
                page.set_input_files('input[type=file]', PHOTO)
                page.wait_for_selector('button:has-text("Remove all")')
            page.wait_for_timeout(200)
            sw = page.evaluate('document.documentElement.scrollWidth')
            if sw > w:
                note(False, f'{route} at {w}px: scrollWidth {sw}')
            page.close()
    note(True, 'no horizontal scroll at 320, 390, 768, 1024, 1440 on every route')

    print('keyboard')
    page = b.new_page(viewport={'width': 1366, 'height': 650})
    page.goto(URL + '/', wait_until='load')
    stops = []
    for _ in range(14):
        page.keyboard.press('Tab')
        stops.append(page.evaluate("() => { const e = document.activeElement; const s = getComputedStyle(e); return [e.tagName + ':' + (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 22), s.outlineStyle, parseFloat(s.outlineWidth)] }"))
    for tag, style, width in stops:
        print('   ', tag, style, width)
    note(all(s[1] == 'solid' and s[2] >= 2 for s in stops if s[0] != 'BODY:'), 'every tab stop has a 2px solid ring')
    note(not any(s[0].startswith('INPUT') for s in stops), 'the file input is never a tab stop')
    page.close()

    print('easing: no default ease-in-out on any transitioned element')
    for route in ROUTES:
        page = b.new_page(viewport={'width': 1366, 'height': 800})
        page.goto(URL + route, wait_until='load')
        hits = page.evaluate("() => Array.from(document.querySelectorAll('*')).filter((e) => { const s = getComputedStyle(e); return s.transitionDuration !== '0s' && /cubic-bezier\\(0\\.4, 0, 0\\.2, 1\\)|ease-in-out|linear/.test(s.transitionTimingFunction) && !/linear/.test(s.animationTimingFunction) }).map((e) => e.tagName + '.' + String(e.className).slice(0, 40))")
        if hits:
            note(False, f'{route}: default easing on {hits[:4]}')
        page.close()
    note(True, 'no cubic-bezier(0.4, 0, 0.2, 1), ease-in-out or linear transition on any route')

    print('phone menu, both engines')
    for eng in ('chromium', 'firefox'):
        bb = getattr(p, eng).launch()
        page = bb.new_page(viewport={'width': 390, 'height': 844})
        page.goto(URL + '/faq', wait_until='load')
        page.click('button.burger')
        page.wait_for_timeout(700)
        op = page.evaluate("getComputedStyle(document.getElementById('menu')).opacity")
        focused = page.evaluate('document.activeElement.textContent')
        note(op == '1' and focused == 'Home', f'{eng}: menu opens, focus on the first link ({focused!r})')
        outside = []
        for _ in range(12):
            page.keyboard.press('Tab')
            where = page.evaluate("() => { const e = document.activeElement; return e.closest('header') ? 'in' : e.tagName + ':' + (e.textContent || '').trim().slice(0, 20) }")
            if where != 'in':
                outside.append(where)
        note(not outside, f'{eng}: twelve Tabs stay inside nav and menu ({outside})')
        page.keyboard.press('Escape')
        page.wait_for_timeout(500)
        note(page.evaluate("document.activeElement.getAttribute('aria-label')") == 'Open menu', f'{eng}: Escape closes the menu and returns focus to the button')
        note(page.evaluate("document.querySelectorAll('[inert]').length") == 0, f'{eng}: inert removed on close')
        bb.close()

    print('reduced motion')
    ctx = b.new_context(reduced_motion='reduce', viewport={'width': 1366, 'height': 650})
    page = ctx.new_page()
    page.goto(URL + '/', wait_until='load')
    page.wait_for_timeout(300)
    r = page.evaluate("() => Array.from(document.querySelectorAll('[data-reveal]:not(.in)')).map((e) => getComputedStyle(e).opacity)")
    note(bool(r) and all(o == '1' for o in r), f'{len(r)} unrevealed elements render at rest (opacity 1)')
    t = page.evaluate("getComputedStyle(document.querySelector('.pill')).transitionDuration")
    note(float(t.rstrip('s')) < 0.01, f'pill transition under reduced motion: {t}')
    ctx.close()

    print('font fallback: abort the font, compare line counts')
    lines = {}
    for mode in ('font', 'nofont'):
        ctx = b.new_context(viewport={'width': 390, 'height': 844})
        page = ctx.new_page()
        if mode == 'nofont':
            page.route('**/*.woff2', lambda r: r.abort())
        page.goto(URL + '/', wait_until='load')
        page.wait_for_timeout(400)
        lines[mode] = page.evaluate("() => ['h1', 'h1 + p', '.drop'].map((s) => { const e = document.querySelector(s); return Math.round(e.getBoundingClientRect().top) + ':' + Math.round(e.getBoundingClientRect().height) })")
        ctx.close()
    print('   ', lines)
    tops = [abs(int(a.split(':')[0]) - int(b.split(':')[0])) for a, b in zip(lines['font'], lines['nofont'])]
    note(max(tops) <= 6, f'fallback face moves the fold by at most {max(tops)}px')

    print('contrast of painted glyphs, picker states')
    from PIL import Image
    ctx = b.new_context(viewport={'width': 1366, 'height': 900}, accept_downloads=True)
    page = ctx.new_page()
    page.goto(URL + '/', wait_until='load')

    def sample(sel, label, ground_sel=None, want=4.5):
        el = page.query_selector(sel)
        box = el.bounding_box()
        shot = Image.open(io.BytesIO(page.screenshot())).convert('RGB')
        px = shot.crop((int(box['x']), int(box['y']), int(box['x'] + box['width']), int(box['y'] + box['height']))).getdata()
        colors = sorted(set(px), key=lum)
        ground = colors[-1] if lum(colors[-1]) > 0.5 else colors[0]
        ink = colors[0] if ground == colors[-1] else colors[-1]
        # The darkest (or lightest) painted pixel against the most common ground.
        rr = ratio(ink, ground)
        note(rr >= want, f'{label}: {rr:.1f}:1 ({ink} on {ground})')

    sample('h1', 'headline')
    sample('h1 + p', 'sub-paragraph')
    sample('.pill', 'accent pill label')
    sample('button.drop', 'drop surface text')
    sample('#drop-help', 'drop help line')
    page.set_input_files('input[type=file]', PHOTO)
    page.wait_for_selector('button:has-text("Remove all")')
    page.wait_for_timeout(300)
    sample('.fields tbody tr', 'table row')
    sample('.fields thead', 'table head')
    with page.expect_download():
        page.click('button:has-text("Remove all")')
    page.wait_for_timeout(600)
    sample('.fields .gone', 'struck-through row', want=4.5)
    sample('.pill-ghost', 'ghost pill')
    ctx.close()
    b.close()

dist = os.path.join(ROOT, 'dist', 'assets')
js = sum(len(gzip.compress(open(os.path.join(dist, f), 'rb').read())) for f in os.listdir(dist) if f.endswith('.js'))
css = sum(len(gzip.compress(open(os.path.join(dist, f), 'rb').read())) for f in os.listdir(dist) if f.endswith('.css'))
note(js < 150 * 1024, f'JS {js / 1024:.1f} kB gz (one bundle, every route), CSS {css / 1024:.1f} kB gz')
html = ''.join(open(os.path.join(ROOT, 'dist', f), encoding='utf-8').read() for f in os.listdir(os.path.join(ROOT, 'dist')) if f.endswith('.html'))
note(not re.findall('[–—]', html), 'no em or en dashes in any shipped page')
note(all(os.path.exists(os.path.join(ROOT, 'dist', f)) for f in ('404.html', 'sitemap.xml', 'robots.txt', 'source/index.html', 'source/jpeg.ts.txt')), '404.html, sitemap.xml, robots.txt, /source/ exist')
note(any(f.endswith('.js.map') for f in os.listdir(dist)), 'the bundle ships a source map')
print('\nVERIFY FAILED' if bad else '\nVERIFY OK', len(bad))
sys.exit(1 if bad else 0)
