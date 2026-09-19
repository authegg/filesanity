import { useCallback, useEffect, useRef, useState } from 'react'
import { Plates } from './Figure'
import { cleanName, fieldCount, fmtBytes, inspect, keptCount, strip, Unsupported, type Report } from './lib'

type State =
  | { status: 'empty' }
  | { status: 'reading'; name: string }
  | { status: 'unsupported'; name: string; reason: string }
  | { status: 'error'; name: string; message: string }
  | { status: 'ready'; file: File; report: Report; thumb?: string }
  | { status: 'cleaned'; file: File; report: Report; thumb?: string; out: Blob; url: string }

const SPEC = [
  ['JPEG', 'EXIF, XMP, IPTC and Photoshop resources, comments', 'All removed. The ICC colour profile stays. If the photo was shot sideways, one EXIF value is written back so it still displays the right way up.'],
  ['PNG', 'tEXt, zTXt and iTXt text chunks, eXIf, tIME', 'All removed. The colour profile stays.'],
  ['DOCX, XLSX, PPTX', 'core.xml, app.xml, custom.xml, the first-page thumbnail; authors of tracked changes and comments', 'The four parts are emptied and the package is rewritten part for part. Tracked changes and comments are shown, not removed: that is an edit to the document, so it stays your call.'],
  ['PDF', 'The Info dictionary and the XMP packet', 'The Info dictionary and an uncompressed XMP packet are blanked in place, same length, so nothing else in the file moves. A compressed XMP stream, which is what Word and Acrobat usually write, is shown and kept; the figure says so. Metadata inside compressed object streams is not read yet.'],
  ['Not yet', 'MP4, MOV, M4A, GIF, TIFF, PSD, DOC, XLS, PPT, ODT, ODS, ODP', 'Shown as unsupported. Nothing is sent anywhere either way.'],
]

