import { concat, crc32, ascii, type Bytes } from './bytes.ts'

const le16 = (n: number) => [n & 0xff, (n >> 8) & 0xff]
const le32 = (n: number) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff]
const le64 = (n: number) => [...le32(n % 2 ** 32), ...le32(Math.floor(n / 2 ** 32))]
const MAX = 0xffffffff

/** A zip of the given files, stored, no compression, every timestamp 1980-01-01. Paths may carry folders.
 *  ZIP64 records only where a size, an offset or the count does not fit the classic fields (batches over 4 GB).
 *  `base` is where the zip starts in its file; tests set it past 4 GB to cross the limit without writing 4 GB. */
export async function zipStore(files: { path: string; data: Blob | Uint8Array<ArrayBuffer> }[], base = 0): Promise<Blob> {
  const parts: BlobPart[] = []
  const central: Bytes[] = []
  let offset = base
  for (const f of files) {
    const data = f.data instanceof Uint8Array ? f.data : new Uint8Array(await f.data.arrayBuffer())
    const name = ascii(f.path.replace(/\\/g, '/').replace(/^\/+/, ''))
    const crc = crc32(data)
    const big = data.length >= MAX, far = offset >= MAX
    const size = big ? MAX : data.length
    // ZIP64 extra field: only the fields whose classic slot holds 0xFFFFFFFF, in this order.
    const x = (sizes: boolean, off: boolean) => {
      const v = [...(sizes ? [...le64(data.length), ...le64(data.length)] : []), ...(off ? le64(offset) : [])]
      return v.length ? [...le16(1), ...le16(v.length), ...v] : []
    }
    const lx = x(big, false), cx = x(big, far), ver = big || far ? 45 : 20
    const local = new Uint8Array([...le32(0x04034b50), ...le16(ver), ...le16(0x0800), ...le16(0), ...le16(0), ...le16(0x21), ...le32(crc), ...le32(size), ...le32(size), ...le16(name.length), ...le16(lx.length)])
    parts.push(local, name, new Uint8Array(lx), data)
    central.push(new Uint8Array([...le32(0x02014b50), ...le16(ver), ...le16(ver), ...le16(0x0800), ...le16(0), ...le16(0), ...le16(0x21), ...le32(crc), ...le32(size), ...le32(size), ...le16(name.length), ...le16(cx.length), ...le16(0), ...le16(0), ...le16(0), ...le32(0), ...le32(far ? MAX : offset)]), name, new Uint8Array(cx))
    offset += local.length + name.length + lx.length + data.length
  }
  const cd = concat(central), n = files.length
  parts.push(cd)
  if (n >= 0xffff || cd.length >= MAX || offset >= MAX) {
    const at = offset + cd.length
    parts.push(new Uint8Array([...le32(0x06064b50), ...le64(44), ...le16(45), ...le16(45), ...le32(0), ...le32(0), ...le64(n), ...le64(n), ...le64(cd.length), ...le64(offset)]))
    parts.push(new Uint8Array([...le32(0x07064b50), ...le32(0), ...le64(at), ...le32(1)]))
  }
  const n16 = Math.min(n, 0xffff)
  parts.push(new Uint8Array([...le32(0x06054b50), ...le16(0), ...le16(0), ...le16(n16), ...le16(n16), ...le32(Math.min(cd.length, MAX)), ...le32(Math.min(offset, MAX)), ...le16(0)]))
  return new Blob(parts, { type: 'application/zip' })
}
