import { ascii, concat, crc32, deflateRaw, inflateRaw, lastIndexOf, read, u16, u32, utf8, type Bytes, join } from './bytes'
import type { Field, Report, Segment } from './types'
import { parseXml, rewriteXml, unescapeXml, type XEl } from './xml'
import { readJpeg, stripJpeg } from './jpeg'
import { readPng, stripPng } from './png'

export type Entry = { name: string; nameBytes: Bytes; flags: number; method: number; crc: number; csize: number; usize: number; offset: number; extAttr: number; madeBy: number; dataStart?: number }

const EOCD = [0x50, 0x4b, 0x05, 0x06]

export async function directory(blob: Blob): Promise<Entry[]> {
  const tailLen = Math.min(blob.size, 66 * 1024)
  const tail = await read(blob, blob.size - tailLen, tailLen)
  const e = lastIndexOf(tail, new Uint8Array(EOCD))
  if (e < 0) throw new Error('not a zip')
  const count = u16(tail, e + 10, true), cdSize = u32(tail, e + 12, true), cdOff = u32(tail, e + 16, true)
  if (cdOff === 0xffffffff || count === 0xffff) throw new Error('zip64 packages are not read in this version')
  const cd = await read(blob, cdOff, cdSize)
  const entries: Entry[] = []
  let p = 0
  for (let i = 0; i < count && p + 46 <= cd.length; i++) {
    if (u32(cd, p, true) !== 0x02014b50) break
    const nameLen = u16(cd, p + 28, true), extraLen = u16(cd, p + 30, true), commentLen = u16(cd, p + 32, true)
    const nameBytes = cd.slice(p + 46, p + 46 + nameLen)
    entries.push({ name: utf8(nameBytes), nameBytes, madeBy: u16(cd, p + 4, true), flags: u16(cd, p + 8, true), method: u16(cd, p + 10, true), crc: u32(cd, p + 16, true), csize: u32(cd, p + 20, true), usize: u32(cd, p + 24, true), extAttr: u32(cd, p + 38, true), offset: u32(cd, p + 42, true) })
    p += 46 + nameLen + extraLen + commentLen
  }
  for (const en of entries) {
    const lh = await read(blob, en.offset, 30)
    en.dataStart = en.offset + 30 + u16(lh, 26, true) + u16(lh, 28, true)
  }
  return entries
}

export async function content(blob: Blob, en: Entry): Promise<Uint8Array> {
  const raw = await read(blob, en.dataStart!, en.csize)
  if (en.method === 0) return raw
  if (en.method === 8) return inflateRaw(raw)
  throw new Error(`unsupported zip method ${en.method}`)
}

const xmlDoc = (b: Uint8Array) => parseXml(utf8(b))

const PRETTY: Record<string, string> = {
  creator: 'Author', lastModifiedBy: 'Last modified by', created: 'Created', modified: 'Modified', revision: 'Revision count',
  title: 'Title', subject: 'Subject', description: 'Comments', keywords: 'Keywords', category: 'Category', lastPrinted: 'Last printed',
  contentStatus: 'Content status', language: 'Language', identifier: 'Identifier', version: 'Version',
  Application: 'Application', AppVersion: 'Application version', Company: 'Company', Manager: 'Manager', TotalTime: 'Total editing time',
  Template: 'Template', Pages: 'Pages', Words: 'Words', Characters: 'Characters', Lines: 'Lines', Paragraphs: 'Paragraphs',
  Slides: 'Slides', Notes: 'Notes', HiddenSlides: 'Hidden slides', TitlesOfParts: 'Titles of parts', HyperlinkBase: 'Hyperlink base',
  CharactersWithSpaces: 'Characters with spaces', DocSecurity: 'Document security', SharedDoc: 'Shared document', ScaleCrop: 'Scale crop',
  LinksUpToDate: 'Links up to date', HyperlinksChanged: 'Hyperlinks changed', PresentationFormat: 'Presentation format', MMClips: 'Multimedia clips',
}

function leafFields(root: XEl): Field[] {
  const out: Field[] = []
  for (const child of root.children) {
    const leaves = child.children.length ? child.all().filter((e) => !e.children.length) : [child]
    const vals = leaves.map((l) => (l.textContent ?? '').trim()).filter(Boolean)
    if (!vals.length) continue
    let value = vals.join(', ')
    if (child.localName === 'TotalTime' && /^\d+$/.test(value)) value = `${value} minutes`
    out.push({ name: PRETTY[child.localName] ?? child.localName, value })
  }
  return out
}

