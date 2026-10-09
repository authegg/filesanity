import { latin1, u16, u32, utf8 } from './bytes'
import type { Field } from './types'

const TAGS: Record<number, string> = {
  0x010e: 'Image description', 0x010f: 'Camera make', 0x0110: 'Camera model', 0x0112: 'Orientation',
  0x011a: 'X resolution', 0x011b: 'Y resolution', 0x0128: 'Resolution unit', 0x0131: 'Software',
  0x0132: 'Date and time (file)', 0x013b: 'Artist', 0x013c: 'Host computer', 0x8298: 'Copyright',
  0x8769: 'Exif sub-IFD', 0x8825: 'GPS sub-IFD', 0x9003: 'Date and time (original)', 0x9004: 'Date and time (digitised)',
  0x9010: 'Time zone', 0x9011: 'Time zone (original)', 0x9291: 'Subsecond time (original)',
  0x829a: 'Exposure time', 0x829d: 'F-number', 0x8827: 'ISO', 0x8822: 'Exposure program', 0x9204: 'Exposure bias',
  0x9207: 'Metering mode', 0x9209: 'Flash', 0x920a: 'Focal length', 0xa405: 'Focal length (35 mm)',
  0x9286: 'User comment', 0xa001: 'Colour space', 0xa002: 'Pixel width', 0xa003: 'Pixel height',
  0xa430: 'Camera owner', 0xa431: 'Body serial number', 0xa432: 'Lens specification', 0xa433: 'Lens make',
  0xa434: 'Lens model', 0xa435: 'Lens serial number', 0x9000: 'Exif version', 0xa000: 'Flashpix version',
  0x0201: 'Thumbnail offset', 0x0202: 'Thumbnail length', 0x0103: 'Compression', 0x927c: 'Maker note',
  0xa420: 'Unique image ID', 0xa500: 'Gamma', 0xa401: 'Custom rendered', 0xa402: 'Exposure mode',
  0xa403: 'White balance', 0xa406: 'Scene type', 0x9101: 'Components', 0x9102: 'Bits per pixel',
  0xa404: 'Digital zoom', 0x0213: 'YCbCr positioning', 0xa408: 'Contrast', 0xa409: 'Saturation', 0xa40a: 'Sharpness',
  0xa40c: 'Subject distance range', 0x9214: 'Subject area', 0x9202: 'Aperture', 0x9203: 'Brightness',
  0x9201: 'Shutter speed', 0x9205: 'Max aperture', 0x9206: 'Subject distance', 0xa407: 'Gain control',
  0xa300: 'File source', 0xa301: 'Scene type', 0xa302: 'CFA pattern', 0xa20e: 'Focal plane X resolution',
  0xa20f: 'Focal plane Y resolution', 0xa210: 'Focal plane unit', 0xa217: 'Sensing method',
}
const GPS: Record<number, string> = {
  0: 'GPS version', 1: 'Latitude ref', 2: 'Latitude', 3: 'Longitude ref', 4: 'Longitude', 5: 'Altitude ref',
  6: 'Altitude', 7: 'GPS time', 8: 'Satellites', 9: 'GPS status', 10: 'Measure mode', 11: 'Precision',
  12: 'Speed ref', 13: 'Speed', 14: 'Track ref', 15: 'Track', 16: 'Image direction ref', 17: 'Image direction',
  18: 'Map datum', 24: 'Destination bearing ref', 25: 'Destination bearing', 27: 'Processing method', 29: 'GPS date', 31: 'Horizontal error',
}
const SIZES: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 }

export type ExifResult = { fields: Field[]; orientation?: number; thumbnailBytes: number }

const rational = (b: Uint8Array, i: number, le: boolean, signed: boolean) => {
  const n = signed ? u32(b, i, le) | 0 : u32(b, i, le)
  const d = signed ? u32(b, i + 4, le) | 0 : u32(b, i + 4, le)
  return d === 0 ? n : n / d
}

const dms = (v: number[], ref: string) => {
  if (v.length < 3) return v.join(', ')
  const deg = v[0] + v[1] / 60 + v[2] / 3600
  const sign = ref === 'S' || ref === 'W' ? -1 : 1
  return `${(sign * deg).toFixed(5)} (${v[0]}° ${v[1]}' ${v[2].toFixed(1)}" ${ref})`
}

