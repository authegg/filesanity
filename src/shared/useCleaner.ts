import { useCallback, useEffect, useRef, useState } from 'react'
import { cleanName, fieldCount, inspect, keptCount, strip, Unsupported, warnCount, type Report } from '../lib'

export type State = 'idle' | 'over' | 'reading' | 'ready' | 'cleaned' | 'error'

/** The picker without a look: states, drop, paste, sample, clean and download. Nothing here makes a request except `sample()`. */
export function useCleaner(sampleUrl = '/sample.jpg', paste = true) {
  const [state, setState] = useState<State>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')
  const [cleanedBytes, setCleanedBytes] = useState(0)
  const input = useRef<HTMLInputElement | null>(null)
  const depth = useRef(0)

  const take = useCallback(async (f: File) => {
    setFile(f)
    setReport(null)
    setError('')
    setState('reading')
    try {
      setReport(await inspect(f))
      setState('ready')
    } catch (e) {
      setError(e instanceof Unsupported ? e.message : `${f.name} could not be read. It may be damaged.`)
      setState('error')
    }
  }, [])

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
    if (!file || !report) return
    const blob = await strip(file, report)
    setCleanedBytes(blob.size)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = cleanName(file.name)
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setState('cleaned')
  }, [file, report])

  const reset = useCallback(() => {
    setFile(null); setReport(null); setError(''); setState('idle')
    if (input.current) input.current.value = ''
  }, [])

  // Takes another sample's URL; as an onClick handler it gets the event, so anything but a string means the default.
  const sample = useCallback(async (url?: unknown) => {
    const u = typeof url === 'string' ? url : sampleUrl
    const blob = await (await fetch(u)).blob()
    take(new File([blob], u.split('/').pop()!, { type: blob.type }))
  }, [sampleUrl, take])

  /** Spread on the element that accepts drops. */
  const dropProps = {
    onDragEnter: (e: React.DragEvent) => { e.preventDefault(); depth.current++; if (state !== 'reading') setState('over') },
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' },
    onDragLeave: () => { if (--depth.current <= 0) { depth.current = 0; setState((s) => (s === 'over' ? (report ? 'ready' : file && error ? 'error' : 'idle') : s)) } },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault(); depth.current = 0
      const f = e.dataTransfer.files?.[0]
      if (f) take(f); else setState(report ? 'ready' : 'idle')
    },
  }

  /** The hidden input: never painted, opened only by `open()` from a custom control. */
  const inputProps = {
    ref: input,
    type: 'file' as const,
    hidden: true,
    tabIndex: -1,
    'aria-hidden': true,
    accept: '.jpg,.jpeg,.png,.heic,.heif,.mp4,.mov,.m4v,.pdf,.docx,.xlsx,.pptx',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) take(f) },
  }

  return {
    state, file, report, error, cleanedBytes,
    removed: report ? fieldCount(report) : 0,
    kept: report ? keptCount(report) : 0,
    warned: report ? warnCount(report) : 0,
    open: () => input.current?.click(),
    take, clean, reset, sample, dropProps, inputProps,
  }
}

export type Cleaner = ReturnType<typeof useCleaner>
