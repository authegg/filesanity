import type { Report } from '../lib'


const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** "2026:04:11 17:42:09", "2026-04-11T17:42:09+01:00" or "2026-04-12 09:03:51 +01:00" -> "11 April 2026 at 17:42". */
export function when(v: string) {
  const m = v.match(/^(\d{4})[:-](\d\d)[:-](\d\d)(?:[ T](\d\d):(\d\d))?/)
  if (!m) return v
  const d = `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}`
  return m[4] ? `${d} at ${m[4]}:${m[5]}` : d
}

export type Group = 'who' | 'where' | 'when' | 'device' | 'other'
export type Row = { group: Group; name: string; value: string; part: string; strip: boolean }

export const GROUPS: Record<Group, string> = {
  who: 'Who made it',
  where: 'Where it was',
  when: 'When',
  device: 'On what',
  other: 'Everything else',
}

const RULES: [Group, RegExp][] = [
  ['other', /exposure|f-number|^iso$|focal/i],
  ['device', /created with|produced by|made with|digital source|creatortool|softwareagent/i],
  ['where', /gps|latitude|longitude|altitude|city|country|state|location|sublocation/i],
  ['who', /artist|author|creator(?!tool)|by-line|owner|copyright|rights|last modified by|manager|company|reviewer|signed by/i],
  ['when', /date|time(?! \()|created|modified|when/i],
  ['device', /make|model|serial|lens|software|creatortool|application|produced|softwareagent|xmptk/i],
]

export const groupOf = (name: string): Group => RULES.find(([, re]) => re.test(name))?.[0] ?? 'other'

export const ORDER: Group[] = ['where', 'who', 'when', 'device', 'other']

/** Every field, flattened and sorted by what it gives away: place, person, time, device, then the rest. */
export function rows(r: Report): Row[] {
  const order = ORDER
  return r.segments
    .flatMap((s) => s.fields.map((f) => ({ group: groupOf(f.name), name: f.name, value: f.value, part: s.label, strip: s.strip })))
    .sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group))
}

/** The one-line story a report tells, built only from fields actually present. */
export function headline(r: Report): string[] {
  const all = rows(r)
  const pick = (re: RegExp) => all.find((x) => re.test(x.name))?.value
  const out: string[] = []
  const who = pick(/^(artist|author|by-line|dc:creator)$/i)
  const city = pick(/city/i)
  const date = pick(/original/i) ?? pick(/^created$|createdate/i)
  const dev = [pick(/camera model/i), pick(/^application$|created with/i)].find(Boolean)
  if (who) out.push(who)
  if (city) out.push(city)
  else if (pick(/gps latitude/i)) out.push('GPS position')
  if (date) out.push(when(date))
  if (dev) out.push(dev)
  return out
}
