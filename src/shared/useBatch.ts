import { useCallback, useRef, useState } from 'react'
import { applyPolicy, checkClean, cleanName, inspect, nameRisks, neutralName, recordEntry, recordHead, sha256, strip, unzip, Unsupported, type Proof, type Report } from '../lib'
import { zipStore } from '../lib/zip'

export type Item = { id: number; file: File; report?: Report; error?: string; sample?: boolean }

/** Many files at once: read each, apply the kept-kinds policy, clean all into one zip with a record. Local only. */
export function useBatch() {
  const [items, setItems] = useState<Item[]>([])
  const [keep, setKeep] = useState<string[]>([])
  const [over, setOver] = useState(false)
  const [done, setDone] = useState<{ bytes: number; at: Date; checking: boolean; left: number } | null>(null)
  // Files whose names give something away are saved as photo-01.jpg and so on; the record keeps the old names.
  const [neutral, setNeutral] = useState(true)
  // When files last arrived: the request counter starts here, after any sample download has finished.
  const [since, setSince] = useState<number | null>(null)
  const input = useRef<HTMLInputElement | null>(null)
  const seq = useRef(0)
  const depth = useRef(0)

  const add = useCallback(async (dropped: File[], sample = false) => {
    setDone(null)
    setSince(performance.now())
    // A plain zip opens into its files, folders kept in their names; the clean zip keeps the same folders.
    const files: File[] = [], bad: Item[] = []
    for (const f of dropped) {
      const z = await unzip(f).catch(() => null)
      if (!z) { files.push(f); continue }
      files.push(...z.files)
      for (const s of z.skipped) bad.push({ id: ++seq.current, file: new File([], s), error: `${s} could not be taken out of ${f.name}: it is encrypted or packed in a way FileSanity does not read.` })
    }
    const fresh = files.map((file) => ({ id: ++seq.current, file, sample }))
    setItems((xs) => [...xs, ...bad])
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

  /** Output names for every readable file: cleanName, or photo-01.jpg style for names that give something away. */
  const names = useCallback(() => {
    const out = new Map<number, string>(), used = new Set<string>(), seqs = new Map<string, number>()
    for (const it of ready) {
      const i = it.file.name.lastIndexOf('/'), dir = it.file.name.slice(0, i + 1), base = it.file.name.slice(i + 1)
      let path = dir + cleanName(base)
      if (neutral && nameRisks(base).length) {
        const n = neutralName(base, it.report!.kind), dot = n.lastIndexOf('.'), key = dir + n
        const k = (seqs.get(key) ?? 0) + 1
        seqs.set(key, k)
        path = `${dir}${n.slice(0, dot)}-${String(k).padStart(2, '0')}${n.slice(dot)}`
      }
      for (let n = 2; used.has(path); n++) path = path.replace(/(-\d+)?(\.[^.]+)?$/, `-${n}$2`)
      used.add(path)
      out.set(it.id, path)
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, neutral])

  /** The record: one block per file, written for a file note; with proofs once the files are cleaned. */
  const record = useCallback((at: Date, proofs?: Map<number, Proof>) => {
    const lines = recordHead(at, keep)
    for (const it of items) {
      if (!it.report) { lines.push(`${it.file.name}: not cleaned. ${it.error ?? ''}`, ''); continue }
      lines.push(...recordEntry(it.file.name, withPolicy(it.report), proofs?.get(it.id)))
    }
    return lines.join('\n')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, keep])

  /** Clean one file and read it back: the clean copy and its proof. */
  const cleanItem = async (it: Item, out: string): Promise<[Blob, Proof]> => {
    const blob = await strip(it.file, withPolicy(it.report!))
    const [before, after, left] = await Promise.all([sha256(it.file), sha256(blob), checkClean(blob, out, keep)])
    return [blob, { out, before, after, left }]
  }

  const save = (blob: Blob, name: string) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  const cleanAll = useCallback(async () => {
    const at = new Date()
    setDone({ bytes: 0, at, checking: true, left: 0 })
    const paths = names()
    const files = [], proofs = new Map<number, Proof>()
    for (const it of ready) {
      const [data, proof] = await cleanItem(it, paths.get(it.id)!)
      files.push({ path: proof.out, data })
      proofs.set(it.id, proof)
    }
    files.push({ path: 'filesanity-record.txt', data: new Blob([record(at, proofs)]) })
    const zip = await zipStore(files)
    save(zip, `cleaned-${at.toISOString().slice(0, 10)}.zip`)
    setDone({ bytes: zip.size, at, checking: false, left: [...proofs.values()].filter((p) => p.left.length).length })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, record, names])

  /** One file on its own: the clean copy alone, no zip. */
  const cleanOne = useCallback(async (id: number) => {
    const it = items.find((x) => x.id === id)
    if (!it?.report) return
    const [blob, proof] = await cleanItem(it, names().get(id)!.split('/').pop()!)
    save(blob, proof.out)
    setDone({ bytes: blob.size, at: new Date(), checking: false, left: proof.left.length ? 1 : 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, keep, names])

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
    accept: '.jpg,.jpeg,.png,.heic,.heif,.webp,.mp4,.mov,.m4v,.m4a,.mp3,.pdf,.docx,.xlsx,.pptx,.odt,.ods,.odp',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => { add([...(e.target.files ?? [])]); e.target.value = '' },
  }

  return {
    items, keep, setKeep, over, done, ready, since, withPolicy, cleanOne, neutral, setNeutral,
    risky: ready.filter((x) => nameRisks(x.file.name.split('/').pop()!).length).length,
    open: () => input.current?.click(),
    toggle: (k: string) => setKeep((xs) => (xs.includes(k) ? xs.filter((x) => x !== k) : [...xs, k])),
    remove: (id: number) => setItems((xs) => xs.filter((x) => x.id !== id)),
    clear: () => { setItems([]); setDone(null) },
    cleanAll, sample, add, dropProps, inputProps,
    saveRecord: () => save(new Blob([record(new Date())], { type: 'text/plain' }), 'filesanity-record.txt'),
  }
}