export default function App() {
  const [state, setState] = useState<State>({ status: 'empty' })
  const [over, setOver] = useState(false)
  const [requests, setRequests] = useState(0)
  const [hint, setHint] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const figure = useRef<HTMLElement>(null)

  // Count every network request the page makes after a file is read. It stays at zero; the point is that you can watch it.
  useEffect(() => {
    if (!('PerformanceObserver' in window)) return
    const po = new PerformanceObserver((list) => {
      const n = list.getEntries().filter((e) => e.name.startsWith('http')).length
      if (n) setRequests((c) => c + n)
    })
    po.observe({ type: 'resource', buffered: false })
    return () => po.disconnect()
  }, [])

  const load = useCallback(async (file: File) => {
    setState((s) => {
      if (s.status === 'cleaned') URL.revokeObjectURL(s.url)
      if ((s.status === 'ready' || s.status === 'cleaned') && s.thumb) URL.revokeObjectURL(s.thumb)
      return { status: 'reading', name: file.name }
    })
    try {
      const report = await inspect(file)
      const thumb = report.kind === 'jpeg' || report.kind === 'png' ? URL.createObjectURL(file) : undefined
      setRequests(0)
      setState({ status: 'ready', file, report, thumb })
      figure.current?.scrollIntoView({ block: 'nearest' })
    } catch (e) {
      if (e instanceof Unsupported) setState({ status: 'unsupported', name: file.name, reason: e.message })
      else setState({ status: 'error', name: file.name, message: e instanceof Error ? e.message : 'could not be read' })
    }
  }, [])

  const pick = () => input.current?.click()
  const sample = async () => {
    const r = await fetch('/sample.jpg')
    load(new File([await r.blob()], 'IMG_4471.jpg', { type: 'image/jpeg' }))
  }

  const clean = async () => {
    if (state.status !== 'ready') return
    try {
      const out = await strip(state.file, state.report)
      const url = URL.createObjectURL(out)
      setState({ ...state, status: 'cleaned', out, url })
      download(url, cleanName(state.file.name))
    } catch (e) {
      setState({ status: 'error', name: state.file.name, message: e instanceof Error ? e.message : 'could not be rewritten' })
    }
  }

  const download = (url: string, name: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
  }

  /** One file at a time; a folder is refused by name; more than one file reads the first and says so. */
  const take = (files: FileList | null, entry?: { isDirectory?: boolean } | null) => {
    if (!files?.length) return
    if (entry?.isDirectory) {
      setHint('')
      setState({ status: 'unsupported', name: files[0].name, reason: `${files[0].name} is a folder. Drop one file from inside it.` })
      return
    }
    setHint(files.length > 1 ? `One file at a time, reading ${files[0].name}.` : '')
    load(files[0])
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setOver(false)
    take(e.dataTransfer.files, e.dataTransfer.items?.[0]?.webkitGetAsEntry?.())
  }

  const report = state.status === 'ready' || state.status === 'cleaned' ? state.report : null
  const fields = report ? fieldCount(report) : 0
  const kept = report ? keptCount(report) : 0
  const stripParts = report ? report.segments.filter((s) => s.strip) : []

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:bg-paper focus:p-2">Skip to content</a>
      <input ref={input} type="file" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => take(e.target.files)} />

      <header className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:px-6">
        <a href="/" aria-current="page" className="font-mono text-[0.9375rem] font-semibold tracking-[-0.01em]">FileSanity</a>
        <button type="button" className="btn" onClick={pick}>Clean a file</button>
      </header>

      <main id="main" className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <section className="grid grid-cols-1 gap-8 border-t border-rule pt-6 lg:grid-cols-12 lg:gap-10 lg:pt-8" aria-labelledby="h1">
          <div className="min-w-0 lg:col-span-5">
            <h1 id="h1" className="m-0 text-[clamp(1.75rem,4.8vw,2.75rem)] leading-[1.1] lg:text-[clamp(1.75rem,1.9vw,2.25rem)]">The file never leaves your browser.</h1>
            <p className="mt-4 max-w-[42ch] text-[1.0625rem] leading-relaxed text-muted lg:mt-5">Drop a photo or a document. It is read and stripped on your own machine. Nothing is uploaded.</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 lg:mt-6">
              <button type="button" className="btn" onClick={pick}>Clean a file</button>
              <button type="button" className="link font-mono text-[0.9375rem]" onClick={sample}>Try a sample</button>
            </div>
          </div>

          <figure
            ref={figure}
            className={`relative m-0 min-w-0 border border-rule lg:col-span-7 ${over ? 'drop-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setOver(true) }}
            onDragLeave={() => setOver(false)}
            onDrop={onDrop}
            aria-label="Your file, taken apart"
          >
            <figcaption className="flex items-center justify-between gap-4 border-b border-rule px-3 py-2 sm:px-4" aria-live="polite">
              <span className="meta">
                {state.status === 'empty' && 'Fig. 1, a typical file'}
                {state.status === 'reading' && `Reading ${state.name}`}
                {state.status === 'unsupported' && `Fig. 1, ${state.name}`}
                {state.status === 'error' && `Fig. 1, ${state.name}`}
                {report && `Fig. 1, ${report.name}, ${report.kindLabel.toLowerCase()}, ${fmtBytes(report.bytes)}`}
              </span>
              {hint ? <span className="meta text-muted">{hint}</span> : report && <span className="meta text-muted">Requests since read: {requests}</span>}
            </figcaption>

            <div className="grid-paper px-3 py-3 sm:px-5 sm:py-6">
              {state.status === 'unsupported' ? (
                <div className="max-w-[52ch] font-mono text-[0.8125rem] leading-relaxed">
                  <p className="m-0"><span className="tag tag-kept">not read</span></p>
                  <p className="mt-3">{state.reason} Nothing was sent anywhere, and nothing was changed.</p>
                </div>
              ) : state.status === 'error' ? (
                <div className="max-w-[52ch] font-mono text-[0.8125rem] leading-relaxed">
                  <p className="m-0"><span className="tag tag-kept">not read</span></p>
                  <p className="mt-3">{state.name} could not be taken apart: {state.message}. Your file was not sent anywhere, and nothing was changed.</p>
                </div>
              ) : (
                <Plates report={report} state={state.status === 'cleaned' ? 'cleaned' : report ? 'ready' : 'empty'} thumb={state.status === 'ready' || state.status === 'cleaned' ? state.thumb : undefined} />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-rule px-3 py-3 sm:px-4">
              {state.status === 'empty' || state.status === 'unsupported' || state.status === 'error' ? (
                <>
                  <button type="button" className="btn btn-quiet" onClick={pick}>Drop a file here, or choose one</button>
                  <span className="font-mono text-[0.75rem] text-muted">JPEG, PNG, DOCX, XLSX, PPTX, PDF</span>
                </>
              ) : state.status === 'reading' ? (
                <span className="font-mono text-[0.8125rem]">Reading the parts of the file.</span>
              ) : state.status === 'ready' ? (
                fields || stripParts.length ? (
                  <>
                    <button type="button" className="btn" onClick={clean}>Strip {fields} {fields === 1 ? 'field' : 'fields'} and download</button>
                    <span className="font-mono text-[0.75rem] text-muted">{stripParts.length} {stripParts.length === 1 ? 'part' : 'parts'} to remove, {fmtBytes(report!.bytes - report!.body.bytes)}</span>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-[0.8125rem]">{kept ? `Nothing FileSanity can remove here. ${kept} ${kept === 1 ? 'field is' : 'fields are'} shown and kept.` : 'Nothing to remove. This file carries no metadata FileSanity reads.'}</span>
                    <button type="button" className="btn btn-quiet" onClick={pick}>Clean a file</button>
                  </>
                )
              ) : (
                <>
                  <span className="font-mono text-[0.8125rem] tabular-nums">
                    Before: {fmtBytes(state.report.bytes)}, {fields + kept} {fields + kept === 1 ? 'field' : 'fields'}. After: {fmtBytes(state.out.size)}, {fields} removed{kept ? `, ${kept} kept` : ''}.
                  </span>
                  <span className="flex flex-wrap gap-x-4 gap-y-2">
                    <button type="button" className="btn btn-quiet" onClick={() => download(state.url, cleanName(state.file.name))}>Download again</button>
                    <button type="button" className="btn" onClick={pick}>Clean a file</button>
                  </span>
                </>
              )}
            </div>
            {report?.note && <p className="m-0 border-t border-rule px-3 py-2 font-mono text-[0.75rem] leading-relaxed text-muted sm:px-4">{report.note}</p>}
          </figure>
        </section>

        {report && (
          <section className="mt-12 border-t border-rule pt-6" aria-labelledby="h-fields">
            <h2 id="h-fields" className="m-0 text-[1.25rem]">What {report.name} is carrying</h2>
            <p className="mt-2 max-w-[60ch] text-[0.9375rem] text-muted">Every field FileSanity could read, by the part of the file it sits in. {state.status === 'cleaned' ? 'Struck-through rows are gone from the downloaded copy.' : 'Rows marked remove go when you strip the file.'}</p>
            <div className="mt-5 overflow-x-auto">
              <table className="fields w-full border-collapse font-mono text-[0.75rem] leading-[1.4]">
                <thead>
                  <tr className="meta text-muted">
                    <th scope="col" className="w-[9rem]">Part</th>
                    <th scope="col" className="w-[14rem]">Field</th>
                    <th scope="col">Value</th>
                    <th scope="col" className="w-[5rem]">Fate</th>
                  </tr>
                </thead>
                <tbody>
                  {report.segments.flatMap((s) =>
                    (s.fields.length ? s.fields : [{ name: 'nothing readable', value: '' }]).map((f, k) => (
                      <tr key={`${s.id}-${k}`} className={state.status === 'cleaned' && s.strip ? 'text-muted line-through decoration-accent-ink' : ''}>
                        <th scope="row">{k === 0 ? s.label : ''}</th>
                        <td>{f.name}</td>
                        <td className="break-words [overflow-wrap:anywhere]">{f.value}</td>
                        <td className="whitespace-nowrap">{s.strip ? (state.status === 'cleaned' ? 'removed' : 'remove') : 'kept'}</td>
                      </tr>
                    )),
                  )}
                  <tr>
                    <th scope="row">{report.body.label}</th>
                    <td colSpan={2}>{fmtBytes(report.body.bytes)}, untouched</td>
                    <td>stays</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {report.segments.some((s) => !s.strip && s.why) && (
              <ul className="mt-4 max-w-[70ch] list-none p-0 font-mono text-[0.75rem] leading-relaxed text-muted">
                {report.segments.filter((s) => !s.strip && s.why).map((s) => <li key={s.id}>{s.label}: {s.why}.</li>)}
              </ul>
            )}
          </section>
        )}

        <section className="mt-16 grid grid-cols-1 gap-8 border-t border-rule pt-6 lg:mt-20 lg:grid-cols-12 lg:gap-10" aria-labelledby="h-spec">
          <div className="lg:col-span-4">
            <h2 id="h-spec" className="m-0 text-[1.25rem]">What is read, what is removed</h2>
            <p className="mt-3 max-w-[42ch] text-[0.9375rem] leading-relaxed text-muted">Every format is taken apart by its own parser, written for this page, small enough to read. Files are told apart by their first bytes, not their names.</p>
          </div>
          <div className="lg:col-span-8">
            <table className="spec w-full border-collapse font-mono text-[0.75rem] leading-[1.45]">
              <thead>
                <tr className="meta text-muted"><th scope="col" className="w-[8rem] sm:w-[10rem]">Format</th><th scope="col" className="hidden sm:table-cell">Read</th><th scope="col">Removed</th></tr>
              </thead>
              <tbody>
                {SPEC.map(([f, r, s]) => (
                  <tr key={f}><th scope="row">{f}</th><td className="hidden sm:table-cell">{r}</td><td><span className="sm:hidden text-muted">{r}. </span>{s}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16 grid grid-cols-1 gap-8 border-t border-rule pt-6 lg:mt-20 lg:grid-cols-12 lg:gap-10" aria-labelledby="h-how">
          <div className="lg:col-span-4">
            <h2 id="h-how" className="m-0 text-[1.25rem]">How it stays on your device</h2>
          </div>
          <div className="max-w-[62ch] text-[1rem] leading-relaxed lg:col-span-8">
            <p className="mt-0">A cleaner that uploads your file has to ask you to trust it: encrypted in transit, not stored, deleted after. FileSanity has nothing to promise, because the file is never sent. The page reads it with the browser's own file interface, the same one a web mail attachment uses before you press send.</p>
            <p>The parser reads only the header bytes it needs. The clean copy is assembled from slices of the original, so a two-gigabyte scan costs no more memory than a snapshot, and nothing is decoded or re-saved: the pixels and the text you meant to send are byte for byte what they were.</p>
            <p>There is no size limit that comes from a server, no daily count, no account. The counter on the figure lists every network request the page makes after your file is read. Open your browser's network panel and clean a file: it stays at zero.</p>
            <p>A listing photo carries the street it was taken on. An offer letter carries who drafted it, who reviewed it and how many minutes they spent. A PDF carries the software that made it and the day it was last touched. Take that off before it goes to a stranger.</p>
          </div>
        </section>
      </main>

      <footer className="mx-auto mt-16 max-w-[1400px] border-t border-rule px-4 py-6 font-mono text-[0.75rem] leading-relaxed text-muted sm:px-6 lg:mt-20">
        <p className="m-0 max-w-[80ch]">FileSanity runs in your browser. No account, no upload, no server. Nothing is collected, so there is no privacy policy to link. Fig. 1's sample photograph is generated and its metadata is invented.</p>
      </footer>
    </>
  )
}
