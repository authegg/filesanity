"""Strip every file in tests/files through the built page and assert the
metadata is gone and the file still opens.

Needs the preview server: npx vite preview --port 4184
Run: python3 tests/run.py [url]
"""
import io
import json
import os
import re
import sys
import zipfile

from playwright.sync_api import sync_playwright

URL = next((a for a in sys.argv[1:] if a.startswith('http')), 'http://127.0.0.1:4184/')
HERE = os.path.dirname(os.path.abspath(__file__))
FILES = os.path.join(HERE, 'files')
OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)

CASES = ['photo.jpg', 'shot.png', 'offer.docx', 'fees.xlsx', 'pitch.pptx', 'memo.pdf']
LEAKS = [b'Okafor', b'Priya', b'Delacroix', b'Lightroom', b'GIMP', b'iPhone', b'Oxford', b'Northwind', b'DEL-2026', b'Byrne', b'confidential']

failures = []


def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond:
        failures.append(msg)


def verify(name, data, before):
    ext = name.rsplit('.', 1)[1]
    leaks = [l for l in LEAKS if l in data]
    if ext == 'pdf':
        # Same length, blanked in place: the words must be gone but the structure untouched.
        check(len(data) == len(before), 'pdf: same length as the original')
        check(not leaks, f'pdf: no leaked strings ({leaks})')
        from pypdf import PdfReader
        r = PdfReader(io.BytesIO(data))
        check(len(r.pages) == 1 and 'Internal memo' in r.pages[0].extract_text(), 'pdf: opens and the page text is intact')
        info = {k: str(v).strip() for k, v in (r.metadata or {}).items()}
        check(all(not v for v in info.values()), f'pdf: Info values blank ({info})')
        xmp = r.xmp_metadata
        blank = lambda v: not ''.join(v if isinstance(v, list) else [v or '']).strip()
        check(xmp is None or (blank(xmp.dc_creator) and blank(xmp.xmp_creator_tool)), f'pdf: XMP creator and tool blank ({xmp and xmp.dc_creator}, {xmp and xmp.xmp_creator_tool})')
        return
    check(not leaks, f'{ext}: no leaked strings ({leaks})')
    if ext in ('jpg', 'png'):
        from PIL import Image
        im = Image.open(io.BytesIO(data))
        im.load()
        check(im.size[0] > 0, f'{ext}: Pillow opens it, {im.size}')
        check(not dict(im.getexif()), f'{ext}: no EXIF')
        check('xmp' not in im.info and 'comment' not in im.info, f'{ext}: no XMP, no comment')
        if ext == 'jpg':
            check(all(a[0] not in ('APP1', 'APP13', 'COM') for a in im.applist), f'{ext}: only {[a[0] for a in im.applist]} segments left')
        else:
            check(not im.text and 'exif' not in im.info, f'{ext}: no text chunks, no eXIf ({im.text})')
            chunks = re.findall(rb'(?s)....(tEXt|zTXt|iTXt|eXIf|tIME)', data)
            check(not chunks, f'{ext}: no metadata chunk types in the bytes ({chunks})')
        return
    z = zipfile.ZipFile(io.BytesIO(data))
    check(z.testzip() is None, f'{ext}: zip CRCs pass')
    names = z.namelist()
    core = z.read('docProps/core.xml')
    check(b'<dc:creator' not in core and b'lastModifiedBy' not in core and b'revision' not in core, f'{ext}: core.xml empty')
    app = z.read('docProps/app.xml')
    check(b'Company' not in app and b'TotalTime' not in app and b'Application' not in app, f'{ext}: app.xml empty')
    check(b'ClientMatter' not in z.read('docProps/custom.xml'), f'{ext}: custom.xml empty')
    check(not [n for n in names if 'thumbnail' in n.lower()], f'{ext}: no thumbnail part')
    check(all(i.date_time[:3] == (1980, 1, 1) for i in z.infolist()), f'{ext}: zip entry timestamps reset')
    if ext == 'docx':
        import docx
        d = docx.Document(io.BytesIO(data))
        check('Offer letter draft' in d.paragraphs[0].text, 'docx: python-docx opens it, body intact')
        check(not d.core_properties.author and not d.core_properties.last_modified_by, 'docx: core properties empty')
    elif ext == 'xlsx':
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(data))
        check(wb.active['B2'].value == 4200, 'xlsx: openpyxl opens it, cell intact')
        check(wb.properties.creator in (None, '', 'openpyxl'), 'xlsx: creator empty (openpyxl fills its own name when the field is absent)')
    else:
        from pptx import Presentation
        p = Presentation(io.BytesIO(data))
        check(p.slides[0].shapes.title.text == 'Pitch, internal only', 'pptx: python-pptx opens it, title intact')
        check(not p.core_properties.author, 'pptx: author empty')


with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(accept_downloads=True)
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    requests = []
    # blob: URLs are the page's own object URLs (thumbnail, download); they never leave the browser.
    page.on('request', lambda r: r.url.startswith('blob:') or requests.append(r.url))
    page.goto(URL, wait_until='load')
    page.wait_for_timeout(500)
    n0 = len(requests)
    for name in CASES:
        print(name)
        path = os.path.join(FILES, name)
        page.set_input_files('input[type=file]', path)
        page.wait_for_selector('button:has-text("Strip ")', timeout=8000)
        with page.expect_download() as dl:
            page.click('button:has-text("Strip ")')
        out = os.path.join(OUT, dl.value.suggested_filename)
        dl.value.save_as(out)
        page.wait_for_selector('text=Before:', timeout=8000)
        with open(out, 'rb') as f:
            data = f.read()
        with open(path, 'rb') as f:
            before = f.read()
        check(dl.value.suggested_filename == name.replace('.', '-clean.'), f'named {dl.value.suggested_filename}')
        verify(name, data, before)
    # Edge states.
    page.set_input_files('input[type=file]', os.path.join(FILES, 'clean.jpg'))
    page.wait_for_timeout(600)
    check('Nothing to remove' in page.inner_text('figure'), 'clean.jpg: nothing to remove')
    page.set_input_files('input[type=file]', os.path.join(FILES, 'notes.txt'))
    page.wait_for_timeout(600)
    check('cannot read .txt' in page.inner_text('figure'), 'notes.txt: unsupported')
    check(not errors, f'no page errors ({errors})')
    check(len(requests) == n0, f'no network requests during {len(CASES)} reads and cleans ({requests[n0:]})')
    b.close()

json.dump({'failures': failures}, open(os.path.join(OUT, 'result.json'), 'w'))
print('\nFAILED' if failures else '\nALL PASS', len(failures))
sys.exit(1 if failures else 0)
