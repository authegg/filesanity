import { latin1 } from './bytes'
import type { Field } from './types'

/** C2PA Content Credentials: a signed JUMBF store (JPEG APP11, PNG caBX) naming the app that made the file, who signed
 *  it, whether it says AI made it, and the edits. Read by scanning for its CBOR keys, not by decoding the store.
 *  ponytail: a heuristic read of the first manifest; the strip removes the whole store regardless, so a miss here only
 *  shortens the list. Upgrade to a CBOR + COSE walk if the list must name the active manifest exactly. */
export const isC2pa = (b: Uint8Array) => latin1(b).includes('c2pa')

/** The CBOR text string right after `key` (also a CBOR text string), or ''. */
function textAfter(s: string, key: string, from = 0): string {
  const i = s.indexOf(key, from)
  if (i < 0) return ''
  let p = i + key.length
  const h = s.charCodeAt(p++)
  let n = h - 0x60
  if (h === 0x78) n = s.charCodeAt(p++)
  else if (h === 0x79) { n = (s.charCodeAt(p) << 8) | s.charCodeAt(p + 1); p += 2 }
  else if (h < 0x60 || h > 0x77) return ''
  return new TextDecoder().decode(Uint8Array.from(s.slice(p, p + n), (c) => c.charCodeAt(0)))
}

/** A certificate name attribute (OID 2.5.4.x), the nth one in the store: issuer comes before subject in each cert. */
function certName(s: string, oid: number, nth: number): string {
  const tag = `\x06\x03\x55\x04${String.fromCharCode(oid)}`
  let at = -1
  for (let k = 0; k <= nth; k++) { at = s.indexOf(tag, at + 1); if (at < 0) return '' }
  const len = s.charCodeAt(at + tag.length + 1)
  return s.slice(at + tag.length + 2, at + tag.length + 2 + len)
}

const SOURCE: Record<string, string> = {
  trainedAlgorithmicMedia: 'Made by AI (trained algorithmic media)',
  compositeWithTrainedAlgorithmicMedia: 'Partly made by AI',
  algorithmicMedia: 'Made by software, not a camera',
  digitalCapture: 'A camera capture',
  compositeCapture: 'Several camera captures combined',
}

export function c2paFields(b: Uint8Array): Field[] {
  const s = latin1(b)
  const out: Field[] = []
  const info = s.indexOf('claim_generator_info')
  const app = info >= 0 ? [textAfter(s, '\x64name', info), textAfter(s, '\x67version', info)].filter(Boolean).join(' ') : ''
  const made = app || textAfter(s, '\x6fclaim_generator')
  if (made) out.push({ name: 'Made with (Content Credentials)', value: made })
  // The first certificate is the signer's: its issuer's name comes first, its own second.
  const signer = certName(s, 0x0a, 1) || certName(s, 0x03, 1)
  if (signer) out.push({ name: 'Signed by', value: signer })
  const src = /digitalsourcetype\/([A-Za-z]+)/.exec(s)?.[1]
  if (src) out.push({ name: 'Digital source type', value: SOURCE[src] ?? src })
  const actions = [...new Set([...s.matchAll(/\x66action/g)].map((m) => textAfter(s, '\x66action', m.index)).filter((a) => a.startsWith('c2pa.')).map((a) => a.slice(5).replace(/_/g, ' ')))]
  if (actions.length) out.push({ name: 'Edit history', value: actions.join(', ') })
  const ingredients = new Set([...s.matchAll(/c2pa\.ingredient(?:\.v\d)?(?:__\d+)?\x00/g)].map((m) => m[0])).size
  if (ingredients) out.push({ name: 'Made from', value: `${ingredients} earlier ${ingredients === 1 ? 'file' : 'files'}` })
  out.push({ name: 'Content Credentials (C2PA)', value: `${Math.round(b.length / 1024)} kB signed record` })
  return out
}
