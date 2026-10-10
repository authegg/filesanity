import { ascii, utf8, type Bytes } from './bytes'
import { content, count, directory, plural, rewriteZip, type Entry } from './ooxml'
import type { Field, Report, Segment } from './types'
import { parseXml, type XEl } from './xml'

/** OpenDocument (LibreOffice, OpenOffice): a zip whose first part, `mimetype`, names the kind. Metadata is meta.xml,
 *  the first-page thumbnail and the printer named in settings.xml. Cleaning empties office:meta, drops the thumbnail
 *  (and its manifest entry) and blanks the printer; content.xml is copied as it is. */

const KINDS: Record<string, string> = {
  'application/vnd.oasis.opendocument.text': 'OpenDocument text',
  'application/vnd.oasis.opendocument.spreadsheet': 'OpenDocument spreadsheet',
  'application/vnd.oasis.opendocument.presentation': 'OpenDocument presentation',
  'application/vnd.oasis.opendocument.graphics': 'OpenDocument drawing',
}

const META: Record<string, string> = {
  'initial-creator': 'Author', creator: 'Last modified by', 'creation-date': 'Created', date: 'Modified', 'editing-duration': 'Total editing time',
  'editing-cycles': 'Revision count', generator: 'Created with', title: 'Title', subject: 'Subject', description: 'Comments', keyword: 'Keywords',
  'print-date': 'Last printed', 'printed-by': 'Printed by', language: 'Language', template: 'Template',
}

/** "PT1H2M3S" as "1 h 2 min 3 s". */
const duration = (v: string) => v.replace(/^P(?:T)?/, '').replace(/(\d+)H/, '$1 h ').replace(/(\d+)M/, '$1 min ').replace(/(\d+(?:\.\d+)?)S/, '$1 s').trim() || v

function metaFields(root: XEl): Field[] {
  const meta = root.all().find((e) => e.localName === 'meta' && e.children.length)
  if (!meta) return []
  const out: Field[] = []
  for (const el of meta.children) {
    if (el.localName === 'user-defined') out.push({ name: el.getAttribute('meta:name') ?? 'Custom property', value: (el.textContent ?? '').trim() })
    else if (el.localName === 'document-statistic') out.push({ name: 'Statistics', value: el.attrs.map((a) => `${a.name.replace(/^meta:/, '')} ${a.value}`).join(', ') })
    else if (el.localName === 'template') out.push({ name: 'Template', value: el.getAttribute('xlink:href') ?? '' })
    else {
      const v = (el.textContent ?? '').trim()
      out.push({ name: META[el.localName] ?? el.localName, value: el.localName === 'editing-duration' ? duration(v) : v })
    }
  }
  return out.filter((f) => f.value)
}

const PRINTER = /(<config:config-item\b[^>]*config:name="(PrinterName|PrinterSetup)"[^>]*>)([^<]*)(<\/config:config-item>)/g

async function plan(blob: Blob) {
  const entries = await directory(blob)
  const mime = entries[0]?.name === 'mimetype' ? utf8(await content(blob, entries[0])).trim() : ''
  const text = async (name: string) => { const en = entries.find((e) => e.name === name); return en && en.usize < 40e6 ? utf8(await content(blob, en)) : '' }
  return { entries, mime, text }
}

