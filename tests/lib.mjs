// Runs src/lib's inspect and strip on each fixture in Node and writes the cleaned files plus a JSON report.
// Used by tests/lib.py; no page, no browser.
import { build } from 'esbuild'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, 'out', 'lib')
await mkdir(out, { recursive: true })
const bundle = join(tmpdir(), `fs-lib-${process.pid}.mjs`)
await build({ entryPoints: [join(here, '../src/lib/index.ts')], bundle: true, format: 'esm', platform: 'neutral', outfile: bundle, logLevel: 'error' })
const lib = await import(pathToFileURL(bundle).href)

const report = {}
for (const name of process.argv.slice(2)) {
  const file = new File([await readFile(join(here, 'files', name))], name)
  try {
    const r = await lib.inspect(file)
    const blob = await lib.strip(file, r)
    await writeFile(join(out, name), new Uint8Array(await blob.arrayBuffer()))
    report[name] = { removed: lib.fieldCount(r), kept: lib.keptCount(r), note: r.note ?? '', kind: r.kind, fields: r.segments.flatMap((s) => s.fields.map((f) => `${f.name}=${f.value}`)) }
  } catch (e) {
    report[name] = { error: `${e.constructor.name}: ${e.message}` }
  }
}
console.log(JSON.stringify(report))
