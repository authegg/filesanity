import { read, startsWith } from './bytes'
import { readJpeg, stripJpeg } from './jpeg'
import { content, directory, readOoxml, stripOoxml } from './ooxml'
import { readPdf, stripPdf } from './pdf'
import { readPng, stripPng } from './png'
import { isHeif, readHeic, stripHeic } from './heic'
import { isMp4, readMp4, stripMp4 } from './mp4'
import { isWebp, readWebp, stripWebp } from './webp'
import { isId3, isMpegAudio, readMp3, stripMp3 } from './mp3'
import { readOdf, stripOdf } from './odf'
import { fieldCount, keptCount, warnCount, type Field, type Report } from './types'

export * from './types'
export { fmtBytes } from './bytes'
export { nameRisks, neutralName } from './name'

/** Refused, with the reason in plain words. */
export class Unsupported extends Error {}

const KNOWN: Record<string, string> = { jpg: 'JPEG', jpeg: 'JPEG', png: 'PNG', webp: 'WebP image', pdf: 'PDF', docx: 'Word document', xlsx: 'Excel workbook', pptx: 'PowerPoint deck', odt: 'OpenDocument text', ods: 'OpenDocument spreadsheet', odp: 'OpenDocument presentation', heic: 'HEIC photo', heif: 'HEIF image', mp4: 'MP4 video', m4v: 'MP4 video', mov: 'QuickTime video', m4a: 'M4A audio', mp3: 'MP3 audio' }

/** Sniff by bytes, never by extension. */
export async function inspect(file: File): Promise<Report> {
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : ''
  let head: Uint8Array
  try {
    head = await read(file, 0, 64)
  } catch {
    throw new Unsupported(`${file.name} could not be opened: that is a folder, or a file the browser cannot read.`)
  }
  if (file.size === 0) throw new Unsupported(`${file.name} is empty${ext ? '' : ', or a folder'}. There is nothing to read.`)
  if (startsWith(head, [0xff, 0xd8, 0xff])) return readJpeg(file, file.name)
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return readPng(file, file.name)
  if (startsWith(head, [0x25, 0x50, 0x44, 0x46])) return readPdf(file, file.name)
  if (isWebp(head)) return readWebp(file, file.name)
  if (isId3(head) || (ext === 'mp3' && isMpegAudio(head))) return readMp3(file, file.name)
  if (isHeif(head)) return readHeic(file, file.name)
  if (isMp4(head)) return readMp4(file, file.name)
  if (startsWith(head, [0x50, 0x4b, 0x03, 0x04])) {
    const r = (await readOoxml(file, file.name).catch(() => null)) ?? (await readOdf(file, file.name).catch(() => null))
    if (r) return r
    if (ext === 'zip' || !KNOWN[ext]) throw new Unsupported(`${file.name} is a zip archive. Clean every file inside it on the batch page: you get a cleaned zip back with the same folders.`)
  }
  if (KNOWN[ext]) throw new Unsupported(`This .${ext} does not begin like a ${KNOWN[ext]}. FileSanity reads files by their first bytes, and these are not ones it knows.`)
  throw new Unsupported(`FileSanity cannot read ${ext ? `.${ext}` : 'this kind of'} files yet. It reads JPEG, PNG, HEIC, WebP, MP4, MOV, M4A, MP3, DOCX, XLSX, PPTX, OpenDocument and PDF.`)
}

/** Removes every segment the report marks `strip`; segments flipped to kept (see `applyPolicy`) stay byte for byte. */
export function strip(file: File, report: Report): Promise<Blob> {
  const keep = new Set(report.segments.filter((s) => !s.strip).map((s) => s.id))
  switch (report.kind) {
    case 'jpeg': return stripJpeg(file, keep)
    case 'png': return stripPng(file, keep)
    case 'pdf': return stripPdf(file, keep)
    case 'heic': return stripHeic(file, keep)
    case 'mp4': return stripMp4(file, keep)
    case 'webp': return stripWebp(file, keep)
    case 'mp3': return stripMp3(file, keep)
    case 'odf': return stripOdf(file, keep)
    default: return stripOoxml(file, keep)
  }
}

