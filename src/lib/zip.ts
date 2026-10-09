import { concat, crc32, ascii, type Bytes } from './bytes.ts'

const le16 = (n: number) => [n & 0xff, (n >> 8) & 0xff]
const le32 = (n: number) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff]

/** A zip of the given files, stored, no compression, every timestamp 1980-01-01. Paths may carry folders. */
export async function zipStore(files: { path: string; data: Blob | Uint8Array<ArrayBuffer> }[]): Promise<Blob> {
  const parts: BlobPart[] = []
  const central: Bytes[] = []
  let offset = 0
  for (const f of files) {
    const data = f.data instanceof Uint8Array ? f.data : new Uint8Array(await f.data.arrayBuffer())
    const name = ascii(f.path.replace(/\\/g, '/').replace(/^\/+/, ''))
    const crc = crc32(data)
    const local = new Uint8Array([...le32(0x04034b50), ...le16(20), ...le16(0x0800), ...le16(0), ...le16(0), ...le16(0x21), ...le32(crc), ...le32(data.length), ...le32(data.length), ...le16(name.length), ...le16(0)])
    parts.push(local, name, data)
    central.push(new Uint8Array([...le32(0x02014b50), ...le16(20), ...le16(20), ...le16(0x0800), ...le16(0), ...le16(0), ...le16(0x21), ...le32(crc), ...le32(data.length), ...le32(data.length), ...le16(name.length), ...le16(0), ...le16(0), ...le16(0), ...le16(0), ...le32(0), ...le32(offset)]), name)
    offset += local.length + name.length + data.length
  }
  const cd = concat(central)
  parts.push(cd, new Uint8Array([...le32(0x06054b50), ...le16(0), ...le16(0), ...le16(files.length), ...le16(files.length), ...le32(cd.length), ...le32(offset), ...le16(0)]))
  return new Blob(parts, { type: 'application/zip' })
}
