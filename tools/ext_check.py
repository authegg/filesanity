"""The built extension (npm run build:ext), headless, in Chromium and in Firefox.

Both engines: choosing public/sample.jpg in an <input type=file> and dropping it on a drop zone hand the page a file
without GPS, Artist or City, and "Save without metadata" returns a clean image. Chromium also: a paste carrying the file
(Firefox leaves pastes alone, see content.ts), the popup and options pages, a real pairing against the local server
(sign in, a connection token, a Pro webhook, the saved policy), a policy that keeps EXIF, the log and a "never" rule.
Firefox loads the add-on through its remote debugging protocol, as web-ext does; Playwright cannot open moz-extension
pages, so there the background is read over that protocol instead of through the popup.
Needs `npx wrangler dev --port 8787` (DEV_LINKS=1, .dev.vars). Shots go to shots/ext/.
Run: python3 tools/ext_check.py [base]
"""
import base64, hashlib, hmac, io, json, os, socket, sys, tempfile, time, urllib.request
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8787'
OUT = os.path.join(ROOT, 'shots', 'ext')
os.makedirs(OUT, exist_ok=True)
SAMPLE = os.path.join(ROOT, 'public', 'sample.jpg')
PAGE = """<!doctype html><title>upload test</title>
<input type=file id=f><div id=zone style="width:300px;height:200px;border:1px solid">drop here</div><img id=img src=/sample.jpg>
<script>
const read = async (f) => ({ name: f.name, size: f.size, b64: btoa(Array.from(new Uint8Array(await f.arrayBuffer()), c => String.fromCharCode(c)).join('')) })
document.getElementById('f').addEventListener('change', async (e) => { window.picked = await read(e.target.files[0]) })
const z = document.getElementById('zone')
z.addEventListener('dragover', (e) => e.preventDefault())
z.addEventListener('drop', async (e) => { e.preventDefault(); window.dropped = await read(e.dataTransfer.files[0]) })
document.addEventListener('paste', async (e) => { window.pasted = { ...(await read(e.clipboardData.files[0])), text: e.clipboardData.getData('text/plain') } })
</script>"""
SYNTH = """async ([b64, kind]) => {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  const dt = new DataTransfer(); dt.items.add(new File([bytes], kind + '.jpg', { type: 'image/jpeg' }))
  if (kind === 'drop') document.getElementById('zone').dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }))
  else { dt.setData('text/plain', 'caption'); document.body.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt })) }
}"""
fails = []
def check(ok, msg):
    print(('ok   ' if ok else 'FAIL ') + msg)
    if not ok: fails.append(msg)

def dirty(b64):
    data = base64.b64decode(b64)
    ex = Image.open(io.BytesIO(data)).getexif()
    return [k for k, bad in (('GPS', ex.get(0x8825)), ('Artist', ex.get(0x013b)), ('City', b'photoshop:City' in data)) if bad]

orig = base64.b64encode(open(SAMPLE, 'rb').read()).decode()
check(dirty(orig) != [], f'the sample itself carries {dirty(orig)}')

def serve(ctx, host):
    ctx.route(f'http://{host}/sample.jpg', lambda r: r.fulfill(status=200, content_type='image/jpeg', body=open(SAMPLE, 'rb').read()))
    ctx.route(f'http://{host}/', lambda r: r.fulfill(status=200, content_type='text/html', body=PAGE))

def uploads(pg, eng, keep=()):
    """Pick, drop and (Chromium) paste on the test page; returns how many files the extension cleaned."""
    want = sorted(keep)
    pg.set_input_files('#f', SAMPLE)
    pg.wait_for_function('window.picked', timeout=10000)
    got = pg.evaluate('window.picked')
    check(got['name'] == 'sample.jpg' and sorted(dirty(got['b64'])) == want and got['size'] < os.path.getsize(SAMPLE), f'{eng} input: the page received {got["name"]}, {got["size"]} bytes, carrying {dirty(got["b64"])}')
    pg.evaluate(SYNTH, [orig, 'drop'])
    pg.wait_for_function('window.dropped', timeout=10000)
    got = pg.evaluate('window.dropped')
    check(sorted(dirty(got['b64'])) == want, f'{eng} drop: the page received {got["size"]} bytes, carrying {dirty(got["b64"])}')
    if eng == 'firefox': return 2
    pg.evaluate(SYNTH, [orig, 'paste'])
    pg.wait_for_function('window.pasted', timeout=10000)
    got = pg.evaluate('window.pasted')
    check(sorted(dirty(got['b64'])) == want and got['text'] == 'caption', f'{eng} paste: the page received {got["size"]} bytes carrying {dirty(got["b64"])}, text "{got["text"]}"')
    return 3