function customFields(root: XEl): Field[] {
  return root.children.map((p) => ({ name: p.getAttribute('name') ?? 'property', value: (p.textContent ?? '').trim() })).filter((f) => f.value)
}

const EMPTY: Record<string, string> = {
  'docProps/core.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>',
  'docProps/app.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"/>',
  'docProps/custom.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"/>',
}
const WHAT: Record<string, string> = { 'docProps/core.xml': 'author, last editor, dates, revision count', 'docProps/app.xml': 'software, company, editing time', 'docProps/custom.xml': 'custom properties' }

const kindOf = (names: string[]) => (names.some((n) => n.startsWith('word/')) ? 'docx' : names.some((n) => n.startsWith('xl/')) ? 'xlsx' : names.some((n) => n.startsWith('ppt/')) ? 'pptx' : null)
const LABEL = { docx: 'Word document', xlsx: 'Excel workbook', pptx: 'PowerPoint deck' } as const

export async function readOoxml(blob: Blob, name: string): Promise<Report | null> {
  const entries = await directory(blob)
  const kind = kindOf(entries.map((e) => e.name))
  if (!kind) return null
  const segments: Segment[] = []
  let stripped = 0
  for (const en of entries) {
    if (EMPTY[en.name]) {
      const doc = xmlDoc(await content(blob, en))
      const fields = doc ? (en.name.endsWith('custom.xml') ? customFields(doc) : leafFields(doc)) : [{ name: en.name, value: 'could not be parsed' }]
      segments.push({ id: en.name, label: en.name.replace('docProps/', ''), what: WHAT[en.name], bytes: en.csize, fields, strip: true })
      stripped += en.csize
    } else if (/^docProps\/thumbnail\./i.test(en.name)) {
      segments.push({ id: en.name, label: 'thumbnail', what: 'a picture of the first page', bytes: en.csize, fields: [{ name: 'Preview image', value: `${en.name.split('/').pop()}, ${en.usize} bytes` }], strip: true })
      stripped += en.csize
    }
  }
  for (const s of await reviewing(blob, entries)) {
    segments.push(s)
    stripped += s.bytes
  }
  for (const s of await pictureSegment(blob, entries)) {
    segments.push(s)
    stripped += s.bytes
  }
  segments.push(...(await risks(blob, entries, kind)))
  return { kind, kindLabel: LABEL[kind], name, bytes: blob.size, segments, body: { label: 'The document', bytes: blob.size - stripped } }
}

const unescapeUri = (u: string) => { try { return decodeURI(u) } catch { return u } }
export const count = (s: string, re: RegExp) => (s.match(re) ?? []).length
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** What the sender may not know is in the content: hidden sheets, rows and text, speaker notes, pivot caches, embedded
 *  files, and parts that fetch from the web when opened. Shown, never changed (comments and tracked changes: `reviewing`). */
