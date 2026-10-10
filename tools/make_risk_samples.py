"""Fixtures for the content checks, video, audio, WebP, HEIC Content Credentials and OpenDocument, in tests/files.
Every name, place and address in them is invented. Run: python3 tools/make_risk_samples.py
"""
import io, os, struct, subprocess, sys, zipfile

TST = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tests', 'files')


def patch(path, edits, add=None):
    """Rewrite a zip: edits maps part name -> function(str) -> str; add maps new part name -> bytes."""
    src = zipfile.ZipFile(path)
    parts = {n: src.read(n) for n in src.namelist()}
    src.close()
    for name, fn in edits.items():
        parts[name] = fn(parts[name].decode()).encode()
    parts.update(add or {})
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as out:
        for n, b in parts.items():
            out.writestr(n, b)


def xlsx():
    import openpyxl
    from openpyxl.comments import Comment
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Fees'
    ws.append(['Client', 'Fee'])
    ws.append(['Tamarind Freight', 4200])
    ws.append(['Internal floor', 3100])
    ws.row_dimensions[3].hidden = True
    ws.column_dimensions['C'].hidden = True
    ws['B2'].comment = Comment('Do not go below 3,100', 'H. Delacroix')
    wb.create_sheet('Salaries').sheet_state = 'hidden'
    wb.create_sheet('Owners').sheet_state = 'veryHidden'
    path = os.path.join(TST, 'hidden.xlsx')
    wb.save(path)
    records = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><pivotCacheRecords xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="943"/>'
    link_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                 '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/externalLinkPath" '
                 'Target="file:///C:/Users/hdelacroix/Clients/Tamarind%20rates.xlsx" TargetMode="External"/></Relationships>')
    patch(path, {}, {'xl/pivotCache/pivotCacheRecords1.xml': records.encode(), 'xl/externalLinks/_rels/externalLink1.xml.rels': link_rels.encode()})


def docx():
    import docx as d
    doc = d.Document()
    doc.add_paragraph('Offer of employment')
    p = doc.add_paragraph('Salary as agreed. ')
    p.add_run('Approved up to 95,000.').font.hidden = True
    doc.add_paragraph('PICTUREHERE')
    path = os.path.join(TST, 'hidden.docx')
    doc.save(path)
    deleted = ('<w:p><w:del w:id="91" w:author="H. Delacroix" w:date="2026-04-11T09:00:00Z"><w:r><w:delText>Salary floor 88,000</w:delText></w:r></w:del>'
               '<w:ins w:id="92" w:author="H. Delacroix" w:date="2026-04-11T09:00:00Z"><w:r><w:t>Salary as agreed.</w:t></w:r></w:ins></w:p>')
    field = ('<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> INCLUDEPICTURE "https://canary.example/t.png" \\d </w:instrText></w:r>'
             '<w:r><w:fldChar w:fldCharType="end"/></w:r>')
    def body(x):
        x = x.replace('<w:t>PICTUREHERE</w:t>', '<w:t></w:t>')
        i = x.rindex('<w:sectPr')
        return x[:i] + deleted + '<w:p>' + field + '</w:p>' + x[i:]
    rel = ('<Relationship Id="rId900" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" '
           'Target="https://pixel.example/open?id=7" TargetMode="External"/>'
           '<Relationship Id="rId901" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" '
           'Target="https://filesanity.com/" TargetMode="External"/></Relationships>')
    patch(path, {'word/document.xml': body, 'word/_rels/document.xml.rels': lambda x: x.replace('</Relationships>', rel)})


def pptx():
    from pptx import Presentation
    p = Presentation()
    s1 = p.slides.add_slide(p.slide_layouts[5])
    s1.shapes.title.text = 'Pitch'
    s1.notes_slide.notes_text_frame.text = 'Say we can go to 20% off if they push.'
    s2 = p.slides.add_slide(p.slide_layouts[5])
    s2.shapes.title.text = 'Margins, internal'
    s2._element.set('show', '0')
    path = os.path.join(TST, 'hidden.pptx')
    p.save(path)
    patch(path, {}, {'ppt/embeddings/Microsoft_Excel_Worksheet.xlsx': open(os.path.join(TST, 'hidden.xlsx'), 'rb').read()})