export async function readOdf(blob: Blob, name: string): Promise<Report | null> {
  const { entries, mime, text } = await plan(blob)
  if (!mime.startsWith('application/vnd.oasis.opendocument')) return null
  const segments: Segment[] = []
  const metaXml = await text('meta.xml')
  const doc = metaXml ? parseXml(metaXml) : null
  const mf = doc ? metaFields(doc) : []
  if (mf.length) segments.push({ id: 'meta.xml', label: 'meta.xml', what: 'author, last editor, dates, editing time, software', bytes: metaXml.length, fields: mf, strip: true })
  const thumb = entries.find((e) => /^Thumbnails\//.test(e.name))
  if (thumb) segments.push({ id: thumb.name, label: 'thumbnail', what: 'a picture of the first page', bytes: thumb.csize, fields: [{ name: 'Preview image', value: `${thumb.name.split('/').pop()}, ${thumb.usize} bytes` }], strip: true })
  const printers = [...(await text('settings.xml')).matchAll(PRINTER)].filter((m) => m[2] === 'PrinterName' && m[3].trim()).map((m) => ({ name: 'Printer', value: m[3].trim() }))
  if (printers.length) segments.push({ id: 'settings.xml', label: 'settings', what: 'the printer it was last set up for', bytes: 0, fields: printers, strip: true })

  // Content the sender may not know is there: shown, never changed (as for Word, Excel and PowerPoint).
  const c = await text('content.xml')
  const hidden: Field[] = []
  const del = count(c, /<text:deletion\b/g), changes = count(c, /<text:changed-region\b/g), notes = count(c, /<office:annotation\b/g)
  if (del) hidden.push({ name: 'Deleted text still inside', value: `${plural(del, 'tracked deletion')}; the words are in the file until the change is accepted` })
  else if (changes) hidden.push({ name: 'Tracked changes', value: plural(changes, 'change') })
  if (notes) hidden.push({ name: 'Comments', value: plural(notes, 'comment') })
  const hid = count(c, /<text:hidden-(paragraph|text)\b/g) + count(c, /text:display="none"/g)
  if (hid) hidden.push({ name: 'Hidden text', value: plural(hid, 'passage') })
  const rows = count(c, /table:visibility="(collapse|filter)"/g)
  if (rows) hidden.push({ name: 'Hidden rows and columns', value: plural(rows, 'run') })
  const speaker = [...c.matchAll(/<presentation:notes\b[^]*?<\/presentation:notes>/g)].filter((m) => /<text:p\b[^>]*>[^<]*\S/.test(m[0].replace(/<presentation:notes\b[^>]*>/, ''))).length
  if (speaker) hidden.push({ name: 'Speaker notes', value: `on ${plural(speaker, 'slide')}; they travel with the file` })
  const objects = new Set(entries.map((e) => /^(Object \d+)\//.exec(e.name)?.[1]).filter(Boolean)).size
  if (objects) hidden.push({ name: 'Embedded objects', value: `${plural(objects, 'object')}, such as a chart with its data` })
  const external = [...c.matchAll(/<draw:image\b[^>]*xlink:href="(https?:\/\/[^"]+)"/g)].map((m) => ({ name: 'Image fetched on opening', value: m[1] }))
  if (hidden.length) segments.push({ id: 'hidden', label: 'hidden', what: 'content most readers never see', bytes: 0, warn: true, strip: false, why: 'kept: it is part of the document; remove it in the app that made the file', fields: hidden })
  if (external.length) segments.push({ id: 'external', label: 'links', what: 'addresses contacted when the file opens', bytes: 0, warn: true, strip: false, why: 'kept: removing them changes the document', fields: external })

  const stripped = segments.filter((s) => s.strip).reduce((n, s) => n + s.bytes, 0)
  return { kind: 'odf', kindLabel: KINDS[mime] ?? 'OpenDocument file', name, bytes: blob.size, segments, body: { label: 'The document', bytes: blob.size - stripped } }
}

export async function stripOdf(blob: Blob, keep = new Set<string>()): Promise<Blob> {
  const { entries, text } = await plan(blob)
  const out = new Map<string, Bytes | null>()
  const drop = keep.has('Thumbnails/thumbnail.png') ? [] : entries.filter((e: Entry) => /^Thumbnails\//.test(e.name))
  for (const en of drop) out.set(en.name, null)
  if (!keep.has('meta.xml') && entries.some((e) => e.name === 'meta.xml')) out.set('meta.xml', ascii((await text('meta.xml')).replace(/<office:meta\b[^>]*>[^]*<\/office:meta>/, '<office:meta/>')))
  if (!keep.has('settings.xml') && entries.some((e) => e.name === 'settings.xml')) out.set('settings.xml', ascii((await text('settings.xml')).replace(PRINTER, '$1$4')))
  if (drop.length) out.set('META-INF/manifest.xml', ascii((await text('META-INF/manifest.xml')).replace(/<manifest:file-entry\b[^>]*manifest:full-path="Thumbnails\/[^"]*"[^>]*\/>/g, '')))
  return rewriteZip(blob, entries, out)
}
