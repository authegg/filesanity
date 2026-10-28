"""Fixtures for parser edge cases that once leaked: python3 tests/files/make_edge_cases.py. Invented people only."""
import io, os, struct
from PIL import Image
from PIL.TiffImagePlugin import IFDRational as R

HERE = os.path.dirname(os.path.abspath(__file__))


def jpeg(artist='Jane Secret', orientation=None):
    ex = Image.Exif()
    ex[0x013B] = artist
    if orientation:
        ex[0x0112] = orientation
    gps = ex.get_ifd(0x8825)
    gps[1], gps[2], gps[3], gps[4] = 'N', (R(52, 1), R(22, 1), R(1, 1)), 'W', (R(4, 1), R(53, 1), R(2, 1))
    out = io.BytesIO()
    Image.new('RGB', (64, 48), (40, 90, 60)).save(out, 'JPEG', exif=ex.tobytes(), quality=80)
    return out.getvalue()


def write(name, data):
    open(os.path.join(HERE, name), 'wb').write(data)


def pdf(info, extra=(), metadata=None):
    """memo.pdf's shape: one page, Info at a fixed object, `extra` objects after it, an optional uncompressed metadata stream."""
    objs = [b'<< /Type /Catalog /Pages 2 0 R' + (b' /Metadata 6 0 R' if metadata else b'') + b' >>',
            b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>']
    content = b'BT 72 770 Td /F1 18 Tf (Fee summary) Tj ET'
    objs.append(b'<< /Length %d >>\nstream\n' % len(content) + content + b'\nendstream')
    objs.append(b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
    md = metadata or b'<?xpacket begin="" id="x"?><x:xmpmeta xmlns:x="adobe:ns:meta/"/><?xpacket end="w"?>'
    objs.append(b'<< /Type /Metadata /Subtype /XML /Length %d >>\nstream\n' % len(md) + md + b'\nendstream')
    objs.append(info)
    objs.extend(extra)
    out = bytearray(b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n')
    offsets = []
    for i, o in enumerate(objs, 1):
        offsets.append(len(out))
        out += b'%d 0 obj\n' % i + o + b'\nendobj\n'
    xref = len(out)
    out += b'xref\n0 %d\n0000000000 65535 f \n' % (len(objs) + 1) + b''.join(b'%010d 00000 n \n' % o for o in offsets)
    out += b'trailer\n<< /Size %d /Root 1 0 R /Info 7 0 R >>\nstartxref\n%d\n%%%%EOF\n' % (len(objs) + 1, xref)
    return bytes(out)


XMP = '''<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/" xmlns:dc="http://purl.org/dc/elements/1.1/" pdf:Author="{author}">
<dc:creator><rdf:Seq><rdf:li>{creator}</rdf:li></rdf:Seq></dc:creator></rdf:Description></rdf:RDF></x:xmpmeta>'''

def photos_inside():
    """8. Photos placed inside documents keep their own EXIF: a Word file with a JPEG and a PNG in word/media, an
    OpenDocument text with a JPEG in Pictures/, and a PDF holding the JPEG as it was (DCTDecode)."""
    import zipfile
    from PIL.PngImagePlugin import PngInfo
    meta = PngInfo()
    meta.add_text('Author', 'Jane Secret')
    png = io.BytesIO()
    Image.new('RGB', (8, 8), (40, 90, 60)).save(png, 'PNG', pnginfo=meta)
    for src, dst, parts in (('offer.docx', 'photo-in.docx', {'word/media/image1.jpeg': jpeg(), 'word/media/image2.png': png.getvalue()}), ('fees.odt', 'photo-in.odt', {'Pictures/photo.jpg': jpeg()})):
        with zipfile.ZipFile(os.path.join(HERE, src)) as a, zipfile.ZipFile(os.path.join(HERE, dst), 'w') as b:
            for i in a.infolist():
                b.writestr(i, a.read(i.filename))
            for n, d in parts.items():
                b.writestr(n, d, zipfile.ZIP_DEFLATED)
    j = jpeg()
    write('photo-in.pdf', pdf(b'<< /Producer (Quartz) >>', [b'<< /Type /XObject /Subtype /Image /Width 64 /Height 48 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length %d >>\nstream\n' % len(j) + j + b'\nendstream']))


if __name__ == '__main__':
    # 1. A rotated photo: the clean copy keeps Orientation=6 and nothing else.
    write('rotated.jpg', jpeg(orientation=6))
    # 2a. Two 0xFF fill bytes before the APP1 Exif marker (legal padding).
    j = jpeg()
    write('fill.jpg', j[:2] + b'\xff\xff' + j[2:])
    # 2b. A motion photo: a short MP4 after the JPEG's EOI.
    mp4 = struct.pack('>I', 20) + b'ftypmp42\0\0\0\0isom' + struct.pack('>I', 40) + b'udta' + b'Jane Secret motion clip, Leeds'.ljust(32)
    write('motion.jpg', jpeg(artist='R. Okafor') + mp4)
    # 2c. Two images, MPF-indexed (as phones save depth or burst frames); the second carries its own EXIF.
    a, b = Image.open(io.BytesIO(jpeg(artist='R. Okafor'))), Image.open(io.BytesIO(jpeg()))
    out = io.BytesIO()
    a.save(out, 'MPO', save_all=True, append_images=[b], exif=a.info['exif'])
    m = out.getvalue()
    # Pillow drops the second frame's EXIF; swap that frame for one that has it (the MPF sizes go stale, which no test reads).
    write('multi.jpg', m[:m.index(b'\xff\xd8', 2 + m.index(b'\xff\xd9'))] + jpeg())
    # 3. Info values held in their own objects.
    write('info-ref.pdf', pdf(b'<< /Author 8 0 R /Title 9 0 R /Producer (Quartz) >>', [b'(Jane Secret)', b'<FEFF004A0061006E00650020005300650063007200650074002000430056>']))
    # 4. Nested parens and escapes in literal strings.
    write('nested.pdf', pdf(b'<< /Title (Report (draft (v2)) for Jane Secret) /Author (Ann \\) Byrne-Ortiz \\\\) /Subject (Fees) >>'))
    # 5. An XMP attribute holding the other quote character.
    write('quote-xmp.pdf', pdf(b'<< /Producer (Quartz) >>', metadata=('<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>' + XMP.format(author="Sean O'Brien", creator='Sean O&apos;Brien') + '<?xpacket end="w"?>').encode()))
    # 6. Bare XMP: no xpacket wrapper.
    write('bare-xmp.pdf', pdf(b'<< /Producer (Quartz) >>', metadata=XMP.format(author='Jane Secret', creator='Jane Secret').encode()))
    # 7. An encrypted PDF, linearized: its first trailer and /Encrypt sit at the start, far from the end.
    import pikepdf
    p = pikepdf.open(os.path.join(HERE, 'memo.pdf'))
    p.pages[0].Contents.write(p.pages[0].Contents.read_bytes() + b'\n' + b'% padding\n' * 1200)
    p.save(os.path.join(HERE, 'locked-lin.pdf'), linearize=True, compress_streams=False, static_id=True,
           encryption=pikepdf.Encryption(user='', owner='owner-x', R=4, aes=True))
    photos_inside()
