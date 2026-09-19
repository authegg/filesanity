"""Screenshots at the client's sizes (Firefox for the primary size), the
four-state flow strip, and the network log during a clean.

Usage: python3 tools/shots.py [url] [--quick]
"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

URL = next((a for a in sys.argv[1:] if a.startswith('http')), 'http://127.0.0.1:4184/')
QUICK = '--quick' in sys.argv
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'shots')
FILES = os.path.join(ROOT, 'tests', 'files')
SIZES = [('1917x870', 1917, 870, 'firefox'), ('1366x650', 1366, 650, 'chromium'), ('390x844', 390, 844, 'chromium'), ('390x844', 390, 844, 'firefox'), ('1917x870', 1917, 870, 'chromium')]
if QUICK:
    SIZES = SIZES[:3]


def settle(page):
    page.wait_for_timeout(700)
    page.evaluate('document.fonts.ready')
    page.wait_for_timeout(200)


def load_file(page, path):
    page.set_input_files('input[type=file]', path)
    page.wait_for_selector('button:has-text("Strip ")', timeout=5000) if path.endswith(('.jpg', '.png', '.docx', '.xlsx', '.pptx', '.pdf')) and 'clean' not in path else page.wait_for_timeout(400)
    settle(page)


with sync_playwright() as p:
    os.makedirs(OUT, exist_ok=True)
    for name, w, h, engine in SIZES:
        b = getattr(p, engine).launch()
        page = b.new_page(viewport={'width': w, 'height': h})
        page.goto(URL, wait_until='load')
        settle(page)
        tag = f'{name}-{engine}' if (name, engine) in [('390x844', 'firefox'), ('1917x870', 'chromium')] else name
        page.screenshot(path=os.path.join(OUT, f'fold-{tag}.png'))
        page.screenshot(path=os.path.join(OUT, f'full-{tag}.png'), full_page=True)
        b.close()

    # Flow strip at 1917x870 in Firefox: empty, read, cleaned, unsupported. Plus the network log.
    b = p.firefox.launch()
    ctx = b.new_context(viewport={'width': 1917, 'height': 870}, accept_downloads=True)
    page = ctx.new_page()
    log = []
    page.on('request', lambda r: log.append({'method': r.method, 'url': r.url, 'type': r.resource_type}))
    page.goto(URL, wait_until='load')
    settle(page)
    shots = []
    page.screenshot(path=os.path.join(OUT, 'flow-0-empty.png'))
    n_before = len(log)
    load_file(page, os.path.join(FILES, 'photo.jpg'))
    page.screenshot(path=os.path.join(OUT, 'flow-1-read.png'))
    with page.expect_download() as dl:
        page.click('button:has-text("Strip ")')
    dl.value.save_as(os.path.join(OUT, 'flow-download.jpg'))
    page.wait_for_timeout(900)
    page.screenshot(path=os.path.join(OUT, 'flow-2-cleaned.png'))
    after = [r for r in log[n_before:] if not r['url'].startswith('blob:')]  # blob: URLs are the page's own object URLs
    load_file(page, os.path.join(FILES, 'notes.txt'))
    page.screenshot(path=os.path.join(OUT, 'flow-3-unsupported.png'))
    with open(os.path.join(OUT, 'network-log.json'), 'w') as f:
        json.dump({'requests_during_read_and_clean': after, 'total_requests_on_page': len(log), 'all': log}, f, indent=1)
    print('requests during read and clean:', after)
    b.close()

    from PIL import Image
    ims = [Image.open(os.path.join(OUT, f'flow-{i}-{n}.png')) for i, n in enumerate(['empty', 'read', 'cleaned', 'unsupported'])]
    W = sum(i.width for i in ims) + 30
    sheet = Image.new('RGB', (W, ims[0].height), '#888')
    x = 0
    for im in ims:
        sheet.paste(im, (x, 0))
        x += im.width + 10
    sheet.save(os.path.join(OUT, 'flow-1917x870.png'))
print('ok', sorted(os.listdir(OUT)))
