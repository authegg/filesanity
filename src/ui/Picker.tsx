import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, CircleNotch, File as FileIcon, FileDoc, FilePdf, FilePpt, FileXls, Image, WarningCircle, X } from '@phosphor-icons/react'
import { applyPolicy, cleanName, fieldCount, fmtBytes, inspect, keptCount, parsePolicy, POLICY, strip, Unsupported, type Report } from '../lib'

export type PickerState =
  | { status: 'idle' }
  | { status: 'reading'; name: string }
  | { status: 'error'; name: string; message: string }
  | { status: 'ready'; file: File; report: Report }
  | { status: 'cleaned'; file: File; report: Report; out: Blob; url: string }

const GLYPH: Record<Report['kind'] | 'other', typeof FileIcon> = { jpeg: Image, png: Image, docx: FileDoc, xlsx: FileXls, pptx: FilePpt, pdf: FilePdf, other: FileIcon }
const ACCEPT = '.jpg,.jpeg,.png,.pdf,.docx,.xlsx,.pptx,image/jpeg,image/png,application/pdf'

export function usePicker() {
  const [state, setState] = useState<PickerState>({ status: 'idle' })
  const [over, setOver] = useState(false)
  const [note, setNote] = useState('')
  const [requests, setRequests] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const overCount = useRef(0)

  // Every network request after a read, from the browser's own observer. It stays at zero; the point is that you can watch it.
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
      return { status: 'reading', name: file.name }
    })
    try {
      // A policy shared as a link (/?keep=exif,xmp) flips those kinds to kept; see /batch.
      const report = applyPolicy(await inspect(file), parsePolicy(location.search))
      setRequests(0)
      setState({ status: 'ready', file, report })
    } catch (e) {
      const message = e instanceof Unsupported ? e.message : `${file.name} could not be read: ${e instanceof Error ? e.message : 'unknown error'}.`
      setState({ status: 'error', name: file.name, message })
    }
  }, [])

  /** One file at a time; a folder is refused; more than one reads the first and points at batch. */
  const take = useCallback((files: FileList | File[] | null, entry?: { isDirectory?: boolean } | null) => {
    if (!files?.length) return
    const list = Array.from(files)
    if (entry?.isDirectory) {
      setNote('')
      setState({ status: 'error', name: list[0].name, message: `${list[0].name} is a folder. Drop one file from inside it.` })
      return
    }
    setNote(list.length > 1 ? `Reading ${list[0].name}. For ${list.length} files at once, use batch.` : '')
    load(list[0])
  }, [load])

  // Ctrl+V an image or a file copied from the desktop.
  useEffect(() => {
    const paste = (e: ClipboardEvent) => {
      const files = e.clipboardData?.files
      if (files?.length) {
        e.preventDefault()
        take(files)
      }
    }
    document.addEventListener('paste', paste)
    return () => document.removeEventListener('paste', paste)
  }, [take])

  const pick = useCallback(() => input.current?.click(), [])
  const sample = useCallback(async () => {
    setState({ status: 'reading', name: 'IMG_4471.jpg' })
    const r = await fetch('/sample.jpg')
    load(new File([await r.blob()], 'IMG_4471.jpg', { type: 'image/jpeg' }))
  }, [load])

  const download = (url: string, name: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
  }

  const clean = useCallback(async () => {
    if (state.status !== 'ready') return
    try {
      const out = await strip(state.file, state.report)
      const url = URL.createObjectURL(out)
      setState({ ...state, status: 'cleaned', out, url })
      download(url, cleanName(state.file.name))
    } catch (e) {
      setState({ status: 'error', name: state.file.name, message: `${state.file.name} could not be rewritten: ${e instanceof Error ? e.message : 'unknown error'}.` })
    }
  }, [state])

  const reset = useCallback(() => {
    setState((s) => {
      if (s.status === 'cleaned') URL.revokeObjectURL(s.url)
      return { status: 'idle' }
    })
    setNote('')
  }, [])

  const dragProps = {
    onDragEnter: (e: React.DragEvent) => { e.preventDefault(); overCount.current += 1; setOver(true) },
    onDragOver: (e: React.DragEvent) => { e.preventDefault() },
    onDragLeave: () => { overCount.current -= 1; if (overCount.current <= 0) { overCount.current = 0; setOver(false) } },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      overCount.current = 0
      setOver(false)
      take(e.dataTransfer.files, e.dataTransfer.items?.[0]?.webkitGetAsEntry?.())
    },
  }

  const inputEl = (
    <input
      ref={input}
      type="file"
      accept={ACCEPT}
      className="sr-only"
      tabIndex={-1}
      aria-hidden="true"
      onChange={(e) => { take(e.target.files); e.target.value = '' }}
    />
  )

  return { state, over, note, requests, pick, sample, clean, reset, download, dragProps, inputEl }
}

export type PickerApi = ReturnType<typeof usePicker>

