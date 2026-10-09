import { useCallback, useRef, useState } from 'react'
import { applyPolicy, cleanName, fieldCount, inspect, keptCount, strip, Unsupported, type Report } from '../lib'
import { zipStore } from '../lib/zip'
import { rows } from './reveal'

export type Item = { id: number; file: File; report?: Report; error?: string; sample?: boolean }

/** Many files at once: read each, apply the kept-kinds policy, clean all into one zip with a record. Local only. */
export function useBatch() {
  const [items, setItems] = useState<Item[]>([])
  const [keep, setKeep] = useState<string[]>([])
  const [over, setOver] = useState(false)
  const [done, setDone] = useState<{ bytes: number; at: Date } | null>(null)
  // When files last arrived: the request counter starts here, after any sample download has finished.
  const [since, setSince] = useState<number | null>(null)
  const input = useRef<HTMLInputElement | null>(null)
  const seq = useRef(0)
  const depth = useRef(0)

  const add = useCallback(async (files: File[], sample = false) => {
    setDone(null)
    setSince(performance.now())
    const fresh = files.map((file) => ({ id: ++seq.current, file, sample }))
    // Your own files replace the samples.
    setItems((xs) => [...(sample ? [] : xs.filter((x) => !x.sample)), ...fresh])
    for (const it of fresh) {
      let patch: Partial<Item>
      try { patch = { report: await inspect(it.file) } } catch (e) {
        patch = { error: e instanceof Unsupported ? e.message : `${it.file.name} could not be read.` }
      }
      setItems((xs) => xs.map((x) => (x.id === it.id ? { ...x, ...patch } : x)))
    }
  }, [])

  const withPolicy = (r: Report) => applyPolicy(r, keep)
  const ready = items.filter((x) => x.report)

  /** The record: one block per file, written for a file note. */
  const record = useCallback((at: Date) => {
    const lines = [`FileSanity cleaning record`, `${at.toISOString().slice(0, 16).replace('T', ' ')} UTC, in the browser. Nothing was uploaded.`, `Policy: ${keep.length ? `kept ${keep.join(', ')}` : 'remove everything FileSanity can remove'}.`, '']
    for (const it of items) {
      if (!it.report) { lines.push(`${it.file.name}: not cleaned. ${it.error ?? ''}`, ''); continue }
      const r = withPolicy(it.report)
      lines.push(`${it.file.name} -> ${cleanName(it.file.name)}: ${fieldCount(r)} fields removed${keptCount(r) ? `, ${keptCount(r)} kept` : ''}.`)
      for (const x of rows(r)) lines.push(`  ${x.strip ? 'removed' : 'kept   '}  ${x.part}  ${x.name}: ${x.value}`)
      if (r.note) lines.push(`  ${r.note}`)
      lines.push('')
    }
    return lines.join('\n')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, keep])

  const save = (blob: Blob, name: string) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  const cleanAll = useCallback(async () => {
    const at = new Date()
    const used = new Set<string>()
    const files = []
    for (const it of ready) {
      let path = cleanName(it.file.name)
      for (let n = 2; used.has(path); n++) path = cleanName(it.file.name).replace(/(\.[^.]+)?$/, `-${n}$1`)
      used.add(path)
      files.push({ path, data: await strip(it.file, withPolicy(it.report!)) })
    }
    files.push({ path: 'filesanity-record.txt', data: new Blob([record(at)]) })
    const zip = await zipStore(files)
    save(zip, `cleaned-${at.toISOString().slice(0, 10)}.zip`)
    setDone({ bytes: zip.size, at })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, record])

  /** One file on its own: the clean copy alone, no zip. */
  const cleanOne = useCallback(async (id: number) => {
    const it = items.find((x) => x.id === id)
    if (!it?.report) return
    const blob = await strip(it.file, withPolicy(it.report))
    save(blob, cleanName(it.file.name))
    setDone({ bytes: blob.size, at: new Date() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, keep])

  const sample = useCallback(async () => {
    const names = ['shoes.jpg', 'offer.docx', 'memo.pdf']
    add(await Promise.all(names.map(async (n) => new File([await (await fetch(`/samples/${n}`)).blob()], n))), true)
  }, [add])

  const dropProps = {
    onDragEnter: (e: React.DragEvent) => { e.preventDefault(); depth.current++; setOver(true) },
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' },
    onDragLeave: () => { if (--depth.current <= 0) { depth.current = 0; setOver(false) } },
    onDrop: (e: React.DragEvent) => { e.preventDefault(); depth.current = 0; setOver(false); add([...e.dataTransfer.files]) },
  }
  const inputProps = {
    ref: input, type: 'file' as const, hidden: true, multiple: true, tabIndex: -1, 'aria-hidden': true,
    accept: '.jpg,.jpeg,.png,.heic,.heif,.pdf,.docx,.xlsx,.pptx',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => { add([...(e.target.files ?? [])]); e.target.value = '' },
  }

  return {
    items, keep, setKeep, over, done, ready, since, withPolicy, cleanOne,
    open: () => input.current?.click(),
    toggle: (k: string) => setKeep((xs) => (xs.includes(k) ? xs.filter((x) => x !== k) : [...xs, k])),
    remove: (id: number) => setItems((xs) => xs.filter((x) => x.id !== id)),
    clear: () => { setItems([]); setDone(null) },
    cleanAll, sample, add, dropProps, inputProps,
    saveRecord: () => save(new Blob([record(new Date())], { type: 'text/plain' }), 'filesanity-record.txt'),
  }
}
