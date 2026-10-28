/** A small XML reader: the subset of the DOM the parsers use (elements, attributes, text), so the same
 *  code runs in the browser, in Node for the command line, and in a Worker for the API. Not validating;
 *  a document that does not close every tag it opens is refused with null, as DOMParser would. */

export class XEl {
  children: XEl[] = []
  text = ''
  name: string
  attrs: { name: string; value: string }[]
  parent: XEl | null
  constructor(name: string, attrs: { name: string; value: string }[], parent: XEl | null) {
    this.name = name
    this.attrs = attrs
    this.parent = parent
  }
  get localName() {
    return this.name.slice(this.name.indexOf(':') + 1)
  }
  get textContent(): string {
    return this.text + this.children.map((c) => c.textContent).join('')
  }
  getAttribute(name: string) {
    return this.attrs.find((a) => a.name === name)?.value ?? null
  }
  /** Every descendant, document order. */
  all(): XEl[] {
    return this.children.flatMap((c) => [c, ...c.all()])
  }
}

const ENT: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" }
export const unescapeXml = (s: string) =>
  s.includes('&') ? s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) => (e[0] === '#' ? String.fromCodePoint(parseInt(e[1] === 'x' || e[1] === 'X' ? e.slice(2) : e.slice(1), e[1] === 'x' || e[1] === 'X' ? 16 : 10)) : ENT[e] ?? m)) : s

const ATTR = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g

/** The document element, or null if the text is not well-formed enough to trust. */
export function parseXml(src: string): XEl | null {
  const root = new XEl('#document', [], null)
  let cur = root
  let i = 0
  const n = src.length
  while (i < n) {
    const lt = src.indexOf('<', i)
    if (lt < 0) {
      cur.text += unescapeXml(src.slice(i))
      break
    }
    if (lt > i) cur.text += unescapeXml(src.slice(i, lt))
    if (src.startsWith('<!--', lt)) {
      const e = src.indexOf('-->', lt + 4)
      if (e < 0) return null
      i = e + 3
    } else if (src.startsWith('<![CDATA[', lt)) {
      const e = src.indexOf(']]>', lt + 9)
      if (e < 0) return null
      cur.text += src.slice(lt + 9, e)
      i = e + 3
    } else if (src.startsWith('<?', lt) || src.startsWith('<!', lt)) {
      const e = src.indexOf('>', lt)
      if (e < 0) return null
      i = e + 1
    } else if (src[lt + 1] === '/') {
      const e = src.indexOf('>', lt)
      if (e < 0 || cur === root || src.slice(lt + 2, e).trim() !== cur.name) return null
      cur = cur.parent!
      i = e + 1
    } else {
      const e = src.indexOf('>', lt)
      if (e < 0) return null
      const selfClosing = src[e - 1] === '/'
      const tag = src.slice(lt + 1, selfClosing ? e - 1 : e)
      const sp = tag.search(/[\s/]/)
      const name = sp < 0 ? tag : tag.slice(0, sp)
      if (!name) return null
      const attrs: XEl['attrs'] = []
      if (sp >= 0) for (const m of tag.slice(sp).matchAll(ATTR)) attrs.push({ name: m[1], value: unescapeXml(m[2] ?? m[3] ?? '') })
      const el = new XEl(name, attrs, cur)
      cur.children.push(el)
      if (!selfClosing) cur = el
      i = e + 1
    }
  }
  if (cur !== root || root.children.length !== 1) return null
  const doc = root.children[0]
  doc.parent = null
  return doc
}

const TOKEN = /<!--[^]*?-->|<!\[CDATA\[[^]*?\]\]>|<[?!][^>]*>|<\/([^\s>]+)\s*>|<([^\s/>]+)(?:[^>"']|"[^"]*"|'[^']*')*?(\/?)>/g

/** Rebuilds an XML text element by element, innermost first: `fn` gets each element's name, its start tag and its already
 *  rebuilt inner text, and returns what to write in its place (undefined keeps the element). Everything else passes through
 *  as it was, so a part with nothing to change comes back identical. */
export function rewriteXml(src: string, fn: (name: string, tag: string, inner: string) => string | undefined): string {
  const stack: { name: string; tag: string; out: string[] }[] = [{ name: '', tag: '', out: [] }]
  let i = 0
  for (const m of src.matchAll(TOKEN)) {
    const top = stack[stack.length - 1]
    top.out.push(src.slice(i, m.index))
    i = m.index + m[0].length
    if (m[2] && m[3]) top.out.push(fn(m[2], m[0], '') ?? m[0])
    else if (m[2]) stack.push({ name: m[2], tag: m[0], out: [] })
    else if (m[1] && stack.length > 1) {
      const el = stack.pop()!, inner = el.out.join('')
      stack[stack.length - 1].out.push(fn(el.name, el.tag, inner) ?? el.tag + inner + m[0])
    } else top.out.push(m[0])
  }
  // An element left open (not well-formed) is written back as it came.
  while (stack.length > 1) { const el = stack.pop()!; stack[stack.length - 1].out.push(el.tag + el.out.join('')) }
  return stack[0].out.join('') + src.slice(i)
}
