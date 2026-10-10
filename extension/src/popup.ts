import { cleanFile } from './clean'
import { dayOf, ext, load, paid, save } from './store'

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const RULE = { always: 'Your site rule here: always clean.', never: 'Your site rule here: never clean.', ask: 'Your site rule here: ask each time.' }

async function init() {
  const s = await load()
  $('today').textContent = String(s.day === dayOf() ? s.today : 0)
  const [tab] = await ext.tabs.query({ active: true, currentWindow: true })
  if (tab?.id != null) $('tab').textContent = String((await ext.storage.session.get(`tab:${tab.id}`))[`tab:${tab.id}`] ?? 0)
  // The page's own content script names its host; there is none on browser pages, where nothing can be uploaded anyway.
  const host: string | null = tab?.id != null ? await ext.tabs.sendMessage(tab.id, { type: 'host' }, { frameId: 0 }).catch(() => null) : null
  const on = $<HTMLInputElement>('on')
  if (host) {
    $('host').textContent = host
    on.checked = !s.paused.includes(host)
    on.addEventListener('change', async () => {
      const p = (await load()).paused.filter((h) => h !== host)
      await save({ paused: on.checked ? p : [...p, host] })
    })
    const rule = paid(s) ? s.rules[host] : undefined
    if (rule) { $('rule').textContent = RULE[rule]; $('rule').hidden = false }
  } else {
    on.disabled = true; on.checked = false
    $('host').textContent = 'this page'
  }
  if (s.token) $('plan').textContent = paid(s) ? `Connected: ${s.plan[0].toUpperCase()}${s.plan.slice(1)}.` : 'Connected: Free plan.'
  if (s.token) ext.runtime.sendMessage({ type: 'recheck' }).catch(() => {})
}

async function take(f: File) {
  const msg = $('msg')
  msg.textContent = `Reading ${f.name}...`
  const s = await load()
  const c = await cleanFile(f, paid(s) ? s.policy : [], true)
  if (!c) { msg.textContent = `${f.name} is not a file FileSanity reads. It reads JPEG, PNG, HEIC, WebP, MP4, MOV, M4A, MP3, DOCX, XLSX, PPTX, ODT, ODS, ODP and PDF.`; return }
  const url = URL.createObjectURL(c.file)
  const a = document.createElement('a')
  a.href = url; a.download = c.file.name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
  msg.textContent = `${c.removed} ${c.removed === 1 ? 'field' : 'fields'} removed. Saved as ${c.file.name}.`
}

const input = $<HTMLInputElement>('file'), drop = $('drop')
// Firefox closes a popup when its file dialog opens, so there the picker opens in a tab.
const firefox = navigator.userAgent.includes('Firefox')
$('pick').addEventListener('click', () => (firefox && !location.search.includes('tab') ? ext.tabs.create({ url: ext.runtime.getURL('popup.html?tab=1') }).then(() => window.close()) : input.click()))
input.addEventListener('change', () => { const f = input.files?.[0]; if (f) take(f); input.value = '' })
drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over') })
drop.addEventListener('dragleave', () => drop.classList.remove('over'))
drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); const f = e.dataTransfer?.files?.[0]; if (f) take(f) })
$('opts').addEventListener('click', () => ext.runtime.openOptionsPage())
init()
