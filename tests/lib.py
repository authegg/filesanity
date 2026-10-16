"""src/lib on its own: tests/lib.mjs cleans every fixture in Node, this asserts the cleaned bytes.
No page, no browser. Run: python3 tests/lib.py
"""
import io, json, os, re, subprocess, sys, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out', 'lib')
CASES = ['photo.jpg', 'photo.heic', 'c2pa.heic', 'photo.webp', 'video.mp4', 'video.mov', 'memo.m4a', 'song.mp3', 'fees.odt', 'fees.ods', 'fees.odp', 'shot.png', 'c2pa.jpg', 'c2pa.png', 'offer.docx', 'fees.xlsx', 'pitch.pptx', 'memo.pdf', 'memo-z.pdf', 'objstm.pdf', 'qpdf.pdf']
failures = []


def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond:
        failures.append(msg)


LEAKS = [b'Villanueva', b'Priya', b'Delacroix', b'Lightroom', b'GIMP', b'iPhone', b'Quezon', b'Tamarind', b'DEL-2026', b'Byrne', b'confidential', b'c2pa', b'C2PA Test Signing Cert', b'14.6760', b'Mabini', b'Gate code', b'LaserJet', b'Lavf']

failures = []


def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond:
        failures.append(msg)


def verify(name, data, before, fig=''):
    ext = name.rsplit('.', 1)[1]
    leaks = [l for l in LEAKS if l in data]
    if ext == 'pdf':
        # Same length, blanked in place: the words must be gone but the structure untouched.
        check(len(data) == len(before), 'pdf: same length as the original')
        check(not leaks, f'pdf: no leaked strings ({leaks})')
        from pypdf import PdfReader
        r = PdfReader(io.BytesIO(data))
        check(len(r.pages) == 1 and 'Fee summary' in r.pages[0].extract_text(), 'pdf: opens and the page text is intact')
        info = {k: str(v).strip() for k, v in (r.metadata or {}).items()}
        check(all(not v for v in info.values()), f'pdf: Info values blank ({info})')
        xmp = r.xmp_metadata
        blank = lambda v: not ''.join(v if isinstance(v, list) else [v or '']).strip()
        # Compressed XMP and object streams are rewritten to the same compressed length, so nothing moves.
        check(xmp is None or (blank(xmp.dc_creator) and blank(xmp.xmp_creator_tool)), f'{name}: XMP creator and tool blank ({xmp and xmp.dc_creator}, {xmp and xmp.xmp_creator_tool})')
        check(fig['kept'] == 0 and 'shown and kept' not in fig['note'] and 'not cleaned' not in fig['note'], f'{name}: nothing kept, the note claims no gap ({fig})')
        tmp = os.path.join(OUT, 'probe.pdf')
        open(tmp, 'wb').write(data)
        gs = subprocess.run(['gs', '-q', '-dNOPAUSE', '-dBATCH', '-sDEVICE=nullpage', tmp], capture_output=True, text=True)
        check(gs.returncode == 0 and not gs.stdout.strip() and not gs.stderr.strip(), f'{name}: Ghostscript renders it without a warning ({(gs.stdout + gs.stderr)[:200]})')
        import pikepdf
        problems = pikepdf.open(tmp).check_pdf_syntax()
        check(not problems, f'{name}: qpdf finds no syntax problems ({problems})')
        return
    if ext in ('mp4', 'mov', 'm4a'):
        check(len(data) == len(before), f'{ext}: same length, cleaned in place')
        check(not leaks, f'{ext}: no leaked strings anywhere in the bytes ({leaks})')
        tmp = os.path.join(OUT, 'probe.' + ext)
        open(tmp, 'wb').write(data)
        probe = lambda p: subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format_tags:stream_tags', '-of', 'json', p], capture_output=True, text=True).stdout
        tags = probe(tmp)
        check(not any(t in tags for t in ('location', 'ISO6709', 'make', 'model', 'Gate code', '2026-04-11')), f'{ext}: no location, camera, title or date tags ({tags})')
        frames = lambda p: subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'framemd5', '-'], capture_output=True, text=True)
        a, b = frames(os.path.join(HERE, 'files', name)), frames(tmp)
        check(not b.stderr and a.stdout == b.stdout, f'{ext}: decodes without errors, frames and sound identical ({b.stderr[:200]})')
        return
    if ext == 'mp3':
        from mutagen.mp3 import MP3
        check(not leaks, f'mp3: no leaked strings ({leaks})')
        check(not MP3(io.BytesIO(data)).tags and b'TAG' != data[-128:-125] and not data.startswith(b'ID3'), 'mp3: no ID3v2 or ID3v1 tag left')
        tmp = os.path.join(OUT, 'probe.mp3')
        open(tmp, 'wb').write(data)
        frames = lambda p: subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-map', '0:a', '-f', 'framemd5', '-'], capture_output=True, text=True)
        a, b = frames(os.path.join(HERE, 'files', name)), frames(tmp)
        check(not b.stderr and a.stdout == b.stdout and a.stdout.count('\n') > 20, f'mp3: decodes, sound identical ({b.stderr[:200]})')
        return
    if ext == 'webp':
        from PIL import Image
        check(not leaks, f'webp: no leaked strings ({leaks})')
        im, orig = Image.open(io.BytesIO(data)), Image.open(io.BytesIO(before))
        check(im.tobytes() == orig.tobytes(), f'webp: Pillow opens it, picture identical {im.size}')
        check('exif' not in im.info and 'xmp' not in im.info, 'webp: no EXIF, no XMP')
        check(not re.findall(rb'(EXIF|XMP |C2PA)....', data[12:]) and not data[20] & 0x0C and int.from_bytes(data[4:8], 'little') == len(data) - 8, 'webp: no metadata chunks, flags cleared, RIFF size right')
        return
    if ext in ('odt', 'ods', 'odp'):
        import xml.dom.minidom
        z = zipfile.ZipFile(io.BytesIO(data))
        check(z.testzip() is None, f'{ext}: zip CRCs pass')
        first = z.infolist()[0]
        check(first.filename == 'mimetype' and first.compress_type == zipfile.ZIP_STORED, f'{ext}: mimetype stays first and stored')
        names = z.namelist()
        meta = z.read('meta.xml') + z.read('settings.xml') + z.read('META-INF/manifest.xml')
        leaks = [l for l in LEAKS + [b'Priya', b'Delacroix', b'HP '] if l in meta]
        check(not leaks, f'{ext}: no leaked strings in meta, settings or manifest ({leaks})')
        check(not [n for n in names if n.startswith('Thumbnails/')] and b'Thumbnails' not in z.read('META-INF/manifest.xml'), f'{ext}: thumbnail and its manifest entry gone')
        orig = zipfile.ZipFile(io.BytesIO(before))
        check(z.read('content.xml') == orig.read('content.xml'), f'{ext}: content.xml byte for byte')
        for n in ('meta.xml', 'settings.xml', 'META-INF/manifest.xml'):
            xml.dom.minidom.parseString(z.read(n))
        return
    if ext == 'heic':
        import pillow_heif
        check(not leaks, f'heic: no leaked strings ({leaks})')
        check(len(data) == len(before), 'heic: same length, blanked in place')
        h = pillow_heif.open_heif(io.BytesIO(data))
        from PIL import Image
        orig = pillow_heif.open_heif(io.BytesIO(before))
        check(h.size == orig.size and bytes(h.data) == bytes(orig.data), f'heic: decodes, picture identical {h.size}')
        ex = Image.Exif(); ex.load(h.info.get('exif') or b'')
        check(not dict(ex) and not ex.get_ifd(0x8825), f'heic: EXIF item has no tags ({dict(ex)})')
        check(b'Villanueva' not in (h.info.get('xmp') or b''), 'heic: XMP item empty')
        return
    if ext in ('jpg', 'png'):
        check(not leaks, f'{ext}: no leaked strings ({leaks})')
        from PIL import Image
        im = Image.open(io.BytesIO(data))
        im.load()
        check(im.size[0] > 0, f'{ext}: Pillow opens it, {im.size}')
        check(not dict(im.getexif()), f'{ext}: no EXIF')
        check('xmp' not in im.info and 'comment' not in im.info, f'{ext}: no XMP, no comment')
        if ext == 'jpg':
            check(all(a[0] not in ('APP1', 'APP11', 'APP13', 'COM') for a in im.applist), f'{ext}: only {[a[0] for a in im.applist]} segments left')
        else:
            check(not im.text and 'exif' not in im.info, f'{ext}: no text chunks, no eXIf ({im.text})')
            chunks = re.findall(rb'(?s)....(tEXt|zTXt|iTXt|eXIf|tIME|caBX)', data)
            check(not chunks, f'{ext}: no metadata chunk types in the bytes ({chunks})')
        return
    z = zipfile.ZipFile(io.BytesIO(data))
    check(z.testzip() is None, f'{ext}: zip CRCs pass')
    names = z.namelist()
    # The document's own text may name people (a letterhead, a signature); metadata lives in docProps.
    props = b''.join(z.read(n) for n in names if n.startswith('docProps/'))
    leaks = [l for l in LEAKS if l in props]
    check(not leaks, f'{ext}: no leaked strings in docProps ({leaks})')
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
        check('Offer of employment' in d.paragraphs[0].text, 'docx: python-docx opens it, body intact')
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



