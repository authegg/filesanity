/** A file that is not in memory, read by byte ranges: the hosted API's large uploads, kept in R2 for one request.
 *  Parsers only call slice(a, b).arrayBuffer() (through `read`), so this stands in for a File. A strip's output comes
 *  back from `join` as a Joined whose stream() reads each kept range in turn: the file is never held whole.
 *  Neither is a Blob: `new Blob([it])` throws (toString) instead of writing "[object Object]". */
import type { Bytes } from './bytes'

type Get = (offset: number, length: number) => Promise<ReadableStream<Uint8Array>>
const WINDOW = 1 << 20 // small reads (box and segment headers) come from one cached megabyte, not one fetch each
const notPart = (): never => { throw new TypeError('a ranged file is not a BlobPart: build the output with join()') }
// Into one buffer of the known length: a whole-file read (JPEG scans, PDF) holds one copy, not chunks plus a copy.
const all = async (s: ReadableStream<Uint8Array>, len: number): Promise<Bytes> => {
  const out = new Uint8Array(len), r = s.getReader()
  for (let o = 0, c; !(c = await r.read()).done;) { out.set(c.value, o); o += c.value.length }
  return out
}

export class Ranged {
  private win = { at: 0, bytes: new Uint8Array(0) as Bytes }
  readonly name: string
  readonly size: number
  readonly type: string
  readonly get: Get
  constructor(name: string, size: number, type: string, get: Get) { this.name = name; this.size = size; this.type = type; this.get = get }

  slice(start = 0, end = this.size): Range {
    const at = (n: number) => Math.max(0, Math.min(this.size, n < 0 ? this.size + n : n))
    return new Range(this, at(start), Math.max(at(start), at(end)))
  }

  async bytes(start: number, end: number): Promise<Bytes> {
    const w = this.win
    if (start >= w.at && end <= w.at + w.bytes.length) return w.bytes.slice(start - w.at, end - w.at)
    if (end - start >= WINDOW) return all(await this.get(start, end - start), end - start)
    const len = Math.min(this.size, start + WINDOW) - start
    this.win = { at: start, bytes: await all(await this.get(start, len), len) }
    return this.win.bytes.slice(0, end - start)
  }

  join(parts: BlobPart[], type: string): Blob { return new Joined(parts, type) as unknown as Blob }
  toString = notPart
}

export class Range {
  readonly src: Ranged
  readonly start: number
  readonly end: number
  constructor(src: Ranged, start: number, end: number) { this.src = src; this.start = start; this.end = end }
  get size() { return this.end - this.start }
  async arrayBuffer() { return (await this.src.bytes(this.start, this.end)).buffer }
  async stream() { return this.size ? this.src.get(this.start, this.size) : new Blob([]).stream() }
  toString = notPart
}

export class Joined {
  readonly size: number
  readonly type: string
  readonly parts: (BlobPart | Range)[] = []
  constructor(parts: BlobPart[], type: string) {
    this.type = type
    // Touching ranges become one, so a PNG's thousand image chunks are one read, not a thousand.
    for (const p of parts as (BlobPart | Range)[]) {
      const last = this.parts[this.parts.length - 1]
      if (p instanceof Range && last instanceof Range && last.src === p.src && last.end === p.start) this.parts[this.parts.length - 1] = new Range(p.src, last.start, p.end)
      else this.parts.push(p)
    }
    this.size = this.parts.reduce<number>((n, p) => n + (p instanceof Range || p instanceof Blob ? p.size : typeof p === 'string' ? notPart() : p.byteLength), 0)
  }

  stream(): ReadableStream<Uint8Array> {
    const parts = this.parts
    let i = 0, cur: ReadableStreamDefaultReader<Uint8Array> | null = null
    return new ReadableStream<Uint8Array>({
      async pull(ctl) {
        for (;;) {
          if (cur) { const r = await cur.read(); if (!r.done) return ctl.enqueue(r.value); cur = null }
          if (i === parts.length) return ctl.close()
          const p = parts[i++]
          if (p instanceof Range || p instanceof Blob) cur = (await p.stream()).getReader()
          else if (typeof p !== 'string' && p.byteLength) return ctl.enqueue(ArrayBuffer.isView(p) ? new Uint8Array(p.buffer, p.byteOffset, p.byteLength) : new Uint8Array(p))
        }
      },
      cancel: () => cur?.cancel(),
    })
  }

  async arrayBuffer() { return (await all(this.stream(), this.size)).buffer }
  toString = notPart
}
