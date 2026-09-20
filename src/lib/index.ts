import { read, startsWith } from './bytes'
import { readJpeg, stripJpeg } from './jpeg'
import { readOoxml, stripOoxml } from './ooxml'
import { readPdf, stripPdf } from './pdf'
import { readPng, stripPng } from './png'
import type { Report } from './types'

export * from './types'
export { fmtBytes } from './bytes'

/** Refused, with the reason in plain words. */
export class Unsupported extends Error {}

const KNOWN: Record<string, string> = { jpg: 'JPEG', jpeg: 'JPEG', png: 'PNG', pdf: 'PDF', docx: 'Word document', xlsx: 'Excel workbook', pptx: 'PowerPoint deck' }

/** Sniff by bytes, never by extension. */
export async function inspect(file: File): Promise<Report> {
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : ''
  let head: Uint8Array
  try {
    head = await read(file, 0, 8)
  } catch {
    throw new Unsupported(`${file.name} could not be opened: that is a folder, or a file the browser cannot read.`)
  }
  if (file.size === 0) throw new Unsupported(`${file.name} is empty${ext ? '' : ', or a folder'}. There is nothing to read.`)
  if (startsWith(head, [0xff, 0xd8, 0xff])) return readJpeg(file, file.name)
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return readPng(file, file.name)
  if (startsWith(head, [0x25, 0x50, 0x44, 0x46])) return readPdf(file, file.name)
  if (startsWith(head, [0x50, 0x4b, 0x03, 0x04])) {
    const r = await readOoxml(file, file.name).catch(() => null)
    if (r) return r
  }
  if (KNOWN[ext]) throw new Unsupported(`This .${ext} does not begin like a ${KNOWN[ext]}. FileSanity reads files by their first bytes, and these are not ones it knows.`)
  throw new Unsupported(`FileSanity cannot read ${ext ? `.${ext}` : 'this kind of'} files yet. It reads JPEG, PNG, DOCX, XLSX, PPTX and PDF.`)
}

/** Removes every segment the report marks `strip`; segments flipped to kept (see `applyPolicy`) stay byte for byte. */
export function strip(file: File, report: Report): Promise<Blob> {
  const keep = new Set(report.segments.filter((s) => !s.strip).map((s) => s.id))
  switch (report.kind) {
    case 'jpeg': return stripJpeg(file, keep)
    case 'png': return stripPng(file, keep)
    case 'pdf': return stripPdf(file, keep)
    default: return stripOoxml(file, keep)
  }
}

/** A policy is the list of segment kinds a team keeps; everything else is removed. Shared as a URL, stored nowhere. */
export const POLICY: { key: string; label: string; formats: string }[] = [
  { key: 'exif', label: 'EXIF', formats: 'JPEG' },
  { key: 'xmp', label: 'XMP', formats: 'JPEG, PDF' },
  { key: 'iptc', label: 'IPTC', formats: 'JPEG' },
  { key: 'com', label: 'Comments', formats: 'JPEG' },
  { key: 'text', label: 'Text chunks', formats: 'PNG' },
  { key: 'exif-png', label: 'EXIF chunk', formats: 'PNG' },
  { key: 'time', label: 'Last-modified time', formats: 'PNG' },
  { key: 'core', label: 'Core properties', formats: 'Word, Excel, PowerPoint' },
  { key: 'app', label: 'App properties', formats: 'Word, Excel, PowerPoint' },
  { key: 'custom', label: 'Custom properties', formats: 'Word, Excel, PowerPoint' },
  { key: 'thumbnail', label: 'Thumbnail', formats: 'Word, Excel, PowerPoint' },
  { key: 'info', label: 'Info dictionary', formats: 'PDF' },
]
const KEY: [RegExp, string][] = [
  [/^exif-/, 'exif'], [/^xmpx?-/, 'xmp'], [/^iptc-/, 'iptc'], [/^com-/, 'com'],
  [/^(tEXt|zTXt|iTXt)-/, 'text'], [/^eXIf-/, 'exif-png'], [/^tIME-/, 'time'],
  [/^docProps\/core\.xml$/, 'core'], [/^docProps\/app\.xml$/, 'app'], [/^docProps\/custom\.xml$/, 'custom'], [/^docProps\/thumbnail\./i, 'thumbnail'],
  [/^info-/, 'info'],
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
