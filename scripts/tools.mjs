// Builds the downloads the site serves beside the pages: the command line tool, the self-hosted API
// (Worker and Node), and the browser extension as a zip. Each is one dependency-free file bundled from src/lib.
import { build } from 'vite'
import { mkdirSync, readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { zipStore } from '../src/lib/zip.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const out = (p) => join(root, 'dist', p)

const bundle = async (entry, dir, name, opts = {}) => {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    publicDir: false,
    build: { ssr: entry, outDir: out(dir), emptyOutDir: false, minify: false, sourcemap: false, rollupOptions: { output: { entryFileNames: name, format: 'es' } }, ...opts },
  })
}

await bundle('cli/filesanity.ts', 'cli', 'filesanity.mjs', { target: 'node20' })
await bundle('api/worker.ts', 'api', 'worker.mjs', { target: 'es2022' })
await bundle('api/node.ts', 'api', 'node.mjs', { target: 'node20' })
await bundle('extension/content.ts', 'extension/build', 'content.js', { target: 'es2022', ssr: undefined, lib: { entry: 'extension/content.ts', formats: ['iife'], name: 'filesanity', fileName: () => 'content.js' } })

// The Worker's wrangler config and a readme travel with the API files.
for (const f of ['wrangler.jsonc', 'README.md']) writeFileSync(out(`api/${f}`), readFileSync(join(root, 'api', f)))
writeFileSync(out('cli/README.md'), readFileSync(join(root, 'cli/README.md')))

// The extension: manifest, popup, icons and the bundled content script, zipped for "load unpacked".
const ext = join(root, 'extension')
const files = []
const add = (dir, prefix) => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) { if (e !== 'build') add(p, `${prefix}${e}/`) }
    else if (!e.endsWith('.ts')) files.push({ path: `${prefix}${e}`, data: readFileSync(p) })
  }
}
add(ext, '')
files.push({ path: 'content.js', data: readFileSync(out('extension/build/content.js')) })
for (const n of ['icon-192.png', 'icon-512.png']) files.push({ path: `icons/${n}`, data: readFileSync(join(root, 'public/icons', n)) })
mkdirSync(out('extension'), { recursive: true })
const zip = await zipStore(files)
writeFileSync(out('extension/filesanity-extension.zip'), new Uint8Array(await zip.arrayBuffer()))
console.log(`tools: cli ${statSync(out('cli/filesanity.mjs')).size} B, api worker ${statSync(out('api/worker.mjs')).size} B, node ${statSync(out('api/node.mjs')).size} B, extension zip ${zip.size} B (${files.length} files)`)
