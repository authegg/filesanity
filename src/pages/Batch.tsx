import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, CircleNotch, X } from '@phosphor-icons/react'
import { applyPolicy, cleanName, fieldCount, fmtBytes, inspect, keptCount, parsePolicy, POLICY, strip, Unsupported, type Report } from '../lib'
import { zipStore } from '../lib/zip'
import { Closer, PageHead, Section } from '../ui/bits'

export const meta = {
  title: 'Batch: clean a folder of files in your browser',
  description: 'Drop a folder or many files. Each photo, Office file and PDF is cleaned on your own machine and comes back as one zip in the same shape, under a team policy.',
}

type Row = { id: number; file: File; path: string } & (
  | { status: 'reading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; report: Report }
  | { status: 'cleaned'; report: Report; out: Blob }
)

const ACCEPT = '.jpg,.jpeg,.png,.pdf,.docx,.xlsx,.pptx'
let seq = 0

/** Every file under a dropped folder, with its path inside it. */
async function unfold(entry: FileSystemEntry, prefix: string, out: { file: File; path: string }[]) {
  if (entry.isFile) {
    const file = await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej))
    if (!file.name.startsWith('.')) out.push({ file, path: prefix + file.name })
  } else if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader()
    for (;;) {
      const batch = await new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej))
      if (!batch.length) break
      for (const e of batch) await unfold(e, `${prefix}${entry.name}/`, out)
    }
  }
}

const withPolicy = (r: Row, keep: string[]): Row => (r.status === 'ready' ? { ...r, report: applyPolicy(r.report, keep) } : r)

