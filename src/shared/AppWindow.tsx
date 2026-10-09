import { useEffect, useState } from 'react'
import { fieldCount, fmtBytes, keptCount } from '../lib'
import { GROUPS, ORDER, rows, when } from './reveal'
import { useBatch } from './useBatch'
import { useRequests } from './useRequests'
import { FORMATS } from './site'


/** The working cleaner, framed as the product: files on the left, what each one says on the right, the actions below.
 *  Opens on the three samples, read for real after the page has painted. Themed by the page through --aw-* variables. */
export function AppWindow({ batch, label = 'FileSanity', canBatch = true, hold = false }: { batch?: ReturnType<typeof useBatch>; label?: string; canBatch?: boolean; hold?: boolean }) {
  const own = useBatch()
  const b = batch ?? own
  const n = useRequests(b.since)
  const [sel, setSel] = useState<number | null>(null)
  const [all, setAll] = useState(false)

  // hold: the page has its own request in flight; the samples wait so the counter starts after it.
  useEffect(() => {
    if (hold) return
    const go = () => setTimeout(b.sample, 250)
    if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hold])
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => { const f = [...(e.clipboardData?.files ?? [])]; if (f.length) { e.preventDefault(); b.add(f) } }
    addEventListener('paste', onPaste)
    return () => removeEventListener('paste', onPaste)
  }, [b.add])

  // Keep a valid selection: the newest file once yours arrive, else the first.
  useEffect(() => {
    if (!b.items.some((x) => x.id === sel)) setSel(b.items.find((x) => !x.sample)?.id ?? b.items[0]?.id ?? null)
  }, [b.items, sel])

  const cur = b.items.find((x) => x.id === sel)
  const r = cur?.report && b.withPolicy(cur.report)
  const list = r ? rows(r) : []
  const shown = all ? list : list.filter((x) => x.group !== 'other')
  const samples = b.items.length > 0 && b.items.every((x) => x.sample)

  return (
    <div className={`aw ${b.over ? 'over' : ''}`} {...b.dropProps} role="region" aria-label="FileSanity, the cleaner">
      <div className="aw-bar">
        <span className="aw-name">{label}</span>
        <span className="aw-net" aria-live="polite">
          On this device <span aria-hidden="true">/</span> <b>{n}</b> network {n === 1 ? 'request' : 'requests'}{b.since != null ? ' since your files arrived' : ''}
        </span>
      </div>

      <div className="aw-body">
        <aside className="aw-side" aria-label="Files">
          <div className="aw-side-head">
            <span>Files</span>
            <button className="aw-add" onClick={b.open}>Add files</button>
          </div>
          {b.items.length === 0 ? <p className="aw-hint">Nothing here yet.</p> : (
            <ul>
              {b.items.map((it) => {
                const rr = it.report && b.withPolicy(it.report)
                return (
                  <li key={it.id}>
                    <button className={`aw-file ${it.id === sel ? 'on' : ''}`} onClick={() => setSel(it.id)} aria-current={it.id === sel}>
                      <span className="aw-fn">{it.file.name}</span>
                      <span className="aw-fm">
                        {it.sample ? 'Sample, ' : ''}{it.error ? 'cannot read' : rr ? `${fieldCount(rr)} fields` : 'reading…'}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          {samples && <p className="aw-hint">These are samples. Drop or add your own files and they take their place.</p>}
        </aside>

        <div className="aw-main">
          {!cur ? (
            <div className="aw-empty">
              <p className="aw-drop">{b.over ? 'Let go to read them here.' : 'Drop files anywhere on this window.'}</p>
              <p><button className="aw-link" onClick={b.open}>Choose files</button>, paste them, or <button className="aw-link" onClick={b.sample}>load the samples</button>.</p>
              <p className="aw-small">{FORMATS}</p>
            </div>
          ) : cur.error ? (
            <div className="aw-empty"><p className="aw-drop">{cur.file.name}</p><p role="alert">{cur.error}</p></div>
          ) : !r ? (
            <div className="aw-empty"><p className="aw-drop">Reading {cur.file.name}…</p></div>
          ) : (
            <>
              <div className="aw-head">
                <div>
                  <h3 className="aw-title">{cur.file.name}</h3>
                  <p className="aw-small">{r.kindLabel}, {fmtBytes(r.bytes)}. {fieldCount(r)} fields to remove{keptCount(r) ? `, ${keptCount(r)} kept` : ''}.</p>
                </div>
              </div>
              {r.note && <p className="aw-note">{r.note}</p>}
              {fieldCount(r) === 0 && !keptCount(r) ? <p className="aw-clean">This file carries no metadata FileSanity can find. It is already clean.</p> : (
                <div className="aw-table" tabIndex={0} role="region" aria-label={`Fields in ${cur.file.name}`}>
                  <table>
                    {ORDER.map((g) => {
                      const gs = shown.filter((x) => x.group === g)
                      if (!gs.length) return null
                      return (
                        <tbody key={g}>
                          <tr className="aw-g"><th colSpan={3} scope="colgroup">{GROUPS[g]}</th></tr>
                          {gs.map((x, i) => (
                            <tr key={i} className={x.strip ? '' : 'kept'}>
                              <th scope="row">{x.name}</th>
                              <td>{g === 'when' ? when(x.value) : x.value}</td>
                              <td className="aw-part">{x.strip ? x.part : 'kept'}</td>
                            </tr>
                          ))}
                        </tbody>
                      )
                    })}
                  </table>
                  {!all && list.length > shown.length && <button className="aw-link aw-more" onClick={() => setAll(true)}>Show {list.length - shown.length} more fields</button>}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="aw-foot">
        <span className="aw-small" role="status">
          {b.done ? `Saved, ${fmtBytes(b.done.bytes)}. Nothing was uploaded.` : b.ready.length ? `${b.ready.length} ${b.ready.length === 1 ? 'file' : 'files'} ready.` : 'Files are read and cleaned in this tab.'}
        </span>
        <div className="aw-acts">
          {b.ready.length > 1 && <button className="aw-ghost" onClick={() => cur && b.cleanOne(cur.id)} disabled={!r}>Clean this one</button>}
          <button className="aw-ghost" onClick={b.saveRecord} disabled={!b.ready.length}>Download report</button>
          {b.ready.length > 1 && !canBatch ? <a className="aw-primary" href="/pricing">Clean all {b.ready.length}: needs Pro</a> : (
            <button className="aw-primary" onClick={() => (b.ready.length > 1 ? b.cleanAll() : cur && b.cleanOne(cur.id))} disabled={!b.ready.length}>
              {b.ready.length > 1 ? `Clean all ${b.ready.length} and download` : 'Remove all and download'}
            </button>
          )}
        </div>
      </div>
      <input {...b.inputProps} />
    </div>
  )
}
