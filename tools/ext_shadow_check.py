"""The extension on uploaders inside an open shadow root (web components), Chromium and Firefox, with no server: the page
must receive cleaned bytes from both a picked and a dropped file. Run from app/ after npm run build:ext: python3 tools/ext_shadow_check.py
"""
import base64, io, os, sys, tempfile
from PIL import Image
from playwright.sync_api import sync_playwright
ROOT = os.getcwd()
sys.path.insert(0, os.path.join(ROOT, 'tools'))
SAMPLE = os.path.join(ROOT, 'public', 'sample.jpg')
PAGE = """<!doctype html><title>shadow</title><x-up></x-up><script>
const read = async (f) => ({ name: f.name, size: f.size, b64: btoa(Array.from(new Uint8Array(await f.arrayBuffer()), c => String.fromCharCode(c)).join('')) })
customElements.define('x-up', class extends HTMLElement { connectedCallback() {
  const r = this.attachShadow({ mode: 'open' })
  r.innerHTML = '<input type=file id=f><div id=zone style="width:300px;height:200px">drop</div>'
  r.getElementById('f').addEventListener('change', async (e) => { window.picked = await read(e.target.files[0]) })
  const z = r.getElementById('zone'); z.addEventListener('dragover', (e) => e.preventDefault())
  z.addEventListener('drop', async (e) => { e.preventDefault(); window.dropped = await read(e.dataTransfer.files[0]) })
} })
</script>"""
DROP = """async (b64) => { const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0)); const dt = new DataTransfer(); dt.items.add(new File([bytes], 'drop.jpg', { type: 'image/jpeg' }))
  document.querySelector('x-up').shadowRoot.getElementById('zone').dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, composed: true, dataTransfer: dt })) }"""
fails = []
def check(ok, m): print(('ok   ' if ok else 'FAIL ') + m); ok or fails.append(m)
def dirty(b64):
    d = base64.b64decode(b64); ex = Image.open(io.BytesIO(d)).getexif()
    return [k for k, bad in (('GPS', ex.get(0x8825)), ('Artist', ex.get(0x013b)), ('City', b'photoshop:City' in d)) if bad]
orig = base64.b64encode(open(SAMPLE, 'rb').read()).decode()
def run(ctx, eng):
    ctx.route('http://shadow.test/', lambda r: r.fulfill(status=200, content_type='text/html', body=PAGE))
    pg = ctx.new_page(); pg.goto('http://shadow.test/'); pg.wait_for_timeout(1000)
    pg.set_input_files('x-up #f', SAMPLE); pg.wait_for_function('window.picked', timeout=10000)
    g = pg.evaluate('window.picked'); check(dirty(g['b64']) == [], f'{eng} shadow input: {g["size"]} bytes, carrying {dirty(g["b64"])}')
    pg.evaluate(DROP, orig); pg.wait_for_function('window.dropped', timeout=10000)
    g = pg.evaluate('window.dropped'); check(dirty(g['b64']) == [], f'{eng} shadow drop: {g["size"]} bytes, carrying {dirty(g["b64"])}')
with sync_playwright() as p:
    with tempfile.TemporaryDirectory() as prof:
        d = os.path.join(ROOT, 'dist-extension', 'chrome')
        ctx = p.chromium.launch_persistent_context(prof, channel='chromium', headless=True, args=[f'--disable-extensions-except={d}', f'--load-extension={d}'])
        run(ctx, 'chromium'); ctx.close()
    from rdp import RDP
    with tempfile.TemporaryDirectory() as prof:
        ctx = p.firefox.launch_persistent_context(prof, headless=True, args=['-start-debugger-server', '6124'], firefox_user_prefs={'devtools.debugger.remote-enabled': True, 'devtools.chrome.enabled': True, 'devtools.debugger.prompt-connection': False})
        RDP(6124).install(os.path.join(ROOT, 'dist-extension', 'firefox'))
        run(ctx, 'firefox'); ctx.close()
sys.exit(1 if fails else 0)
