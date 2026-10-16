// The C2PA fields a real AI generator writes, which the SDK fixtures lack: generator name and the IPTC AI source type.
// Run by tests/lib.py.
import { build } from 'esbuild'
import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const out = join(tmpdir(), `fs-c2pa-${process.pid}.mjs`)
await build({ entryPoints: [join(dirname(fileURLToPath(import.meta.url)), '../src/lib/c2pa.ts')], bundle: true, format: 'esm', outfile: out, logLevel: 'error' })
const { c2paFields } = await import(pathToFileURL(out).href)
const s = 'jumdc2pa\0' + '\x6fclaim_generator\x67ChatGPT' + '\x71digitalSourceType\x78\x46http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia'
const f = Object.fromEntries(c2paFields(new TextEncoder().encode(s)).map((x) => [x.name, x.value]))
assert.equal(f['Made with (Content Credentials)'], 'ChatGPT')
assert.equal(f['Digital source type'], 'Made by AI (trained algorithmic media)')
console.log('ok')
