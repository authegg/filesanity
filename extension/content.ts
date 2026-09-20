/** Runs on every page. When a file input receives files, each one FileSanity can read is replaced by its clean copy
 *  before the page's own listeners see the change. Files it cannot read pass through untouched. Drag-and-drop
 *  uploads that never touch an <input type=file> are not covered. */
import { cleanName, inspect, strip } from '../src/lib/index'

declare const chrome: { storage: { local: { get: (k: string[]) => Promise<Record<string, unknown>>; set: (v: Record<string, unknown>) => Promise<void> } } }
const store = chrome.storage.local

const MARK = '__filesanity'
const busy = new WeakMap<HTMLInputElement, Promise<void>>()

async function cleanAll(input: HTMLInputElement) {
  const dt = new DataTransfer()
  let n = 0
  for (const f of Array.from(input.files ?? [])) {
    try {
      const out = await strip(f, await inspect(f))
      dt.items.add(new File([out], cleanName(f.name), { type: f.type || out.type, lastModified: f.lastModified }))
      n++
    } catch {
      dt.items.add(f)
    }
  }
  input.files = dt.files
  if (n) {
    const { cleaned = 0 } = await store.get(['cleaned'])
    await store.set({ cleaned: (cleaned as number) + n })
  }
}

const intercept = (e: Event) => {
  const t = e.target
  if (!(t instanceof HTMLInputElement) || t.type !== 'file' || !t.files?.length) return
  if ((e as Event & { [MARK]?: true })[MARK]) return
  e.stopImmediatePropagation()
  if (busy.has(t)) return
  const job = (async () => {
    const { enabled = true } = await store.get(['enabled'])
    if (enabled) await cleanAll(t)
  })().catch(() => {}).then(() => {
    busy.delete(t)
    for (const type of ['input', 'change']) {
      const ev = new Event(type, { bubbles: true, composed: true }) as Event & { [MARK]?: true }
      ev[MARK] = true
      t.dispatchEvent(ev)
    }
  })
  busy.set(t, job)
}

for (const type of ['input', 'change']) window.addEventListener(type, intercept, true)
