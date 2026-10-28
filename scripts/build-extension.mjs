// Bundles extension/src into dist-extension/{chrome,firefox} with the esbuild that vite and wrangler already install,
// and zips each one for its store. One codebase; the two manifests differ only in the background key and gecko settings.
// Run: npm run build:ext
import { build } from 'esbuild'
import { execFileSync } from 'node:child_process'
import { copyFileSync, cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const src = join(root, 'extension/src')
const out = join(root, 'dist-extension')
const font = join(root, 'node_modules/@fontsource-variable/archivo/files/archivo-latin-standard-normal.woff2')
const base = JSON.parse(readFileSync(join(root, 'extension/manifest.json'), 'utf8'))

rmSync(out, { recursive: true, force: true })
const tmp = join(out, '.bundle')
await build({
  entryPoints: ['content', 'background', 'popup', 'options'].map((n) => join(src, `${n}.ts`)),
  outdir: tmp, bundle: true, format: 'iife', target: ['chrome120', 'firefox128'], minify: true, legalComments: 'none', logLevel: 'warning',
})

const manifests = {
  chrome: (() => { const m = structuredClone(base); delete m.browser_specific_settings; return m })(),
  firefox: { ...base, background: { scripts: ['background.js'] } },
}
for (const [name, manifest] of Object.entries(manifests)) {
  const dir = join(out, name)
  mkdirSync(dir, { recursive: true })
  cpSync(tmp, dir, { recursive: true })
  cpSync(join(root, 'extension/icons'), join(dir, 'icons'), { recursive: true })
  for (const f of ['popup.html', 'options.html', 'ui.css']) copyFileSync(join(src, f), join(dir, f))
  copyFileSync(font, join(dir, 'archivo.woff2'))
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  const files = readdirSync(dir, { recursive: true }).filter((f) => statSync(join(dir, f)).isFile()).sort()
  if (files.some((f) => /[–—]/.test(readFileSync(join(dir, f), 'latin1')) && !f.endsWith('.png') && !f.endsWith('.woff2'))) throw new Error(`em or en dash in ${name}`)
  const zip = join(out, `filesanity-${name}-${base.version}.zip`)
  try {
    execFileSync('zip', ['-X', '-q', '-r', zip, '.'], { cwd: dir })
  } catch (e) {
    if (e.code !== 'ENOENT') throw e
    // No zip CLI: the repo's own stored zip writer. Loaded through esbuild because it is TypeScript.
    const { outputFiles } = await build({ entryPoints: [join(root, 'src/lib/zip.ts')], bundle: true, format: 'esm', write: false, platform: 'neutral' })
    const { zipStore } = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`)
    const blob = await zipStore(files.map((f) => ({ path: f, data: new Uint8Array(readFileSync(join(dir, f))) })))
    writeFileSync(zip, Buffer.from(await blob.arrayBuffer()))
  }
  console.log(`${name}: ${files.length} files, ${(statSync(zip).size / 1024).toFixed(1)} kB zipped -> ${zip.slice(root.length)}`)
}
rmSync(tmp, { recursive: true, force: true })
