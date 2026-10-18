"""Fixtures for removing comments and accepting tracked changes: review.docx, review.xlsx, review.pptx, review.odt in
tests/files. Every name in them is invented. Run: python3 tools/make_review_samples.py
"""
import os, sys, zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_risk_samples import TST, patch

NOTE = 'Marguerite Okonkwo-Hale'   # wrote the comments
EDIT = 'Teodoro Rask'              # made the tracked changes
CT_XML = 'application/vnd.openxmlformats-officedocument.'
REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/'
W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'


def add_rels(x, *rels):
    return x.replace('</Relationships>', ''.join(f'<Relationship Id="{i}" Type="{t}" Target="{g}"/>' for i, t, g in rels) + '</Relationships>')


def add_types(x, *parts):
    return x.replace('</Types>', ''.join(f'<Override PartName="{p}" ContentType="{c}"/>' for p, c in parts) + '</Types>')


def docx():
    import docx as d
    doc = d.Document()
    doc.add_paragraph('BODYHERE')
    path = os.path.join(TST, 'review.docx')
    doc.save(path)
    a = f'w:author="{EDIT}" w:date="2026-05-02T10:00:00Z"'
    body = (
        '<w:p><w:r><w:t>Offer letter for review</w:t></w:r></w:p>'
        f'<w:p><w:r><w:t xml:space="preserve">The salary is </w:t></w:r><w:del w:id="11" {a}><w:r><w:delText>88,000</w:delText></w:r></w:del>'
        f'<w:ins w:id="12" {a}><w:r><w:t>92,000</w:t></w:r></w:ins><w:r><w:t xml:space="preserve"> per year.</w:t></w:r></w:p>'
        '<w:p><w:commentRangeStart w:id="0"/><w:r><w:t>Start date is May.</w:t></w:r><w:commentRangeEnd w:id="0"/>'
        '<w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:commentReference w:id="0"/></w:r></w:p>'
        f'<w:p><w:r><w:rPr><w:b/><w:rPrChange w:id="13" {a}><w:rPr/></w:rPrChange></w:rPr><w:t>Bold now.</w:t></w:r></w:p>'
        f'<w:p><w:moveFromRangeStart w:id="14" w:name="move1" {a}/><w:moveFrom w:id="15" {a}><w:r><w:t>Moved sentence.</w:t></w:r></w:moveFrom><w:moveFromRangeEnd w:id="14"/></w:p>'
        f'<w:p><w:pPr><w:rPr><w:ins w:id="16" {a}/></w:rPr></w:pPr><w:moveToRangeStart w:id="17" w:name="move1" {a}/><w:moveTo w:id="18" {a}><w:r><w:t>Moved sentence.</w:t></w:r></w:moveTo><w:moveToRangeEnd w:id="17"/></w:p>'
        '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/></w:tblPr><w:tblGrid><w:gridCol w:w="4000"/></w:tblGrid>'
        '<w:tr><w:tc><w:p><w:r><w:t>Row that stays</w:t></w:r></w:p></w:tc></w:tr>'
        f'<w:tr><w:trPr><w:del w:id="19" {a}/></w:trPr><w:tc><w:p><w:r><w:t>Row that was deleted</w:t></w:r></w:p></w:tc></w:tr></w:tbl>'
        '<w:p><w:r><w:t>Closing line.</w:t></w:r></w:p>')
    comments = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:comments {W}><w:comment w:id="0" w:author="{NOTE}" w:date="2026-05-01T09:00:00Z" w:initials="MO">'
                '<w:p><w:r><w:annotationRef/></w:r><w:r><w:t>Can we push this to June?</w:t></w:r></w:p></w:comment></w:comments>')
    W15 = 'xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml"'
    extended = f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w15:commentsEx {W15}><w15:commentEx w15:paraId="1A2B3C4D" w15:done="0"/></w15:commentsEx>'
    people = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w15:people {W15}><w15:person w15:author="{NOTE}">'
              '<w15:presenceInfo w15:providerId="None" w15:userId="mokonkwo@example.org"/></w15:person></w15:people>')
    patch(path, {
        'word/document.xml': lambda x: x[:x.index('<w:p>')] + body + x[x.index('</w:p>') + 6:],
        'word/settings.xml': lambda x: x.replace('<w:zoom', '<w:trackRevisions/><w:zoom', 1),
        'word/_rels/document.xml.rels': lambda x: add_rels(x, ('rIdC1', REL + 'comments', 'comments.xml'),
                                                            ('rIdC2', 'http://schemas.microsoft.com/office/2011/relationships/commentsExtended', 'commentsExtended.xml'),
                                                            ('rIdC3', 'http://schemas.microsoft.com/office/2011/relationships/people', 'people.xml')),
        '[Content_Types].xml': lambda x: add_types(x, ('/word/comments.xml', CT_XML + 'wordprocessingml.comments+xml'),
                                                   ('/word/commentsExtended.xml', CT_XML + 'wordprocessingml.commentsExtended+xml'),
                                                   ('/word/people.xml', CT_XML + 'wordprocessingml.people+xml')),
    }, {'word/comments.xml': comments.encode(), 'word/commentsExtended.xml': extended.encode(), 'word/people.xml': people.encode()})