export default function Batch() {
  const [rows, setRows] = useState<Row[]>([])
  const [keep, setKeep] = useState<string[]>([])
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const raw = useRef(new Map<number, Report>()) // the report as read, before any policy
  const overCount = useRef(0)
  const filesInput = useRef<HTMLInputElement>(null)
  const folderInput = useRef<HTMLInputElement>(null)
  const primary = useRef<HTMLButtonElement>(null)

  // The policy lives in the URL and nowhere else: the address bar is the share button.
  useEffect(() => { setKeep(parsePolicy(location.search)) }, [])
  const setPolicy = (next: string[]) => {
    setKeep(next)
    history.replaceState(null, '', next.length ? `/batch?keep=${next.join(',')}` : '/batch')
    setRows((rs) => rs.map((r) => (r.status === 'ready' ? { ...r, report: applyPolicy(raw.current.get(r.id)!, next) } : r)))
  }

  const add = useCallback(async (items: { file: File; path: string }[]) => {
    const fresh: Row[] = items.map(({ file, path }) => ({ id: ++seq, file, path, status: 'reading' }))
    setRows((rs) => [...rs.filter((r) => r.status !== 'cleaned'), ...fresh])
    for (const r of fresh) {
      let next: Row
      try {
        const report = await inspect(r.file)
        raw.current.set(r.id, report)
        next = withPolicy({ ...r, status: 'ready', report }, parsePolicy(location.search))
      } catch (e) {
        next = { ...r, status: 'error', message: e instanceof Unsupported ? e.message : e instanceof Error ? e.message : 'could not be read' }
      }
      setRows((rs) => rs.map((x) => (x.id === r.id ? next : x)))
    }
  }, [])

  const takeList = (list: FileList | null) => {
    if (!list?.length) return
    add(Array.from(list).filter((f) => !f.name.startsWith('.')).map((file) => ({ file, path: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name })))
  }

  const dragProps = {
    onDragEnter: (e: React.DragEvent) => { e.preventDefault(); overCount.current += 1; setOver(true) },
    onDragOver: (e: React.DragEvent) => { e.preventDefault() },
    onDragLeave: () => { overCount.current -= 1; if (overCount.current <= 0) { overCount.current = 0; setOver(false) } },
    onDrop: async (e: React.DragEvent) => {
      e.preventDefault()
      overCount.current = 0
      setOver(false)
      const entries = Array.from(e.dataTransfer.items ?? []).map((i) => i.webkitGetAsEntry?.()).filter(Boolean) as FileSystemEntry[]
      if (entries.length) {
        const out: { file: File; path: string }[] = []
        for (const en of entries) await unfold(en, '', out)
        add(out)
      } else takeList(e.dataTransfer.files)
    },
  }

  const ready = rows.filter((r) => r.status === 'ready') as Extract<Row, { status: 'ready' }>[]
  const cleaned = rows.filter((r) => r.status === 'cleaned') as Extract<Row, { status: 'cleaned' }>[]
  const reading = rows.some((r) => r.status === 'reading')
  const toRemove = ready.reduce((n, r) => n + fieldCount(r.report), 0)
  const folder = rows.find((r) => r.path.includes('/'))?.path.split('/')[0]

  const download = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  const clean = async () => {
    if (!ready.length || busy) return
    setBusy(true)
    const done: Extract<Row, { status: 'cleaned' }>[] = []
    for (const r of ready) {
      try {
        done.push({ ...r, status: 'cleaned', out: await strip(r.file, r.report) })
      } catch (e) {
        setRows((rs) => rs.map((x) => (x.id === r.id ? { ...r, status: 'error', message: `could not be rewritten: ${e instanceof Error ? e.message : 'unknown error'}` } : x)))
      }
    }
    if (done.length === 1) download(done[0].out, cleanName(done[0].file.name))
    else if (done.length) download(await zipStore(done.map((r) => ({ path: r.path.includes('/') ? r.path.replace(/^[^/]+/, (f) => `${f}-clean`) : cleanName(r.path), data: r.out }))), `${folder ?? 'files'}-clean.zip`)
    setRows((rs) => rs.map((x) => done.find((d) => d.id === x.id) ?? x))
    setBusy(false)
    primary.current?.focus()
  }

  const clear = () => { setRows([]); raw.current.clear() }
  const remove = (id: number) => { setRows((rs) => rs.filter((r) => r.id !== id)); raw.current.delete(id) }

  const share = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}/batch${keep.length ? `?keep=${keep.join(',')}` : ''}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* the address bar carries the same link */ }
  }

  const live = busy ? 'Cleaning.' : cleaned.length ? `${cleaned.length} ${cleaned.length === 1 ? 'file' : 'files'} cleaned. The download has started.` : reading ? 'Reading.' : ready.length ? `${ready.length} ${ready.length === 1 ? 'file' : 'files'} read, ${toRemove} ${toRemove === 1 ? 'field' : 'fields'} to remove.` : ''

  return (
    <>
      <PageHead
        eyebrow="Batch"
        title="A folder in, a clean folder out."
        lede="Drop a folder, or as many files as you like. Each one is read and cleaned on your own machine, and they come back as one zip in the same shape."
      />
      <Section>
        <div className={`bezel bezel-lg ${over ? 'is-over' : ''}`} {...dragProps}>
          <div className="plate plate-hero flex flex-col gap-6 p-5 sm:p-8">
            <p className="sr-only" role="status" aria-live="polite">{live}</p>

            {rows.length === 0 ? (
              <button type="button" onClick={() => filesInput.current?.click()} className={`drop flex min-h-[15rem] flex-col items-center justify-center gap-3 px-6 py-10 text-center ${over ? 'is-over' : ''}`} aria-describedby="batch-help">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ground shadow-[inset_0_0_0_1px_var(--hair)]">
                  <ArrowDown size={22} weight="light" aria-hidden="true" />
                </span>
                <span className="text-[1.0625rem] font-medium">{over ? 'Release to read them' : 'Drop a folder or files here'}</span>
                <span className="text-[0.875rem] text-muted">or press to browse.</span>
              </button>
            ) : (
              <div className="overflow-hidden rounded-2xl bg-ground shadow-[inset_0_0_0_1px_var(--hair)]">
                <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-hair-2 px-4 py-3">
                  <span className="text-[1.25rem] font-medium tabular-nums">
                    {cleaned.length ? `${cleaned.length} ${cleaned.length === 1 ? 'file' : 'files'} cleaned` : reading ? 'Reading' : toRemove ? `${toRemove} ${toRemove === 1 ? 'field' : 'fields'} to remove in ${ready.length} ${ready.length === 1 ? 'file' : 'files'}` : 'Nothing to remove'}
                  </span>
                  <span className="text-[0.8125rem] text-muted">{rows.filter((r) => r.status === 'error').length ? `${rows.filter((r) => r.status === 'error').length} skipped.` : ''} {folder ? `Folder: ${folder}` : ''}</span>
                </div>
                <div className="max-h-[28rem] overflow-y-auto overscroll-contain" tabIndex={0} aria-label="Files in the batch">
                  <table className="fields w-full table-fixed">
                    <thead className="sticky top-0 bg-ground">
                      <tr><th scope="col">File</th><th scope="col" className="w-[9rem]">Kind</th><th scope="col" className="w-[7rem]">Remove</th><th scope="col" className="w-[5rem]">Kept</th><th scope="col" className="w-[7rem]">Fate</th><th scope="col" className="w-[3rem]"><span className="sr-only">Drop from batch</span></th></tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id} className={r.status === 'cleaned' ? 'gone' : ''}>
                          <th scope="row" className="truncate" title={r.path}>{r.path}</th>
                          {r.status === 'error' ? (
                            <td colSpan={4} className="v text-muted [overflow-wrap:anywhere]">Skipped: {r.message}</td>
                          ) : r.status === 'reading' ? (
                            <td colSpan={4} className="v"><CircleNotch size={14} weight="light" className="spin" aria-hidden="true" /></td>
                          ) : (
                            <>
                              <td className="f">{r.report.kindLabel}</td>
                              <td className="v tabular-nums">{fieldCount(r.report)}</td>
                              <td className="v tabular-nums">{keptCount(r.report) || ''}</td>
                              <td className="fate whitespace-nowrap">{r.status === 'cleaned' ? `Removed, ${fmtBytes(r.out.size)}` : fieldCount(r.report) ? 'Remove' : 'Nothing'}</td>
                            </>
                          )}
                          <td className="fate">
                            <button type="button" onClick={() => remove(r.id)} aria-label={`Drop ${r.path} from the batch`} className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-panel hover:text-ink"><X size={14} weight="light" aria-hidden="true" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div id="batch-help" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.8125rem] text-muted">
              <span>JPEG, PNG, DOCX, XLSX, PPTX, PDF. Anything else is listed and skipped.</span>
              <button type="button" className="link" onClick={() => filesInput.current?.click()}>Browse files</button>
              <button type="button" className="link" onClick={() => folderInput.current?.click()}>Browse a folder</button>
            </div>

            <fieldset className="rows border-b border-hair-2">
              <legend className="text-[1.125rem] font-medium">Policy: what stays</legend>
              <p className="pt-3 text-[0.8125rem] text-muted">Everything is removed unless ticked. The choice is written into this page's address and nowhere else; copy the link and the whole desk works to the same rule. It applies on the home page too.</p>
              <div className="grid grid-cols-1 gap-x-6 pt-2 sm:grid-cols-2 lg:grid-cols-3">
                {POLICY.map((p) => (
                  <label key={p.key} className="flex items-baseline gap-3 py-2 text-[0.9375rem]">
                    <input type="checkbox" className="translate-y-0.5 accent-[var(--accent)]" checked={keep.includes(p.key)} onChange={(e) => setPolicy(e.target.checked ? [...keep, p.key] : keep.filter((k) => k !== p.key))} />
                    <span>{p.label} <span className="text-[0.8125rem] text-muted">{p.formats}</span></span>
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 text-[0.8125rem] text-muted">
                <code className="[overflow-wrap:anywhere]">/batch{keep.length ? `?keep=${keep.join(',')}` : ''}</code>
                <button type="button" className="link" onClick={share}>{copied ? 'Copied' : 'Copy link'}</button>
                {keep.length > 0 && <button type="button" className="link" onClick={() => setPolicy([])}>Remove everything</button>}
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center gap-3">
              {cleaned.length && !ready.length ? (
                <button ref={primary} type="button" className="pill" onClick={() => filesInput.current?.click()}>
                  Clean more
                  <span className="orb"><ArrowRight size={16} weight="light" aria-hidden="true" /></span>
                </button>
              ) : (
                <button ref={primary} type="button" className="pill" onClick={clean} disabled={!ready.length || reading || busy}>
                  {busy ? 'Cleaning' : ready.length > 1 ? `Remove all and download ${ready.length} files` : 'Remove all and download'}
                  <span className="orb"><ArrowDown size={16} weight="light" aria-hidden="true" /></span>
                </button>
              )}
              {rows.length > 0 && <button type="button" className="pill pill-ghost" onClick={clear}>Clear<span className="orb"><X size={16} weight="light" aria-hidden="true" /></span></button>}
            </div>
          </div>
        </div>
        <input ref={filesInput} type="file" multiple accept={ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { takeList(e.target.files); e.target.value = '' }} />
        <input ref={folderInput} type="file" className="sr-only" tabIndex={-1} aria-hidden="true" {...({ webkitdirectory: '' } as object)} onChange={(e) => { takeList(e.target.files); e.target.value = '' }} />
      </Section>

      <Section>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-5">
            <h2 className="text-[1.75rem] sm:text-[2.25rem]">Same shape, clean files.</h2>
          </div>
          <div className="prose md:col-span-7">
            <p>Every file is read the way the home page reads one: only the header bytes it needs. The clean copies are assembled from slices of the originals and written into one zip, stored, with the folder's own structure and a "-clean" suffix on the top folder. One file comes back on its own, as it does on the home page.</p>
            <p>Files FileSanity does not read are listed and left out. Nothing is sent, nothing is remembered between visits, and the policy is the only setting there is. For a shell or a server, the same parsers run as a <a href="/cli" className="link">command line tool</a> and a <a href="/api" className="link">self-hosted API</a>.</p>
          </div>
        </div>
      </Section>
      <Closer title="One file, no zip." text="The home page reads one file and downloads it clean, no zip, and honours the same policy link." />
    </>
  )
}
