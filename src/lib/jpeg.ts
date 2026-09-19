import { latin1, read, startsWith, u16, utf8 } from './bytes'
import { orientationOnlyExif, parseTiff } from './exif'
import { parseIrb, parseXmp } from './xmp'
import type { Report, Segment } from './types'

type Seg = { marker: number; start: number; end: number; strip: boolean; seg?: Segment }

const EXIF = [0x45, 0x78, 0x69, 0x66, 0, 0]
const XMP = 'http://ns.adobe.com/xap/1.0/\0'
const XMP_EXT = 'http://ns.adobe.com/xmp/extension/\0'
const PS = 'Photoshop 3.0\0'

/** Walk the header segments up to SOS; only those bytes are read. */
async function walk(blob: Blob) {
  const segs: Seg[] = []
  let pos = 2
  let sos = -1
  let orientation: number | undefined
  while (pos + 4 <= blob.size) {
    const h = await read(blob, pos, 4)
    if (h[0] !== 0xff) break
    const marker = h[1]
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      pos += 2
      continue
    }
    if (marker === 0xda) {
      sos = pos
      break
    }
    const len = u16(h, 2)
    const end = pos + 2 + len
    const s: Seg = { marker, start: pos, end, strip: false }
    if (marker === 0xe1 || marker === 0xed || marker === 0xfe) {
      const body = await read(blob, pos + 4, len - 2)
      if (marker === 0xe1 && startsWith(body, EXIF)) {
        const ex = parseTiff(body.subarray(6))
        orientation = ex.orientation
        s.strip = true
        s.seg = { id: `exif-${pos}`, label: 'EXIF', what: 'camera, lens, dates, position, owner', bytes: len + 2, fields: ex.fields, strip: true }
        if (ex.thumbnailBytes) s.seg.fields.push({ name: 'Embedded thumbnail', value: `${ex.thumbnailBytes} bytes, a small copy of the original picture` })
      } else if (marker === 0xe1 && latin1(body, 0, XMP.length) === XMP) {
        s.strip = true
        s.seg = { id: `xmp-${pos}`, label: 'XMP', what: 'editing software, history, names, keywords', bytes: len + 2, fields: parseXmp(utf8(body.subarray(XMP.length))), strip: true }
      } else if (marker === 0xe1 && latin1(body, 0, XMP_EXT.length) === XMP_EXT) {
        s.strip = true
        s.seg = { id: `xmpx-${pos}`, label: 'XMP', what: 'extended XMP packet', bytes: len + 2, fields: [{ name: 'Extended XMP', value: `${len - 2} bytes` }], strip: true }
      } else if (marker === 0xed && latin1(body, 0, PS.length) === PS) {
        s.strip = true
        s.seg = { id: `iptc-${pos}`, label: 'IPTC', what: 'captions, by-line, city, copyright', bytes: len + 2, fields: parseIrb(body.subarray(PS.length)), strip: true }
      } else if (marker === 0xfe) {
        s.strip = true
        s.seg = { id: `com-${pos}`, label: 'COM', what: 'a comment', bytes: len + 2, fields: [{ name: 'Comment', value: utf8(body).replace(/\0+$/, '') }], strip: true }
      }
    } else if (marker === 0xe2) {
      const body = await read(blob, pos + 4, 12)
      if (latin1(body, 0, 11) === 'ICC_PROFILE') s.seg = { id: `icc-${pos}`, label: 'ICC', what: 'colour profile', bytes: len + 2, fields: [{ name: 'ICC profile', value: `${len - 2} bytes` }], strip: false, why: 'kept: the profile is how the colours are meant to look, not who took the picture' }
    }
    segs.push(s)
    pos = end
  }
  return { segs, sos, orientation }
}

export async function readJpeg(blob: Blob, name: string): Promise<Report> {
  const { segs, sos, orientation } = await walk(blob)
  const segments = segs.filter((s) => s.seg).map((s) => s.seg!)
  const stripped = segs.filter((s) => s.strip).reduce((n, s) => n + s.end - s.start, 0)
  const note = sos < 0 ? 'No scan data found; the file may be truncated.' : orientation && orientation !== 1 ? 'One EXIF value is written back: the orientation flag, so the photo still displays the right way up.' : undefined
  return { kind: 'jpeg', kindLabel: 'JPEG photograph', name, bytes: blob.size, segments, body: { label: 'The picture', bytes: blob.size - stripped }, note }
}

/** The clean file is a Blob of slices of the original: nothing is decoded, nothing is re-encoded. */
export async function stripJpeg(blob: Blob): Promise<Blob> {
  const { segs, sos, orientation } = await walk(blob)
  const parts: BlobPart[] = [blob.slice(0, 2)]
  if (orientation && orientation !== 1) {
    const ex = orientationOnlyExif(orientation)
    parts.push(new Uint8Array([0xff, 0xe1, (ex.length + 2) >> 8, (ex.length + 2) & 0xff]), ex)
  }
  for (const s of segs) if (!s.strip) parts.push(blob.slice(s.start, s.end))
  parts.push(blob.slice(sos < 0 ? segs[segs.length - 1]?.end ?? 2 : sos))
  return new Blob(parts, { type: 'image/jpeg' })
}