def xlsx():
    import openpyxl
    from openpyxl.comments import Comment
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Fees'
    ws.append(['Client', 'Fee'])
    ws.append(['Kestrel Ltd', 5100])
    ws['B2'].comment = Comment('Check with finance', NOTE)
    path = os.path.join(TST, 'review.xlsx')
    wb.save(path)
    S = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
    T = 'xmlns="http://schemas.microsoft.com/office/spreadsheetml/2018/threadedcomments"'
    person = f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><personList {T}><person displayName="{NOTE}" id="{{00000000-0000-0000-0000-000000000001}}" userId="mokonkwo@example.org" providerId="AD"/></personList>'
    thread = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><ThreadedComments {T}><threadedComment ref="B2" dT="2026-05-01T09:00:00.00" '
              'personId="{00000000-0000-0000-0000-000000000001}" id="{00000000-0000-0000-0000-000000000002}"><text>Check with finance</text></threadedComment></ThreadedComments>')
    headers = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><headers {S} xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" guid="{{00000000-0000-0000-0000-0000000000A1}}">'
               f'<header guid="{{00000000-0000-0000-0000-0000000000A2}}" dateTime="2026-05-02T10:00:00" maxSheetId="2" userName="{EDIT}" r:id="rId1"><sheetIdMap count="1"><sheetId val="1"/></sheetIdMap></header></headers>')
    log = f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><revisions {S}><rcc rId="1" sId="1"><nc r="B2" t="n"><v>5100</v></nc><oc r="B2" t="n"><v>4800</v></oc></rcc></revisions>'
    users = f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><users {S} count="1"><userInfo guid="{{00000000-0000-0000-0000-0000000000A3}}" name="{EDIT}" id="1" dateTime="2026-05-02T10:00:00"/></users>'
    head_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                 f'<Relationship Id="rId1" Type="{REL}revisionLog" Target="revisionLog1.xml"/></Relationships>')
    # A form button in the same VML as the comment box: it must survive.
    button = ('<v:shape xmlns:v="urn:schemas-microsoft-com:vml" xmlns:x="urn:schemas-microsoft-com:office:excel" id="_x0000_s2049" type="#_x0000_t201" '
              'style="position:absolute;width:60pt;height:20pt"><x:ClientData ObjectType="Button"><x:Anchor>3, 0, 3, 0, 4, 0, 4, 0</x:Anchor></x:ClientData></v:shape>')
    z = zipfile.ZipFile(path)
    vml = next(n for n in z.namelist() if n.endswith('.vml'))
    rels = z.read('xl/worksheets/_rels/sheet1.xml.rels').decode()
    z.close()
    patch(path, {
        vml: lambda x: x[:x.rindex('</xml>')] + button + '</xml>',
        'xl/worksheets/_rels/sheet1.xml.rels': lambda x: add_rels(x, ('rIdT1', 'http://schemas.microsoft.com/office/2017/10/relationships/threadedComment', '../threadedComments/threadedComment1.xml')),
        'xl/_rels/workbook.xml.rels': lambda x: add_rels(x, ('rIdP1', 'http://schemas.microsoft.com/office/2017/10/relationships/person', 'persons/person.xml'),
                                                         ('rIdR1', REL + 'revisionHeaders', 'revisions/revisionHeaders.xml'),
                                                         ('rIdR2', REL + 'usernames', 'revisions/userNames.xml')),
        '[Content_Types].xml': lambda x: add_types(x, ('/xl/persons/person.xml', 'application/vnd.ms-excel.person+xml'),
                                                   ('/xl/threadedComments/threadedComment1.xml', 'application/vnd.ms-excel.threadedcomments+xml'),
                                                   ('/xl/revisions/revisionHeaders.xml', CT_XML + 'spreadsheetml.revisionHeaders+xml'),
                                                   ('/xl/revisions/revisionLog1.xml', CT_XML + 'spreadsheetml.revisionLog+xml'),
                                                   ('/xl/revisions/userNames.xml', CT_XML + 'spreadsheetml.userNames+xml')),
    }, {'xl/persons/person.xml': person.encode(), 'xl/threadedComments/threadedComment1.xml': thread.encode(),
        'xl/revisions/revisionHeaders.xml': headers.encode(), 'xl/revisions/revisionLog1.xml': log.encode(), 'xl/revisions/userNames.xml': users.encode(),
        'xl/revisions/_rels/revisionHeaders.xml.rels': head_rels.encode()})
    assert 'comments' in rels


