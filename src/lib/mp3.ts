import { latin1, read, startsWith } from './bytes'
import type { Field, Report, Segment } from './types'

/** MP3: tags sit outside the audio, in an ID3v2 block at the start, an ID3v1 block in the last 128 bytes (with an
 *  optional 227-byte "TAG+" block before it) and sometimes an APEv2 block before those. Cleaning cuts them off; the
 *  audio frames between are copied as they are. */

export const isId3 = (head: Uint8Array) => startsWith(head, [0x49, 0x44, 0x33]) // "ID3"
/** A bare MPEG audio frame sync, for MP3s with no ID3v2 at the start. Only trusted with an .mp3 name (see index.ts). */
export const isMpegAudio = (head: Uint8Array) => head[0] === 0xff && (head[1] & 0xe0) === 0xe0

const syncsafe = (b: Uint8Array, i: number) => (b[i] << 21) | (b[i + 1] << 14) | (b[i + 2] << 7) | b[i + 3]
const be32 = (b: Uint8Array, i: number) => ((b[i] << 24) >>> 0) + (b[i + 1] << 16) + (b[i + 2] << 8) + b[i + 3]

const FRAMES: Record<string, string> = {
  TIT2: 'Title', TPE1: 'Artist', TPE2: 'Album artist', TALB: 'Album', TCOM: 'Composer', TYER: 'Year', TDRC: 'Recorded', TDAT: 'Date',
  TENC: 'Encoded by', TSSE: 'Encoder software', TCOP: 'Copyright', TOWN: 'Owner', TPUB: 'Publisher', TCON: 'Genre', TRCK: 'Track',
  TOAL: 'Original album', TOPE: 'Original artist', TEXT: 'Lyricist', TIT1: 'Grouping', TIT3: 'Subtitle', TDEN: 'Encoded on', TDTG: 'Tagged on',
}

function text(d: Uint8Array): string {
  const enc = d[0], body = d.subarray(1)
  const s = enc === 1 || enc === 2 ? new TextDecoder(enc === 2 ? 'utf-16be' : 'utf-16').decode(body) : enc === 3 ? new TextDecoder().decode(body) : latin1(body)
  return s.replace(/\ufeff/g, '').replace(/\0+$/, '').replace(/\0/g, ' / ').trim()
}

/** Frames of an ID3v2.3 or 2.4 tag (v2.2 is listed whole). */
function id3v2Fields(b: Uint8Array): Field[] {
  const v = b[3], out: Field[] = []
  if (v < 3) return [{ name: `ID3v2.${v} tag`, value: `${b.length} bytes` }]
  let p = 10
  if (b[5] & 0x40) p += v === 4 ? syncsafe(b, 10) : be32(b, 10) + 4 // extended header
  while (p + 10 <= b.length && b[p]) {
    const id = latin1(b, p, p + 4)
    const n = v === 4 ? syncsafe(b, p + 4) : be32(b, p + 4)
    if (!/^[A-Z0-9]{4}$/.test(id) || n <= 0 || p + 10 + n > b.length) break
    const d = b.subarray(p + 10, p + 10 + n)
    if (FRAMES[id]) out.push({ name: FRAMES[id], value: text(d) })
    else if (id === 'TXXX' || id === 'COMM' || id === 'USLT') {
      // [encoding][language for COMM and USLT][description\0][text]
      const off = id === 'TXXX' ? 1 : 4
      const t = text(Uint8Array.of(d[0], ...d.subarray(off)))
      const [desc, ...rest] = t.split(' / ')
      out.push({ name: id === 'TXXX' ? desc || 'User text' : id === 'COMM' ? 'Comment' : 'Lyrics', value: rest.join(' / ') || desc })
    } else if (id === 'APIC') out.push({ name: 'Cover picture', value: `${n.toLocaleString('en')} bytes` })
    else if (id === 'PRIV' || id === 'GEOB' || id === 'UFID') out.push({ name: id === 'PRIV' ? 'Private data' : id === 'GEOB' ? 'Embedded object' : 'Unique file id', value: latin1(d, 0, Math.max(0, d.indexOf(0))) || `${n} bytes` })
    else if (id.startsWith('T') || id.startsWith('W')) out.push({ name: id, value: id.startsWith('T') ? text(d) : latin1(d).replace(/\0/g, '') })
    p += 10 + n
  }
  return out.filter((f) => f.value)
}

function id3v1Fields(b: Uint8Array): Field[] {
  const s = (a: number, z: number) => latin1(b, a, z).replace(/\0.*$/, '').trim()
  return [['Title', s(3, 33)], ['Artist', s(33, 63)], ['Album', s(63, 93)], ['Year', s(93, 97)], ['Comment', s(97, 127)]].filter(([, v]) => v).map(([name, value]) => ({ name, value }))
}

type Layout = { start: number; end: number; segments: Segment[] }

async function layout(blob: Blob): Promise<Layout> {
  const segments: Segment[] = []
  let start = 0, end = blob.size
  const h = await read(blob, 0, 10)
  if (isId3(h)) {
    start = 10 + syncsafe(h, 6) + (h[5] & 0x10 ? 10 : 0) // the footer flag adds ten bytes
    const tag = await read(blob, 0, Math.min(start, 5e7))
    segments.push({ id: 'id3v2', label: 'ID3v2', what: 'title, artist, encoder, comments, pictures', bytes: start, fields: id3v2Fields(tag), strip: true })
  }
  if (end - start >= 128) {
    const t = await read(blob, end - 128, 128)
    if (latin1(t, 0, 3) === 'TAG') {
      segments.push({ id: 'id3v1', label: 'ID3v1', what: 'title, artist, album, year, comment', bytes: 128, fields: id3v1Fields(t), strip: true })
      end -= 128
      if (end - start >= 227 && latin1(await read(blob, end - 227, 4)) === 'TAG+') end -= 227
    }
  }
  if (end - start >= 32) {
    const a = await read(blob, end - 32, 32)
    if (latin1(a, 0, 8) === 'APETAGEX') {
      const n = a[12] | (a[13] << 8) | (a[14] << 16) | (a[15] << 24) // tag size without its header
      const size = n + (a[23] & 0x80 ? 32 : 0)
      if (size <= end - start) {
        segments.push({ id: 'ape', label: 'APE', what: 'tags written by some players and taggers', bytes: size, fields: [{ name: 'APE tag', value: `${size} bytes` }], strip: true })
        end -= size
      }
    }
  }
  return { start, end, segments }
}

export async function readMp3(blob: Blob, name: string): Promise<Report> {
  const { start, end, segments } = await layout(blob)
  return { kind: 'mp3', kindLabel: 'MP3 audio', name, bytes: blob.size, segments, body: { label: 'The sound', bytes: end - start } }
}

/** shortcut: tags kept by a policy stay only when nothing after them is cut; a kept ID3v2 keeps its place, a kept
 *  ID3v1 or APE keeps the tail. Upgrade if anyone needs one kept and another removed at the same end. */
export async function stripMp3(blob: Blob, keep = new Set<string>()): Promise<Blob> {
  const { start, end } = await layout(blob)
  const s = keep.has('id3v2') ? 0 : start
  const e = keep.has('id3v1') || keep.has('ape') ? blob.size : end
  return new Blob([blob.slice(s, e)], { type: 'audio/mpeg' })
}
