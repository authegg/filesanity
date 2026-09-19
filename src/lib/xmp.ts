import { latin1, u16, u32, utf8 } from './bytes'
import type { Field } from './types'

/** XMP packet (XML) to fields: every attribute on rdf:Description and every leaf element with text. */
export function parseXmp(xml: string): Field[] {
  const fields: Field[] = []
  let doc: Document
  try {
    doc = new DOMParser().parseFromString(xml.replace(/^[^<]*/, ''), 'application/xml')
  } catch {
    return fields
  }
  if (doc.getElementsByTagName('parsererror').length) return [{ name: 'XMP packet', value: `${xml.length} characters, could not be parsed` }]
  const seen = new Set<string>()
  const push = (name: string, value: string) => {
    const v = value.trim()
    if (!v) return
    const key = name + '=' + v
    if (seen.has(key)) return
    seen.add(key)
    fields.push({ name, value: v })
  }
  const walk = (el: Element) => {
    for (const a of Array.from(el.attributes)) {
      if (a.name.startsWith('xmlns') || a.name === 'rdf:about' || a.name === 'rdf:parseType' || a.name === 'xml:lang') continue
      push(a.name, a.value)
    }
    const kids = Array.from(el.children)
    if (!kids.length) {
      const name = el.nodeName === 'rdf:li' ? (el.parentElement?.parentElement?.nodeName ?? 'item') : el.nodeName
      push(name, el.textContent ?? '')
      return
    }
    for (const k of kids) walk(k)
  }
  const roots = doc.getElementsByTagNameNS('*', 'Description')
  for (const r of Array.from(roots)) walk(r)
  const tk = doc.documentElement.getAttribute('x:xmptk')
  if (tk) push('x:xmptk', tk)
  return fields
}

const IPTC: Record<number, string> = {
  5: 'Object name', 7: 'Edit status', 10: 'Urgency', 15: 'Category', 20: 'Supplemental category', 25: 'Keyword',
  30: 'Release date', 37: 'Expiration date', 40: 'Special instructions', 55: 'Date created', 60: 'Time created',
  62: 'Digitisation date', 63: 'Digitisation time', 65: 'Originating program', 70: 'Program version',
  80: 'By-line', 85: 'By-line title', 90: 'City', 92: 'Sub-location', 95: 'Province or state',
  100: 'Country code', 101: 'Country', 103: 'Transmission reference', 105: 'Headline', 110: 'Credit',
  115: 'Source', 116: 'Copyright notice', 118: 'Contact', 120: 'Caption', 122: 'Caption writer',
}

/** Photoshop IRB (APP13 payload after "Photoshop 3.0\0") to fields: IPTC datasets and the other resource ids. */
export function parseIrb(b: Uint8Array): Field[] {
  const fields: Field[] = []
  let i = 0
  while (i + 12 <= b.length) {
    if (latin1(b, i, i + 4) !== '8BIM') break
    const id = u16(b, i + 4)
    const nameLen = b[i + 6]
    let p = i + 7 + nameLen
    if ((nameLen + 1) % 2) p++
    const size = u32(b, p)
    p += 4
    const data = b.subarray(p, p + size)
    if (id === 0x0404) fields.push(...parseIptc(data))
    else if (id === 0x0425) fields.push({ name: 'IPTC digest', value: `${size} bytes` })
    else if (id === 0x0422) fields.push({ name: 'EXIF copy (Photoshop)', value: `${size} bytes` })
    else if (id === 0x0424) fields.push({ name: 'XMP copy (Photoshop)', value: `${size} bytes` })
    else if (id === 0x03ed) fields.push({ name: 'Photoshop resolution', value: `${size} bytes` })
    else if (id === 0x040f) fields.push({ name: 'ICC profile (Photoshop)', value: `${size} bytes` })
    else fields.push({ name: `Photoshop resource 0x${id.toString(16).padStart(4, '0')}`, value: `${size} bytes` })
    p += size + (size % 2)
    i = p
  }
  return fields
}

export function parseIptc(b: Uint8Array): Field[] {
  const fields: Field[] = []
  let i = 0
  while (i + 5 <= b.length) {
    if (b[i] !== 0x1c) break
    const rec = b[i + 1], ds = b[i + 2]
    let len = u16(b, i + 3)
    let p = i + 5
    if (len & 0x8000) {
      const n = len & 0x7fff
      len = 0
      for (let k = 0; k < n; k++) len = len * 256 + b[p + k]
      p += n
    }
    const data = b.subarray(p, p + len)
    if (rec === 2) fields.push({ name: IPTC[ds] ?? `IPTC 2:${ds}`, value: utf8(data) })
    else if (!(rec === 1 && ds === 90)) fields.push({ name: `IPTC ${rec}:${ds}`, value: `${len} bytes` })
    i = p + len
  }
  return fields
}
