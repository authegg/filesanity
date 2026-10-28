/** Counts (per tab in session storage, per day in local storage), the toolbar badge, the subscriber log, the plan
 *  refresh and the "Save without metadata" menu. Holds no file except an image being saved, for one moment. */
import { cleanFile } from './clean'
import { dayOf, ext, load, paid, refresh, save, type Entry } from './store'

const MENU = 'fs-save-clean'

async function syncMenu() {
  const s = await load()
  await ext.contextMenus.removeAll()
  if (paid(s)) ext.contextMenus.create({ id: MENU, title: 'Save without metadata', contexts: ['image'] })
}

/** Re-reads the plan and policy for the stored token. A network failure keeps the last known plan. */
async function recheck() {
  const s = await load()
  if (s.token) {
    try { await save(await refresh(s.token)) } catch (x) { if (/unknown|disconnected/.test((x as Error).message)) await save({ plan: 'free', policy: [] }) }
  }
  await syncMenu()
}
ext.runtime.onInstalled.addListener(recheck)
ext.runtime.onStartup.addListener(recheck)
ext.storage.onChanged.addListener((c: Record<string, unknown>, area: string) => { if (area === 'local' && ('plan' in c || 'token' in c)) syncMenu() })

async function record(tabId: number | undefined, site: string, files: { name: string; removed: number }[]) {
  const s = await load()
  const today = s.day === dayOf() ? s.today + files.length : files.length
  const log: Entry[] = paid(s) ? [...files.map((f) => ({ at: new Date().toISOString(), site, name: f.name, removed: f.removed })), ...s.log].slice(0, 100) : s.log
  await save({ day: dayOf(), today, log })
  if (tabId == null) return
  const key = `tab:${tabId}`
  const n = (((await ext.storage.session.get(key))[key] as number) ?? 0) + files.length
  await ext.storage.session.set({ [key]: n })
  ext.action.setBadgeText({ tabId, text: String(n) })
  ext.action.setBadgeBackgroundColor({ tabId, color: '#0d5641' })
}

ext.runtime.onMessage.addListener((m: { type?: string; site?: string; files?: { name: string; removed: number }[]; file?: File; keep?: string[]; rename?: boolean }, sender: { tab?: { id?: number } }) => {
  if (m?.type === 'clean' && m.file) return cleanFile(m.file, m.keep ?? [], m.rename) // Firefox only, see content.ts
  if (m?.type === 'cleaned' && Array.isArray(m.files)) return record(sender.tab?.id, String(m.site ?? ''), m.files)
  if (m?.type === 'recheck') return recheck()
})
ext.tabs.onRemoved.addListener((tabId: number) => ext.storage.session.remove(`tab:${tabId}`))

ext.contextMenus.onClicked.addListener(async (info: { menuItemId: string; srcUrl?: string; frameId?: number }, tab?: { id?: number }) => {
  if (info.menuItemId !== MENU || !info.srcUrl || tab?.id == null) return
  const r = (await ext.tabs.sendMessage(tab.id, { type: 'save', src: info.srcUrl }, { frameId: info.frameId ?? 0 }).catch(() => null)) as { url: string; name: string; removed: number; site: string } | null
  if (!r) return
  // Chrome's service worker has no object URLs and takes the data URL; Firefox's background page makes a blob URL.
  const url = typeof URL.createObjectURL === 'function' ? URL.createObjectURL(await (await fetch(r.url)).blob()) : r.url
  await ext.downloads.download({ url, filename: r.name, saveAs: false })
  await record(tab.id, r.site, [{ name: r.name, removed: r.removed }])
})