/** Parse a TIFF/EXIF block (the bytes after "Exif\0\0"). Never throws on bad data; returns what it could read. */
export function parseTiff(t: Uint8Array): ExifResult {
  const out: ExifResult = { fields: [], thumbnailBytes: 0 }
  if (t.length < 8) return out
  const le = t[0] === 0x49 && t[1] === 0x49
  if (!le && !(t[0] === 0x4d && t[1] === 0x4d)) return out
  if (u16(t, 2, le) !== 42) return out
  const gps: Record<number, string | number[]> = {}
  const seen = new Set<number>()

  const readIfd = (off: number, names: Record<number, string>, prefix: string, depth: number): number => {
    if (off < 8 || off + 2 > t.length || seen.has(off) || depth > 4) return 0
    seen.add(off)
    const n = u16(t, off, le)
    if (n > 500) return 0
    for (let k = 0; k < n; k++) {
      const e = off + 2 + k * 12
      if (e + 12 > t.length) break
      const tag = u16(t, e, le), type = u16(t, e + 2, le), count = u32(t, e + 4, le)
      const size = (SIZES[type] ?? 1) * count
      const v = size <= 4 ? e + 8 : u32(t, e + 8, le)
      if (v + size > t.length || size > 1e7) continue
      if (tag === 0x8769 || tag === 0x8825 || tag === 0xa005) {
        readIfd(u32(t, e + 8, le), tag === 0x8825 ? GPS : TAGS, tag === 0x8825 ? 'GPS' : tag === 0xa005 ? 'Interop' : 'Exif', depth + 1)
        continue
      }
      let value: string
      let nums: number[] = []
      if (type === 2) value = latin1(t, v, v + count).replace(/\0+$/, '').trim()
      else if (type === 7 && tag === 0x9286) {
        const raw = t.subarray(v + 8, v + count)
        value = utf8(raw).replace(/\0+$/, '').trim()
      } else if (type === 7 || type === 1 || type === 6) {
        value = count <= 4 ? Array.from(t.subarray(v, v + count)).join('.') : `${count} bytes`
        if (tag === 0x9000 || tag === 0xa000) value = latin1(t, v, v + count)
      } else if (type === 3 || type === 8) {
        for (let i = 0; i < Math.min(count, 16); i++) nums.push(u16(t, v + i * 2, le))
        value = nums.join(', ')
      } else if (type === 4 || type === 9) {
        for (let i = 0; i < Math.min(count, 16); i++) nums.push(u32(t, v + i * 4, le))
        value = nums.join(', ')
      } else if (type === 5 || type === 10) {
        for (let i = 0; i < Math.min(count, 16); i++) nums.push(rational(t, v + i * 8, le, type === 10))
        value = nums.map((x) => +x.toFixed(4)).join(', ')
      } else value = `${count} bytes`
      if (tag === 0x0112 && prefix === 'IFD0') out.orientation = nums[0]
      if (prefix === 'IFD1' && tag === 0x0202) out.thumbnailBytes = nums[0] ?? 0
      if (prefix === 'GPS') {
        gps[tag] = nums.length && type !== 2 ? nums : value
        continue
      }
      if (tag === 0x829a && nums[0]) value = nums[0] < 1 ? `1/${Math.round(1 / nums[0])} s` : `${nums[0]} s`
      if (tag === 0x829d && nums[0]) value = `f/${nums[0]}`
      if (tag === 0x920a && nums[0]) value = `${nums[0]} mm`
      const name = names[tag] ?? `Tag 0x${tag.toString(16).padStart(4, '0')}`
      out.fields.push({ name: prefix === 'IFD1' ? `Thumbnail ${name.toLowerCase()}` : name, value })
    }
    return u32(t, off + 2 + n * 12, le)
  }
  const next = readIfd(u32(t, 4, le), TAGS, 'IFD0', 0)
  if (next) readIfd(next, TAGS, 'IFD1', 1)

  // GPS, folded into readable positions.
  const g = gps
  if (g[2] && Array.isArray(g[2])) out.fields.push({ name: 'GPS latitude', value: dms(g[2], String(g[1] ?? '')) })
  if (g[4] && Array.isArray(g[4])) out.fields.push({ name: 'GPS longitude', value: dms(g[4], String(g[3] ?? '')) })
  if (g[6] && Array.isArray(g[6])) out.fields.push({ name: 'GPS altitude', value: `${g[6][0]} m${g[5] && String(g[5]) !== '0' ? ' below sea level' : ''}` })
  if (g[7] && Array.isArray(g[7])) out.fields.push({ name: 'GPS time', value: g[7].map((x) => String(Math.floor(x)).padStart(2, '0')).join(':') + ' UTC' })
  for (const [k, v] of Object.entries(g)) {
    const tag = +k
    if ([1, 2, 3, 4, 5, 6, 7].includes(tag)) continue
    out.fields.push({ name: GPS[tag] ?? `GPS tag ${tag}`, value: Array.isArray(v) ? v.join(', ') : v })
  }
  return out
}

/** A minimal EXIF block carrying only Orientation, so a cleaned photo still displays the right way up. */
export function orientationOnlyExif(o: number): Uint8Array<ArrayBuffer> {
  // "Exif\0\0" + TIFF header (II, 42, IFD at 8) + 1 entry + next-IFD 0
  const b = new Uint8Array(6 + 8 + 2 + 12 + 4)
  b.set([0x45, 0x78, 0x69, 0x66, 0, 0, 0x49, 0x49, 42, 0, 8, 0, 0, 0, 1, 0], 0)
  b.set([0x12, 0x01, 3, 0, 1, 0, 0, 0, o & 0xff, 0, 0, 0], 16)
  return b
}
