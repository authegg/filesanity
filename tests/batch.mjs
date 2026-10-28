// Zip in, zip out: a plain zip opens into its files with folders kept; Office files are not taken for zips. Run by tests/lib.py.
import { build } from 'esbuild'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const load = async (entry, tag) => {
  const out = join(tmpdir(), `fs-${tag}-${process.pid}.mjs`)
  await build({ entryPoints: [join(here, entry)], bundle: true, format: 'esm', platform: 'neutral', outfile: out, logLevel: 'error' })
  return import(pathToFileURL(out).href)
}
const lib = await load('../src/lib/index.ts', 'batch')
const { zipStore } = await load('../src/lib/zip.ts', 'zip')
const f = async (n) => new Uint8Array(await readFile(join(here, 'files', n)))
const zip = await zipStore([{ path: 'trip/IMG_20261010_093351.jpg', data: await f('photo.jpg') }, { path: 'docs/offer.docx', data: await f('offer.docx') }, { path: '__MACOSX/._x', data: new Uint8Array(3) }])
const got = await lib.unzip(new File([zip], 'export.zip'))
assert.deepEqual(got.files.map((x) => x.name), ['trip/IMG_20261010_093351.jpg', 'docs/offer.docx'])
assert.deepEqual(got.skipped, [])
const r = await lib.inspect(got.files[0])
assert.ok(lib.fieldCount(r) > 40, 'a photo from inside the zip is read')
assert.equal(await lib.unzip(new File([await f('offer.docx')], 'offer.docx')), null, 'a .docx is not taken for a plain zip')
await assert.rejects(lib.inspect(new File([zip], 'export.zip')), /zip archive.*batch page/)
const clean = await lib.strip(got.files[0], r)
const proof = { out: 'trip/photo-01.jpg', before: await lib.sha256(got.files[0]), after: await lib.sha256(clean), left: await lib.checkClean(clean, 'photo-01.jpg') }
assert.equal(proof.before.length, 64)
assert.notEqual(proof.before, proof.after)
assert.deepEqual(proof.left, [])
const lines = lib.recordEntry('trip/IMG_20261010_093351.jpg', r, proof).join('\n')
assert.match(lines, /-> trip\/photo-01\.jpg: \d+ fields removed/)
assert.match(lines, /SHA-256 before  [0-9a-f]{64}/)
assert.match(lines, /Read back: the clean copy was read again and no metadata was left/)

// ZIP64: over 65535 entries, and entries past 4 GB: the zip is written 5 GB into a sparse file, so no 5 GB is stored.
// Python's zipfile reads both back and checks every CRC.
{
  const { execFileSync } = await import('node:child_process')
  const { writeFile, open, rm } = await import('node:fs/promises')
  const many = join(tmpdir(), `fs-zip64-many-${process.pid}.zip`), far = join(tmpdir(), `fs-zip64-far-${process.pid}.zip`)
  await writeFile(many, new Uint8Array(await (await zipStore(Array.from({ length: 70000 }, (_, i) => ({ path: `f/${i}.txt`, data: new TextEncoder().encode(String(i)) })))).arrayBuffer()))
  const at = 5 * 2 ** 30, fz = new Uint8Array(await (await zipStore([{ path: 'a.jpg', data: await f('photo.jpg') }, { path: 'b.txt', data: new TextEncoder().encode('b') }], at)).arrayBuffer())
  const h = await open(far, 'w')
  await h.write(fz, 0, fz.length, at)
  await h.close()
  const py = `import sys, zipfile
m = zipfile.ZipFile(sys.argv[1]); assert len(m.infolist()) == 70000; assert m.testzip() is None; assert m.read('f/69999.txt') == b'69999'
z = zipfile.ZipFile(sys.argv[2]); assert [i.header_offset > 0xffffffff for i in z.infolist()] == [True, True], [i.header_offset for i in z.infolist()]
assert z.testzip() is None; assert z.read('b.txt') == b'b'; print('zip64 ok')`
  try { assert.match(execFileSync('python3', ['-c', py, many, far], { encoding: 'utf8' }), /zip64 ok/) } finally { await rm(many); await rm(far) }
  // Under the limits nothing changes: no ZIP64 record at all.
  const small = new Uint8Array(await (await zipStore([{ path: 'x', data: new Uint8Array(1) }])).arrayBuffer())
  assert.ok(!Buffer.from(small).includes(Buffer.from([0x50, 0x4b, 0x06, 0x06])), 'a small zip has no ZIP64 record')
}

