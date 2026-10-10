export type Field = { name: string; value: string }

/** One part of the file: a JPEG segment, a PNG chunk, a zip entry, a PDF object. */
export type Segment = {
  id: string
  /** Short label for the diagram: EXIF, XMP, IPTC, core.xml, Info ... */
  label: string
  /** What this part is, in one plain clause. */
  what: string
  bytes: number
  fields: Field[]
  /** true: the strip removes or blanks it. false: kept, with `why`. */
  strip: boolean
  why?: string
  /** Not metadata but something in the content the sender may not know is there (hidden sheets, earlier PDF saves, links
   *  that fire on opening). Always kept: changing it would change the document. */
  warn?: boolean
}

export type Report = {
  kind: 'jpeg' | 'png' | 'heic' | 'webp' | 'mp4' | 'mp3' | 'docx' | 'xlsx' | 'pptx' | 'odf' | 'pdf'
  kindLabel: string
  name: string
  bytes: number
  segments: Segment[]
  /** Everything that stays: the picture, the document body. */
  body: { label: string; bytes: number }
  /** A caveat shown on the page, e.g. PDF compressed object streams. */
  note?: string
}

export const fieldCount = (r: Report) => r.segments.filter((s) => s.strip).reduce((n, s) => n + s.fields.length, 0)
export const keptCount = (r: Report) => r.segments.filter((s) => !s.strip && !s.warn).reduce((n, s) => n + s.fields.length, 0)
export const warnCount = (r: Report) => r.segments.filter((s) => s.warn).reduce((n, s) => n + s.fields.length, 0)