function Chip({ name, size, kind, onRemove }: { name: string; size?: number; kind: Report['kind'] | 'other'; onRemove: () => void }) {
  const Glyph = GLYPH[kind]
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-full bg-ground py-1.5 pl-2 pr-1.5 shadow-[inset_0_0_0_1px_var(--hair)]">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-panel shadow-[inset_0_0_0_1px_var(--hair)]">
        <Glyph size={18} weight="light" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[0.875rem] font-medium" title={name}>{name}</span>
      {size !== undefined && <span className="flex-none text-[0.8125rem] tabular-nums text-muted">{fmtBytes(size)}</span>}
      <button type="button" onClick={onRemove} aria-label={`Remove ${name}`} className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-muted transition-colors duration-200 ease-[var(--ease)] hover:bg-panel hover:text-ink">
        <X size={16} weight="light" aria-hidden="true" />
      </button>
    </div>
  )
}

/** The drop surface: a real button. Enter or Space opens the picker; the OS dialog is the browser's, every pixel here is ours. */
export function Picker({ p }: { p: PickerApi }) {
  const { state, over, note, requests, pick, sample, clean, reset, download } = p
  const primary = useRef<HTMLButtonElement>(null)

  // After a clean the strip button is replaced; focus follows so a keyboard user is not dropped on body.
  useEffect(() => {
    if (state.status === 'cleaned') primary.current?.focus()
  }, [state.status])

  const report = state.status === 'ready' || state.status === 'cleaned' ? state.report : null
  const fields = report ? fieldCount(report) : 0
  const kept = report ? keptCount(report) : 0

  const live =
    state.status === 'idle' ? '' :
    state.status === 'reading' ? `Reading ${state.name}.` :
    state.status === 'error' ? state.message :
    state.status === 'ready' ? `${report!.name} read. ${fields} ${fields === 1 ? 'field' : 'fields'} can be removed${kept ? `, ${kept} kept` : ''}.` :
    `${report!.name} cleaned. ${fields} ${fields === 1 ? 'field' : 'fields'} removed. The download has started.`

  return (
    <div className="flex h-full min-w-0 flex-col" data-state={state.status}>
      <p className="sr-only" role="status" aria-live="polite">{live} {note}</p>

      {state.status === 'idle' || state.status === 'reading' || state.status === 'error' ? (
        <div className="flex flex-1 flex-col">
          <button
            type="button"
            onClick={pick}
            className={`drop flex min-h-[15rem] flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center sm:min-h-[19rem] ${over ? 'is-over' : ''}`}
            aria-describedby="drop-help"
            disabled={state.status === 'reading'}
          >
            {state.status === 'reading' ? (
              <>
                <CircleNotch size={28} weight="light" className="spin text-muted" aria-hidden="true" />
                <span className="text-[0.9375rem] font-medium">Reading {state.name}</span>
                <span className="text-[0.8125rem] text-muted">Only the header bytes are read. Nothing is sent.</span>
              </>
            ) : state.status === 'error' ? (
              <>
                <WarningCircle size={28} weight="light" className="text-accent" aria-hidden="true" />
                <span className="max-w-[36ch] text-[0.9375rem] font-medium">{state.message}</span>
                <span className="text-[0.8125rem] text-muted">Nothing was sent, and nothing was changed. Drop another file, or press to browse.</span>
              </>
            ) : (
              <>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ground shadow-[inset_0_0_0_1px_var(--hair)]">
                  <ArrowDown size={22} weight="light" aria-hidden="true" />
                </span>
                <span className="text-[1.0625rem] font-medium">{over ? 'Release to read it' : 'Drop a file here'}</span>
                <span className="text-[0.875rem] text-muted">or press to browse. Paste works too.</span>
              </>
            )}
          </button>
          <div id="drop-help" className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[0.8125rem] text-muted">
            <span>JPEG, PNG, DOCX, XLSX, PPTX, PDF. One file at a time.</span>
            <button type="button" className="link" onClick={sample} disabled={state.status === 'reading'}>Try a sample</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Chip name={report!.name} size={state.status === 'cleaned' ? state.out.size : report!.bytes} kind={report!.kind} onRemove={reset} />
            {note && <span className="text-[0.8125rem] text-muted">{note.endsWith('use batch.') ? <>{note.slice(0, -6)}<a href="/batch" className="link">batch</a>.</> : note}</span>}
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-ground shadow-[inset_0_0_0_1px_var(--hair)]">
            {state.status === 'cleaned' ? (
              <div className="grid grid-cols-2 divide-x divide-hair-2 border-b border-hair-2">
                <div className="px-4 py-3">
                  <span className="block text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted">Before</span>
                  <span className="mt-1 block text-[1.25rem] font-medium tabular-nums">{fields + kept} {fields + kept === 1 ? 'field' : 'fields'}</span>
                  <span className="block text-[0.8125rem] tabular-nums text-muted">{fmtBytes(report!.bytes)}</span>
                </div>
                <div className="px-4 py-3">
                  <span className="block text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted">After</span>
                  <span className="mt-1 block text-[1.25rem] font-medium tabular-nums">{kept} {kept === 1 ? 'field' : 'fields'}</span>
                  <span className="block text-[0.8125rem] tabular-nums text-muted">{fmtBytes(state.out.size)}, {fields} removed</span>
                </div>
              </div>
            ) : (
              <div className="border-b border-hair-2 px-4 py-3">
                <span className="block text-[1.25rem] font-medium tabular-nums">
                  {fields ? `${fields} ${fields === 1 ? 'field' : 'fields'} to remove` : 'Nothing to remove'}
                </span>
                <span className="block text-[0.8125rem] text-muted">
                  {fields
                    ? `${report!.segments.filter((s) => s.strip).length} ${report!.segments.filter((s) => s.strip).length === 1 ? 'part' : 'parts'} of the file, ${fmtBytes(Math.max(0, report!.bytes - report!.body.bytes))}${kept ? `. ${kept} ${kept === 1 ? 'field is' : 'fields are'} shown and kept.` : '.'}`
                    : kept ? `${kept} ${kept === 1 ? 'field is' : 'fields are'} shown and kept.` : 'This file carries no metadata FileSanity reads.'}
                </span>
              </div>
            )}
            <div className="max-h-[20rem] flex-1 overflow-y-auto overscroll-contain lg:max-h-[26rem]" tabIndex={0} aria-label="Fields found in the file">
              <FieldTable report={report!} cleaned={state.status === 'cleaned'} />
            </div>
          </div>

          {report!.note && <p className="text-[0.8125rem] leading-relaxed text-muted">{report!.note}</p>}
          {report!.segments.some((s) => s.why === 'kept by your policy') && (
            <p className="text-[0.8125rem] leading-relaxed text-muted">
              Policy from this link: keeping {parsePolicy(location.search).map((k) => POLICY.find((p) => p.key === k)!.label).join(', ')}. <a href="/" className="link">Clear it</a> or <a href="/batch" className="link">change it</a>.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {state.status === 'ready' ? (
              fields ? (
                <button ref={primary} type="button" className="pill" onClick={clean}>
                  Remove all and download
                  <span className="orb"><ArrowDown size={16} weight="light" aria-hidden="true" /></span>
                </button>
              ) : (
                <button type="button" className="pill" onClick={pick}>
                  Clean a file
                  <span className="orb"><ArrowRight size={16} weight="light" aria-hidden="true" /></span>
                </button>
              )
            ) : (
              <>
                <button ref={primary} type="button" className="pill" onClick={() => download(state.url, cleanName(state.file.name))}>
                  Download again
                  <span className="orb"><ArrowDown size={16} weight="light" aria-hidden="true" /></span>
                </button>
                <button type="button" className="pill pill-ghost" onClick={pick}>
                  Clean another
                  <span className="orb"><ArrowRight size={16} weight="light" aria-hidden="true" /></span>
                </button>
              </>
            )}
            <span className="ml-auto text-[0.8125rem] tabular-nums text-muted">Requests since read: {requests}</span>
          </div>
        </div>
      )}
    </div>
  )
}

/** Every field read, by the part of the file it sits in. */
function FieldTable({ report, cleaned }: { report: Report; cleaned: boolean }) {
  return (
    <table className="fields w-full table-fixed">
      <thead className="sticky top-0 bg-ground">
        <tr><th scope="col" className="w-[5.5rem]">Part</th><th scope="col" className="w-[9.5rem]">Field</th><th scope="col">Value</th><th scope="col" className="w-[5.5rem]">Fate</th></tr>
      </thead>
      <tbody>
        {report.segments.flatMap((s) =>
          (s.fields.length ? s.fields : [{ name: 'nothing readable', value: '' }]).map((f, k) => (
            <tr key={`${s.id}-${k}`} className={cleaned && s.strip ? 'gone' : ''}>
              <th scope="row">{k === 0 ? s.label : ''}</th>
              <td className="f">{f.name}</td>
              <td className="v break-words [overflow-wrap:anywhere]">{f.value}</td>
              <td className="fate whitespace-nowrap">{s.strip ? (cleaned ? 'Removed' : 'Remove') : 'Kept'}</td>
            </tr>
          )),
        )}
        {report.segments.filter((s) => !s.strip && s.why).map((s) => (
          <tr key={`why-${s.id}`}><th scope="row">{s.label}</th><td colSpan={3} className="v text-muted">{s.why}.</td></tr>
        ))}
        <tr>
          <th scope="row">{report.body.label}</th>
          <td colSpan={2} className="v">{fmtBytes(report.body.bytes)}, untouched</td>
          <td className="fate">Stays</td>
        </tr>
      </tbody>
    </table>
  )
}
