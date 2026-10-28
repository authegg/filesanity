// The file name check: what a name gives away, and the neutral name offered instead. Run by tests/lib.py.
import { build } from 'esbuild'
import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const out = join(tmpdir(), `fs-name-${process.pid}.mjs`)
await build({ entryPoints: [join(dirname(fileURLToPath(import.meta.url)), '../src/lib/name.ts')], bundle: true, format: 'esm', outfile: out, logLevel: 'error' })
const { nameRisks, neutralName } = await import(pathToFileURL(out).href)
assert.deepEqual(nameRisks('IMG_20261010_093351.jpg'), ['the date 2026-10-10'])
assert.deepEqual(nameRisks('PXL_20250102_101010123.MP.jpg'), ['the date 2025-01-02'])
assert.deepEqual(nameRisks('Screenshot 2026-04-11 at 09.03.51.png'), ['the date 2026-04-11'])
assert.deepEqual(nameRisks('Offer DRAFT for priya@tamarind.example.docx'), ['an email address, priya@tamarind.example', '"DRAFT"'])
assert.deepEqual(nameRisks('Fees v3 internal.xlsx'), ['"v3"', '"internal"'])
assert.deepEqual(nameRisks('shoes.jpg'), [])
assert.deepEqual(nameRisks('invoice-1042.pdf'), [])
assert.equal(neutralName('IMG_20261010_093351.JPG', 'jpeg'), 'photo.jpg')
assert.equal(neutralName('Voice memo 2026-04-11.m4a', 'mp4'), 'audio.m4a')
assert.equal(neutralName('Fees v3 internal.xlsx', 'xlsx'), 'spreadsheet.xlsx')
