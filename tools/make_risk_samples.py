"""Fixtures for the content checks and video: tests/files/hidden.xlsx, hidden.docx, hidden.pptx, saves.pdf, video.mp4, video.mov.
Every name, place and address in them is invented. Run: python3 tools/make_risk_samples.py
"""
import io, os, subprocess, zipfile

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


if __name__ == '__main__':
    xlsx(); docx(); pptx(); pdf(); video()
    print('made', [n for n in sorted(os.listdir(TST)) if n.split('.')[0] in ('hidden', 'saves', 'video')])