# The test page's tab: the one whose content script answers "upload.test" (tab URLs need the tabs permission).
TAB = "(async () => { for (const t of await ext.tabs.query({})) if (await ext.tabs.sendMessage(t.id, { type: 'host' }).catch(() => null) === 'upload.test') return t })()"
SAVE = """async () => {
  const tab = await """ + TAB + """
  const r = await ext.tabs.sendMessage(tab.id, { type: 'save', src: 'http://upload.test/sample.jpg' })
  return r && { name: r.name, removed: r.removed, b64: r.url.split(',')[1] }
}"""

def saved(eng, r):
    check(bool(r) and r['name'] == 'sample-clean.jpg' and r['removed'] > 0 and dirty(r['b64']) == [], f'{eng} "Save without metadata": {r and r["name"]}, {r and r["removed"]} fields removed, carrying {r and dirty(r["b64"])}')

# --- the local account: sign in, a connection token, a Pro plan that keeps EXIF ---
VARS = dict(l.split('=', 1) for l in open(os.path.join(ROOT, '.dev.vars')).read().strip().split('\n'))
def call(method, path, body=None, headers=None):
    req = urllib.request.Request(BASE + path, method=method, data=body if isinstance(body, bytes) or body is None else json.dumps(body).encode(), headers={'Content-Type': 'application/json', 'Origin': BASE, **(headers or {})})
    class Keep(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *a): return None
    try: return urllib.request.build_opener(Keep).open(req)
    except urllib.error.HTTPError as e: return e

email = f'ext-{int(time.time())}@example.com'
link = json.load(call('POST', '/api/auth/start', {'email': email, 'turnstile': 'XXXX.DUMMY.TOKEN.XXXX'}))['link']
cookie = call('GET', '/' + link.split('/', 3)[3]).headers['set-cookie'].split(';')[0]
token = json.load(call('POST', '/api/keys', {'scope': 'ext'}, {'Cookie': cookie}))['key']
raw = json.dumps({'meta': {'event_name': 'subscription_created', 'custom_data': {'email': email}}, 'data': {'attributes': {'variant_id': int(VARS['LS_VARIANT_PRO']), 'status': 'active', 'user_email': email, 'renews_at': '2026-11-08T00:00:00Z', 'ends_at': None, 'urls': {'customer_portal': 'https://example.com'}}}}).encode()
call('POST', '/api/webhooks/lemonsqueezy', raw, {'X-Signature': hmac.new(VARS['LS_WEBHOOK_SECRET'].encode(), raw, hashlib.sha256).hexdigest()})
call('PUT', '/api/policy', {'keep': ['exif']}, {'Cookie': cookie})
check(token.startswith('fs_ext_'), f'local account {email} on Pro, policy keeps EXIF, token {token[:10]}...')

