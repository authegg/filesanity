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
