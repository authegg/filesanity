/** Runs on every page (v2's approach): when a file input receives files, or files are dropped on the page, each one
 *  FileSanity can read is swapped for its clean copy before the page's own listeners see it. Files it cannot read
 *  pass through untouched. Nothing is sent anywhere; the background only hears counts and, for subscribers, names. */
import { cleanFile } from './clean'
import { ext, load, paid, type State } from './store'

const busy = new WeakSet<EventTarget>()
const host = location.hostname
// Firefox shows a content script the page's objects through a wrapper the parsers cannot read through ("Permission
// denied to access property constructor"), so there the background page cleans; Firefox passes a File in a message.
const FIREFOX = ext.runtime.getURL('').startsWith('moz-extension:')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ff = globalThis as any // cloneInto and window.wrappedJSObject exist only in Firefox content scripts
const clean: typeof cleanFile = FIREFOX
  ? async (file, keep, rename) => {
      const c = await ext.runtime.sendMessage({ type: 'clean', file, keep, rename })
      // The copy arrives in this script's realm, which the page cannot read; hand it over in the page's.
      return c && { ...c, file: ff.cloneInto(c.file, window) }
    }
  : cleanFile

/** Whether to clean here, from the site rule (subscribers), else the free per-site pause. */
async function decide(s: State, n: number): Promise<boolean> {
  const rule = paid(s) ? s.rules[host] : undefined
  if (rule === 'never') return false
  if (rule === 'ask') return confirm(`FileSanity: remove the metadata from ${n === 1 ? 'this file' : `these ${n} files`} before ${host} receives ${n === 1 ? 'it' : 'them'}?`)
  if (rule === 'always') return true
  return !s.paused.includes(host)
}

/** The files to hand the page: clean copies where possible, originals otherwise. */
async function cleanList(files: File[]): Promise<File[]> {
  const s = await load()
  if (!files.length || !(await decide(s, files.length))) return files
  const keep = paid(s) ? s.policy : []
  const out: File[] = []
  const done: { name: string; removed: number }[] = []
  for (const f of files) {
    const c = await clean(f, keep)
    out.push(c?.file ?? f)
    if (c) done.push({ name: f.name, removed: c.removed })
  }
  if (done.length) ext.runtime.sendMessage({ type: 'cleaned', site: host, files: done }).catch(() => {})
  return out
}

// What the page reads must be made in the page's realm; in Firefox that means the page's own constructors.
const pageWin: typeof window = FIREFOX ? ff.window.wrappedJSObject : window
const toList = (files: File[]) => { const dt = new pageWin.DataTransfer(); for (const f of files) dt.items.add(f); return dt }
const dragEvent = (type: string, init: DragEventInit) => FIREFOX ? new pageWin.DragEvent(type, ff.cloneInto(init, window, { wrapReflectors: true })) : new DragEvent(type, init)
// dispatchEvent is synchronous, so a flag marks our own replays (an expando would not cross Firefox's realm wrappers).
let replaying = false
const redispatch = (t: EventTarget, types: string[], init: (type: string) => Event) => {
  replaying = true
  try { for (const type of types) t.dispatchEvent(init(type)) } finally { replaying = false }
}

// File inputs: hold the page's input/change events, swap the files, then let the page hear them.
const onPick = (e: Event) => {
  const t = e.target
  if (!(t instanceof HTMLInputElement) || t.type !== 'file' || !t.files?.length || replaying) return
  e.stopImmediatePropagation()
  if (busy.has(t)) return
  busy.add(t)
  cleanList(Array.from(t.files)).then((files) => { t.files = toList(files).files }).catch(() => {}).finally(() => {
    busy.delete(t)
    redispatch(t, ['input', 'change'], (type) => new Event(type, { bubbles: true, composed: true }))
  })
}
for (const type of ['input', 'change']) window.addEventListener(type, onPick, true)

// Drops: hold the drop, then replay it at the same spot with the clean files. A drop on a file input fills the input.
window.addEventListener('drop', (e) => {
  const files = Array.from(e.dataTransfer?.files ?? [])
  if (!files.length || replaying || !e.target) return
  e.preventDefault()
  e.stopImmediatePropagation()
  const t = e.target
  const { clientX, clientY, screenX, screenY } = e
  cleanList(files).catch(() => files).then((clean) => {
    const dt = toList(clean)
    if (t instanceof HTMLInputElement && t.type === 'file') {
      t.files = dt.files
      redispatch(t, ['input', 'change'], (type) => new Event(type, { bubbles: true, composed: true }))
    } else {
      // ponytail: a replayed drop is untrusted (isTrusted false); a page that checks for that will ignore it.
      redispatch(t, ['drop'], (type) => dragEvent(type, { bubbles: true, cancelable: true, composed: true, dataTransfer: dt, clientX, clientY, screenX, screenY }))
    }
  })
}, true)

// Pastes that carry files (a file copied in the file manager, a screenshot): hold the paste, replay it with clean files
// and the same text. Pastes of text only are never touched. Not in Firefox: it empties the clipboard of a constructed
// paste event, so a replay would lose the paste; there the page gets the original.
if (!FIREFOX) window.addEventListener('paste', (e) => {
  const cd = e.clipboardData
  const files = Array.from(cd?.files ?? [])
  if (!files.length || replaying || !e.target) return
  e.preventDefault()
  e.stopImmediatePropagation()
  const t = e.target
  const text = cd!.types.filter((type) => type !== 'Files').map((type) => [type, cd!.getData(type)] as const)
  cleanList(files).catch(() => files).then((clean) => {
    const dt = toList(clean)
    for (const [type, v] of text) dt.setData(type, v)
    // ponytail: the replayed paste is untrusted, so the browser's own insert (an image into a bare contenteditable) does not run; pages that read clipboardData, as upload pages do, get the clean files.
    redispatch(t, ['paste'], (type) => new ClipboardEvent(type, { bubbles: true, cancelable: true, composed: true, clipboardData: dt }))
  })
}, true)

// "Save without metadata" on an image (subscribers): the background asks the frame that holds the image.
ext.runtime.onMessage.addListener((m: { type?: string; src?: string }, _sender: unknown, reply: (r: unknown) => void) => {
  if (m?.type === 'host') return reply(host)
  if (m?.type !== 'save' || !m.src) return
  ;(async () => {
    try {
      // ponytail: fetched from the page, so a cross-origin image without CORS headers cannot be read; we say so.
      const r = await fetch(m.src!, { credentials: 'include' })
      if (!r.ok) throw new Error(`the image answered ${r.status}`)
      const blob = await r.blob()
      const name = decodeURIComponent(new URL(m.src!, location.href).pathname.split('/').pop() || 'image') || 'image'
      const s = await load()
      const c = await clean(new File([blob], name, { type: blob.type }), paid(s) ? s.policy : [], true)
      if (!c) { alert('FileSanity reads JPEG, PNG and HEIC images. This image is in another format, so it was not saved.'); return reply(null) }
      const url = await new Promise<string>((ok) => { const fr = new FileReader(); fr.onload = () => ok(fr.result as string); fr.readAsDataURL(c.file) })
      reply({ url, name: c.file.name, removed: c.removed, site: host })
    } catch (x) {
      alert(`FileSanity could not read this image (${(x as Error).message || 'the site does not allow it'}). Open it in its own tab and try again.`)
      reply(null)
    }
  })()
  return true
})
