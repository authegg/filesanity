import { concat, latin1, read, u16, u32, utf8 } from './bytes'
import { parseTiff } from './exif'
import { parseXmp } from './xmp'
import type { Report, Segment } from './types'

/** HEIC (iPhone) and the rest of the HEIF family: an ISO box file whose `meta` box lists items. The Exif and XMP items are
 *  blanked in place, same length, the way PDFs are: the picture, its tiles and the box offsets stay byte for byte. */

type Item = { id: number; type: string; extents: [number, number][] }

/** HEIF brands: ftyp's major brand or any compatible brand. */
const BRANDS = ['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1', 'avif', 'avis']
export const isHeif = (head: Uint8Array) => latin1(head, 4, 8) === 'ftyp' && BRANDS.some((b) => latin1(head, 8, Math.min(head.length, 64)).includes(b))

const uint = (b: Uint8Array, i: number, n: number) => (n === 0 ? 0 : n === 2 ? u16(b, i) : n === 4 ? u32(b, i) : u32(b, i) * 2 ** 32 + u32(b, i + 4))

/** Child boxes of [from, to) in b: type, start of payload, end. */
function boxes(b: Uint8Array, from: number, to: number) {
  const out: { type: string; at: number; end: number }[] = []
  for (let i = from; i + 8 <= to;) {
    let n = u32(b, i)
    let h = 8
    if (n === 1) { n = uint(b, i + 8, 8); h = 16 }
    if (n === 0) n = to - i
    if (n < h) break
    out.push({ type: latin1(b, i + 4, i + 8), at: i + h, end: Math.min(i + n, to) })
    i += n
  }
  return out
}

/** The meta box's items with their byte ranges in the file. */
async function items(blob: Blob): Promise<Item[]> {
  let pos = 0
  let meta: Uint8Array | null = null
  let metaAt = 0
  while (pos + 16 <= blob.size && !meta) {
    const h = await read(blob, pos, 16)
    let n = u32(h, 0)
    if (n === 1) n = uint(h, 8, 8)
    if (n === 0) n = blob.size - pos
    if (n < 8) break
    if (latin1(h, 4, 8) === 'meta') { meta = await read(blob, pos, n); metaAt = pos }
    pos += n
  }
  if (!meta) return []
  const kids = boxes(meta, 12, meta.length) // meta is a full box: 8 header + 4 version and flags
  const types = new Map<number, string>()
  const iinf = kids.find((k) => k.type === 'iinf')
  if (iinf) {
    const v = meta[iinf.at]
    for (const e of boxes(meta, iinf.at + 4 + (v === 0 ? 2 : 4), iinf.end)) {
      if (e.type !== 'infe' || meta[e.at] < 2) continue
      const wide = meta[e.at] >= 3
      const id = wide ? u32(meta, e.at + 4) : u16(meta, e.at + 4)
      const t = e.at + 4 + (wide ? 4 : 2) + 2
      let type = latin1(meta, t, t + 4)
      if (type === 'mime') {
        const name = meta.indexOf(0, t + 4)
        const ct = latin1(meta, name + 1, meta.indexOf(0, name + 1))
        if (ct === 'application/rdf+xml') type = 'xmp'
      }
      types.set(id, type)
    }
  }
  const idat = kids.find((k) => k.type === 'idat')
  const iloc = kids.find((k) => k.type === 'iloc')
  const out: Item[] = []
  if (!iloc) return out
  const v = meta[iloc.at]
  let p = iloc.at + 4
  const offSize = meta[p] >> 4, lenSize = meta[p] & 15, baseSize = meta[p + 1] >> 4, idxSize = v > 0 ? meta[p + 1] & 15 : 0
  p += 2
  const count = v < 2 ? u16(meta, p) : u32(meta, p)
  p += v < 2 ? 2 : 4
  for (let k = 0; k < count && p < iloc.end; k++) {
    const id = v < 2 ? u16(meta, p) : u32(meta, p)
    p += v < 2 ? 2 : 4
    const method = v > 0 ? meta[p + 1] & 15 : 0
    if (v > 0) p += 2
    p += 2 // data_reference_index
    const base = uint(meta, p, baseSize)
    p += baseSize
    const n = u16(meta, p)
    p += 2
    const extents: [number, number][] = []
    for (let e = 0; e < n; e++) {
      p += idxSize
      const off = uint(meta, p, offSize)
      p += offSize
      const len = uint(meta, p, lenSize)
      p += lenSize
      const at = method === 1 && idat ? metaAt + idat.at + base + off : base + off
      if (method < 2) extents.push([at, len || blob.size - at])
    }
    const type = types.get(id)
    if (type) out.push({ id, type, extents })
  }
  return out
}

