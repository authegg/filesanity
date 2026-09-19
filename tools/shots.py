"""Screenshots: home fold and full page at the client's sizes (Firefox for
1917x870 and 390x844, Chromium for 1366x650), the picker's six states side
by side, the phone menu open, one full page per other route at 1440, and
the anchors-vs-page sheet.

Usage: python3 tools/shots.py [url]
"""
import os
import sys

from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

URL = next((a for a in sys.argv[1:] if a.startswith('http')), 'http://127.0.0.1:4184')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'shots')
FILES = os.path.join(ROOT, 'tests', 'files')
ROUTES = ['how-it-works', 'photos', 'documents', 'pdf', 'formats', 'pricing', 'security', 'faq', 'about', 'contact', 'privacy', 'terms', 'changelog', '404.html']
os.makedirs(OUT, exist_ok=True)


def settle(page, full=False):
    page.wait_for_timeout(500)
    if full:
        page.evaluate('''async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 30)) } window.scrollTo(0, 0) }''')
        page.wait_for_timeout(1100)


with sync_playwright() as p:
    for name, w, h, engine in (('1917x870', 1917, 870, 'firefox'), ('1366x650', 1366, 650, 'chromium'), ('390x844', 390, 844, 'firefox'), ('390x844-chromium', 390, 844, 'chromium')):
        b = getattr(p, engine).launch()
        page = b.new_page(viewport={'width': w, 'height': h})
        page.goto(URL + '/', wait_until='load')
        settle(page)
        page.screenshot(path=os.path.join(OUT, f'home-fold-{name}.png'))
        settle(page, full=True)
        page.screenshot(path=os.path.join(OUT, f'home-full-{name}.png'), full_page=True)
        b.close()

    # Six picker states at 1917x870 in Firefox, the hero panel cropped, side by side.
    b = p.firefox.launch()
    ctx = b.new_context(viewport={'width': 1917, 'height': 870}, accept_downloads=True)
    page = ctx.new_page()
    page.goto(URL + '/', wait_until='load')
    settle(page)
    states = []

    def grab(label):
        page.wait_for_timeout(300)
        box = page.query_selector('.plate-hero').bounding_box()
        page.screenshot(path=os.path.join(OUT, '_tmp.png'))
        im = Image.open(os.path.join(OUT, '_tmp.png')).crop((int(box['x'] + box['width'] * 0.5), int(box['y']), int(box['x'] + box['width']), int(box['y'] + box['height'])))
        states.append((label, im))

    grab('idle')
    dt = page.evaluate_handle("async () => { const r = await fetch('/sample.jpg'); const b = await r.blob(); const dt = new DataTransfer(); dt.items.add(new File([b], 'IMG_4471.jpg', { type: 'image/jpeg' })); return dt }")
    page.dispatch_event('section[aria-labelledby=h1]', 'dragenter', {'dataTransfer': dt})
    grab('drag-over')
    page.dispatch_event('section[aria-labelledby=h1]', 'dragleave', {'dataTransfer': dt})
    # Reading: hold the parser by loading a large file through a slowed inspect; simplest is to capture right after the drop.
    page.evaluate("() => { const o = Blob.prototype.arrayBuffer; Blob.prototype.arrayBuffer = function () { Blob.prototype.arrayBuffer = o; return new Promise((res) => setTimeout(() => res(o.call(this)), 1200)) } }")
    page.dispatch_event('section[aria-labelledby=h1]', 'drop', {'dataTransfer': dt})
    page.wait_for_timeout(150)
    grab('reading')
    page.wait_for_selector('button:has-text("Remove all")', timeout=15000)
    grab('ready')
    with page.expect_download():
        page.click('button:has-text("Remove all")')
    page.wait_for_selector('button:has-text("Download again")')
    grab('cleaned')
    page.set_input_files('input[type=file]', os.path.join(FILES, 'notes.txt'))
    page.wait_for_selector('[data-state=error]', timeout=8000)
    grab('error')
    os.remove(os.path.join(OUT, '_tmp.png'))
    W = sum(im.width for im, in [(s[1],) for s in states]) + 10 * (len(states) - 1)
    H = max(s[1].height for s in states) + 30
    sheet = Image.new('RGB', (W, H), '#333')
    d = ImageDraw.Draw(sheet)
    x = 0
    for label, im in states:
        sheet.paste(im, (x, 30))
        d.text((x + 6, 8), label, fill='white')
        x += im.width + 10
    sheet.save(os.path.join(OUT, 'picker-states-1917x870.png'))
    b.close()

    # Phone menu open.
    b = p.firefox.launch()
    page = b.new_page(viewport={'width': 390, 'height': 844})
    page.goto(URL + '/security', wait_until='load')
    settle(page)
    page.click('button.burger')
    page.wait_for_timeout(900)
    page.screenshot(path=os.path.join(OUT, 'menu-390x844.png'))
    b.close()

    # One full page per other route at 1440.
    b = p.chromium.launch()
    for r in ROUTES:
        page = b.new_page(viewport={'width': 1440, 'height': 900})
        page.goto(URL + '/' + r, wait_until='load')
        settle(page, full=True)
        page.screenshot(path=os.path.join(OUT, f'page-{r.replace(".html", "")}-1440.png'), full_page=True)
        page.close()
    b.close()

# Anchors beside the page: minimal-so (structure), mollie-com--pricing (surface), our fold.
refs = os.path.join(ROOT, 'refs')
tiles = []
for f, label in ((os.path.join(refs, 'minimal-so.hero.webp'), 'minimal-so: structure'), (os.path.join(refs, 'mollie-com--pricing.hero.webp'), 'mollie-com--pricing: surface'), (os.path.join(OUT, 'home-fold-1917x870.png'), 'filesanity v2: home fold, 1917x870')):
    if os.path.exists(f):
        im = Image.open(f).convert('RGB')
        im.thumbnail((900, 600))
        tiles.append((label, im))
if tiles:
    W = sum(t[1].width for t in tiles) + 10 * (len(tiles) - 1)
    H = max(t[1].height for t in tiles) + 30
    sheet = Image.new('RGB', (W, H), '#333')
    d = ImageDraw.Draw(sheet)
    x = 0
    for label, im in tiles:
        sheet.paste(im, (x, 30))
        d.text((x + 6, 8), label, fill='white')
        x += im.width + 10
    sheet.save(os.path.join(OUT, 'anchors-vs-page.png'))
print('ok', sorted(os.listdir(OUT)))
