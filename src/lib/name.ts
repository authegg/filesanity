import type { Report } from './types'

/** The file name travels with the file and no metadata cleaner touches it. These are the giveaways a name commonly carries. */
const CHECKS: [RegExp, (m: RegExpExecArray) => string][] = [
  [/(?:^|[^a-z])(?:IMG|VID|PXL|DSC|MVIMG|PANO|Screenshot|Screen ?Shot|Screen Recording|WhatsApp (?:Image|Video)|Photo)[ _-]*(20\d\d)-?(\d\d)-?(\d\d)/i, (m) => `the date ${m[1]}-${m[2]}-${m[3]}`],
  [/(?:^|\D)(20\d\d)[-_.](0[1-9]|1[0-2])[-_.]([0-2]\d|3[01])(?!\d)/, (m) => `the date ${m[1]}-${m[2]}-${m[3]}`],
  [/[\w.+-]+@[\w-]+\.[\w.-]+/, (m) => `an email address, ${m[0]}`],
  [/\b(draft|internal|confidential|private|not for (?:circulation|distribution)|do not (?:share|send)|copy of|final ?final|v\d+|rev ?\d+)\b/i, (m) => `"${m[1]}"`],
]

/** What the name gives away, in plain words; empty when it looks neutral. */
export function nameRisks(name: string): string[] {
  const base = name.replace(/\.[^.]+$/, '')
  const out: string[] = []
  for (const [re, say] of CHECKS) {
    for (const m of base.matchAll(new RegExp(re, `${re.flags}g`))) if (!out.includes(say(m))) out.push(say(m))
  }
  return out
}

const WORD: Partial<Record<Report['kind'], string>> = { jpeg: 'photo', png: 'image', heic: 'photo', webp: 'image', mp4: 'video', mp3: 'audio', docx: 'document', odf: 'document', pdf: 'document', xlsx: 'spreadsheet', pptx: 'slides' }

/** A name that says only what the file is: photo.jpg, document.pdf. */
export function neutralName(name: string, kind: Report['kind']) {
  const ext = /\.[^.]+$/.exec(name)?.[0].toLowerCase() ?? ''
  return `${/^\.(m4a|aac)$/.test(ext) ? 'audio' : WORD[kind] ?? 'file'}${ext}`
}
