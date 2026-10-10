import { ascii, concat, crc32, deflateRaw, inflateRaw, lastIndexOf, read, u16, u32, utf8, type Bytes } from './bytes'
import type { Field, Report, Segment } from './types'
import { parseXml, type XEl } from './xml'

type Entry = { name: string; nameBytes: Bytes; flags: number; method: number; crc: number; csize: number; usize: number; offset: number; extAttr: number; madeBy: number; dataStart?: number }

const EOCD = [0x50, 0x4b, 0x05, 0x06]

async function directory(blob: Blob): Promise<Entry[]> {
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

async function content(blob: Blob, en: Entry): Promise<Uint8Array> {
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
  if (kind === 'docx') {
    const authors = new Map<string, number>()
    for (const part of ['word/document.xml', 'word/comments.xml']) {
      const en = entries.find((e) => e.name === part)
      if (!en || en.usize > 40e6) continue
      const xml = utf8(await content(blob, en))
      for (const m of xml.matchAll(/w:author="([^"]*)"/g)) authors.set(m[1], (authors.get(m[1]) ?? 0) + 1)
    }
    if (authors.size) segments.push({ id: 'revisions', label: 'changes', what: 'tracked changes and comments', bytes: 0, warn: true, fields: Array.from(authors, ([a, n]) => ({ name: 'Tracked change or comment by', value: `${a} (${n})` })), strip: false, why: 'shown, not removed: accepting tracked changes or deleting comments edits the document itself, so that stays your call in Word' })
  }
  segments.push(...(await risks(blob, entries, kind)))
  return { kind, kindLabel: LABEL[kind], name, bytes: blob.size, segments, body: { label: 'The document', bytes: blob.size - stripped } }
}

const unescapeUri = (u: string) => { try { return decodeURI(u) } catch { return u } }
const count = (s: string, re: RegExp) => (s.match(re) ?? []).length
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** What the sender may not know is in the content: hidden sheets, rows and text, speaker notes, deleted text kept as a
 *  tracked change, pivot caches, embedded files, and parts that fetch from the web when opened. Shown, never changed. */
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
    let notes = 0
    for (const en of parts(/^xl\/(comments[^/]*|comments\/[^/]+|threadedComments\/[^/]+)\.xml$/)) notes += count(utf8(await content(blob, en)), /<(comment|threadedComment)\b/g)
    if (notes) hidden.push({ name: 'Cell comments', value: plural(notes, 'comment') })
    for (const en of parts(/^xl\/externalLinks\/_rels\/[^/]+\.rels$/)) for (const m of utf8(await content(blob, en)).matchAll(/Target="([^"]*)"/g)) external.push({ name: 'Linked workbook', value: unescapeUri(m[1]) })
    for (const m of (await text('xl/connections.xml')).matchAll(/<connection\b[^>]*\bname="([^"]*)"/g)) external.push({ name: 'Data connection', value: m[1] })
  }

  if (kind === 'docx') {
    const doc = await text('word/document.xml')
    const vanish = count(doc, /<w:vanish\s*\/>|<w:vanish\s+w:val="(1|true|on)"/g)
    if (vanish) hidden.push({ name: 'Hidden text', value: `${plural(vanish, 'passage')} formatted as hidden; Word shows them with Show/Hide` })
    const del = count(doc, /<w:del\b/g), ins = count(doc, /<w:ins\b/g)
    if (del) hidden.push({ name: 'Deleted text still inside', value: `${plural(del, 'tracked deletion')}; the words are in the file until the change is accepted` })
    if (ins) hidden.push({ name: 'Tracked insertions', value: plural(ins, 'insertion') })
    const notes = count(await text('word/comments.xml'), /<w:comment\b/g)
    if (notes) hidden.push({ name: 'Comments', value: plural(notes, 'comment') })
    for (const m of doc.matchAll(/INCLUDE(PICTURE|TEXT)\s+(?:\\d\s+)?"?(https?:\/\/[^"\s<]+)/g)) external.push({ name: 'Fetches on opening', value: m[2] })
  }

  if (kind === 'pptx') {
    let noted = 0, off = 0
    for (const en of parts(/^ppt\/notesSlides\/notesSlide\d+\.xml$/)) if (/<a:t>[^<]*\S/.test(utf8(await content(blob, en)).replace(/<a:fld\b[^]*?<\/a:fld>/g, ''))) noted++
    for (const en of parts(/^ppt\/slides\/slide\d+\.xml$/)) if (/<p:sld\b[^>]*\bshow="(0|false)"/.test(utf8(await content(blob, en)).slice(0, 2000))) off++
    let notes = 0
    for (const en of parts(/^ppt\/comments\/[^/]+\.xml$/)) notes += count(utf8(await content(blob, en)), /<(p:|p188:)cm\b/g)
    if (noted) hidden.push({ name: 'Speaker notes', value: `on ${plural(noted, 'slide')}; they travel with the deck` })
    if (off) hidden.push({ name: 'Hidden slides', value: `${plural(off, 'slide')} skipped in the show but in the file` })
    if (notes) hidden.push({ name: 'Comments', value: plural(notes, 'comment') })
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

const le16 = (n: number) => [n & 0xff, (n >> 8) & 0xff]
const le32 = (n: number) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff]

/** Rewrite the package: metadata parts replaced by empty ones, the thumbnail dropped, every other part copied byte for byte
 *  (the zip's own per-part timestamps are reset to 1980-01-01; they are metadata too). */
export async function stripOoxml(blob: Blob, keep = new Set<string>()): Promise<Blob> {
  const entries = await directory(blob)
  const parts: BlobPart[] = []
  const central: Bytes[] = []
  let offset = 0
  const dropped = entries.filter((e) => /^docProps\/thumbnail\./i.test(e.name) && !keep.has(e.name))
  for (const en of entries) {
    if (dropped.includes(en)) continue
    let data: BlobPart, csize = en.csize, usize = en.usize, crc = en.crc, method = en.method
    if ((EMPTY[en.name] && !keep.has(en.name)) || (en.name === '_rels/.rels' && dropped.length)) {
      let raw: Bytes
      if (EMPTY[en.name]) raw = ascii(EMPTY[en.name])
      else {
        raw = ascii(utf8(await content(blob, en)).replace(/<Relationship\b[^>]*Target="[^"]*thumbnail\.[^"]*"[^>]*\/>/gi, ''))
      }
      usize = raw.length
      crc = crc32(raw)
      const z = await deflateRaw(raw)
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
  return new Blob(parts, { type: blob.type || 'application/octet-stream' })
}
