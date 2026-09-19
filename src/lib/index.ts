import { read, startsWith } from './bytes'
import { readJpeg, stripJpeg } from './jpeg'
import { readOoxml, stripOoxml } from './ooxml'
import { readPdf, stripPdf } from './pdf'
import { readPng, stripPng } from './png'
import type { Report } from './types'

export * from './types'
export { fmtBytes } from './bytes'

export class Unsupported extends Error {
  ext: string
  constructor(ext: string) {
    super('unsupported')
    this.ext = ext
  }
}

/** Sniff by bytes, never by extension. */
export async function inspect(file: File): Promise<Report> {
  const head = await read(file, 0, 8)
  if (startsWith(head, [0xff, 0xd8, 0xff])) return readJpeg(file, file.name)
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return readPng(file, file.name)
  if (startsWith(head, [0x25, 0x50, 0x44, 0x46])) return readPdf(file, file.name)
  if (startsWith(head, [0x50, 0x4b, 0x03, 0x04])) {
    const r = await readOoxml(file, file.name).catch(() => null)
    if (r) return r
  }
  throw new Unsupported(file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'unknown')
}

export function strip(file: File, report: Report): Promise<Blob> {
  switch (report.kind) {
    case 'jpeg': return stripJpeg(file)
    case 'png': return stripPng(file)
    case 'pdf': return stripPdf(file)
    default: return stripOoxml(file)
  }
}

export const cleanName = (name: string) => {
  const i = name.lastIndexOf('.')
  return i > 0 ? `${name.slice(0, i)}-clean${name.slice(i)}` : `${name}-clean`
}
