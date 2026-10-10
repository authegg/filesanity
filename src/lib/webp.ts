import { latin1, read, startsWith, u32, utf8 } from './bytes'
import { parseTiff } from './exif'
import { parseXmp } from './xmp'
import { c2paFields } from './c2pa'
import type { Field, Report, Segment } from './types'

/** WebP: a RIFF file of chunks. Metadata sits in EXIF, XMP and C2PA chunks, announced by flags in the VP8X header.
 *  Cleaning drops those chunks, clears their flags and fixes the RIFF size; the image chunks are copied as they are. */

export const isWebp = (head: Uint8Array) => startsWith(head, [0x52, 0x49, 0x46, 0x46]) && latin1(head, 8, 12) === 'WEBP'

type Chunk = { type: string; start: number; end: number; seg?: Segment }
const STRIP: Record<string, string> = { EXIF: 'camera EXIF block', 'XMP ': 'editing software, history, names', C2PA: 'Content Credentials (C2PA): the app, the signer, AI and edit history' }

async function fields(type: string, d: Uint8Array): Promise<Field[]> {
  try {
    if (type === 'EXIF') return parseTiff(latin1(d, 0, 6) === 'Exif\0\0' ? d.subarray(6) : d).fields
    if (type === 'XMP ') return parseXmp(utf8(d))
    return c2paFields(d)
  } catch {
    return [{ name: type.trim(), value: `${d.length} bytes, could not be decoded` }]
  }
}

async function walk(blob: Blob) {
  const chunks: Chunk[] = []
  for (let pos = 12; pos + 8 <= blob.size;) {
    const h = await read(blob, pos, 8)
    const type = latin1(h, 0, 4), len = u32(h, 4, true)
    const end = Math.min(blob.size, pos + 8 + len + (len & 1))
    const c: Chunk = { type, start: pos, end }
    if (STRIP[type] && len < 5e7) c.seg = { id: `${type.trim()}-${pos}`, label: type.trim(), what: STRIP[type], bytes: end - pos, fields: await fields(type, await read(blob, pos + 8, len)), strip: true }
    chunks.push(c)
    pos = end
  }
  return chunks
}

export async function readWebp(blob: Blob, name: string): Promise<Report> {
  const chunks = await walk(blob)
  const segs = chunks.filter((c) => c.seg).map((c) => c.seg!)
  return { kind: 'webp', kindLabel: 'WebP image', name, bytes: blob.size, segments: segs, body: { label: 'The picture', bytes: blob.size - segs.reduce((n, s) => n + s.bytes, 0) } }
}

export async function stripWebp(blob: Blob, keep = new Set<string>()): Promise<Blob> {
  const chunks = await walk(blob)
  const out = chunks.filter((c) => !c.seg || keep.has(c.seg.id))
  const kept = new Set(out.map((c) => c.type))
  const parts: BlobPart[] = []
  let size = 4 // "WEBP"
  for (const c of out) {
    if (c.type === 'VP8X') {
      const x = await read(blob, c.start, c.end - c.start)
      // Clear the EXIF (0x08) and XMP (0x04) flags for chunks that are gone; the ICC flag stays with its profile.
      x[8] &= ~((kept.has('EXIF') ? 0 : 0x08) | (kept.has('XMP ') ? 0 : 0x04)) & 0xff
      parts.push(x)
    } else parts.push(blob.slice(c.start, c.end))
    size += c.end - c.start
  }
  const head = new Uint8Array(12)
  head.set([0x52, 0x49, 0x46, 0x46, size & 0xff, (size >> 8) & 0xff, (size >> 16) & 0xff, (size >>> 24) & 0xff, 0x57, 0x45, 0x42, 0x50])
  return new Blob([head, ...parts], { type: 'image/webp' })
}