def pptx():
    from pptx import Presentation
    p = Presentation()
    s = p.slides.add_slide(p.slide_layouts[0])
    s.shapes.title.text = 'Quarterly plan'
    path = os.path.join(TST, 'review.pptx')
    p.save(path)
    P = 'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"'
    P188 = 'xmlns:p188="http://schemas.microsoft.com/office/powerpoint/2018/8/main"'
    authors = f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:cmAuthorLst {P}><p:cmAuthor id="0" name="{NOTE}" initials="MO" lastIdx="1" clrIdx="0"/></p:cmAuthorLst>'
    legacy = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:cmLst {P}><p:cm authorId="0" dt="2026-05-01T09:00:00" idx="1">'
              '<p:pos x="10" y="10"/><p:text>Too optimistic</p:text></p:cm></p:cmLst>')
    modern_authors = f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p188:authorLst {P188}><p188:author id="{{00000000-0000-0000-0000-0000000000B1}}" name="{NOTE}" initials="MO" userId="mokonkwo@example.org" providerId="AD"/></p188:authorLst>'
    modern = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p188:cmLst {P188} xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
              '<p188:cm id="{00000000-0000-0000-0000-0000000000B2}" authorId="{00000000-0000-0000-0000-0000000000B1}" created="2026-05-01T09:00:00.000">'
              '<p188:txBody><a:bodyPr/><a:p><a:r><a:t>Second opinion please</a:t></a:r></a:p></p188:txBody></p188:cm></p188:cmLst>')
    ext = ('<p:extLst><p:ext uri="{6950BFC3-D8DA-4A85-94F7-54DA5524770B}"><p188:commentRel xmlns:p188="http://schemas.microsoft.com/office/powerpoint/2018/8/main" '
           'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rIdM1"/></p:ext></p:extLst>')
    patch(path, {
        'ppt/slides/slide1.xml': lambda x: x.replace('</p:sld>', ext + '</p:sld>'),
        'ppt/slides/_rels/slide1.xml.rels': lambda x: add_rels(x, ('rIdL1', REL + 'comments', '../comments/comment1.xml'),
                                                               ('rIdM1', 'http://schemas.microsoft.com/office/2018/10/relationships/comments', '../comments/modernComment_100_1.xml')),
        'ppt/_rels/presentation.xml.rels': lambda x: add_rels(x, ('rIdA1', REL + 'commentAuthors', 'commentAuthors.xml'),
                                                              ('rIdA2', 'http://schemas.microsoft.com/office/2018/10/relationships/authors', 'authors.xml')),
        '[Content_Types].xml': lambda x: add_types(x, ('/ppt/commentAuthors.xml', CT_XML + 'presentationml.commentAuthors+xml'),
                                                   ('/ppt/comments/comment1.xml', CT_XML + 'presentationml.comments+xml'),
                                                   ('/ppt/authors.xml', 'application/vnd.ms-powerpoint.authors+xml'),
                                                   ('/ppt/comments/modernComment_100_1.xml', 'application/vnd.ms-powerpoint.comments+xml')),
    }, {'ppt/commentAuthors.xml': authors.encode(), 'ppt/comments/comment1.xml': legacy.encode(), 'ppt/authors.xml': modern_authors.encode(),
        'ppt/comments/modernComment_100_1.xml': modern.encode()})