def pdf():
    """One page, saved twice (an incremental update), with an open action that reaches a web address and some JavaScript."""
    objs = [
        b'<< /Type /Catalog /Pages 2 0 R /OpenAction 5 0 R >>',
        b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R >>',
        b'<< /Length 44 >>\nstream\nBT /F1 12 Tf 20 100 Td (Fee summary) Tj ET\nendstream',
        b'<< /S /URI /URI (https://track.example/o?doc=31) /Next << /S /JavaScript /JS (app.alert(1)) >> >>',
    ]
    out = io.BytesIO()
    out.write(b'%PDF-1.7\n')
    offs = []
    for i, o in enumerate(objs, 1):
        offs.append(out.tell())
        out.write(b'%d 0 obj\n' % i + o + b'\nendobj\n')
    x = out.tell()
    out.write(b'xref\n0 6\n0000000000 65535 f \n' + b''.join(b'%010d 00000 n \n' % o for o in offs))
    out.write(b'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n' % x)
    # The update replaces the page text; the first version stays in the file above it.
    o4 = out.tell()
    out.write(b'4 0 obj\n<< /Length 41 >>\nstream\nBT /F1 12 Tf 20 100 Td (Fee: see) Tj ET\nendstream\nendobj\n')
    x2 = out.tell()
    out.write(b'xref\n4 1\n%010d 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R /Prev %d >>\nstartxref\n%d\n%%%%EOF\n' % (o4, x, x2))
    open(os.path.join(TST, 'saves.pdf'), 'wb').write(out.getvalue())


