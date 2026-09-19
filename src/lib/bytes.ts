/** Byte helpers. Files are never read whole into a string; parsers slice
 *  the Blob and read only the parts they need. */

export type Bytes = Uint8Array<ArrayBuffer>
export const read = async (blob: Blob, start: number, len: number): Promise<Bytes> =>
  new Uint8Array(await blob.slice(start, Math.min(blob.size, start + len)).arrayBuffer())

export const u16 = (b: Uint8Array, i: number, le = false) => (le ? b[i] | (b[i + 1] << 8) : (b[i] << 8) | b[i + 1])
export const u32 = (b: Uint8Array, i: number, le = false) =>
  (le ? (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16)) + b[i + 3] * 0x1000000 : (b[i] << 24 >>> 0) + (b[i + 1] << 16) + (b[i + 2] << 8) + b[i + 3])

export const latin1 = (b: Uint8Array, start = 0, end = b.length) => {
  let s = ''
  for (let i = start; i < end; i++) s += String.fromCharCode(b[i])
  return s
}
export const utf8 = (b: Uint8Array) => new TextDecoder('utf-8', { fatal: false }).decode(b)
export const ascii = (s: string): Bytes => new TextEncoder().encode(s) as Bytes

/** First index of `pat` in `b` at or after `from`, or -1. Naive; patterns are short. */
export const indexOf = (b: Uint8Array, pat: Uint8Array, from = 0) => {
  const n = b.length - pat.length
  outer: for (let i = Math.max(0, from); i <= n; i++) {
    for (let j = 0; j < pat.length; j++) if (b[i + j] !== pat[j]) continue outer
    return i
  }
  return -1
}

export const lastIndexOf = (b: Uint8Array, pat: Uint8Array) => {
  outer: for (let i = b.length - pat.length; i >= 0; i--) {
    for (let j = 0; j < pat.length; j++) if (b[i + j] !== pat[j]) continue outer
    return i
  }
  return -1
}

export const startsWith = (b: Uint8Array, pat: number[] | Uint8Array, at = 0) => {
  if (b.length < at + pat.length) return false
  for (let i = 0; i < pat.length; i++) if (b[at + i] !== pat[i]) return false
  return true
}

export const concat = (parts: Uint8Array[]): Bytes => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

let crcTable: Uint32Array | undefined
export const crc32 = (b: Uint8Array) => {
  if (!crcTable) {
    crcTable = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      crcTable[n] = c >>> 0
    }
  }
  let c = 0xffffffff
  for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const pipe = async (data: Uint8Array, stream: GenericTransformStream): Promise<Bytes> =>
  new Uint8Array(await new Response(new Blob([data as BlobPart]).stream().pipeThrough(stream)).arrayBuffer())
export const inflateRaw = (d: Uint8Array) => pipe(d, new DecompressionStream('deflate-raw'))
export const inflateZlib = (d: Uint8Array) => pipe(d, new DecompressionStream('deflate'))
export const deflateRaw = (d: Uint8Array) => pipe(d, new CompressionStream('deflate-raw'))

export const fmtBytes = (n: number) => {
  if (n < 1000) return `${n} B`
  if (n < 1e6) return `${(n / 1e3).toFixed(1)} kB`
  if (n < 1e9) return `${(n / 1e6).toFixed(n < 1e7 ? 2 : 1)} MB`
  return `${(n / 1e9).toFixed(2)} GB`
}

export const trunc = (s: string, n = 160) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