def odt():
    NS = ('xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" '
          'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0" '
          'xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0" xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0"')
    info = f'<office:change-info><dc:creator>{EDIT}</dc:creator><dc:date>2026-05-02T10:00:00</dc:date></office:change-info>'
    content = (f'<?xml version="1.0" encoding="UTF-8"?><office:document-content {NS} office:version="1.3"><office:body><office:text>'
               '<text:tracked-changes text:track-changes="true">'
               f'<text:changed-region xml:id="ct1" text:id="ct1"><text:deletion>{info}<text:p>88,000</text:p></text:deletion></text:changed-region>'
               f'<text:changed-region xml:id="ct2" text:id="ct2"><text:insertion>{info}</text:insertion></text:changed-region>'
               '</text:tracked-changes>'
               '<text:p>Offer letter for review</text:p>'
               '<text:p>The salary is <text:change text:change-id="ct1"/><text:change-start text:change-id="ct2"/>92,000<text:change-end text:change-id="ct2"/> per year.</text:p>'
               f'<text:p><office:annotation office:name="n1"><dc:creator>{NOTE}</dc:creator><dc:date>2026-05-01T09:00:00</dc:date><text:p>Can we push this to June?</text:p></office:annotation>'
               'Start date is May.<office:annotation-end office:name="n1"/></text:p>'
               '</office:text></office:body></office:document-content>')
    settings = (f'<?xml version="1.0" encoding="UTF-8"?><office:document-settings {NS} office:version="1.3"><office:settings><config:config-item-set config:name="ooo:configuration-settings">'
                '<config:config-item config:name="RecordChanges" config:type="boolean">true</config:config-item></config:config-item-set></office:settings></office:document-settings>')
    meta = f'<?xml version="1.0" encoding="UTF-8"?><office:document-meta {NS} office:version="1.3"><office:meta><meta:initial-creator>Someone</meta:initial-creator></office:meta></office:document-meta>'
    manifest = (f'<?xml version="1.0" encoding="UTF-8"?><manifest:manifest {NS} manifest:version="1.3"><manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text"/>'
                + ''.join(f'<manifest:file-entry manifest:full-path="{n}" manifest:media-type="text/xml"/>' for n in ('content.xml', 'meta.xml', 'settings.xml')) + '</manifest:manifest>')
    write('review.odt', 'text', content, meta, settings, manifest)
    # A spreadsheet: a cell comment and a logged change to a cell value (the old value lives only in the log).
    TNS = NS + ' xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"'
    cells = (f'<?xml version="1.0" encoding="UTF-8"?><office:document-content {TNS} office:version="1.3"><office:body><office:spreadsheet>'
             '<table:tracked-changes><table:cell-content-change table:id="ct1"><table:cell-address table:column="1" table:row="1" table:table="0"/>'
             f'{info}<table:previous><table:change-track-table-cell office:value-type="float" office:value="4800"><text:p>4800</text:p></table:change-track-table-cell></table:previous>'
             '</table:cell-content-change></table:tracked-changes>'
             '<table:table table:name="Fees"><table:table-row><table:table-cell office:value-type="string"><text:p>Client</text:p></table:table-cell>'
             '<table:table-cell office:value-type="string"><text:p>Fee</text:p></table:table-cell></table:table-row>'
             '<table:table-row><table:table-cell office:value-type="string"><text:p>Kestrel Ltd</text:p></table:table-cell>'
             f'<table:table-cell office:value-type="float" office:value="5100"><office:annotation><dc:creator>{NOTE}</dc:creator><text:p>Check with finance</text:p></office:annotation><text:p>5100</text:p></table:table-cell>'
             '</table:table-row></table:table></office:spreadsheet></office:body></office:document-content>')
    write('review.ods', 'spreadsheet', cells, meta, settings, manifest.replace('opendocument.text', 'opendocument.spreadsheet'))


def write(name, kind, content, meta, settings, manifest):
    with zipfile.ZipFile(os.path.join(TST, name), 'w') as z:
        z.writestr('mimetype', f'application/vnd.oasis.opendocument.{kind}', zipfile.ZIP_STORED)
        for n, b in (('content.xml', content), ('meta.xml', meta), ('settings.xml', settings), ('META-INF/manifest.xml', manifest)):
            z.writestr(n, b, zipfile.ZIP_DEFLATED)


if __name__ == '__main__':
    docx(); xlsx(); pptx(); odt()
    print('made review.docx, review.xlsx, review.pptx, review.odt, review.ods')