async function risks(blob: Blob, entries: Entry[], kind: 'docx' | 'xlsx' | 'pptx'): Promise<Segment[]> {
  const text = async (name: string) => {
    const en = entries.find((e) => e.name === name)
    return en && en.usize < 40e6 ? utf8(await content(blob, en)) : ''
  }
  const parts = (re: RegExp) => entries.filter((e) => re.test(e.name) && e.usize < 40e6)
  const hidden: Field[] = []
  const external: Field[] = []

  if (kind === 'xlsx') {
    const wb = await text('xl/workbook.xml')
    const rels = await text('xl/_rels/workbook.xml.rels')
    const target = (id: string) => new RegExp(`<Relationship\\b[^>]*Id="${id}"[^>]*Target="([^"]*)"`).exec(rels)?.[1] ?? new RegExp(`<Relationship\\b[^>]*Target="([^"]*)"[^>]*Id="${id}"`).exec(rels)?.[1]
    for (const m of wb.matchAll(/<sheet\b[^>]*>/g)) {
      const name = /\bname="([^"]*)"/.exec(m[0])?.[1] ?? 'a sheet'
      const state = /\bstate="(hidden|veryHidden)"/.exec(m[0])?.[1]
      if (state) hidden.push({ name: state === 'veryHidden' ? 'Very hidden sheet' : 'Hidden sheet', value: `${name}${state === 'veryHidden' ? ' (Excel lists it nowhere; only code can show it)' : ''}` })
      const t = target(/\br:id="([^"]*)"/.exec(m[0])?.[1] ?? '')
      if (!t) continue
      const sheet = await text(t.startsWith('/') ? t.slice(1) : `xl/${t}`)
      const rows = count(sheet, /<row\b[^>]*\bhidden="(1|true)"/g)
      let cols = 0
      for (const c of sheet.matchAll(/<col\b[^>]*\bhidden="(1|true)"[^>]*>/g)) cols += +(/\bmax="(\d+)"/.exec(c[0])?.[1] ?? 1) - +(/\bmin="(\d+)"/.exec(c[0])?.[1] ?? 1) + 1
      if (rows || cols) hidden.push({ name: 'Hidden rows and columns', value: `${name}: ${[rows && plural(rows, 'row'), cols && plural(cols, 'column')].filter(Boolean).join(', ')}` })
    }
    for (const en of parts(/^xl\/pivotCache\/pivotCacheRecords\d*\.xml$/)) {
      const n = /\bcount="(\d+)"/.exec(utf8(await content(blob, en)).slice(0, 2000))?.[1]
      hidden.push({ name: 'Pivot table data', value: `${n ? plural(+n, 'source row') : 'source rows'} stored inside the file; double-clicking the table shows them` })
    }
    for (const en of parts(/^xl\/externalLinks\/_rels\/[^/]+\.rels$/)) for (const m of utf8(await content(blob, en)).matchAll(/Target="([^"]*)"/g)) external.push({ name: 'Linked workbook', value: unescapeUri(m[1]) })
    for (const m of (await text('xl/connections.xml')).matchAll(/<connection\b[^>]*\bname="([^"]*)"/g)) external.push({ name: 'Data connection', value: m[1] })
  }

  if (kind === 'docx') {
    const doc = await text('word/document.xml')
    const vanish = count(doc, /<w:vanish\s*\/>|<w:vanish\s+w:val="(1|true|on)"/g)
    if (vanish) hidden.push({ name: 'Hidden text', value: `${plural(vanish, 'passage')} formatted as hidden; Word shows them with Show/Hide` })
    for (const m of doc.matchAll(/INCLUDE(PICTURE|TEXT)\s+(?:\\d\s+)?"?(https?:\/\/[^"\s<]+)/g)) external.push({ name: 'Fetches on opening', value: m[2] })
  }

  if (kind === 'pptx') {
    let noted = 0, off = 0
    for (const en of parts(/^ppt\/notesSlides\/notesSlide\d+\.xml$/)) if (/<a:t>[^<]*\S/.test(utf8(await content(blob, en)).replace(/<a:fld\b[^]*?<\/a:fld>/g, ''))) noted++
    for (const en of parts(/^ppt\/slides\/slide\d+\.xml$/)) if (/<p:sld\b[^>]*\bshow="(0|false)"/.test(utf8(await content(blob, en)).slice(0, 2000))) off++
    if (noted) hidden.push({ name: 'Speaker notes', value: `on ${plural(noted, 'slide')}; they travel with the deck` })
    if (off) hidden.push({ name: 'Hidden slides', value: `${plural(off, 'slide')} skipped in the show but in the file` })
  }

  // Embedded files: a chart in Word or PowerPoint usually carries its whole workbook.
  for (const en of entries) if (/\/embeddings\/[^/]+$/.test(en.name)) hidden.push({ name: 'Embedded file', value: `${en.name.split('/').pop()}, ${en.usize.toLocaleString('en')} bytes` })
  // Relationships that fetch from outside when the file opens; ordinary hyperlinks wait for a click and are left out.
  for (const en of parts(/\.rels$/)) {
    if (/externalLinks\/_rels/.test(en.name)) continue
    for (const m of utf8(await content(blob, en)).matchAll(/<Relationship\b[^>]*>/g)) {
      const r = m[0]
      if (!/TargetMode="External"/.test(r) || /\/hyperlink"/.test(r)) continue
      const target = /Target="([^"]*)"/.exec(r)?.[1] ?? ''
      external.push({ name: /attachedTemplate/.test(r) ? 'Template fetched on opening' : /\/image"/.test(r) ? 'Image fetched on opening' : 'Fetches on opening', value: target })
    }
  }

  const out: Segment[] = []
  if (hidden.length) out.push({ id: 'hidden', label: 'hidden', what: 'content most readers never see', bytes: 0, warn: true, strip: false, why: 'kept: it is part of the document; remove it in the app that made the file', fields: hidden })
  if (external.length) out.push({ id: 'external', label: 'links', what: 'addresses contacted or read when the file opens', bytes: 0, warn: true, strip: false, why: 'kept: removing them changes the document; an address can tell its owner when and where the file was opened', fields: external })
  return out
}

