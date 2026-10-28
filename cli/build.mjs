// Bundles cli/filesanity.ts and the src/lib it imports into one ESM file with the esbuild vite already installs.
// Run: npm run build:cli
import { build } from 'esbuild'
import { chmodSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const { version } = JSON.parse(readFileSync(`${here}package.json`, 'utf8'))
const outfile = `${here}dist/filesanity.mjs`
await build({
  entryPoints: [`${here}filesanity.ts`], outfile, bundle: true, format: 'esm', platform: 'node', target: 'node20',
  banner: { js: '#!/usr/bin/env node' }, define: { VERSION: JSON.stringify(version) }, minify: true, legalComments: 'none', logLevel: 'warning',
})
chmodSync(outfile, 0o755)
console.log(`cli: ${(statSync(outfile).size / 1024).toFixed(1)} kB -> cli/dist/filesanity.mjs`)
