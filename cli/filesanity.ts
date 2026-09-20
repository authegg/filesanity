#!/usr/bin/env node
/** filesanity: the same parsers as the page, run from a shell. Node 20 or newer, no dependencies.
 *
 *   filesanity [options] <file or folder>...
 *     --out DIR        write clean files under DIR (folders keep their shape); default: next to the original, "-clean" suffix
 *     --keep a,b,c     policy: segment kinds to keep (exif, xmp, iptc, com, text, exif-png, time, core, app, custom, thumbnail, info)
 *     --inspect        read and report only, write nothing
 *     --json           report as JSON lines, one per file
 *     --quiet          no report, only errors
 */
import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { applyPolicy, cleanName, fieldCount, inspect, keptCount, strip, POLICY, Unsupported, type Report } from '../src/lib/index'

const args = process.argv.slice(2)
const opt = { out: '', keep: [] as string[], inspect: false, json: false, quiet: false }
const paths: string[] = []
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a === '--out') opt.out = args[++i] ?? ''
  else if (a === '--keep') opt.keep = (args[++i] ?? '').split(',').filter(Boolean)
  else if (a === '--inspect') opt.inspect = true
  else if (a === '--json') opt.json = true
  else if (a === '--quiet') opt.quiet = true
  else if (a === '--help' || a === '-h') paths.length = 0
  else paths.push(a)
}
const bad = opt.keep.filter((k) => !POLICY.some((p) => p.key === k))
if (bad.length) fail(`unknown --keep kinds: ${bad.join(', ')}. Known: ${POLICY.map((p) => p.key).join(', ')}`)
if (!paths.length) {
  console.error('usage: filesanity [--out DIR] [--keep exif,xmp] [--inspect] [--json] [--quiet] <file or folder>...')
  process.exit(2)
}

function fail(msg: string): never {
  console.error(`filesanity: ${msg}`)
  process.exit(2)
}

async function* walk(p: string): AsyncGenerator<string> {
  const s = await stat(p)
  if (s.isDirectory()) for (const e of (await readdir(p)).sort()) yield* walk(join(p, e))
  else yield p
}

const MIME: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.pdf': 'application/pdf' }
const SUMMARY = (r: Report) => `${fieldCount(r)} field${fieldCount(r) === 1 ? '' : 's'} removed${keptCount(r) ? `, ${keptCount(r)} kept` : ''}`

let errors = 0
for (const root of paths) {
  const rootDir = (await stat(root).catch(() => null))?.isDirectory() ? root : dirname(root)
  for await (const file of walk(root)) {
    const name = basename(file)
    if (name.startsWith('.')) continue
    try {
      const f = new File([await readFile(file)], name, { type: MIME[extname(name).toLowerCase()] ?? '' })
      const report = applyPolicy(await inspect(f), opt.keep)
      let target = ''
      if (!opt.inspect) {
        const out = await strip(f, report)
        target = opt.out ? join(opt.out, relative(rootDir, file)) : join(dirname(file), cleanName(name))
        await mkdir(dirname(target), { recursive: true })
        await writeFile(target, new Uint8Array(await out.arrayBuffer()))
      }
      if (opt.json) console.log(JSON.stringify({ file, out: target || undefined, ...report }))
      else if (!opt.quiet) {
        console.log(`${file}: ${report.kindLabel}, ${SUMMARY(report)}${target ? ` -> ${resolve(target)}` : ''}`)
        if (report.note) console.log(`  note: ${report.note}`)
        for (const s of report.segments) for (const fld of s.fields) console.log(`  ${s.strip ? (opt.inspect ? 'remove' : 'removed') : 'kept   '}  ${s.label}: ${fld.name} = ${fld.value.replace(/\s+/g, ' ').slice(0, 120)}`)
      }
    } catch (e) {
      errors++
      const msg = e instanceof Unsupported ? e.message : e instanceof Error ? e.message : String(e)
      if (opt.json) console.log(JSON.stringify({ file, error: msg }))
      else console.error(`${file}: ${msg}`)
    }
  }
}
process.exit(errors ? 1 : 0)