if __name__ == '__main__':
    rep = json.loads(subprocess.run(['node', os.path.join(HERE, 'lib.mjs'), *CASES, 'notajpeg.jpg', 'notes.txt', 'clean.jpg'], check=True, capture_output=True, text=True).stdout)
    for name in CASES:
        print(name)
        check('error' not in rep[name], f'{name}: read ({rep[name]})')
        check(rep[name].get('removed', 0) > 0, f'{name}: fields found to remove')
        check(rep[name].get('left') == [], f'{name}: the clean copy, read back, has no metadata left ({rep[name].get("left")})')
        before = open(os.path.join(HERE, 'files', name), 'rb').read()
        verify(name, open(os.path.join(OUT, name), 'rb').read(), before, rep[name])
    print('c2pa')
    for name in ('c2pa.jpg', 'c2pa.png'):
        f = dict(x.split('=', 1) for x in rep[name]['fields'])
        check(f.get('Made with (Content Credentials)') == 'make_test_images 0.33.1', f'{name}: claim generator read ({f})')
        check(f.get('Signed by') == 'C2PA Test Signing Cert', f'{name}: signer read')
        check('opened' in f.get('Edit history', '') and f.get('Made from') == '1 earlier file', f'{name}: actions and ingredient read')
    bz = subprocess.run(['node', os.path.join(HERE, 'batch.mjs')], capture_output=True, text=True)
    check(bz.returncode == 0, f'batch: a zip opens into its files with folders kept, and a record carries fingerprints and the read-back ({bz.stderr.strip()[-300:]})')
    nm = subprocess.run(['node', os.path.join(HERE, 'name.mjs')], capture_output=True, text=True)
    check(nm.returncode == 0, f'name: dates, emails and draft words in a file name are flagged ({nm.stderr.strip()[-300:]})')
    ai = subprocess.run(['node', os.path.join(HERE, 'c2pa.mjs')], capture_output=True, text=True)
    check(ai.returncode == 0, f'c2pa: an AI generator and source type are named ({ai.stderr.strip()[-200:]})')
    print('content checks: shown, kept')
    risk = json.loads(subprocess.run(['node', os.path.join(HERE, 'lib.mjs'), 'hidden.xlsx', 'hidden.docx', 'hidden.pptx', 'saves.pdf'], check=True, capture_output=True, text=True).stdout)
    want = {
        'hidden.xlsx': ['Hidden sheet=Salaries', 'Very hidden sheet=Owners', 'Hidden rows and columns=Fees: 1 row, 1 column', 'Pivot table data=943 source rows', 'Cell comments=1 comment', 'Linked workbook=file:///C:/Users/hdelacroix/Clients/Tamarind rates.xlsx'],
        'hidden.docx': ['Hidden text=1 passage', 'Deleted text still inside=1 tracked deletion', 'Fetches on opening=https://canary.example/t.png', 'Image fetched on opening=https://pixel.example/open?id=7'],
        'hidden.pptx': ['Speaker notes=on 1 slide', 'Hidden slides=1 slide', 'Embedded file=Microsoft_Excel_Worksheet.xlsx'],
        'saves.pdf': ['Earlier versions inside=1:', 'Runs JavaScript=', 'Contacts on opening=https://track.example/o?doc=31'],
    }
    for name, fields in want.items():
        got = risk[name].get('fields', [])
        for w in fields:
            check(any(g.startswith(w) for g in got), f'{name}: reports {w}')
        check('filesanity.com' not in ' '.join(got), f'{name}: an ordinary hyperlink is not reported') if name == 'hidden.docx' else None
        out = open(os.path.join(OUT, name), 'rb').read()
        if name.endswith('pdf'):
            check(out.count(b'startxref') == 2 and b'/OpenAction' in out and len(out) == os.path.getsize(os.path.join(HERE, 'files', name)), 'saves.pdf: cleaning leaves the saves and actions as they are')
        else:
            z = zipfile.ZipFile(io.BytesIO(out))
            check(z.testzip() is None, f'{name}: cleaned copy is a sound zip')
    z = zipfile.ZipFile(os.path.join(OUT, 'hidden.xlsx'))
    check(b'state="hidden"' in z.read('xl/workbook.xml') and 'xl/pivotCache/pivotCacheRecords1.xml' in z.namelist(), 'hidden.xlsx: the hidden sheet and pivot cache are left in the file')
    check(b'w:delText' in zipfile.ZipFile(os.path.join(OUT, 'hidden.docx')).read('word/document.xml'), 'hidden.docx: the tracked deletion is left in the document')
    lk = json.loads(subprocess.run(['node', os.path.join(HERE, 'lib.mjs'), 'locked.pdf'], check=True, capture_output=True, text=True).stdout)['locked.pdf']
    check(lk['removed'] == 0 and lk['kept'] == 1 and 'encrypted' in lk['note'] and 'not cleaned' in lk['note'], f'locked.pdf: an encrypted PDF is shown as not cleaned, nothing blanked ({lk})')
    check(open(os.path.join(OUT, 'locked.pdf'), 'rb').read() == open(os.path.join(HERE, 'files', 'locked.pdf'), 'rb').read(), 'locked.pdf: left byte for byte')
    print('refusals')
    check('does not begin like a JPEG' in rep['notajpeg.jpg'].get('error', ''), 'a .jpg that is not a JPEG is refused by its bytes')
    check('cannot read .txt' in rep['notes.txt'].get('error', ''), '.txt is refused in plain words')
    check(rep['clean.jpg'].get('removed') == 0, 'an already clean JPEG reports nothing to remove')
    print(f"\n{len(failures)} failures" if failures else '\nall passed')
    sys.exit(1 if failures else 0)
