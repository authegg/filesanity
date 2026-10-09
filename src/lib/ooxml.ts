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
    if (authors.size) segments.push({ id: 'revisions', label: 'changes', what: 'tracked changes and comments', bytes: 0, fields: Array.from(authors, ([a, n]) => ({ name: 'Tracked change or comment by', value: `${a} (${n})` })), strip: false, why: 'shown, not removed: accepting tracked changes or deleting comments edits the document itself, so that stays your call in Word' })
  }
  return { kind, kindLabel: LABEL[kind], name, bytes: blob.size, segments, body: { label: 'The document', bytes: blob.size - stripped } }
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
