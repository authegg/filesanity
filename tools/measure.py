"""Leader join (plate edge to leader start, leader end to callout) at every
plate, and painted-glyph contrast in the cleaned state, both schemes.

Usage: python3 tools/measure.py [url]
"""
import os
import sys

from playwright.sync_api import sync_playwright

URL = next((a for a in sys.argv[1:] if a.startswith('http')), 'http://127.0.0.1:4184/')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHOTO = os.path.join(ROOT, 'tests', 'files', 'photo.jpg')

JOIN = """() => Array.from(document.querySelectorAll('ol li')).filter((li) => li.querySelector('.plate')).map((li) => {
  const plate = li.querySelector('.plate'), leader = li.querySelector('.leader'), callout = li.querySelector('.callout')
  // offsetLeft/offsetWidth ignore the skew: the plate's box edge at mid-height is the drawn edge.
  const plateRight = plate.offsetParent.getBoundingClientRect().left + plate.offsetLeft + plate.offsetWidth
  const l = leader.getBoundingClientRect(), c = callout.getBoundingClientRect()
  return { plate: plate.textContent.trim(), gapStart: Math.round(l.left - plateRight), gapEnd: Math.round(c.left - l.right), len: Math.round(l.width) }
})"""

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
    for w, h in ((1917, 870), (1366, 650), (390, 844)):
        page = b.new_page(viewport={'width': w, 'height': h})
        page.goto(URL, wait_until='load')
        page.wait_for_timeout(400)
        print(f'{w}x{h} empty:', page.evaluate(JOIN))
        page.set_input_files('input[type=file]', PHOTO)
        page.wait_for_selector('button:has-text("Strip ")')
        page.wait_for_timeout(300)
        print(f'{w}x{h} read: ', page.evaluate(JOIN))
        page.close()

    # Contrast: darkest (light) or lightest (dark) painted pixel in each text box vs the ground behind it.
    from PIL import Image
    import io
    for scheme in ('light', 'dark'):
        ctx = b.new_context(color_scheme=scheme, viewport={'width': 1366, 'height': 900}, accept_downloads=True)
        page = ctx.new_page()
        page.goto(URL, wait_until='load')
        page.set_input_files('input[type=file]', PHOTO)
        page.wait_for_selector('button:has-text("Strip ")')
        with page.expect_download():
            page.click('button:has-text("Strip ")')
        page.wait_for_timeout(900)
        shot = Image.open(io.BytesIO(page.screenshot())).convert('RGB')
        ground = page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--paper').trim()")
        g = tuple(int(ground.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4))
        boxes = page.evaluate("""() => Array.from(document.querySelectorAll('.row-gone .callout .meta, .row-gone .callout p, .row-gone .callout .field, .row-gone .callout li:last-child, .row-gone .tag')).slice(0, 12).map((e) => { const r = e.getBoundingClientRect(); return { t: e.textContent.trim().slice(0, 22), x: r.left, y: r.top, w: r.width, h: r.height, tag: e.className.includes('tag') } })""")
        worst = 99
        for bx in boxes:
            crop = shot.crop((int(bx['x']), int(bx['y']), int(bx['x'] + bx['w']), int(bx['y'] + bx['h'])))
            px = list(crop.getdata())
            if bx['tag']:
                # ink on the orange fill: darkest pixel against the fill's own colour
                fill = max(px, key=lambda c: c[0] - c[2])
                extreme = min(px, key=lum)
                r = ratio(extreme, fill)
            else:
                extreme = min(px, key=lum) if scheme == 'light' else max(px, key=lum)
                r = ratio(extreme, g)
            worst = min(worst, r)
            print(f'  {scheme} {r:4.1f}:1  {bx["t"]!r}')
        print(f'{scheme} worst painted contrast in the cleaned state: {worst:.2f}:1')
        ctx.close()
    b.close()
