import { ascii, indexOf, latin1, read } from './bytes'
import { parseXmp } from './xmp'
import type { Field, Report, Segment } from './types'

/* ponytail: the PDF is scanned as one byte array, capped at 256 MB; a chunked scan is the upgrade if anyone hits it. */
const CAP = 256 * 1024 * 1024

type Edit = { seg: string; start: number; end: number; bytes: Uint8Array<ArrayBuffer> }

const NAMES: Record<string, string> = { Title: 'Title', Author: 'Author', Subject: 'Subject', Keywords: 'Keywords', Creator: 'Created with', Producer: 'Produced by', CreationDate: 'Created', ModDate: 'Modified', Trapped: 'Trapped' }

const pdfDate = (s: string) => {
  const m = /^D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?([+\-Z])?(\d{2})?'?(\d{2})?/.exec(s)
  if (!m) return s
  const tz = m[7] === 'Z' ? ' UTC' : m[7] ? ` ${m[7]}${m[8]}:${m[9] ?? '00'}` : ''
  return `${m[1]}-${m[2] ?? '01'}-${m[3] ?? '01'} ${m[4] ?? '00'}:${m[5] ?? '00'}:${m[6] ?? '00'}${tz}`
}

const decodeLiteral = (s: string) => {
  const raw = s.replace(/\\(\d{1,3}|.)/g, (_, c: string) => (/^\d/.test(c) ? String.fromCharCode(parseInt(c, 8)) : { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' }[c] ?? c))
  return raw.charCodeAt(0) === 0xfe && raw.charCodeAt(1) === 0xff ? new TextDecoder('utf-16be').decode(Uint8Array.from(raw.slice(2), (c) => c.charCodeAt(0))) : raw
}
const decodeHex = (h: string) => {
  const clean = h.replace(/\s/g, '')
  let s = ''
  for (let i = 0; i < clean.length; i += 2) s += String.fromCharCode(parseInt(clean.slice(i, i + 2).padEnd(2, '0'), 16))
  return s.charCodeAt(0) === 0xfe && s.charCodeAt(1) === 0xff ? new TextDecoder('utf-16be').decode(Uint8Array.from(s.slice(2), (c) => c.charCodeAt(0))) : s
}

/** Every `N 0 obj` for an object number; incremental updates can leave several. */
function objectRanges(b: Uint8Array, num: number) {
  const out: [number, number][] = []
  const pat = ascii(`${num} 0 obj`)
  let i = 0
  while ((i = indexOf(b, pat, i)) >= 0) {
    const before = i === 0 ? 0x0a : b[i - 1]
    if (before === 0x0a || before === 0x0d || before === 0x20) {
      const e = indexOf(b, ascii('endobj'), i)
      out.push([i, e < 0 ? Math.min(b.length, i + 65536) : e])
    }
    i += pat.length
  }
  return out
}

const STRING = /\/([A-Za-z0-9_.#-]+)\s*(\((?:\\.|[^\\)])*\)|<[0-9A-Fa-f\s]*>)/g

export async function readPdf(blob: Blob, name: string): Promise<Report> {
  if (blob.size > CAP) return { kind: 'pdf', kindLabel: 'PDF document', name, bytes: blob.size, segments: [], body: { label: 'The document', bytes: blob.size }, note: 'This PDF is over 256 MB, more than FileSanity scans in this version.' }
  const b = await read(blob, 0, blob.size)
  const { segments, edits } = scan(b)
  const objStm = indexOf(b, ascii('/ObjStm')) >= 0
  const zipped = segments.some((s) => !s.strip)
  let note = 'PDF: the Info dictionary and an uncompressed XMP packet are blanked in place, same length.'
  if (zipped) note += ' This file also carries a compressed XMP stream, the usual Word or Acrobat case: it is shown and kept, not removed in this version.'
  if (objStm && !segments.some((s) => s.label === 'Info')) note = 'This PDF keeps its objects in compressed streams. FileSanity cannot read or blank metadata inside them yet, so treat this file as not cleaned.'
  return { kind: 'pdf', kindLabel: 'PDF document', name, bytes: blob.size, segments, body: { label: 'The document', bytes: blob.size - edits.reduce((n, e) => n + e.end - e.start, 0) }, note }
}

function scan(b: Uint8Array) {
  const segments: Segment[] = []
  const edits: Edit[] = []
  // Info dictionaries, by every /Info N 0 R reference in the file.
  const infoNums = new Set<number>()
  let i = 0
  const infoPat = ascii('/Info')
  while ((i = indexOf(b, infoPat, i)) >= 0) {
    const m = /^\/Info\s+(\d+)\s+0\s+R/.exec(latin1(b, i, Math.min(b.length, i + 32)))
    if (m) infoNums.add(+m[1])
    i += 5
  }
  for (const num of infoNums) {
    for (const [s, e] of objectRanges(b, num)) {
      const text = latin1(b, s, e)
      const fields: Field[] = []
      for (const m of text.matchAll(STRING)) {
        const key = m[1], lit = m[2]
        const value = lit.startsWith('(') ? decodeLiteral(lit.slice(1, -1)) : decodeHex(lit.slice(1, -1))
        if (!value.trim()) continue
        fields.push({ name: NAMES[key] ?? key, value: /Date$/.test(key) ? pdfDate(value) : value })
        const at = s + m.index! + m[0].length - lit.length
        edits.push({ seg: `info-${s}`, start: at + 1, end: at + lit.length - 1, bytes: new Uint8Array(lit.length - 2).fill(0x20) })
      }
      if (fields.length) segments.push({ id: `info-${s}`, label: 'Info', what: 'author, software, dates', bytes: e - s, fields, strip: true })
    }
  }
  // XMP packets, wherever they sit uncompressed.
  const begin = ascii('<?xpacket begin'), end = ascii('<?xpacket end')
  i = 0
  while ((i = indexOf(b, begin, i)) >= 0) {
    let e = indexOf(b, end, i)
    if (e < 0) break
    e = indexOf(b, ascii('?>'), e)
    e = e < 0 ? b.length : e + 2
    const xml = new TextDecoder().decode(b.subarray(i, e))
    const fields = parseXmp(xml)
    if (fields.length) {
      segments.push({ id: `xmp-${i}`, label: 'XMP', what: 'software, history, names', bytes: e - i, fields, strip: true })
      edits.push({ seg: `xmp-${i}`, start: i, end: e, bytes: blankXmp(b.subarray(i, e)) })
    }
    i = e
  }
  // Compressed metadata streams we can see but not read.
  const md = ascii('/Type /Metadata'), md2 = ascii('/Type/Metadata')
  for (const pat of [md, md2]) {
    i = 0
    while ((i = indexOf(b, pat, i)) >= 0) {
      const head = latin1(b, Math.max(0, i - 200), Math.min(b.length, i + 200))
      if (/\/Filter/.test(head)) segments.push({ id: `mdz-${i}`, label: 'XMP', what: 'a compressed metadata stream', bytes: 0, fields: [{ name: 'XMP packet', value: 'compressed stream, kept' }], strip: false, why: 'shown and kept: the packet is a compressed stream and FileSanity does not rewrite PDF streams yet' })
      i += pat.length
    }
  }
  return { segments, edits }
}

/** Same length, well-formed: attribute values and element text become spaces; namespaces and the xpacket marker stay. */
function blankXmp(src: Uint8Array): Uint8Array<ArrayBuffer> {
  const s = latin1(src)
  const out = s
    .replace(/(<\?xpacket[^>]*\?>)|(\s[\w:.-]+=)(["'])([^"']*)\3/g, (m, pi: string, attr: string, q: string, v: string) => (pi ? pi : attr.trim().startsWith('xmlns') || attr.trim() === 'rdf:about=' ? m : attr + q + ' '.repeat(v.length) + q))
    .replace(/>([^<]*)</g, (_, t: string) => '>' + t.replace(/\S/g, ' ') + '<')
  return Uint8Array.from(out, (c) => c.charCodeAt(0)) as Uint8Array<ArrayBuffer>
}

export async function stripPdf(blob: Blob, keep = new Set<string>()): Promise<Blob> {
  const b = await read(blob, 0, blob.size)
  const edits = scan(b).edits.filter((e) => !keep.has(e.seg))
  edits.sort((x, y) => x.start - y.start)
  const parts: BlobPart[] = []
  let pos = 0
  for (const e of edits) {
    if (e.start < pos) continue
    parts.push(blob.slice(pos, e.start), e.bytes)
    pos = e.end
  }
  parts.push(blob.slice(pos))
  return new Blob(parts, { type: 'application/pdf' })
}