const COMMENTS = /^(word\/(comments[^/]*|people)\.xml|xl\/(comments[^/]*\.xml|comments\/[^/]+|threadedComments\/[^/]+|persons\/[^/]+)|ppt\/(comments\/[^/]+|commentAuthors\.xml|authors\.xml))$/
const REVISIONS = /^xl\/revisions\/[^/]+$/
const WORD = /^word\/.+\.xml$/
const names = (s: string, re: RegExp, into: Set<string>) => { for (const m of s.matchAll(re)) if (m[1].trim()) into.add(unescapeXml(m[1]).trim()) }

/** Comments and tracked changes: removable, as segments 'comments' and 'changes', listed with the names they carry. */
async function reviewing(blob: Blob, entries: Entry[]): Promise<Segment[]> {
  const read = async (en: Entry) => (en.usize < 40e6 ? utf8(await content(blob, en)) : '')
  const out: Segment[] = []
  const notes = entries.filter((e) => COMMENTS.test(e.name)), logs = entries.filter((e) => REVISIONS.test(e.name))
  let c = '', marks = 0, del = 0, ins = 0, fmt = 0, on = false, saves = 0
  for (const en of notes) c += await read(en)
  const writers = new Set<string>(), changers = new Set<string>()
  names(c, /(?<=\s)(?:w15?:author|displayName|name)="([^"]*)"/g, writers)
  names(c, /<author>([^<]*)<\/author>/g, writers)
  for (const en of entries) {
    if (!WORD.test(en.name)) continue
    const t = await read(en)
    marks += count(t, /<w:comment(RangeStart|RangeEnd|Reference)\b/g)
    del += count(t, /<w:(del|moveFrom)\s/g)
    ins += count(t, /<w:(ins|moveTo)\s/g)
    fmt += count(t, /<w:(\w+PrChange|tblGridChange|numberingChange)\b/g)
    on ||= /<w:trackRevisions\b(?![^>]*w:val="(0|false|off)")/.test(t)
    names(t, /<w:(?:ins|del|moveFrom|moveTo|\w+Change)\s[^>]*\bw:author="([^"]*)"/g, changers)
  }
  for (const en of logs) {
    const t = await read(en)
    saves += count(t, /<header\s/g)
    names(t, /(?<=\s)(?:userName|name)="([^"]*)"/g, changers)
  }
  if (notes.length || marks) {
    const n = count(c, /<(w:comment|comment|p:cm|p188:cm)[\s>]/g) || count(c, /<threadedComment[\s>]/g)
    const fields = [{ name: 'Comments', value: n ? plural(n, 'comment') : 'comment marks in the text' }]
    if (writers.size) fields.push({ name: 'Written by', value: Array.from(writers).join(', ') })
    out.push({ id: 'comments', label: 'comments', what: 'comments and the names of who wrote them', bytes: notes.reduce((s, e) => s + e.csize, 0), fields, strip: true })
  }
  if (del || ins || fmt || on || logs.length) {
    const fields: Field[] = []
    if (del) fields.push({ name: 'Deleted text', value: `${plural(del, 'tracked deletion')}; the words are in the file until the change is accepted` })
    if (ins) fields.push({ name: 'Tracked insertions', value: plural(ins, 'insertion') })
    if (fmt) fields.push({ name: 'Formatting changes', value: plural(fmt, 'change') })
    if (logs.length) fields.push({ name: 'Revision log', value: saves ? `${plural(saves, 'save')} of a shared workbook, with every earlier cell value` : 'a shared workbook\'s change history' })
    if (on) fields.push({ name: 'Track changes', value: 'switched on' })
    if (changers.size) fields.push({ name: 'Changed by', value: Array.from(changers).join(', ') })
    out.push({ id: 'changes', label: 'changes', what: 'tracked changes and who made them; cleaning accepts every change as it stands', bytes: logs.reduce((s, e) => s + e.csize, 0), fields, strip: true })
  }
  return out
}