const data = async (blob: Blob, it: Item) => concat(await Promise.all(it.extents.map(([at, len]) => read(blob, at, len))))

export async function readHeic(blob: Blob, name: string): Promise<Report> {
  const segments: Segment[] = []
  for (const it of await items(blob)) {
    if (it.type === 'Exif') {
      const d = await data(blob, it)
      const tiff = d.subarray(4 + u32(d, 0)) // the item starts with the offset to the TIFF header
      segments.push({ id: `exif-heic-${it.id}`, label: 'EXIF', what: 'camera, lens, dates, position, owner', bytes: d.length, fields: parseTiff(tiff).fields, strip: true })
    } else if (it.type === 'xmp') {
      const d = await data(blob, it)
      segments.push({ id: `xmp-heic-${it.id}`, label: 'XMP', what: 'editing software, history, names, keywords', bytes: d.length, fields: parseXmp(utf8(d)), strip: true })
    }
  }
  const stripped = segments.reduce((n, s) => n + s.bytes, 0)
  const brand = latin1(await read(blob, 8, 4))
  return { kind: 'heic', kindLabel: brand.startsWith('avi') ? 'AVIF image' : 'HEIC photo', name, bytes: blob.size, segments, body: { label: 'The picture', bytes: blob.size - stripped }, note: 'HEIC: the metadata is blanked in place, so the file keeps its size and the picture is not touched.' }
}

/** An Exif item with no tags (offset 0, then a TIFF header and an empty IFD), and an XMP packet with nothing in it. */
const EMPTY_EXIF = Uint8Array.of(0, 0, 0, 0, 0x4d, 0x4d, 0, 0x2a, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0)
const EMPTY_XMP = new TextEncoder().encode('<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"/><?xpacket end="w"?>')

export async function stripHeic(blob: Blob, keep = new Set<string>()): Promise<Blob> {
  const ranges: [number, number, number][] = [] // file offset, length, fill byte source
  const fills: Uint8Array[] = []
  for (const it of await items(blob)) {
    const id = it.type === 'Exif' ? `exif-heic-${it.id}` : it.type === 'xmp' ? `xmp-heic-${it.id}` : ''
    if (!id || keep.has(id)) continue
    const total = it.extents.reduce((n, [, len]) => n + len, 0)
    const empty = it.type === 'Exif' ? EMPTY_EXIF : EMPTY_XMP
    const fill = new Uint8Array(total).fill(it.type === 'Exif' ? 0 : 0x20) // XMP pads with spaces, as XMP packets do
    if (empty.length <= total) fill.set(empty)
    let k = 0
    for (const [at, len] of it.extents) { ranges.push([at, len, fills.length]); fills.push(fill.subarray(k, k + len)); k += len }
  }
  ranges.sort((a, b) => a[0] - b[0])
  const parts: BlobPart[] = []
  let pos = 0
  for (const [at, len, f] of ranges) { parts.push(blob.slice(pos, at), fills[f] as Uint8Array<ArrayBuffer>); pos = at + len }
  parts.push(blob.slice(pos))
  return new Blob(parts, { type: blob.type })
}
