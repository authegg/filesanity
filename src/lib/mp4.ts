import { latin1, read, u16, u32, utf8 } from './bytes'
import { boxes, c2paBoxes, uint } from './heic'
import type { Field, Report, Segment } from './types'

/** MP4 and QuickTime (MOV) video: the same ISO box format as HEIC. Phones put the GPS position, the camera and the
 *  software in `udta` and `meta` boxes under `moov`, and the recording time in the movie and track headers.
 *  Cleaning is in place and the same length: each metadata box is renamed `free`, which every player skips, and its
 *  contents zeroed; the header times are zeroed. The video and sound are not touched, and no offset in the file moves. */

const TOP = ['ftyp', 'moov', 'mdat', 'wide', 'free', 'skip', 'uuid', 'pnot']
export const isMp4 = (head: Uint8Array) => TOP.includes(latin1(head, 4, 8))

/** Adobe XMP in a top-level uuid box. */
const XMP_UUID = 'be7acfcb97a942e89c71999491e3afac'
const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')

const TAGS: Record<string, string> = {
  '©xyz': 'GPS position', '©mak': 'Camera make', '©mod': 'Camera model', '©swr': 'Software', '©too': 'Encoder', '©day': 'Created',
  '©nam': 'Title', '©ART': 'Artist', '©aut': 'Author', '©cmt': 'Comment', '©des': 'Description', '©cpy': 'Copyright',
}
const KEYS: Record<string, string> = {
  'com.apple.quicktime.location.ISO6709': 'GPS position', 'com.apple.quicktime.location.accuracy.horizontal': 'GPS accuracy (metres)',
  'com.apple.quicktime.location.name': 'Location name', 'com.apple.quicktime.make': 'Camera make', 'com.apple.quicktime.model': 'Camera model',
  'com.apple.quicktime.software': 'Software', 'com.apple.quicktime.creationdate': 'Created', 'com.apple.quicktime.author': 'Author',
  'com.android.version': 'Android version', 'com.android.manufacturer': 'Camera make', 'com.android.model': 'Camera model',
  'com.android.capture.fps': 'Capture frame rate', creation_time: 'Created', encoder: 'Encoder',
}

