import { ascii, utf8, type Bytes } from './bytes'
import { content, count, directory, plural, rewriteZip, type Entry } from './ooxml'
import type { Field, Report, Segment } from './types'
import { parseXml, rewriteXml, unescapeXml, type XEl } from './xml'

/** OpenDocument (LibreOffice, OpenOffice): a zip whose first part, `mimetype`, names the kind. Metadata is meta.xml,
 *  the first-page thumbnail and the printer named in settings.xml. Cleaning empties office:meta, drops the thumbnail
 *  (and its manifest entry) and blanks the printer; comments and tracked changes are taken out of content.xml and
 *  styles.xml, changes accepted. */

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

const ANNOTATION = /<(office|officeooo):annotation[\s>]/g
const ANNOTATION_EL = /^(office|officeooo):annotation(-end)?$/
const CHANGE_EL = /^(text:tracked-changes|table:tracked-changes|text:change|text:change-start|text:change-end)$/

const PRINTER =/(<config:config-item\b[^>]*config:name="(PrinterName|PrinterSetup)"[^>]*>)([^<]*)(<\/config:config-item>)/g

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

  const c = await text('content.xml')
  // Comments and tracked changes, in the body or in headers and footers: removed, changes accepted.
  const cs = c + (await text('styles.xml'))
  const notes = count(cs, ANNOTATION), writers = new Set<string>()
  for (const m of cs.matchAll(/<(office|officeooo):annotation\b[^]*?<\/\1:annotation>/g)) for (const d of m[0].matchAll(/<dc:creator>([^<]*)</g)) if (d[1].trim()) writers.add(unescapeXml(d[1]).trim())
  if (notes) segments.push({ id: 'comments', label: 'comments', what: 'comments and the names of who wrote them', bytes: 0, strip: true, fields: [{ name: 'Comments', value: plural(notes, 'comment') }, ...(writers.size ? [{ name: 'Written by', value: Array.from(writers).join(', ') }] : [])] })
  const log = Array.from(cs.matchAll(/<(text|table):tracked-changes\b[^]*?<\/\1:tracked-changes>/g), (m) => m[0]).join('')
  const del = count(log, /<(text|table):deletion\b/g), all = count(log, /<(text:changed-region|table:(cell-content-change|insertion|deletion|movement))\b/g)
  const on = /config:name="RecordChanges"[^>]*>true</.test(await text('settings.xml'))
  if (all || on) {
    const changers = new Set<string>()
    for (const d of log.matchAll(/<dc:creator>([^<]*)</g)) if (d[1].trim()) changers.add(unescapeXml(d[1]).trim())
    const fields: Field[] = []
    if (del) fields.push({ name: 'Deleted text', value: `${plural(del, 'tracked deletion')}; the words are in the file until the change is accepted` })
    if (all - del) fields.push({ name: 'Other tracked changes', value: plural(all - del, 'change') })
    if (on) fields.push({ name: 'Track changes', value: 'switched on' })
    if (changers.size) fields.push({ name: 'Changed by', value: Array.from(changers).join(', ') })
    segments.push({ id: 'changes', label: 'changes', what: 'tracked changes and who made them; cleaning accepts every change as it stands', bytes: 0, strip: true, fields })
  }

  // Content the sender may not know is there: shown, never changed (as for Word, Excel and PowerPoint).
  const hidden: Field[] = []
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
  // Accepting a change in OpenDocument: the change log (which holds the deleted words) and the marks in the text go, and
  // the text between the marks is already the current version.
  const comments = !keep.has('comments'), changes = !keep.has('changes')
  for (const part of ['content.xml', 'styles.xml']) {
    const src = await text(part)
    const t = rewriteXml(src, (name) => ((comments && ANNOTATION_EL.test(name)) || (changes && CHANGE_EL.test(name)) ? '' : undefined))
    if (t !== src) out.set(part, ascii(t))
  }
  if (changes) {
    const s = out.has('settings.xml') ? utf8(out.get('settings.xml')!) : await text('settings.xml')
    const t = s.replace(/(config:name="RecordChanges"[^>]*>)true</, '$1false<')
    if (t !== s) out.set('settings.xml', ascii(t))
  }
  return rewriteZip(blob, entries, out)
}
