"""Mechanical checks: LCP and CLS under throttling at 390x844, no horizontal
scroll at five widths, keyboard reach, reduced motion, dark mode shot,
em-dash grep, JS weight.

Usage: python3 tools/verify.py [url]
"""
import gzip
import os
import re
import sys

from playwright.sync_api import sync_playwright

URL = next((a for a in sys.argv[1:] if a.startswith('http')), 'http://127.0.0.1:4184/')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'shots')

VITALS = """
() => new Promise((res) => {
  const out = { lcp: 0, cls: 0, lcpEl: '' }
  new PerformanceObserver((l) => { for (const e of l.getEntries()) { out.lcp = e.startTime; out.lcpEl = (e.element && (e.element.tagName + '.' + e.element.className)) || '' } }).observe({ type: 'largest-contentful-paint', buffered: true })
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) out.cls += e.value }).observe({ type: 'layout-shift', buffered: true })
  setTimeout(() => res(out), 2500)
})
"""

with sync_playwright() as p:
    b = p.chromium.launch()
    # Cold, throttled phone: 1.6 Mbps down, 150 ms RTT, 4x CPU, 390 wide at 2x.
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
    page = ctx.new_page()
    cdp = ctx.new_cdp_session(page)
    cdp.send('Network.enable')
    cdp.send('Network.emulateNetworkConditions', {'offline': False, 'latency': 150, 'downloadThroughput': 1.6e6 / 8, 'uploadThroughput': 750e3 / 8})
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
    page.goto(URL, wait_until='load')
    v = page.evaluate(VITALS)
    print(f"phone throttled: LCP {v['lcp']:.0f} ms ({v['lcpEl'][:40]}), CLS {v['cls']:.4f}")
    ctx.close()

    ctx = b.new_context(viewport={'width': 1917, 'height': 870})
    page = ctx.new_page()
    page.goto(URL, wait_until='load')
    v = page.evaluate(VITALS)
    print(f"desktop: LCP {v['lcp']:.0f} ms, CLS {v['cls']:.4f}")
    ctx.close()

    for w in (320, 390, 768, 1024, 1440):
        page = b.new_page(viewport={'width': w, 'height': 800})
        page.goto(URL, wait_until='load')
        page.set_input_files('input[type=file]', os.path.join(ROOT, 'tests', 'files', 'photo.jpg'))
        page.wait_for_selector('button:has-text("Strip ")')
        page.wait_for_timeout(300)
        sw = page.evaluate('document.documentElement.scrollWidth')
        print(f'{w}px: scrollWidth {sw}', 'OK' if sw <= w else 'HORIZONTAL SCROLL')
        if w == 320:
            page.screenshot(path=os.path.join(OUT, 'read-320.png'), full_page=True)
        page.close()

    # Keyboard: tab through everything focusable, every stop has a visible ring.
    page = b.new_page(viewport={'width': 1366, 'height': 650})
    page.goto(URL, wait_until='load')
    stops = []
    for _ in range(12):
        page.keyboard.press('Tab')
        info = page.evaluate("() => { const e = document.activeElement; const s = getComputedStyle(e); return e.tagName + ':' + (e.textContent || '').trim().slice(0, 24) + ' outline=' + s.outlineStyle + ' ' + s.outlineWidth }")
        stops.append(info)
    print('tab stops:', *stops, sep='\n  ')

    # Reduced motion: transitions off.
    ctx = b.new_context(reduced_motion='reduce', viewport={'width': 1366, 'height': 650})
    page = ctx.new_page()
    page.goto(URL, wait_until='load')
    t = page.evaluate("getComputedStyle(document.querySelector('.plate')).transitionDuration")
    print('reduced motion plate transition:', t)
    ctx.close()

    # Dark mode.
    ctx = b.new_context(color_scheme='dark', viewport={'width': 1366, 'height': 650})
    page = ctx.new_page()
    page.goto(URL, wait_until='load')
    page.wait_for_timeout(600)
    page.screenshot(path=os.path.join(OUT, 'fold-1366x650-dark.png'))
    page.set_input_files('input[type=file]', os.path.join(ROOT, 'tests', 'files', 'photo.jpg'))
    page.wait_for_selector('button:has-text("Strip ")')
    page.wait_for_timeout(300)
    page.screenshot(path=os.path.join(OUT, 'read-1366x650-dark.png'))
    ctx.close()
    b.close()

dist = os.path.join(ROOT, 'dist', 'assets')
js = sum(len(gzip.compress(open(os.path.join(dist, f), 'rb').read())) for f in os.listdir(dist) if f.endswith('.js'))
css = sum(len(gzip.compress(open(os.path.join(dist, f), 'rb').read())) for f in os.listdir(dist) if f.endswith('.css'))
print(f'JS {js / 1024:.1f} kB gz, CSS {css / 1024:.1f} kB gz')
html = open(os.path.join(ROOT, 'dist', 'index.html'), encoding='utf-8').read()
src = ''.join(open(os.path.join(ROOT, 'src', f), encoding='utf-8').read() for f in ('App.tsx', 'Figure.tsx'))
dashes = re.findall('[–—]', html + src)
print('em/en dashes in shipped copy:', len(dashes))