/** ISO 6709 ("+14.6760+121.0437+012.000/") as "14.6760, 121.0437"; anything else as it came. */
const iso6709 = (v: string) => { const m = /^([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)/.exec(v); return m ? `${+m[1]}, ${+m[2]}` : v }
const pretty = (name: string, v: string) => (name === 'GPS position' ? iso6709(v) : v)

/** Seconds since 1904-01-01, as QuickTime counts. */
const qtDate = (s: number) => (s > 0 ? new Date((s - 2082844800) * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : '')

type Edit = { seg: string; at: number; bytes: Uint8Array<ArrayBuffer> }
type Found = { segments: Segment[]; edits: Edit[]; brand: string }

/** The value of an iTunes-style `data` box: [size]['data'][type][locale][value]. */
function dataValue(b: Uint8Array, from: number, to: number): string {
  const d = boxes(b, from, to).find((x) => x.type === 'data')
  if (!d) return ''
  const type = u32(b, d.at) & 0xffffff
  const v = b.subarray(d.at + 8, d.end)
  if (type === 1 || type === 0) return utf8(v).replace(/\0+$/, '')
  if (type === 23 && v.length === 4) return String(new DataView(v.buffer, v.byteOffset, 4).getFloat32(0))
  if ((type === 21 || type === 22) && v.length <= 4) return String(v.reduce((n, x) => n * 256 + x, 0))
  return `${v.length} bytes`
}

/** A `meta` box is a full box in ISO files and a plain one in QuickTime: find where its children start. */
const metaStart = (b: Uint8Array, at: number, end: number) => (boxes(b, at, end)[0]?.type === 'hdlr' ? at : at + 4)

function metaFields(b: Uint8Array, at: number, end: number): Field[] {
  const kids = boxes(b, metaStart(b, at, end), end)
  const out: Field[] = []
  const keys: string[] = []
  const k = kids.find((x) => x.type === 'keys')
  if (k) for (let p = k.at + 8; p + 8 <= k.end;) { const n = u32(b, p); if (n < 8) break; keys.push(latin1(b, p + 8, p + n)); p += n }
  const ilst = kids.find((x) => x.type === 'ilst')
  if (ilst) for (const item of boxes(b, ilst.at, ilst.end)) {
    const key = item.type.startsWith('©') ? item.type : keys[u32(b, item.at - 4) - 1] ?? item.type
    const value = dataValue(b, item.at, item.end)
    const name = KEYS[key] ?? TAGS[key] ?? key.split('.').pop()!
    if (value) out.push({ name, value: pretty(name, value) })
  }
  return out
}

function udtaFields(b: Uint8Array, at: number, end: number): Field[] {
  const out: Field[] = []
  for (const k of boxes(b, at, end)) {
    if (k.type === 'meta') out.push(...metaFields(b, k.at, k.end))
    else if (k.type.startsWith('©')) {
      // QuickTime text: [u16 length][u16 language][text]; some writers put a `data` box instead.
      const n = u16(b, k.at)
      const value = n && k.at + 4 + n <= k.end ? utf8(b.subarray(k.at + 4, k.at + 4 + n)) : dataValue(b, k.at, k.end)
      const name = TAGS[k.type] ?? k.type
      if (value.trim()) out.push({ name, value: pretty(name, value.trim()) })
    } else if (k.type === 'loci') {
      // 3GPP location: full box, language, a null-ended place name, role, then longitude, latitude, altitude in 16.16.
      let p = k.at + 6
      const named = p
      while (p < k.end && b[p]) p++
      const place = latin1(b, named, p)
      p += 2
      const fixed = (i: number) => (u32(b, i) | 0) / 65536
      out.push({ name: 'GPS position', value: `${fixed(p + 4).toFixed(4)}, ${fixed(p).toFixed(4)}${place ? ` (${place})` : ''}` })
    } else if (k.type === 'XMP_') out.push({ name: 'XMP packet', value: `${k.end - k.at} bytes` })
  }
  return out
}

async function scan(blob: Blob): Promise<Found> {
  const segments: Segment[] = []
  const edits: Edit[] = []
  let brand = ''
  // Renamed `free` so players skip it, and zeroed so nothing it held is left in the bytes.
  const free = (seg: string, typeAt: number, from: number, to: number) => {
    edits.push({ seg, at: typeAt, bytes: Uint8Array.from([0x66, 0x72, 0x65, 0x65]) as Uint8Array<ArrayBuffer> })
    edits.push({ seg, at: from, bytes: new Uint8Array(to - from) })
  }
  for (let pos = 0; pos + 8 <= blob.size;) {
    const h = await read(blob, pos, 32)
    let n = u32(h, 0), head = 8
    if (n === 1) { n = uint(h, 8, 8); head = 16 }
    if (n === 0) n = blob.size - pos
    if (n < head) break
    const type = latin1(h, 4, 8)
    if (type === 'ftyp') brand = latin1(h, 8, 12)
    if (type === 'uuid' && hex(h.subarray(head, head + 16)) === XMP_UUID) {
      segments.push({ id: `vmeta-${pos}`, label: 'XMP', what: 'editing software, history, names', bytes: n, fields: [{ name: 'XMP packet', value: `${n} bytes` }], strip: true })
      free(`vmeta-${pos}`, pos + 4, pos + head, pos + n)
    }
    if (type === 'moov') {
      if (n > 64e6) throw new Error('the movie header is over 64 MB, more than FileSanity reads in this version')
      const m = await read(blob, pos, n)
      walk(m, head, m.length, pos, 0)
    }
    pos += n
  }
  for (const c of await c2paBoxes(blob)) { segments.push(c.seg); free(c.seg.id, c.typeAt, ...c.body) }
  return { segments, edits, brand }

  /** moov and trak: their udta and meta boxes become `free`; their header times become zero. */
  function walk(m: Uint8Array, from: number, to: number, base: number, depth: number) {
    for (const k of boxes(m, from, to)) {
      const id = `vmeta-${base + k.at}`
      if (k.type === 'udta' || k.type === 'meta') {
        const fields = k.type === 'udta' ? udtaFields(m, k.at, k.end) : metaFields(m, k.at, k.end)
        if (!fields.length) fields.push({ name: k.type === 'udta' ? 'User data' : 'Metadata', value: `${k.end - k.at} bytes` })
        segments.push({ id, label: k.type, what: 'position, camera, software', bytes: k.end - k.at + 8, fields, strip: true })
        free(id, base + k.start + 4, base + k.at, base + k.end)
      } else if (k.type === 'mvhd' || k.type === 'tkhd' || k.type === 'mdhd') {
        const v = m[k.at], w = v === 1 ? 8 : 4
        const created = uint(m, k.at + 4, w)
        const tid = `vtime-${base + k.at}`
        if (created || uint(m, k.at + 4 + w, w)) {
          if (k.type === 'mvhd') segments.push({ id: tid, label: 'times', what: 'when it was recorded', bytes: 2 * w, fields: [{ name: 'Recorded', value: qtDate(created) }], strip: true })
          else segments.push({ id: tid, label: 'times', what: 'when each track was recorded', bytes: 2 * w, fields: [], strip: true })
          edits.push({ seg: tid, at: base + k.at + 4, bytes: new Uint8Array(2 * w) })
        }
      } else if ((k.type === 'trak' || k.type === 'mdia') && depth < 3) walk(m, k.at, k.end, base, depth + 1)
    }
  }
}

export async function readMp4(blob: Blob, name: string): Promise<Report> {
  const { segments, brand } = await scan(blob)
  const stripped = segments.reduce((n, s) => n + s.bytes, 0)
  const audio = /^M4[AB] $/.test(brand)
  return { kind: 'mp4', kindLabel: audio ? 'M4A audio' : brand === 'qt  ' ? 'QuickTime video' : 'MP4 video', name, bytes: blob.size, segments, body: { label: audio ? 'The sound' : 'The video and sound', bytes: blob.size - stripped }, note: `${audio ? 'Audio' : 'Video'}: the metadata boxes are renamed so players skip them, and the recording times are zeroed. The file keeps its size; the ${audio ? 'sound is' : 'video and sound are'} not touched.` }
}

export async function stripMp4(blob: Blob, keep = new Set<string>()): Promise<Blob> {
  const edits = (await scan(blob)).edits.filter((e) => !keep.has(e.seg)).sort((a, b) => a.at - b.at)
  const parts: BlobPart[] = []
  let pos = 0
  for (const e of edits) { parts.push(blob.slice(pos, e.at), e.bytes); pos = e.at + e.bytes.length }
  parts.push(blob.slice(pos))
  return new Blob(parts, { type: blob.type || 'video/mp4' })
}
