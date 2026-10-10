"""Chrome Web Store images from the real extension: three 1280x800 screenshots and the 440x280 promo tile.
The popup and options pages are rendered by the built extension in Chromium; the frames around them are plain HTML in the
site's J1 look. Every name in them is invented. Run: npm run build:ext && python3 tools/store_shots.py [out_dir]
"""
import base64, os, sys, tempfile
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'dist-extension', 'store')
EXT = os.path.join(ROOT, 'dist-extension', 'chrome')
SAMPLE = os.path.join(ROOT, 'public', 'sample.jpg')
FONT = os.path.join(EXT, 'archivo.woff2')
os.makedirs(OUT, exist_ok=True)

b64 = lambda p: base64.b64encode(open(p, 'rb').read()).decode()
MARK = ('<svg viewBox="12 6 40 52" width="{w}" height="{h}"><path fill="#f4f1e6" fill-rule="evenodd" d="M26 6H38L52 20V44A14 14 0 0 1 38 58H26A14 14 0 0 1 12 44V20A14 14 0 0 1 26 6Z'
        'M32 21C37 21 40 26.5 40 34S37 47 32 47 24 41.5 24 34 27 21 32 21Z"/><path fill="#e3f07a" d="M42.2 6H52V15.8Z"/></svg>')
BASE = f"""<style>@font-face {{ font-family: Archivo; src: url(data:font/woff2;base64,{b64(FONT)}) format('woff2'); font-weight: 100 900; font-stretch: 62% 125%; }}
* {{ box-sizing: border-box; margin: 0; }} body {{ background: #0d5641; color: #f4f1e6; font: 20px/1.45 system-ui, sans-serif; }}
h1 {{ font: 800 56px/1.02 Archivo, sans-serif; font-stretch: 112%; letter-spacing: -.01em; }} .s {{ color: #e3f07a; }}
.brand {{ display: flex; align-items: center; gap: 12px; font: 800 26px Archivo, sans-serif; font-stretch: 112%; }}
.muted {{ color: #c4d6cc; }} img.shot {{ border-radius: 10px; box-shadow: 0 30px 60px rgb(0 0 0 / .35); }}</style>"""


def frame(pg, html, w, h, path):
    pg.set_viewport_size({'width': w, 'height': h})
    pg.set_content(f'<!doctype html><meta charset="utf-8">{BASE}<body style="width:{w}px;height:{h}px;overflow:hidden">{html}</body>')
    pg.wait_for_timeout(300)
    pg.screenshot(path=path)


with sync_playwright() as p, tempfile.TemporaryDirectory() as prof:
    ctx = p.chromium.launch_persistent_context(prof, channel='chromium', headless=True, device_scale_factor=2,
                                               args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}'])
    sw = ctx.service_workers[0] if ctx.service_workers else ctx.wait_for_event('serviceworker')
    ext_id = sw.url.split('/')[2]
    # A plain upload form on an invented site; the content script cleans the photo the moment it is chosen.
    ctx.route('http://marketplace.example/', lambda r: r.fulfill(content_type='text/html', body='<!doctype html><title>Upload</title><input type="file" id="f">'))
    up = ctx.new_page()
    up.goto('http://marketplace.example/')
    up.set_input_files('#f', SAMPLE)
    up.wait_for_timeout(1500)

    pop = ctx.new_page()
    # Opened from the toolbar, the panel belongs to the site's tab; opened as a page it would describe itself. Point its
    # tab lookup at the site, as the toolbar does.
    pop.set_viewport_size({'width': 320, 'height': 400})
    pop.goto(f'chrome-extension://{ext_id}/popup.html')
    # The background counts cleans per tab under "tab:<id>": that id is the site's tab.
    tab = int(next(k for k in sw.evaluate("chrome.storage.session.get(null)") if k.startswith('tab:')).split(':')[1])
    pop.evaluate("""(tab) => new Promise((done) => {
      chrome.tabs.query = async () => [{ id: tab }]
      const s = document.createElement('script'); s.src = 'popup.js?again'; s.onload = done; document.body.append(s)
    })""", tab)
    for _ in range(50):
        if pop.inner_text('#host') == 'marketplace.example':
            break
        pop.wait_for_timeout(100)
    else:
        raise SystemExit('the panel did not pick up the site tab')
    pop.wait_for_timeout(400)
    pop.screenshot(path=f'{OUT}/_popup.png', full_page=True)
    with pop.expect_download():
        pop.set_input_files('#file', SAMPLE)
    pop.wait_for_function("document.getElementById('msg').textContent.length > 0", timeout=10000)
    pop.screenshot(path=f'{OUT}/_popup-done.png', full_page=True)

    opt = ctx.new_page()
    opt.set_viewport_size({'width': 1280, 'height': 800})
    opt.goto(f'chrome-extension://{ext_id}/options.html')
    opt.wait_for_timeout(800)
    opt.screenshot(path=f'{OUT}/_options.png')

    pg = ctx.new_page()
    # 1. What it does, with the real popup.
    frame(pg, f"""<div style="display:grid;grid-template-columns:1fr 360px;gap:72px;align-items:center;height:100%;padding:0 96px">
      <div style="display:grid;gap:28px"><div class="brand">{MARK.format(w=26, h=34)}<span>File<span class="s">Sanity</span></span></div>
      <h1>Every upload,<br>cleaned before<br>the site gets it.</h1>
      <p class="muted" style="max-width:30ch">GPS position, names, dates and the device leave photos, Office files, PDFs and videos inside your browser.</p></div>
      <img class="shot" src="data:image/png;base64,{b64(f'{OUT}/_popup.png')}" width="360"></div>""", 1280, 800, f'{OUT}/screenshot-1.png')
    # 2. The panel after a drop: the clean copy and its count.
    frame(pg, f"""<div style="display:grid;grid-template-columns:360px 1fr;gap:72px;align-items:center;height:100%;padding:0 96px">
      <img class="shot" src="data:image/png;base64,{b64(f'{OUT}/_popup-done.png')}" width="360">
      <div style="display:grid;gap:24px"><h1>Or drop a file<br>on the panel.</h1>
      <p class="muted" style="max-width:32ch">It is cleaned on the spot and saved as a copy. Nothing is uploaded, to FileSanity or anyone.</p></div></div>""", 1280, 800, f'{OUT}/screenshot-2.png')
    # 3. Options, as a free user sees them.
    frame(pg, f"""<img src="data:image/png;base64,{b64(f'{OUT}/_options.png')}" width="1280" height="800">""", 1280, 800, f'{OUT}/screenshot-3.png')
    # Small promo tile.
    frame(pg, f"""<div style="display:grid;align-content:center;gap:16px;height:100%;padding:0 40px">
      <div class="brand">{MARK.format(w=24, h=31)}<span>File<span class="s">Sanity</span></span></div>
      <h1 style="font-size:34px">Clean files<br>as you upload them.</h1></div>""", 440, 280, f'{OUT}/promo-small-440x280.png')
    ctx.close()

# Rendered at 2x for sharp text; the store wants the exact sizes, PNG, no alpha.
from PIL import Image
for f in os.listdir(OUT):
    path = os.path.join(OUT, f)
    if f.startswith('_'):
        os.remove(path)
        continue
    im = Image.open(path).convert('RGB')
    im.resize((440, 280) if f.startswith('promo') else (1280, 800), Image.LANCZOS).save(path)
print('store images:', sorted(os.listdir(OUT)))
