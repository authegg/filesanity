"""LCP and layout shifts at 390x844, throttled like a mid-range phone (1.6 Mbps, 150 ms, 4x CPU), cold, in Chromium.
Run against `npx wrangler dev --port 8787`: python3 tools/vitals.py [routes...]"""
import sys
from playwright.sync_api import sync_playwright
ROUTES = sys.argv[1:] or ['/', '/how-it-works', '/photos', '/batch', '/pricing', '/developers', '/faq', '/sign-in']
bad = 0
with sync_playwright() as p:
    b = p.chromium.launch()
    for route in ROUTES:
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=3, is_mobile=True, has_touch=True, service_workers='block')
        pg = ctx.new_page(); cdp = ctx.new_cdp_session(pg)
        cdp.send('Network.enable'); cdp.send('Network.emulateNetworkConditions', {'offline': False, 'latency': 150, 'downloadThroughput': 1.6e6 / 8, 'uploadThroughput': 750e3 / 8})
        cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
        pg.goto('http://127.0.0.1:8787' + route, wait_until='load'); pg.wait_for_timeout(4500)
        lcp = pg.evaluate("new Promise(r => new PerformanceObserver(l => r(Math.round(l.getEntries().at(-1).startTime))).observe({ type: 'largest-contentful-paint', buffered: true }))")
        cls = pg.evaluate("new Promise(r => { let s = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) s += e.value }).observe({ type: 'layout-shift', buffered: true }); setTimeout(() => r(s), 300) })")
        font = pg.evaluate("document.fonts.check('16px \"Archivo Variable\"')")
        ok = lcp < 2000 and cls < 0.01
        bad += not ok
        print(f"{'ok  ' if ok else 'FAIL'} {route:14} LCP {lcp} ms  CLS {cls:.4f}  Archivo {'used' if font else 'fallback'}")
        ctx.close()
sys.exit(1 if bad else 0)
