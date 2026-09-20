import { inflateZlib, latin1, read, u16, u32, utf8 } from './bytes'
import { parseTiff } from './exif'
import { parseXmp } from './xmp'
import type { Field, Report, Segment } from './types'

type Chunk = { type: string; start: number; end: number; strip: boolean; seg?: Segment }
const STRIP = new Set(['tEXt', 'zTXt', 'iTXt', 'eXIf', 'tIME'])

const split = (b: Uint8Array, from: number) => {
  const z = b.indexOf(0, from)
  return z < 0 ? [latin1(b, from), b.length] as const : [latin1(b, from, z), z + 1] as const
}

async function chunkFields(type: string, data: Uint8Array): Promise<Field[]> {
  try {
    if (type === 'tEXt') {
      const [k, p] = split(data, 0)
      return [{ name: k, value: latin1(data, p) }]
    }
    if (type === 'zTXt') {
      const [k, p] = split(data, 0)
      return [{ name: k, value: latin1(await inflateZlib(data.subarray(p + 1))) }]
    }
    if (type === 'iTXt') {
      const [k, p] = split(data, 0)
      const comp = data[p], q = p + 2
      const [lang, r] = split(data, q)
      const [tk, s] = split(data, r)
      const body = data.subarray(s)
      const text = utf8(comp ? await inflateZlib(body) : body)
      if (k === 'XML:com.adobe.xmp') return parseXmp(text)
      return [{ name: k + (lang ? ` (${lang})` : '') + (tk ? `, ${tk}` : ''), value: text }]
    }
    if (type === 'eXIf') return parseTiff(data).fields
    if (type === 'tIME') return [{ name: 'Last modified', value: `${u16(data, 0)}-${String(data[2]).padStart(2, '0')}-${String(data[3]).padStart(2, '0')} ${String(data[4]).padStart(2, '0')}:${String(data[5]).padStart(2, '0')}:${String(data[6]).padStart(2, '0')} UTC` }]
  } catch {
    return [{ name: type, value: `${data.length} bytes, could not be decoded` }]
  }
  return []
}

const WHAT: Record<string, string> = { tEXt: 'text fields', zTXt: 'compressed text fields', iTXt: 'international text or XMP', eXIf: 'camera EXIF block', tIME: 'last-modified time' }

/** Walk every chunk header (12 bytes each, the image data itself is skipped). */
async function walk(blob: Blob) {
  const chunks: Chunk[] = []
  let pos = 8
  while (pos + 12 <= blob.size) {
    const h = await read(blob, pos, 8)
    const len = u32(h, 0)
    const type = latin1(h, 4, 8)
    const end = pos + 12 + len
    const c: Chunk = { type, start: pos, end, strip: STRIP.has(type) }
    if (c.strip && len < 5e7) {
      const data = await read(blob, pos + 8, len)
      c.seg = { id: `${type}-${pos}`, label: type, what: WHAT[type] ?? type, bytes: len + 12, fields: await chunkFields(type, data), strip: true }
    } else if (type === 'iCCP') c.seg = { id: `iccp-${pos}`, label: 'iCCP', what: 'colour profile', bytes: len + 12, fields: [{ name: 'ICC profile', value: `${len} bytes` }], strip: false, why: 'kept: the profile is how the colours are meant to look, not who made the picture' }
    chunks.push(c)
    if (type === 'IEND') break
    pos = end
  }
  return chunks
}

export async function readPng(blob: Blob, name: string): Promise<Report> {
  const chunks = await walk(blob)
  const stripped = chunks.filter((c) => c.strip).reduce((n, c) => n + c.end - c.start, 0)
  return { kind: 'png', kindLabel: 'PNG image', name, bytes: blob.size, segments: chunks.filter((c) => c.seg).map((c) => c.seg!), body: { label: 'The picture', bytes: blob.size - stripped } }
}

export async function stripPng(blob: Blob, keep = new Set<string>()): Promise<Blob> {
  const chunks = await walk(blob)
  for (const c of chunks) if (c.seg && keep.has(c.seg.id)) c.strip = false
  const parts: BlobPart[] = [blob.slice(0, 8)]
  for (const c of chunks) if (!c.strip) parts.push(blob.slice(c.start, c.end))
  return new Blob(parts, { type: 'image/png' })
}
