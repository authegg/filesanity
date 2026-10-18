import { useCallback, useEffect, useRef, useState } from 'react'
import { checkClean, cleanName, fieldCount, inspect, keptCount, nameRisks, neutralName, recordEntry, recordHead, sha256, strip, Unsupported, warnCount, type Proof, type Report } from '../lib'

export type State = 'idle' | 'over' | 'reading' | 'ready' | 'cleaned' | 'error'

/** The picker without a look: states, drop, paste, sample, clean and download. Nothing here makes a request except `sample()`. */
const save = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function useCleaner(sampleUrl = '/sample.jpg', paste = true) {
  const [state, setState] = useState<State>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')
  const [cleanedBytes, setCleanedBytes] = useState(0)
  // Download under a neutral name; on by default when the name gives something away.
  const [neutral, setNeutral] = useState(false)
  // The clean copy read back, with both fingerprints; null while it is being checked.
  const [proof, setProof] = useState<Proof | null>(null)
  const [cleanedAt, setCleanedAt] = useState<Date | null>(null)
  const [busy, setBusy] = useState(false)
  const [checkErr, setCheckErr] = useState(false)
  const input = useRef<HTMLInputElement | null>(null)
  const depth = useRef(0)
  const before = useRef<State>('idle') // what a drag over the tray covers, and what it goes back to
  // Bumped by each new file and by reset: an inspect or clean that finishes after it is dropped, not attached to the newer file.
  const gen = useRef(0)

  const take = useCallback(async (f: File) => {
    const g = ++gen.current
    setFile(f)
    setNeutral(nameRisks(f.name).length > 0)
    setReport(null)
    setProof(null)
    setError('')
    setState('reading')
    try {
      const r = await inspect(f)
      if (g !== gen.current) return
      setReport(r)
      setState('ready')
    } catch (e) {
      if (g !== gen.current) return
      setError(e instanceof Unsupported ? e.message : `${f.name} could not be read. It may be damaged.`)
      setState('error')
    }
  }, [])

  // A file shared from Android's share sheet: the service worker left it in the cache (see scripts/pwa.mjs).
  useEffect(() => {
    const shared = new URLSearchParams(location.search).get('shared')
    if (shared == null) return
    history.replaceState(null, '', location.pathname + location.hash)
    if (shared === '0') { setError('The shared file did not arrive. Open FileSanity once, then share the file again.'); setState('error'); return }
    caches.open('fs-share').then(async (c) => {
      const res = await c.match('/shared')
      if (!res) { setError('The shared file did not arrive. Open FileSanity once, then share the file again.'); setState('error'); return }
      await c.delete('/shared')
      take(new File([await res.blob()], decodeURIComponent(res.headers.get('x-name') ?? 'shared'), { type: res.headers.get('content-type') ?? '' }))
    }).catch(() => {})
  }, [take])

  // Paste a file from the clipboard anywhere on the page.
  useEffect(() => {
    if (!paste) return
    const onPaste = (e: ClipboardEvent) => {
      const f = e.clipboardData?.files?.[0]
      if (f) { e.preventDefault(); take(f) }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [take, paste])

  const clean = useCallback(async () => {
    if (!file || !report || busy) return
    const g = gen.current
    setBusy(true)
    let blob: Blob
    try { blob = await strip(file, report) } catch {
      setBusy(false)
      if (g !== gen.current) return
      setError(`${file.name} could not be cleaned. It may be damaged; nothing was saved.`); setState('error'); return
    }
    setBusy(false)
    if (g !== gen.current) return
    const out = neutral ? neutralName(file.name, report.kind) : cleanName(file.name)
    setCleanedBytes(blob.size)
    save(blob, out)
    setProof(null); setCheckErr(false)
    setCleanedAt(new Date())
    setState('cleaned')
    try {
      const [b, after, left] = await Promise.all([sha256(file), sha256(blob), checkClean(blob, out)])
      if (g === gen.current) setProof({ out, before: b, after, left })
    } catch { if (g === gen.current) setCheckErr(true) } // out of memory on a phone: the copy is saved, the check could not run
  }, [file, report, neutral, busy])

  /** The receipt for this one file: what went, what stayed, both fingerprints and the read-back check. */
  const receipt = useCallback(() => {
    if (!file || !report || !proof || !cleanedAt) return
    const text = [...recordHead(cleanedAt, []), ...recordEntry(file.name, report, proof)].join('\n')
    save(new Blob([text], { type: 'text/plain' }), `${proof.out.replace(/\.[^.]+$/, '')}-receipt.txt`)
  }, [file, report, proof, cleanedAt])

  const reset = useCallback(() => {
    gen.current++
    setFile(null); setReport(null); setProof(null); setCheckErr(false); setError(''); setState('idle')
    if (input.current) input.current.value = ''
  }, [])

  // Takes another sample's URL; as an onClick handler it gets the event, so anything but a string means the default.
  const sample = useCallback(async (url?: unknown) => {
    const u = typeof url === 'string' ? url : sampleUrl
    setError(''); setState('reading')
    try {
      const res = await fetch(u)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      take(new File([blob], u.split('/').pop()!, { type: blob.type }))
    } catch { setError('The sample did not load. Check your connection, or choose a file of your own.'); setState('error') }
  }, [sampleUrl, take])

  /** Spread on the element that accepts drops. */
  const dropProps = {
    onDragEnter: (e: React.DragEvent) => { e.preventDefault(); depth.current++; if (state !== 'reading' && state !== 'over') { before.current = state; setState('over') } },
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' },
    onDragLeave: () => { if (--depth.current <= 0) { depth.current = 0; setState((s) => (s === 'over' ? before.current : s)) } },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault(); depth.current = 0
      const f = e.dataTransfer.files?.[0]
      if (f) take(f); else setState(before.current)
    },
  }

  /** The hidden input: never painted, opened only by `open()` from a custom control. */
  const inputProps = {
    ref: input,
    type: 'file' as const,
    hidden: true,
    tabIndex: -1,
    'aria-hidden': true,
    accept: '.jpg,.jpeg,.png,.heic,.heif,.webp,.mp4,.mov,.m4v,.m4a,.mp3,.pdf,.docx,.xlsx,.pptx,.odt,.ods,.odp',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) take(f) }, // cleared, so picking the same file again still fires
  }

  return {
    state, file, report, error, cleanedBytes,
    removed: report ? fieldCount(report) : 0,
    kept: report ? keptCount(report) : 0,
    warned: report ? warnCount(report) : 0,
    risks: file ? nameRisks(file.name) : [],
    neutral, setNeutral, proof, receipt, busy, checkErr,
    downloadName: file && report ? (neutral ? neutralName(file.name, report.kind) : cleanName(file.name)) : '',
    open: () => input.current?.click(),
    take, clean, reset, sample, dropProps, inputProps,
  }
}

export type Cleaner = ReturnType<typeof useCleaner>