const ROW = '\u0001', REF = '\u0002' // never valid in XML, so they cannot come from the file
const WORD_CHANGE = /^w:(del|moveFrom|(moveFrom|moveTo)Range(Start|End)|\w+PrChange|tblGridChange|numberingChange|delText|delInstrText|cellIns|cellMerge|trackRevisions|customXml(Ins|Del|MoveFrom|MoveTo)Range(Start|End))$/
const EMPTY_RUN = /^\s*(<w:rPr\/>|<w:rPr>[^]*<\/w:rPr>)?\s*$/

/** One Word part rebuilt: changes accepted (insertions unwrapped, deletions dropped with their words, old formatting
 *  dropped, deleted rows and cells removed) and comment anchors and their now-empty runs removed.
 *  shortcut: a deleted paragraph mark loses its mark but the two paragraphs are not merged; merge if users report it. */
const wordFn = (comments: boolean, changes: boolean) => (name: string, tag: string, inner: string): string | undefined => {
  if (changes) {
    if (name === 'w:ins' || name === 'w:moveTo') return inner
    // A self-closing w:del in a row's properties deletes the row; w:cellDel deletes the cell. The mark travels up to it.
    if ((name === 'w:del' && tag.endsWith('/>')) || name === 'w:cellDel') return ROW
    if (WORD_CHANGE.test(name)) return ''
    // Word refuses a table left without rows, or a row without cells, so those go too.
    if ((name === 'w:tbl' && !/<w:tr[\s>]/.test(inner)) || (name === 'w:tr' && !/<w:tc[\s>]/.test(inner))) return ''
    if (inner.includes(ROW)) return name === 'w:tr' || name === 'w:tc' ? '' : name === 'w:trPr' || name === 'w:tcPr' ? undefined : `${tag}${inner.replaceAll(ROW, '')}</${name}>`
  }
  if (comments) {
    if (name === 'w:commentRangeStart' || name === 'w:commentRangeEnd') return ''
    if (name === 'w:commentReference') return REF
    if (inner.includes(REF)) {
      const rest = inner.replaceAll(REF, '')
      return name === 'w:r' && EMPTY_RUN.test(rest) ? '' : `${tag}${rest}</${name}>`
    }
  }
}

/** "../comments/comment1.xml" in xl/worksheets/_rels/sheet1.xml.rels is xl/comments/comment1.xml. */
function resolve(rels: string, target: string) {
  if (target.startsWith('/')) return target.slice(1)
  const parts = rels.replace(/(^|\/)_rels\/[^/]+$/, '').split('/').filter(Boolean)
  for (const s of target.split('/')) if (s === '..') parts.pop(); else if (s && s !== '.') parts.push(s)
  return parts.join('/')
}
const ownerOf = (rels: string) => rels.replace(/(^|\/)_rels\/([^/]+)\.rels$/, '$1$2')

/** Comments and tracked changes out of a Word, Excel or PowerPoint package, added to `plan`: their parts dropped with
 *  every relationship, content type and reference that names them, Excel's comment boxes taken out of the VML, and in
 *  Word every change accepted. Parts with nothing to change are not touched. */
