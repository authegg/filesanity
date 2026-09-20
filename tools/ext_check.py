"""Loads the built extension unpacked into Chromium, opens a page with a plain file input, chooses tests/files/photo.jpg
and asserts the page receives a clean copy. Run after npm run build; needs the preview server on 4184."""
import io, os, sys, tempfile, zipfile
from playwright.sync_api import sync_playwright
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ext = os.path.join(ROOT, 'tests/out/ext/unpacked')
os.makedirs(ext, exist_ok=True)
zipfile.ZipFile(os.path.join(ROOT, 'dist/extension/filesanity-extension.zip')).extractall(ext)
fails = []
def check(c, m):
    print(('  ok   ' if c else '  FAIL ') + m)
    if not c: fails.append(m)

with sync_playwright() as p, tempfile.TemporaryDirectory() as prof:
    ctx = p.chromium.launch_persistent_context(prof, channel='chromium', headless=True, args=[f'--disable-extensions-except={ext}', f'--load-extension={ext}'])
    page = ctx.new_page()
    # Content scripts do not run on about:blank, so a real origin hosts the plain page: any served URL will do.
    page.goto(sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:4184/404', wait_until='load')
    page.evaluate('''() => { document.body.innerHTML = '<input id="f" type="file" multiple><pre id="log"></pre>'; const f = document.getElementById('f'); for (const t of ['input', 'change']) f.addEventListener(t, (e) => { log.textContent += t + ':' + [...e.target.files].map((x) => x.name + '=' + x.size).join(',') + '\\n' }) }''')
    page.set_input_files('#f', [os.path.join(ROOT, 'tests/files/photo.jpg'), os.path.join(ROOT, 'tests/files/notes.txt')])
    page.wait_for_function('document.getElementById("log").textContent.includes("change")', timeout=10000)
    log = page.inner_text('#log')
    check('photo-clean.jpg' in log and 'notes.txt=' in log, f'page sees the clean name and the untouched txt ({log.strip()})')
    check(log.count('change') == 1 and log.count('input') == 1, f'one input and one change event reach the page ({log.strip()})')
    data = bytes(page.evaluate('async () => [...new Uint8Array(await document.getElementById("f").files[0].arrayBuffer())]'))
    im = Image.open(io.BytesIO(data)); im.load()
    check(im.size == (1200, 800) and not dict(im.getexif()) and 'xmp' not in im.info and b'Okafor' not in data, f'the file the page holds is clean, {im.size}, {len(data)} B')
    ctx.close()
print('\nFAILED' if fails else '\nALL PASS', len(fails))
sys.exit(1 if fails else 0)