/** A policy is the list of segment kinds a team keeps; everything else is removed. Shared as a URL, stored nowhere. */
export const POLICY: { key: string; label: string; formats: string }[] = [
  { key: 'exif', label: 'EXIF', formats: 'JPEG, HEIC, WebP' },
  { key: 'xmp', label: 'XMP', formats: 'JPEG, HEIC, WebP, PDF' },
  { key: 'iptc', label: 'IPTC', formats: 'JPEG' },
  { key: 'com', label: 'Comments', formats: 'JPEG' },
  { key: 'text', label: 'Text chunks', formats: 'PNG' },
  { key: 'exif-png', label: 'EXIF chunk', formats: 'PNG' },
  { key: 'time', label: 'Last-modified time', formats: 'PNG' },
  { key: 'c2pa', label: 'Content Credentials (C2PA)', formats: 'JPEG, PNG' },
  { key: 'video', label: 'Video and M4A tags (position, camera)', formats: 'MP4, MOV, M4A' },
  { key: 'vtime', label: 'Recording times', formats: 'MP4, MOV' },
  { key: 'audio', label: 'Audio tags', formats: 'MP3' },
  { key: 'core', label: 'Core properties', formats: 'Word, Excel, PowerPoint, OpenDocument' },
  { key: 'app', label: 'App properties', formats: 'Word, Excel, PowerPoint' },
  { key: 'custom', label: 'Custom properties', formats: 'Word, Excel, PowerPoint' },
  { key: 'thumbnail', label: 'Thumbnail', formats: 'Word, Excel, PowerPoint, OpenDocument' },
  { key: 'printer', label: 'Printer name', formats: 'OpenDocument' },
  { key: 'info', label: 'Info dictionary', formats: 'PDF' },
]
const KEY: [RegExp, string][] = [
  [/^(exif|EXIF)-/, 'exif'], [/^(xmpx?|XMP)-/, 'xmp'], [/^iptc-/, 'iptc'], [/^com-/, 'com'],
  [/^(tEXt|zTXt|iTXt)-/, 'text'], [/^eXIf-/, 'exif-png'], [/^tIME-/, 'time'], [/^(c2pa|caBX|C2PA)-/, 'c2pa'],
  [/^(docProps\/core|meta)\.xml$/, 'core'], [/^settings\.xml$/, 'printer'], [/^docProps\/app\.xml$/, 'app'], [/^docProps\/custom\.xml$/, 'custom'], [/^(docProps\/thumbnail\.|Thumbnails\/)/i, 'thumbnail'],
  [/^info-/, 'info'], [/^vmeta-/, 'video'], [/^vtime-/, 'vtime'], [/^(id3v[12]|ape)$/, 'audio'],
]
export const policyKey = (id: string) => KEY.find(([re]) => re.test(id))?.[1]
/** Parses `keep=exif,xmp` from a URL hash or query; unknown keys are dropped. */
export const parsePolicy = (s: string) => (new URLSearchParams(s.replace(/^[#?]/, '')).get('keep') ?? '').split(',').filter((k) => POLICY.some((p) => p.key === k))
export function applyPolicy(r: Report, keep: string[]): Report {
  if (!keep.length) return r
  const segments = r.segments.map((s) => (s.strip && keep.includes(policyKey(s.id) ?? '') ? { ...s, strip: false, why: 'kept by your policy' } : s))
  return { ...r, segments }
}

export const cleanName = (name: string) => {
  const i = name.lastIndexOf('.')
  return i > 0 ? `${name.slice(0, i)}-clean${name.slice(i)}` : `${name}-clean`
}

/** SHA-256 of a file as hex, the fingerprint a record cites; '' over 512 MB, where hashing in one piece costs too much memory. */
export async function sha256(blob: Blob): Promise<string> {
  if (blob.size > 512e6) return ''
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))
  return Array.from(d, (x) => x.toString(16).padStart(2, '0')).join('')
}

/** Reads the clean copy back under the same policy and returns any metadata still in it; empty means the clean held. */
export async function checkClean(clean: Blob, name: string, keep: string[] = []): Promise<Field[]> {
  try {
    const r = applyPolicy(await inspect(new File([clean], name)), keep)
    return r.segments.filter((s) => s.strip).flatMap((s) => s.fields)
  } catch {
    return [{ name: 'Clean copy', value: 'could not be read back' }]
  }
}

export type Proof = { out: string; before: string; after: string; left: Field[] }

/** The lines one file adds to a record: what went, what stayed and why, the fingerprints, and the read-back check. */
export function recordEntry(name: string, r: Report, proof?: Proof): string[] {
  const out = [`${name}${proof ? ` -> ${proof.out}` : ''}: ${fieldCount(r)} fields ${proof ? 'removed' : 'to remove'}${keptCount(r) ? `, ${keptCount(r)} kept` : ''}${warnCount(r) ? `, ${warnCount(r)} in the content left as they are` : ''}.`]
  if (proof) {
    if (proof.before) out.push(`  SHA-256 before  ${proof.before}`, `  SHA-256 after   ${proof.after}`)
    out.push(proof.left.length ? `  Read back: ${proof.left.length} fields still there. ${proof.left.map((f) => `${f.name}: ${f.value}`).join('; ')}` : '  Read back: the clean copy was read again and no metadata was left.')
  }
  for (const s of r.segments) for (const f of s.fields) out.push(`  ${s.warn ? 'in content' : s.strip ? 'removed   ' : 'kept      '}  ${s.label}  ${f.name}: ${f.value}${!s.strip && s.why ? `  (${s.why})` : ''}`)
  if (r.note) out.push(`  ${r.note}`)
  return [...out, '']
}

export const recordHead = (at: Date, keep: string[]) => [
  'FileSanity cleaning record',
  `${at.toISOString().slice(0, 16).replace('T', ' ')} UTC, in the browser. Nothing was uploaded.`,
  `Policy: ${keep.length ? `kept ${keep.join(', ')}` : 'remove everything FileSanity can remove'}.`,
  '',
]

/** A plain zip (not a Word, Excel, PowerPoint or OpenDocument file) as the files inside it, folders kept in their names.
 *  Null when the file is not such a zip. Entries that cannot be read come back as `skipped`. */
export async function unzip(file: File): Promise<{ files: File[]; skipped: string[] } | null> {
  const head = await read(file, 0, 4)
  if (!startsWith(head, [0x50, 0x4b, 0x03, 0x04])) return null
  const entries = await directory(file).catch(() => null)
  if (!entries || entries.some((e) => /^(word|xl|ppt)\//.test(e.name) || e.name === 'mimetype')) return null
  const files: File[] = [], skipped: string[] = []
  for (const en of entries) {
    if (en.name.endsWith('/') || /(^|\/)(__MACOSX|\.DS_Store$|Thumbs\.db$)/.test(en.name)) continue
    try {
      if (en.flags & 1) throw new Error('encrypted')
      files.push(new File([(await content(file, en)) as Uint8Array<ArrayBuffer>], en.name))
    } catch { skipped.push(en.name) }
  }
  return { files, skipped }
}