with sync_playwright() as p:
    # ---------------- Chromium ----------------
    with tempfile.TemporaryDirectory() as prof:
        ext_dir = os.path.join(ROOT, 'dist-extension', 'chrome')
        ctx = p.chromium.launch_persistent_context(prof, channel='chromium', headless=True, args=[f'--disable-extensions-except={ext_dir}', f'--load-extension={ext_dir}'])
        sw = ctx.service_workers[0] if ctx.service_workers else ctx.wait_for_event('serviceworker')
        ext_id = sw.url.split('/')[2]
        serve(ctx, 'upload.test'); serve(ctx, 'never.test')
        # The extension calls https://filesanity.com; here that is answered by the local Worker.
        ctx.route('https://filesanity.com/api/ext/me', lambda r: r.fulfill(response=r.fetch(url=BASE + '/api/ext/me')))
        pg = ctx.new_page()
        pg.goto('http://upload.test/')
        n = uploads(pg, 'chromium')

        pop = ctx.new_page()
        pop.set_viewport_size({'width': 320, 'height': 420})
        pop.goto(f'chrome-extension://{ext_id}/popup.html')
        pop.wait_for_function(f"document.getElementById('today').textContent === '{n}'", timeout=5000)
        check(pop.inner_text('h1') == 'FileSanity' and pop.locator('#pick').is_visible(), f'popup renders with the drop zone, today = {pop.inner_text("#today")}')
        pop.screenshot(path=f'{OUT}/popup.png')

        opt = ctx.new_page()
        opt.set_viewport_size({'width': 1280, 'height': 800})
        opt.goto(f'chrome-extension://{ext_id}/options.html')
        opt.wait_for_function("document.getElementById('rules-box').disabled", timeout=5000)
        check('Not connected' in opt.inner_text('#status'), 'options render; subscriber parts locked when not connected')
        opt.screenshot(path=f'{OUT}/options-free.png', full_page=True)

        # Pairing, as a subscriber does it: paste the token, Connect.
        opt.fill('#token', token)
        opt.click('#connect button')
        opt.wait_for_function("() => !document.getElementById('rules-box').disabled", timeout=10000)
        st = sw.evaluate("chrome.storage.local.get(['token', 'plan', 'policy'])")
        check('Pro plan' in opt.inner_text('#status') and st['plan'] == 'pro' and st['policy'] == ['exif'] and 'EXIF' in opt.inner_text('#policy'), f'pairing against the local server: {st["plan"]}, policy {st["policy"]}')

        sw.evaluate("chrome.storage.local.set({ rules: { 'never.test': 'never' } })")
        pg.reload()
        uploads(pg, 'chromium (Pro, keep EXIF)', keep=('GPS', 'Artist'))
        log = sw.evaluate("chrome.storage.local.get('log').then(r => r.log)")
        check(len(log) == 3 and log[-1]['site'] == 'upload.test' and log[-1]['name'] == 'sample.jpg' and log[-1]['removed'] > 0, f'log records the cleans: {len(log)} entries')
        pg.goto('http://never.test/')
        pg.set_input_files('#f', SAMPLE)
        pg.wait_for_function('window.picked', timeout=10000)
        check(pg.evaluate('window.picked.b64') == orig, 'site rule "never": the original passes through')

        sw.evaluate("chrome.storage.local.set({ policy: [] })")
        pg.goto('http://upload.test/')
        saved('chromium', sw.evaluate(SAVE.replace('ext.', 'chrome.')))
        # The download the menu item makes, from the data URL the content script returns.
        item = sw.evaluate("""(async () => {
          const tab = await """ + TAB.replace('ext.', 'chrome.') + """
          const x = await chrome.tabs.sendMessage(tab.id, { type: 'save', src: 'http://upload.test/sample.jpg' })
          const id = await chrome.downloads.download({ url: x.url, filename: x.name, saveAs: false })
          for (let i = 0; i < 50; i++) { const [d] = await chrome.downloads.search({ id }); if (d.state !== 'in_progress') return d; await new Promise(r => setTimeout(r, 100)) }
        })()""")
        data = open(item['filename'], 'rb').read() if item and item['state'] == 'complete' else b''
        # Playwright stores downloads under a GUID name, so only the bytes are checked here; the name is checked in the reply above.
        check(bool(data) and dirty(base64.b64encode(data)) == [], f'chromium download: {len(data)} bytes, carrying {dirty(base64.b64encode(data)) if data else "nothing"}')
        opt.reload()
        opt.wait_for_function("() => document.querySelectorAll('#log tr').length >= 3", timeout=5000)
        check('never.test' in opt.inner_text('#rules'), 'options show the plan, rule and log')
        opt.screenshot(path=f'{OUT}/options-pro.png', full_page=True)
        ctx.close()

    # ---------------- Firefox ----------------
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from rdp import RDP
    with tempfile.TemporaryDirectory() as prof:
        port = 6123
        ctx = p.firefox.launch_persistent_context(prof, headless=True, args=['-start-debugger-server', str(port)], firefox_user_prefs={
            'devtools.debugger.remote-enabled': True, 'devtools.chrome.enabled': True, 'devtools.debugger.prompt-connection': False})
        rdp = RDP(port)
        aid = rdp.install(os.path.join(ROOT, 'dist-extension', 'firefox'))
        perms = rdp.evaluate(aid, "browser.permissions.getAll()")
        check('<all_urls>' in perms['origins'], f'firefox: {aid} installed, origins {perms["origins"]}')
        serve(ctx, 'upload.test')
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: check(False, f'firefox page error: {e}'))
        pg.on('dialog', lambda d: (check(False, f'firefox dialog: {d.message}'), d.dismiss()))
        pg.goto('http://upload.test/')
        n = uploads(pg, 'firefox')
        today = rdp.evaluate(aid, "browser.storage.local.get('today').then(r => r.today)")
        check(today == n, f'firefox counts the cleans: today = {today}')
        # Started, then polled with Playwright waits: Playwright serves the routed image only while Python is inside one of
        # its calls, never during a blocking debugger call or time.sleep.
        rdp.evaluate(aid, f"void ({SAVE.replace('ext.', 'browser.')})().then((r) => {{ globalThis.saved = r || 'none' }}, (e) => {{ globalThis.saved = String(e) }})")
        for _ in range(100):
            r = rdp.evaluate(aid, 'globalThis.saved')
            if r: break
            pg.wait_for_timeout(100)
        saved('firefox', r if isinstance(r, dict) else None)
        ctx.close()

print('FAILED' if fails else 'all passed', len(fails))
sys.exit(1 if fails else 0)
