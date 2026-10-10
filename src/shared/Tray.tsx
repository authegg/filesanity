import { fmtBytes, neutralName } from '../lib'
import { GROUPS, ORDER, rows, when } from './reveal'
import type { Cleaner } from './useCleaner'
import { useRequests } from './useRequests'
import { FORMATS } from './site'
import { useEffect, useState } from 'react'

/** The single-file cleaner without a frame: drop prompt, then the fields grouped, then clean. Themed by --tr-* or the page tokens. */
export function Tray({ c, drop = true }: { c: Cleaner; drop?: boolean }) {
  const [since, setSince] = useState<number | null>(null)
  useEffect(() => { if (c.file) setSince(performance.now()) }, [c.file])
  const n = useRequests(since)
  const r = c.report
  const props = drop ? c.dropProps : {}

  let body
  if (c.state === 'reading') body = <p className="tr-status">Reading {c.file?.name}…</p>
  else if (c.state === 'error') body = <><p className="tr-status tr-err" role="alert">{c.error}</p><button className="tr-ghost" onClick={c.reset}>Try another file</button></>
  else if (c.state === 'cleaned') body = (
    <>
      <p className="tr-big">Saved a clean copy as {c.downloadName}.</p>
      <p className="tr-status">{c.removed} fields removed, {fmtBytes(c.cleanedBytes)}.{c.kept ? ` ${c.kept} kept, as the note says.` : ''} Nothing was uploaded.</p>
      {c.warned > 0 && <p className="tr-status">{c.warned} {c.warned === 1 ? 'thing' : 'things'} in the content stayed as they were: change {c.warned === 1 ? 'it' : 'them'} in the app that made the file.</p>}
      {r && <ul className="tr-gone" aria-label="Removed, by what it gave away">{ORDER.map((g) => { const k = rows(r).filter((x) => x.group === g && x.strip).length; return k ? <li key={g}><span>{GROUPS[g]}</span><b>{k}</b></li> : null })}</ul>}
      <button className="tr-ghost" onClick={c.reset}>Clean another file</button>
    </>
  )
  else if (r && c.state !== 'over') {
    const list = rows(r).filter((x) => x.group !== 'other')
    body = (
      <>
        <div className="tr-chip"><b>{c.file?.name}</b><span>{r.kindLabel}, {fmtBytes(r.bytes)}</span></div>
        <p className="tr-big">{c.removed ? `${c.removed} hidden fields found.` : c.warned ? 'No metadata to remove.' : c.kept ? 'Nothing FileSanity can remove here.' : 'Nothing hidden: this file is already clean.'}</p>
        {c.warned > 0 && <p className="tr-status">{c.warned} {c.warned === 1 ? 'thing' : 'things'} in the content, listed first. Cleaning leaves {c.warned === 1 ? 'it' : 'them'} as {c.warned === 1 ? 'it is' : 'they are'}, because removing {c.warned === 1 ? 'it' : 'them'} would change the document.</p>}
        {r.note && <p className="tr-status">{r.note}</p>}
        {list.length > 0 && (
          <div className="tr-fields" tabIndex={0} role="region" aria-label="Fields found">
            <table>{ORDER.map((g) => {
              const gs = list.filter((x) => x.group === g)
              return gs.length > 0 && (
                <tbody key={g}>
                  <tr className="tr-g"><th colSpan={2} scope="colgroup">{GROUPS[g]}</th></tr>
                  {gs.map((x, i) => <tr key={i}><th scope="row">{x.name}</th><td className={g === 'where' ? 'tr-nw' : undefined}>{g === 'when' ? when(x.value) : x.value}</td></tr>)}
                </tbody>
              )
            })}</table>
          </div>
        )}
        {c.risks.length > 0 && (
          <label className="tr-name"><input type="checkbox" checked={c.neutral} onChange={(e) => c.setNeutral(e.target.checked)} /> <span>Save it as <b>{neutralName(c.file!.name, r.kind)}</b>. The name gives away {c.risks.join(' and ')}, and no cleaner touches a name.</span></label>
        )}
        <div className="tr-acts">
          <button className="tr-primary" onClick={c.clean} disabled={!c.removed}>Remove all and download</button>
          <button className="tr-ghost" onClick={c.reset}>Another file</button>
        </div>
      </>
    )
  } else body = (
    <>
      <p className="tr-big">{c.state === 'over' ? 'Let go to read it here.' : 'Drop a photo or document here.'}</p>
      <p className="tr-status"><button className="tr-link" onClick={c.open}>Choose a file</button>, paste one, or <button className="tr-link" onClick={c.sample}>try the sample photo</button>.</p>
      <p className="tr-small">{FORMATS}</p>
    </>
  )

  return (
    <div className={`tr tr-${c.state}`} {...props} role="region" aria-label="The cleaner">
      <div className="tr-body">{body}</div>
      <p className="tr-net" aria-live="polite">On this device. <b>{n}</b> network {n === 1 ? 'request' : 'requests'}{since != null ? ' since your file arrived' : ''}.</p>
      <input {...c.inputProps} />
    </div>
  )
}