def video():
    base = ['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc=size=160x120:rate=10:duration=1', '-f', 'lavfi', '-i', 'sine=duration=1',
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', '-metadata', 'creation_time=2026-04-11T09:03:51Z']
    subprocess.run(base + ['-metadata', 'location=+14.6760+121.0437/', '-metadata', 'title=Gate code walkthrough', os.path.join(TST, 'video.mp4')], check=True)
    subprocess.run(base + ['-movflags', 'use_metadata_tags', '-metadata', 'com.apple.quicktime.location.ISO6709=+14.6760+121.0437+012.000/',
                           '-metadata', 'com.apple.quicktime.make=Apple', '-metadata', 'com.apple.quicktime.model=iPhone 15 Pro',
                           '-metadata', 'com.apple.quicktime.software=18.4', os.path.join(TST, 'video.mov')], check=True)


def jumbf():
    """The C2PA store from tests/files/c2pa.jpg (CA.jpg, contentauth/c2pa-rs fixtures), joined from its APP11 segments."""
    src = open(os.path.join(TST, 'c2pa.jpg'), 'rb').read()
    i, out = 2, b''
    while src[i + 1] != 0xDA:
        n = struct.unpack('>H', src[i + 2:i + 4])[0]
        if src[i + 1] == 0xEB:
            out += src[i + 4 + 8:i + 2 + n] if not out else src[i + 4 + 16:i + 2 + n]
        i += 2 + n
    return out


def webp():
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from make_samples import XMP, exif_bytes
    from PIL import Image
    buf = io.BytesIO()
    Image.new('RGB', (64, 48), (180, 90, 40)).save(buf, 'WEBP', exif=exif_bytes(), xmp=XMP, quality=60)
    b = bytearray(buf.getvalue())
    j = jumbf()
    b += b'C2PA' + struct.pack('<I', len(j)) + j + (b'\0' if len(j) & 1 else b'')
    b[4:8] = struct.pack('<I', len(b) - 8)
    open(os.path.join(TST, 'photo.webp'), 'wb').write(bytes(b))


def heic_c2pa():
    j = jumbf()
    box = struct.pack('>I', 8 + 16 + len(j)) + b'uuid' + bytes.fromhex('d8fec3d61b0e483c92975828877ec481') + j
    open(os.path.join(TST, 'c2pa.heic'), 'wb').write(open(os.path.join(TST, 'photo.heic'), 'rb').read() + box)


def audio():
    sine = ['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1']
    subprocess.run(sine + ['-c:a', 'aac', '-metadata', 'title=14 Mabini Street', '-metadata', 'creation_time=2026-04-11T09:03:51Z',
                           '-metadata', 'location=+14.6760+121.0437/', os.path.join(TST, 'memo.m4a')], check=True)
    mp3 = os.path.join(TST, 'song.mp3')
    subprocess.run(sine + ['-c:a', 'libmp3lame', '-id3v2_version', '3', '-write_id3v1', '1', '-metadata', 'title=Demo for Tamarind',
                           '-metadata', 'artist=R. Villanueva', '-metadata', 'comment=rough mix, do not share', mp3], check=True)
    from mutagen.id3 import ID3, APIC, PRIV, TXXX
    t = ID3(mp3)
    t.add(APIC(encoding=3, mime='image/jpeg', type=3, desc='cover', data=b'\xff\xd8\xff\xe0' + b'\0' * 64))
    t.add(PRIV(owner='www.example.com/user', data=b'Villanueva'))
    t.add(TXXX(encoding=3, desc='Studio', text='Quezon City'))
    t.save(mp3, v1=2, v2_version=3)


def odf():
    ns = ('xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" '
          'xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" '
          'xmlns:presentation="urn:oasis:names:tc:opendocument:xmlns:presentation:1.0" xmlns:dc="http://purl.org/dc/elements/1.1/" '
          'xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" '
          'xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0" office:version="1.3"')
    meta = (f'<?xml version="1.0" encoding="UTF-8"?><office:document-meta {ns}><office:meta>'
            '<meta:initial-creator>Priya Raman</meta:initial-creator><dc:creator>H. Delacroix</dc:creator>'
            '<meta:creation-date>2026-04-11T09:03:51</meta:creation-date><dc:date>2026-04-12T10:00:00</dc:date>'
            '<meta:editing-duration>PT2H14M5S</meta:editing-duration><meta:editing-cycles>9</meta:editing-cycles>'
            '<meta:generator>LibreOffice/24.8.2.1$Windows_X86_64</meta:generator><dc:title>Tamarind fees</dc:title>'
            '<meta:user-defined meta:name="Client">Tamarind Freight</meta:user-defined>'
            '<meta:document-statistic meta:page-count="1" meta:word-count="12"/></office:meta></office:document-meta>')
    settings = (f'<?xml version="1.0" encoding="UTF-8"?><office:document-settings {ns}><office:settings><config:config-item-set config:name="ooo:configuration-settings">'
                '<config:config-item config:name="PrinterName" config:type="string">HP LaserJet Delacroix 3F</config:config-item>'
                '<config:config-item config:name="PrinterSetup" config:type="base64Binary">SFAgTGFzZXJKZXQgRGVsYWNyb2l4</config:config-item>'
                '</config:config-item-set></office:settings></office:document-settings>')
    bodies = {
        'odt': ('application/vnd.oasis.opendocument.text', '<office:text><text:tracked-changes><text:changed-region text:id="c1"><text:deletion>'
                '<office:change-info><dc:creator>H. Delacroix</dc:creator></office:change-info><text:p>Floor 88,000</text:p></text:deletion>'
                '</text:changed-region></text:tracked-changes><text:p>Offer of employment<office:annotation><dc:creator>H. Delacroix</dc:creator>'
                '<text:p>check with Priya</text:p></office:annotation></text:p><text:p><text:hidden-text text:is-hidden="true" text:string-value="Approved to 95,000"/></text:p>'
                '<text:p><draw:frame><draw:image xlink:href="https://pixel.example/odt?id=3" xlink:show="embed"/></draw:frame></text:p></office:text>'),
        'ods': ('application/vnd.oasis.opendocument.spreadsheet', '<office:spreadsheet><table:table table:name="Fees"><table:table-row><table:table-cell><text:p>Tamarind</text:p>'
                '</table:table-cell></table:table-row><table:table-row table:visibility="collapse"><table:table-cell><text:p>Floor 3,100</text:p></table:table-cell>'
                '</table:table-row></table:table></office:spreadsheet>'),
        'odp': ('application/vnd.oasis.opendocument.presentation', '<office:presentation><draw:page draw:name="p1"><draw:frame><draw:text-box><text:p>Pitch</text:p>'
                '</draw:text-box></draw:frame><presentation:notes><draw:page-thumbnail/><draw:frame><draw:text-box><text:p>Say 20% if they push.</text:p>'
                '</draw:text-box></draw:frame></presentation:notes></draw:page></office:presentation>'),
    }
    png = bytes.fromhex('89504e470d0a1a0a0000000d4948445200000001000000010806000000'
                        '1f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082')
    for ext, (mime, body) in bodies.items():
        content = f'<?xml version="1.0" encoding="UTF-8"?><office:document-content {ns}><office:body>{body}</office:body></office:document-content>'
        manifest = ('<?xml version="1.0" encoding="UTF-8"?><manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3">'
                    f'<manifest:file-entry manifest:full-path="/" manifest:media-type="{mime}"/>'
                    '<manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>'
                    '<manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>'
                    '<manifest:file-entry manifest:full-path="settings.xml" manifest:media-type="text/xml"/>'
                    '<manifest:file-entry manifest:full-path="Thumbnails/thumbnail.png" manifest:media-type="image/png"/></manifest:manifest>')
        path = os.path.join(TST, f'fees.{ext}')
        with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
            z.writestr(zipfile.ZipInfo('mimetype'), mime, compress_type=zipfile.ZIP_STORED)
            for name, data in (('content.xml', content), ('meta.xml', meta), ('settings.xml', settings), ('META-INF/manifest.xml', manifest)):
                z.writestr(name, data)
            z.writestr('Thumbnails/thumbnail.png', png)
            if ext == 'ods':
                z.writestr('Object 1/content.xml', f'<?xml version="1.0"?><office:document-content {ns}/>')


def objstm_pdf():
    """The way Word and Acrobat save: the Info dictionary inside a compressed object stream, a compressed XMP stream,
    and a cross-reference stream instead of a table."""
    import zlib
    xmp = (b'<?xpacket begin="\xef\xbb\xbf" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">'
           b'<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:pdf="http://ns.adobe.com/pdf/1.3/">'
           b'<dc:creator><rdf:Seq><rdf:li>Priya Raman</rdf:li></rdf:Seq></dc:creator><xmp:CreatorTool>Microsoft Word for Microsoft 365</xmp:CreatorTool>'
           b'<pdf:Producer>Microsoft Word for Microsoft 365</pdf:Producer><dc:title><rdf:Alt><rdf:li xml:lang="x-default">Tamarind fees, internal</rdf:li></rdf:Alt></dc:title>'
           b'</rdf:Description></rdf:RDF></x:xmpmeta>' + b' ' * 400 + b'<?xpacket end="w"?>')
    inner = {
        1: b'<< /Type /Catalog /Pages 2 0 R /Metadata 6 0 R >>',
        2: b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        3: b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>',
        5: b'<< /Author (Priya Raman) /Creator (Microsoft Word for Microsoft 365) /Producer (Microsoft Word for Microsoft 365) /Title (Tamarind fees, internal) /CreationDate (D:20260411090351+08\'00\') >>',
    }
    head, body, off = b'', b'', 0
    for n, o in inner.items():
        head += b'%d %d ' % (n, off)
        body += o + b'\n'
        off += len(o) + 1
    first = len(head)
    objstm = zlib.compress(head + body)
    page = b'BT /F1 12 Tf 20 100 Td (Fee summary) Tj ET'
    xz = zlib.compress(xmp)
    out = io.BytesIO()
    out.write(b'%PDF-1.7\n%\xe2\xe3\xcf\xd3\n')
    offs = {}
    def obj(n, data):
        offs[n] = out.tell()
        out.write(b'%d 0 obj\n' % n + data + b'\nendobj\n')
    obj(4, b'<< /Length %d >>\nstream\n' % len(page) + page + b'\nendstream')
    obj(6, b'<< /Type /Metadata /Subtype /XML /Filter /FlateDecode /Length %d >>\nstream\n' % len(xz) + xz + b'\nendstream')
    obj(7, b'<< /Type /ObjStm /N %d /First %d /Filter /FlateDecode /Length %d >>\nstream\n' % (len(inner), first, len(objstm)) + objstm + b'\nendstream')
    # Cross-reference stream: type 1 = at an offset, type 2 = inside object stream 7 at an index.
    rows = [(0, 0, 255)]
    idx = {n: i for i, n in enumerate(inner)}
    for n in range(1, 9):
        if n in inner: rows.append((2, 7, idx[n]))
        elif n == 8: rows.append((1, out.tell(), 0))
        else: rows.append((1, offs[n], 0))
    data = b''.join(struct.pack('>BIH', *r) for r in rows)
    x = out.tell()
    out.write(b'8 0 obj\n<< /Type /XRef /Size 9 /W [1 4 2] /Root 1 0 R /Info 5 0 R /Length %d >>\nstream\n' % len(data) + data + b'\nendstream\nendobj\n')
    out.write(b'startxref\n%d\n%%%%EOF\n' % x)
    open(os.path.join(TST, 'objstm.pdf'), 'wb').write(out.getvalue())



def locked_pdf():
    from pypdf import PdfWriter
    w = PdfWriter(clone_from=os.path.join(TST, 'memo.pdf'))
    w.encrypt(user_password='', owner_password='owner-x', algorithm='AES-128')
    w.write(os.path.join(TST, 'locked.pdf'))



def qpdf_pdf():
    """memo-z.pdf as qpdf writes it: objects, the Info dictionary included, packed into object streams."""
    import pikepdf
    p = pikepdf.open(os.path.join(TST, 'memo-z.pdf'))
    p.save(os.path.join(TST, 'qpdf.pdf'), object_stream_mode=pikepdf.ObjectStreamMode.generate, compress_streams=True, deterministic_id=True)


if __name__ == '__main__':
    xlsx(); docx(); pptx(); pdf(); video(); webp(); heic_c2pa(); audio(); odf(); objstm_pdf(); locked_pdf(); qpdf_pdf()
    print('made', [n for n in sorted(os.listdir(TST)) if n.split('.')[0] in ('hidden', 'saves', 'video', 'photo', 'c2pa', 'memo', 'song', 'fees', 'objstm', 'locked', 'qpdf')])
