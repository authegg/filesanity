import { POLICY } from '../../src/lib/index'
import { ext, load, paid, refresh, save, type Rule } from './store'

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const RULES: Record<Rule, string> = { always: 'Always clean', never: 'Never clean', ask: 'Ask each time' }
const cell = (tr: HTMLTableRowElement, text: string, cls = '') => { const td = tr.insertCell(); td.textContent = text; if (cls) td.className = cls; return td }
/** A host from what people paste: a bare host, or a URL. */
const hostOf = (v: string) => { try { return new URL(v.includes('://') ? v : `https://${v}`).hostname } catch { return '' } }

async function render() {
  const s = await load()
  const on = paid(s)
  $('status').textContent = !s.token ? 'Not connected.' : on ? `Connected to a ${s.plan[0].toUpperCase()}${s.plan.slice(1)} plan.` : 'Connected, on the Free plan. The features below come with Pro, Team or API.'
  $('disconnect').hidden = !s.token
  $('policy').textContent = !on ? 'Removes everything FileSanity can remove. A saved policy comes with Pro, Team or API.'
    : s.policy.length ? `Keeps ${s.policy.map((k) => POLICY.find((p) => p.key === k)?.label ?? k).join(', ')}; everything else is removed. Change it on the batch page at filesanity.com.`
      : 'Removes everything FileSanity can remove. Change it on the batch page at filesanity.com.'

  $<HTMLFieldSetElement>('rules-box').disabled = !on
  const rules = $<HTMLTableSectionElement>('rules')
  rules.replaceChildren()
  for (const [host, rule] of Object.entries(s.rules)) {
    const tr = rules.insertRow()
    cell(tr, host); cell(tr, RULES[rule])
    const b = document.createElement('button')
    b.type = 'button'; b.className = 'btn ghost'; b.textContent = 'Remove'; b.setAttribute('aria-label', `Remove the rule for ${host}`)
    b.onclick = async () => { const r = { ...(await load()).rules }; delete r[host]; await save({ rules: r }); render() }
    tr.insertCell().append(b)
  }
  if (!rules.rows.length) cell(rules.insertRow(), 'No rules yet.').colSpan = 3

  const log = $<HTMLTableSectionElement>('log')
  log.replaceChildren()
  for (const e of s.log) {
    const tr = log.insertRow()
    cell(tr, new Date(e.at).toLocaleString()); cell(tr, e.site); cell(tr, e.name); cell(tr, String(e.removed), 'num')
  }
  if (!s.log.length) cell(log.insertRow(), on ? 'Nothing cleaned since connecting.' : 'The log starts once a Pro, Team or API account is connected.').colSpan = 4
  $<HTMLButtonElement>('clear-log').disabled = !s.log.length
}

$('connect').addEventListener('submit', async (e) => {
  e.preventDefault()
  const err = $('err'), field = $<HTMLInputElement>('token')
  const token = field.value.trim()
  err.textContent = ''
  if (!/^fs_ext_[a-f0-9]{40}$/.test(token)) { err.textContent = 'That is not a connection token. It starts with fs_ext_ and comes from your account page.'; return }
  try {
    await save({ token, ...(await refresh(token)) })
    field.value = ''
  } catch (x) { err.textContent = (x as Error).message }
  render()
})
$('disconnect').addEventListener('click', async () => { await save({ token: '', plan: 'free', policy: [] }); render() })
$('add-rule').addEventListener('submit', async (e) => {
  e.preventDefault()
  const host = hostOf($<HTMLInputElement>('rule-host').value.trim())
  if (!host) return
  await save({ rules: { ...(await load()).rules, [host]: $<HTMLSelectElement>('rule-kind').value as Rule } })
  $<HTMLInputElement>('rule-host').value = ''
  render()
})
$('clear-log').addEventListener('click', async () => { if (confirm('Clear the log of cleans?')) { await save({ log: [] }); render() } })
ext.storage.onChanged.addListener(() => render())
render()