// The hooks, run against a stand-in for React (state slots, re-render on set, effects skipped), to pin two races.
{
  const react = `let slots = [], i = 0, render
export const useState = (v) => { const k = i++; if (!(k in slots)) slots[k] = v; return [slots[k], (n) => { slots[k] = typeof n === 'function' ? n(slots[k]) : n; render() }] }
export const useRef = (v) => { const k = i++; if (!(k in slots)) slots[k] = { current: v }; return slots[k] }
export const useCallback = (fn) => (i++, fn)
export const useEffect = () => { i++ }
export const mount = (hook) => { let cur; slots = []; render = () => { i = 0; cur = hook() }; render(); return () => cur }`
  const out = join(tmpdir(), `fs-hooks-${process.pid}.mjs`)
  await build({
    stdin: { contents: `export { useBatch } from './src/shared/useBatch.ts'; export { useCleaner } from './src/shared/useCleaner.ts'; export { mount } from 'react'`, resolveDir: join(here, '..'), loader: 'ts' },
    bundle: true, format: 'esm', platform: 'neutral', outfile: out, logLevel: 'error',
    plugins: [{ name: 'react', setup: (b) => { b.onResolve({ filter: /^react$/ }, () => ({ path: 'react', namespace: 'stub' })); b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: react })) } }],
  })
  const { useBatch, useCleaner, mount } = await import(pathToFileURL(out).href)
  globalThis.document = { createElement: () => ({ click() {} }) }
  // A file whose every read waits 20 ms, so it finishes after one dropped later.
  const slow = (file) => { const s = file.slice.bind(file); file.slice = (...a) => { const b = s(...a), ab = b.arrayBuffer.bind(b); b.arrayBuffer = () => new Promise((ok) => setTimeout(ok, 20)).then(ab); return b }; return file }
  const pdf = async () => slow(new File([await f('memo.pdf')], 'memo.pdf'))
  const jpg = async () => new File([await f('photo.jpg')], 'photo.jpg')

  // A slow PDF, then a JPEG: the PDF's late report is not attached to the JPEG.
  let C = mount(() => useCleaner('/x', false))
  await Promise.all([C().take(await pdf()), C().take(await jpg())])
  assert.equal(C().file.name, 'photo.jpg')
  assert.equal(C().report.kind, 'jpeg', 'the late PDF report is dropped')
  // A new file during a clean: the old clean's result and proof do not land on it.
  const png = new File([await f('shot.png')], 'shot.png'), cleaning = C().clean()
  await C().take(png)
  await cleaning
  assert.equal(C().state, 'ready'); assert.equal(C().proof, null); assert.equal(C().report.kind, 'png')

  // Samples that arrive after your files neither replace them nor restart the request counter.
  const B = mount(() => useBatch())
  const mine = B().add([await jpg()])
  await Promise.all([mine, B().add([await pdf()], true)])
  assert.deepEqual(B().items.map((x) => x.file.name), ['photo.jpg'])
  const since = B().since
  await B().add([await pdf()], true)
  assert.deepEqual(B().items.map((x) => x.file.name), ['photo.jpg'])
  assert.equal(B().since, since)
  // On an empty list they still load, and your files still replace them.
  B().clear(); await B().add([await pdf()], true)
  assert.deepEqual(B().items.map((x) => [x.file.name, x.sample]), [['memo.pdf', true]])
  await B().add([await jpg()])
  assert.deepEqual(B().items.map((x) => x.file.name), ['photo.jpg'])
}
