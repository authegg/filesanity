import { ascii, concat, deflateZlib, indexOf, inflateZlib, latin1, read } from './bytes'
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

/** End (exclusive) of the literal string opening at `i`: balanced parens nest, a backslash escapes the next byte. -1 if unclosed. */
function literalEnd(t: string, i: number) {
  for (let d = 0; i < t.length; i++) {
    if (t[i] === '\\') i++
    else if (t[i] === '(') d++
    else if (t[i] === ')' && !--d) return i + 1
  }
  return -1
}

/** The `/Key (literal)`, `/Key <hex>` and `/Key N 0 R` entries in a dictionary's text; [at, end) spans the whole string. */
function strings(t: string) {
  const out: ({ key: string; at: number; end: number } | { key: string; ref: number })[] = []
  const re = /\/([A-Za-z0-9_.#-]+)\s*(?:(\()|(<[0-9A-Fa-f\s]*>)|(\d+)\s+\d+\s+R\b)/g
  for (let m; (m = re.exec(t)); ) {
    if (m[4]) out.push({ key: m[1], ref: +m[4] })
    else {
      const at = m.index + m[0].length - (m[2] ? 1 : m[3].length)
      const end = m[2] ? literalEnd(t, at) : at + m[3].length
      if (end < 0) break
      re.lastIndex = end
      out.push({ key: m[1], at, end })
    }
  }
  return out
}

/** Adds the decoded string as a field; false when it is empty and there is nothing to report or blank. */
const field = (fields: Field[], key: string, lit: string) => {
  const v = lit[0] === '(' ? decodeLiteral(lit.slice(1, -1)) : decodeHex(lit.slice(1, -1))
  if (v.trim()) fields.push({ name: NAMES[key] ?? key, value: /Date$/.test(key) ? pdfDate(v) : v })
  return !!v.trim()
}

const ENCRYPT = ascii('/Encrypt')
/** /Encrypt in any trailer or cross-reference stream: a linearized file has its first trailer at the start, not the end. */
function isEncrypted(b: Uint8Array) {
  for (let i = 0; (i = indexOf(b, ENCRYPT, i)) >= 0; i += ENCRYPT.length) if (/^\/Encrypt\s*(\d+\s+\d+\s+R|<<)/.test(latin1(b, i, Math.min(b.length, i + 32)))) return true
  return false
}

export async function readPdf(blob: Blob, name: string): Promise<Report> {
  if (blob.size > CAP) return { kind: 'pdf', kindLabel: 'PDF document', name, bytes: blob.size, segments: [], body: { label: 'The document', bytes: blob.size }, note: 'This PDF is over 256 MB, more than FileSanity scans in this version.' }
  const b = await read(blob, 0, blob.size)
  const { segments, edits } = await scan(b)
  scanned.set(blob, edits)
  const encrypted = segments.some((s) => s.id === 'encrypted')
  const kept = segments.some((s) => !s.strip && !s.warn)
  const lost = /\/Info\s+\d+\s+0\s+R/.test(latin1(b, Math.max(0, b.length - 4096))) && !segments.some((s) => s.label === 'Info')
  let note = 'PDF: the document information and the XMP are blanked in place, compressed or not, and the file keeps its size.'
  if (encrypted) note = 'This PDF is encrypted, so its metadata cannot be read or blanked here: treat it as not cleaned.'
  else if (kept) note += ' Some metadata here is packed in a way FileSanity does not rewrite yet: it is shown and kept, so treat the file as not fully cleaned.'
  else if (lost) note = 'This PDF keeps its document information where FileSanity cannot reach it, so its metadata may still be inside: treat it as not cleaned.'
  return { kind: 'pdf', kindLabel: 'PDF document', name, bytes: blob.size, segments, body: { label: 'The document', bytes: blob.size - edits.reduce((n, e) => n + e.end - e.start, 0) }, note }
}

async function scan(b: Uint8Array) {
  const segments: Segment[] = []
  const edits: Edit[] = []
  // An encrypted PDF's strings are ciphertext: shown as one kept entry, never blanked into garbage.
  const encrypted = isEncrypted(b)
  if (encrypted) {
    segments.push({ id: 'encrypted', label: 'Info', what: 'author, software, dates (encrypted)', bytes: 0, fields: [{ name: 'Document information', value: 'encrypted with the document, so it cannot be read or blanked here' }], strip: false, why: 'shown and kept: the PDF is encrypted' })
    return { segments: [...segments, ...risks(b)], edits }
  }
  // Info dictionaries, by every /Info N 0 R reference in the file.
  const infoNums = new Set<number>()
  let i = 0
  const infoPat = ascii('/Info')
  while ((i = indexOf(b, infoPat, i)) >= 0) {
    const m = /^\/Info\s+(\d+)\s+0\s+R/.exec(latin1(b, i, Math.min(b.length, i + 32)))
    if (m) infoNums.add(+m[1])
    i += 5
  }
  // An Info value held in its own object (`/Author 5 0 R`) is blanked there, as its own segment. False if it is not a plain string object.
  const indirect = (key: string, num: number) => {
    let found = false
    for (const [s, e] of objectRanges(b, num)) {
      const t = latin1(b, s, e)
      const at = /^\d+\s+0\s+obj\s*/.exec(t)?.[0].length ?? -1
      const end = t[at] === '(' ? literalEnd(t, at) : t[at] === '<' && t[at + 1] !== '<' ? t.indexOf('>', at) + 1 : -1
      if (end <= 0) return false
      found = true
      const fields: Field[] = []
      if (!field(fields, key, t.slice(at, end))) continue
      segments.push({ id: `info-${s}`, label: 'Info', what: 'author, software, dates', bytes: e - s, fields, strip: true })
      edits.push({ seg: `info-${s}`, start: s + at + 1, end: s + end - 1, bytes: new Uint8Array(end - at - 2).fill(0x20) })
    }
    return found
  }
  const unreached = (id: string, key: string) => segments.push({ id, label: 'Info', what: 'author, software, dates', bytes: 0, fields: [{ name: NAMES[key] ?? key, value: 'held in another object' }], strip: false, why: 'shown and kept: this value is stored in a way FileSanity does not rewrite yet' })
  for (const num of infoNums) {
    for (const [s, e] of objectRanges(b, num)) {
      const text = latin1(b, s, e)
      const fields: Field[] = []
      for (const x of strings(text)) {
        if ('ref' in x) {
          if (!indirect(x.key, x.ref)) unreached(`infor-${s}-${x.key}`, x.key)
        } else if (field(fields, x.key, text.slice(x.at, x.end))) edits.push({ seg: `info-${s}`, start: s + x.at + 1, end: s + x.end - 1, bytes: new Uint8Array(x.end - x.at - 2).fill(0x20) })
      }
      if (fields.length) segments.push({ id: `info-${s}`, label: 'Info', what: 'author, software, dates', bytes: e - s, fields, strip: true })
    }
  }
  // XMP packets, wherever they sit uncompressed: in an xpacket wrapper, or bare.
  const covered: [number, number][] = []
  const xmp = (i: number, e: number) => {
    covered.push([i, e])
    const fields = parseXmp(new TextDecoder().decode(b.subarray(i, e)))
    if (!fields.length) return
    segments.push({ id: `xmp-${i}`, label: 'XMP', what: 'software, history, names', bytes: e - i, fields, strip: true })
    edits.push({ seg: `xmp-${i}`, start: i, end: e, bytes: blankXmp(b.subarray(i, e)) })
  }
  const begin = ascii('<?xpacket begin'), end = ascii('<?xpacket end')
  i = 0
  while ((i = indexOf(b, begin, i)) >= 0) {
    let e = indexOf(b, end, i)
    if (e < 0) break
    e = indexOf(b, ascii('?>'), e)
    e = e < 0 ? b.length : e + 2
    xmp(i, e)
    i = e
  }
  for (const [open, close] of [['<x:xmpmeta', '</x:xmpmeta>'], ['<rdf:RDF', '</rdf:RDF>']]) {
    i = 0
    while ((i = indexOf(b, ascii(open), i)) >= 0) {
      const e = indexOf(b, ascii(close), i)
      if (e < 0) break
      if (!covered.some(([s, t]) => i >= s && i < t)) xmp(i, e + close.length)
      i = e + close.length
    }
  }
  // Compressed XMP streams: inflated, blanked like the plain ones, and deflated back to the very same length.
  const md = ascii('/Type /Metadata'), md2 = ascii('/Type/Metadata')
  for (const pat of [md, md2]) {
    i = 0
    while ((i = indexOf(b, pat, i)) >= 0) {
      const head = latin1(b, Math.max(0, i - 200), Math.min(b.length, i + 200))
      const s = /\/Filter/.test(head) && !encrypted ? stream(b, i) : null
      const xml = s ? await inflateZlib(b.subarray(s.start, s.end)).catch(() => null) : null
      const fields = xml ? parseXmp(new TextDecoder().decode(xml)) : []
      // Only the compressed length is fixed, so an empty packet goes in: it packs far smaller than a blanked one.
      const packed = xml && fields.length ? await refit(EMPTY_XMP, s!.end - s!.start) : null
      if (s && packed) {
        segments.push({ id: `xmpz-${s.start}`, label: 'XMP', what: 'software, history, names (compressed)', bytes: s.end - s.start, fields, strip: true })
        edits.push({ seg: `xmpz-${s.start}`, start: s.start, end: s.end, bytes: packed })
      } else if (/\/Filter/.test(head)) segments.push({ id: `mdz-${i}`, label: 'XMP', what: 'a compressed metadata stream', bytes: 0, fields: fields.length ? fields : [{ name: 'XMP packet', value: 'compressed stream, kept' }], strip: false, why: encrypted ? 'shown and kept: the PDF is encrypted' : 'shown and kept: this stream is packed in a way FileSanity does not rewrite yet' })
      i += pat.length
    }
  }
  // Info dictionaries saved inside compressed object streams, as Word and Acrobat do.
  const missing = [...infoNums].filter((n) => !objectRanges(b, n).length)
  if (missing.length && !encrypted) {
    i = 0
    const os = ascii('/Type /ObjStm'), os2 = ascii('/Type/ObjStm')
    for (const pat of [os, os2]) {
      i = 0
      while ((i = indexOf(b, pat, i)) >= 0) {
        const at = i
        i += pat.length
        const s = stream(b, at)
        const dict = latin1(b, Math.max(0, at - 200), Math.min(b.length, at + 300))
        const first = +(/\/First\s+(\d+)/.exec(dict)?.[1] ?? NaN), n = +(/\/N\s+(\d+)/.exec(dict)?.[1] ?? NaN)
        if (!s || !first || !n) continue
        const data = await inflateZlib(b.subarray(s.start, s.end)).catch(() => null)
        if (!data) continue
        const nums = latin1(data, 0, first).trim().split(/\s+/).map(Number)
        const fields: Field[] = []
        for (let k = 0; k < n; k++) {
          if (!missing.includes(nums[2 * k])) continue
          const from = first + nums[2 * k + 1], to = k + 1 < n ? first + nums[2 * k + 3] : data.length
          const text = latin1(data, from, to)
          for (const x of strings(text)) {
            if ('ref' in x) {
              // shortcut: a value in a plain object is blanked; one packed in an object stream is shown as kept, until a file needs it.
              if (!indirect(x.key, x.ref)) unreached(`infor-${s.start}-${x.key}`, x.key)
            } else if (field(fields, x.key, text.slice(x.at, x.end))) data.fill(0x20, from + x.at + 1, from + x.end - 1)
          }
        }
        if (!fields.length) continue
        const packed = await refit(data, s.end - s.start)
        if (packed) {
          segments.push({ id: `info-${s.start}`, label: 'Info', what: 'author, software, dates (compressed)', bytes: s.end - s.start, fields, strip: true })
          edits.push({ seg: `info-${s.start}`, start: s.start, end: s.end, bytes: packed })
        } else segments.push({ id: `infoz-${s.start}`, label: 'Info', what: 'author, software, dates (compressed)', bytes: 0, fields, strip: false, why: 'shown and kept: this stream is packed in a way FileSanity does not rewrite yet' })
      }
    }
  }
  segments.push(...risks(b))
  return { segments, edits }
}

/** Each start of `word` in `b` that a regex `\b` would end (the next byte is not a word character). */
function* words(b: Uint8Array, word: string) {
  const pat = ascii(word)
  for (let i = 0; (i = indexOf(b, pat, i)) >= 0; i += pat.length) {
    const c = b[i + pat.length]
    if (!(c >= 0x30 && c <= 0x39) && !(c >= 0x41 && c <= 0x5a) && !(c >= 0x61 && c <= 0x7a) && c !== 0x5f) yield i
  }
}
const any = (b: Uint8Array, ...ws: string[]) => ws.some((w) => !words(b, w).next().done)

/** Earlier saves and actions that reach out: shown, never changed. Keys inside compressed object streams are not seen.
 *  The bytes are searched directly: a whole-file string costs many times the file in memory. */
function risks(b: Uint8Array): Segment[] {
  const out: Segment[] = []
  // Each save appends a cross-reference section; a linearized ("fast web view") file has one extra by design.
  let saves = 0
  for (let i = 0, x = ascii('startxref'); (i = indexOf(b, x, i)) >= 0; i += x.length) saves++
  if (latin1(b, 0, Math.min(b.length, 2048)).includes('/Linearized')) saves--
  if (saves > 1) out.push({ id: 'versions', label: 'saves', what: 'earlier versions of the document', bytes: 0, warn: true, strip: false, why: 'kept: they are part of the file. Save it as a new PDF (Print to PDF) to keep only the last version',
    fields: [{ name: 'Earlier versions inside', value: `${saves - 1}: text deleted or covered in a later save may still be readable` }] })
  const fields: Field[] = []
  if (any(b, '/JavaScript', '/JS')) fields.push({ name: 'Runs JavaScript', value: 'some PDF readers run it when the file opens' })
  if (any(b, '/Launch')) fields.push({ name: 'Launches a program', value: 'asks the reader to open another file or program' })
  if (any(b, '/SubmitForm')) fields.push({ name: 'Sends form data', value: 'can post the form to a web address' })
  // A web address in an action that runs on opening (/OpenAction or /AA), not an ordinary link someone has to click.
  // shortcut: the address must close within 4 kB of the key; a longer one is not listed.
  const at = [...words(b, '/OpenAction'), ...words(b, '/AA')].sort((x, y) => x - y)
  const re = /\/(?:OpenAction|AA)\b[^]{0,400}?\/URI\s*\(([^)]*)\)/y
  for (let k = 0, done = 0; k < at.length; k++) {
    if (at[k] < done) continue
    re.lastIndex = 0
    const m = re.exec(latin1(b, at[k], Math.min(b.length, at[k] + 4600)))
    if (m) { fields.push({ name: 'Contacts on opening', value: m[1] }); done = at[k] + m[0].length }
  }
  if (fields.length) out.push({ id: 'actions', label: 'actions', what: 'actions that run or reach out', bytes: 0, warn: true, strip: false, why: 'kept: removing actions changes how the document behaves', fields })
  return out
}

/** The data of the stream whose dictionary contains `at`: only a plain /FlateDecode stream with a direct or indirect
 *  /Length and no predictor, the only kind `refit` can rewrite. */
function stream(b: Uint8Array, at: number): { start: number; end: number } | null {
  const objStart = latin1(b, Math.max(0, at - 400), at).lastIndexOf(' 0 obj')
  if (objStart < 0) return null
  const kw = indexOf(b, ascii('stream'), at)
  if (kw < 0 || kw - at > 4000) return null
  const dict = latin1(b, Math.max(0, at - 400) + objStart, kw)
  if (!/\/Filter\s*(\/FlateDecode|\[\s*\/FlateDecode\s*\])/.test(dict) || /\/DecodeParms/.test(dict)) return null
  const direct = /\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(dict)
  const ref = /\/Length\s+(\d+)\s+0\s+R/.exec(dict)
  let len = direct ? +direct[1] : NaN
  if (ref) {
    const r = objectRanges(b, +ref[1])[0]
    len = r ? +(/obj\s+(\d+)/.exec(latin1(b, r[0], r[1]))?.[1] ?? NaN) : NaN
  }
  const start = kw + 6 + (b[kw + 6] === 0x0d && b[kw + 7] === 0x0a ? 2 : 1)
  return Number.isFinite(len) && start + len <= b.length ? { start, end: start + len } : null
}

const EMPTY_XMP = ascii('<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"/></x:xmpmeta><?xpacket end="w"?>')

/** Deflate `data` (zlib) to exactly `size` bytes, so the stream keeps its /Length and nothing after it moves. The gap is
 *  filled with empty stored deflate blocks (5 bytes each, no data) after the zlib header; trailing spaces in the data
 *  (harmless in XMP and in object streams) shift the length until the gap divides by five. Null if it cannot fit. */
async function refit(data: Uint8Array, size: number): Promise<Uint8Array<ArrayBuffer> | null> {
  for (let pad = 0; pad < 40; pad++) {
    const z = await deflateZlib(pad ? concat([data, new Uint8Array(pad).fill(0x20)]) : data)
    const gap = size - z.length
    if (gap < 0) return null
    if (gap % 5) continue
    const empty = new Uint8Array(gap)
    for (let k = 0; k < gap; k += 5) empty.set([0x00, 0x00, 0x00, 0xff, 0xff], k)
    return concat([z.subarray(0, 2), empty, z.subarray(2)])
  }
  return null
}

/** Same length, well-formed: attribute values and element text become spaces; namespaces and the xpacket marker stay. */
function blankXmp(src: Uint8Array): Uint8Array<ArrayBuffer> {
  const s = latin1(src)
  const out = s
    .replace(/(<\?[^>]*\?>)|(\s[\w:.-]+=)("[^"]*"|'[^']*')/g, (m, pi: string, attr: string, v: string) => (pi ? pi : attr.trim().startsWith('xmlns') || attr.trim() === 'rdf:about=' ? m : attr + v[0] + ' '.repeat(v.length - 2) + v[0]))
    .replace(/>([^<]*)</g, (_, t: string) => '>' + t.replace(/\S/g, ' ') + '<')
  return Uint8Array.from(out, (c) => c.charCodeAt(0)) as Uint8Array<ArrayBuffer>
}

/** The edits readPdf found, by file: strip reuses them instead of holding a second whole copy and scanning again. */
const scanned = new WeakMap<Blob, Edit[]>()

export async function stripPdf(blob: Blob, keep = new Set<string>()): Promise<Blob> {
  const found = scanned.get(blob) ?? (await scan(await read(blob, 0, blob.size))).edits
  const edits = found.filter((e) => !keep.has(e.seg))
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