async function unreview(blob: Blob, entries: Entry[], plan: Map<string, Bytes | null>, comments: boolean, changes: boolean) {
  const texts = new Map<string, string>()
  const has = (name: string) => entries.find((e) => e.name === name)
  const get = async (name: string) => texts.get(name) ?? utf8(await content(blob, has(name)!))
  const drop = new Set(entries.filter((e) => (comments && COMMENTS.test(e.name)) || (changes && REVISIONS.test(e.name))).map((e) => e.name))
  for (const en of entries) {
    if (comments && /^xl\/drawings\/[^/]+\.vml$/.test(en.name)) {
      // Excel's comment boxes are VML shapes; the same part can hold form controls, which stay.
      const src = utf8(await content(blob, en))
      const t = rewriteXml(src, (name, _tag, inner) => (/(^|:)shape$/.test(name) && /ObjectType="Note"/.test(inner) ? '' : undefined))
      if (!/<(\w+:)?shape[\s>]/.test(t)) drop.add(en.name)
      else if (t !== src) texts.set(en.name, t)
    } else if (WORD.test(en.name) && !drop.has(en.name) && en.usize < 40e6) {
      const src = utf8(await content(blob, en))
      const t = rewriteXml(src, wordFn(comments, changes)).replaceAll(ROW, '').replaceAll(REF, '')
      if (t !== src) texts.set(en.name, t)
    }
  }
  for (const en of entries) if (en.name.endsWith('.rels') && drop.has(ownerOf(en.name))) drop.add(en.name)
  const unlinked = new Map<string, string[]>()
  for (const en of entries) {
    if (!en.name.endsWith('.rels') || drop.has(en.name)) continue
    const gone: string[] = []
    const t = (await get(en.name)).replace(/<Relationship\b[^>]*>(\s*<\/Relationship>)?/g, (r) => {
      const target = /\bTarget="([^"]*)"/.exec(r)?.[1]
      if (!target || /TargetMode="External"/.test(r) || !drop.has(resolve(en.name, unescapeUri(unescapeXml(target))))) return r
      gone.push(/\bId="([^"]*)"/.exec(r)?.[1] ?? '')
      return ''
    })
    if (gone.length) { texts.set(en.name, t); unlinked.set(ownerOf(en.name), gone) }
  }
  // An element that names a removed relationship goes too (a sheet's legacyDrawing, a slide's comment link), and so does
  // an extension list it leaves empty.
  for (const [owner, ids] of unlinked) {
    if (!has(owner) || drop.has(owner) || owner.endsWith('.rels')) continue
    const src = await get(owner)
    const prefixes = Array.from(src.matchAll(/xmlns:(\w+)="[^"]*\/relationships"/g), (m) => m[1])
    texts.set(owner, rewriteXml(src, (name, tag, inner) => {
      for (const m of tag.matchAll(/\s(\w+):\w+="([^"]*)"/g)) if (prefixes.includes(m[1]) && ids.includes(m[2])) return ''
      return /(^|:)(ext|extLst)$/.test(name) && !tag.endsWith('/>') && !inner.trim() ? '' : undefined
    }))
  }
  if (drop.size && has('[Content_Types].xml')) texts.set('[Content_Types].xml', (await get('[Content_Types].xml')).replace(/<Override\b[^>]*>/g, (o) => (drop.has(unescapeUri(/PartName="\/?([^"]*)"/.exec(o)?.[1] ?? '')) ? '' : o)))
  for (const n of drop) plan.set(n, null)
  for (const [n, t] of texts) if (!drop.has(n)) plan.set(n, ascii(t))
}

/** Photos stored in the package (word/media, ppt/media, xl/media, OpenDocument Pictures/) keep their own EXIF and GPS;
 *  they are read and cleaned with the photo parsers. The first-page thumbnail is not one: it is dropped whole.
 *  shortcut: JPEG and PNG only; HEIC, WebP or TIFF stored in a document are not opened. Add them if users send them. */
async function pictures(blob: Blob, entries: Entry[]) {
  const out: { en: Entry; pic: Blob; r: Report }[] = []
  for (const en of entries) {
    if (!/\.(jpe?g|png)$/i.test(en.name) || /^(docProps\/thumbnail\.|Thumbnails\/)/i.test(en.name) || en.usize > 60e6) continue
    const data = await content(blob, en)
    const pic = new Blob([data as Bytes])
    const r = await (data[0] === 0xff && data[1] === 0xd8 ? readJpeg(pic, en.name) : data[0] === 0x89 && data[1] === 0x50 ? readPng(pic, en.name) : null)?.catch(() => null)
    if (r?.segments.some((x) => x.strip)) out.push({ en, pic, r })
  }
  return out
}

export async function pictureSegment(blob: Blob, entries: Entry[]): Promise<Segment[]> {
  const found = await pictures(blob, entries)
  if (!found.length) return []
  const fields = found.flatMap(({ en, r }) => r.segments.filter((x) => x.strip).flatMap((x) => x.fields.map((f) => ({ name: `${en.name.split('/').pop()}: ${f.name}`, value: f.value }))))
  const bytes = found.reduce((n, { r }) => n + r.bytes - r.body.bytes, 0)
  return [{ id: 'pictures', label: 'pictures', what: `metadata inside ${plural(found.length, 'photo')} placed in the document: camera, dates, position`, bytes, fields, strip: true }]
}

export async function cleanPictures(blob: Blob, entries: Entry[], plan: Map<string, Bytes | null>) {
  for (const { en, pic, r } of await pictures(blob, entries)) plan.set(en.name, new Uint8Array(await (await (r.kind === 'jpeg' ? stripJpeg(pic) : stripPng(pic))).arrayBuffer()))
}

const le16 = (n: number) => [n & 0xff, (n >> 8) & 0xff]
const le32 = (n: number) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff]

/** Rewrite the package: metadata parts replaced by empty ones, the thumbnail dropped, comments and tracked changes taken
 *  out (`unreview`), every other part copied byte for byte (the zip's own per-part timestamps are reset to 1980-01-01;
 *  they are metadata too). */
export async function stripOoxml(blob: Blob, keep = new Set<string>()): Promise<Blob> {
  const entries = await directory(blob)
  const plan = new Map<string, Bytes | null>()
  const dropped = entries.filter((e) => /^docProps\/thumbnail\./i.test(e.name) && !keep.has(e.name))
  for (const en of dropped) plan.set(en.name, null)
  for (const en of entries) {
    if (EMPTY[en.name] && !keep.has(en.name)) plan.set(en.name, ascii(EMPTY[en.name]))
    else if (en.name === '_rels/.rels' && dropped.length) plan.set(en.name, ascii(utf8(await content(blob, en)).replace(/<Relationship\b[^>]*Target="[^"]*thumbnail\.[^"]*"[^>]*\/>/gi, '')))
  }
  if (!keep.has('pictures')) await cleanPictures(blob, entries, plan)
  if (!keep.has('comments') || !keep.has('changes')) await unreview(blob, entries, plan, !keep.has('comments'), !keep.has('changes'))
  return rewriteZip(blob, entries, plan)
}

/** Copy a zip part by part: a part mapped to bytes is replaced (deflated), mapped to null is dropped, the rest is copied
 *  as stored, in the same order (OpenDocument needs its stored `mimetype` part first). Part timestamps become 1980-01-01. */
export async function rewriteZip(blob: Blob, entries: Entry[], plan: Map<string, Bytes | null>): Promise<Blob> {
  const parts: BlobPart[] = []
  const central: Bytes[] = []
  let offset = 0
  for (const en of entries) {
    const repl = plan.get(en.name)
    if (repl === null) continue
    let data: BlobPart, csize = en.csize, usize = en.usize, crc = en.crc, method = en.method
    if (repl) {
      usize = repl.length
      crc = crc32(repl)
      const z = await deflateRaw(repl)
      method = 8
      data = z
      csize = z.length
    } else data = blob.slice(en.dataStart!, en.dataStart! + en.csize)
    const flags = en.flags & 0x0800
    const local = new Uint8Array([...le32(0x04034b50), ...le16(20), ...le16(flags), ...le16(method), ...le16(0), ...le16(0x21), ...le32(crc), ...le32(csize), ...le32(usize), ...le16(en.nameBytes.length), ...le16(0)])
    parts.push(local, en.nameBytes, data)
    central.push(new Uint8Array([...le32(0x02014b50), ...le16(en.madeBy), ...le16(20), ...le16(flags), ...le16(method), ...le16(0), ...le16(0x21), ...le32(crc), ...le32(csize), ...le32(usize), ...le16(en.nameBytes.length), ...le16(0), ...le16(0), ...le16(0), ...le16(0), ...le32(en.extAttr), ...le32(offset)]), en.nameBytes)
    offset += local.length + en.nameBytes.length + csize
  }
  const cd = concat(central)
  const eocd = new Uint8Array([...le32(0x06054b50), ...le16(0), ...le16(0), ...le16(central.length / 2), ...le16(central.length / 2), ...le32(cd.length), ...le32(offset), ...le16(0)])
  parts.push(cd, eocd)
  return join(blob, parts, blob.type || 'application/octet-stream')
}
