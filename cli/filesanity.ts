// The command-line cleaner: the same src/lib parsers the site runs, on local files. No network code anywhere.
import { openAsBlob } from 'node:fs'
import { mkdir, readdir, rename, rm, stat } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { createWriteStream } from 'node:fs'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { POLICY, Unsupported, applyPolicy, checkClean, cleanName, inspect, nameRisks, neutralName, strip, type Field, type Report } from '../src/lib/index.ts'

declare const VERSION: string

const HELP = `filesanity ${VERSION}: remove metadata from files on this machine. Nothing is uploaded.

Usage
  filesanity [options] <files or folders...>   clean; writes name-clean.ext next to each file
  filesanity inspect [--json] <files...>        show what each file carries; writes nothing

Options
  -o, --out <dir>    write the clean copies into <dir>, folders keeping their structure
      --in-place     replace each file with its clean copy
      --keep <keys>  comma list of kinds to keep (below)
      --neutral-name rename an output whose name gives away a date, an email or "draft"
      --json         machine-readable output
  -h, --help         this help
  -v, --version      the version

Kinds for --keep
${POLICY.map((p) => `  ${p.key.padEnd(10)} ${p.label} (${p.formats})`).join('\n')}

Folders recurse; hidden files and earlier name-clean.ext outputs in them are skipped.
Reads JPEG, PNG, HEIC, WebP, MP4, MOV, M4A, MP3, DOCX, XLSX, PPTX, OpenDocument and PDF, by their bytes.
Exit codes: 0 all done, 1 a file failed or was skipped, 2 usage error.
`

function usage(msg: string): never {
  process.stderr.write(`filesanity: ${msg}\nRun filesanity --help for usage.\n`)
  process.exit(2)
}

const parse = () => parseArgs({
  allowPositionals: true,
  options: {
    out: { type: 'string', short: 'o' }, 'in-place': { type: 'boolean' }, keep: { type: 'string' },
    'neutral-name': { type: 'boolean' }, json: { type: 'boolean' }, help: { type: 'boolean', short: 'h' }, version: { type: 'boolean', short: 'v' },
  },
})
let args: ReturnType<typeof parse>
try { args = parse() } catch (e) { usage((e as Error).message) }
const { values: opt, positionals } = args
if (opt.help) { process.stdout.write(HELP); process.exit(0) }
if (opt.version) { process.stdout.write(`${VERSION}\n`); process.exit(0) }

const mode = positionals[0] === 'inspect' ? 'inspect' : 'clean'
const paths = mode === 'inspect' ? positionals.slice(1) : positionals
const keep = opt.keep ? opt.keep.split(',').map((k) => k.trim()).filter(Boolean) : []
const bad = keep.filter((k) => !POLICY.some((p) => p.key === k))
if (!paths.length) usage('name at least one file or folder')
if (bad.length) usage(`unknown --keep kind ${bad.join(', ')}; known: ${POLICY.map((p) => p.key).join(', ')}`)
if (opt.out && opt['in-place']) usage('--out and --in-place cannot be used together')
if (opt['in-place'] && opt['neutral-name']) usage('--in-place keeps the name; use --neutral-name with --out or without either')
if (mode === 'inspect' && (opt.out || opt['in-place'] || opt['neutral-name'])) usage('inspect writes nothing; --out, --in-place and --neutral-name do not apply')

type Job = { path: string; rel: string }
type Result = { file: string; out?: string; kind?: string; remove?: Row[]; keep?: Row[]; content?: Row[]; note?: string; name?: string[]; left?: Field[]; error?: string }
type Row = { group: string; field: string; value: string; why?: string }

/** Files under each argument; a folder's files carry their path from the folder's own name, so --out keeps the structure. */
async function collect(p: string): Promise<Job[]> {
  const s = await stat(p).catch(() => null)
  if (!s?.isDirectory()) return [{ path: p, rel: basename(p) }]
  const out: Job[] = []
  // Symlinks are neither files nor folders here, so links are not followed (no loops).
  for (const e of await readdir(p, { withFileTypes: true, recursive: true })) {
    const full = join(e.parentPath, e.name)
    if (e.isFile() && !e.name.startsWith('.') && !/-clean\.[^.]+$/.test(e.name)) out.push({ path: full, rel: join(basename(resolve(p)), relative(p, full)) })
  }
  return out.sort((a, b) => a.rel.localeCompare(b.rel))
}

const rows = (r: Report, pick: (s: Report['segments'][number]) => boolean) =>
  r.segments.filter(pick).flatMap((s) => s.fields.map((f) => ({ group: s.label, field: f.name, value: f.value, ...(s.why && !s.strip ? { why: s.why } : {}) })))

const written = new Set<string>()
/** Where the clean copy goes; a second output that would land on the same path in this run gets -2, -3. */
function target(job: Job, r: Report) {
  if (opt['in-place']) return job.path
  let name = basename(job.path)
  if (opt['neutral-name'] && nameRisks(name).length) name = neutralName(name, r.kind)
  const dir = opt.out ? join(opt.out, dirname(job.rel)) : dirname(job.path)
  if (!opt.out) name = cleanName(name)
  let dest = join(dir, name)
  for (let i = 2; written.has(resolve(dest)); i++) dest = join(dir, `${basename(name, extname(name))}-${i}${extname(name)}`)
  if (resolve(dest) === resolve(job.path)) throw new Error('the output would replace the original; use --in-place for that')
  written.add(resolve(dest))
  return dest
}

async function run(job: Job): Promise<Result> {
  const res: Result = { file: job.path }
  try {
    // openAsBlob is backed by the file on disk, so parsers read only the slices they need.
    const file = new File([await openAsBlob(job.path)], basename(job.path))
    const r = applyPolicy(await inspect(file), keep)
    Object.assign(res, { kind: r.kindLabel, remove: rows(r, (s) => s.strip), keep: rows(r, (s) => !s.strip && !s.warn), content: rows(r, (s) => !!s.warn), name: nameRisks(file.name), ...(r.note ? { note: r.note } : {}) })
    if (mode === 'inspect') return res
    const dest = target(job, r)
    await mkdir(dirname(dest), { recursive: true })
    // Written beside the destination, then renamed: an interrupted run never leaves half a file under the real name.
    const tmp = join(dirname(dest), `.${basename(dest)}.${process.pid}.tmp`)
    try {
      await pipeline(Readable.fromWeb((await strip(file, r)).stream() as never), createWriteStream(tmp))
      res.left = await checkClean(await openAsBlob(tmp), basename(dest), keep)
      if (res.left.length) throw new Error(`the clean copy still carries ${res.left.map((f) => f.name).join(', ')}; nothing was written`)
      await rename(tmp, dest)
    } finally { await rm(tmp, { force: true }) }
    res.out = dest
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code
    res.error = e instanceof Unsupported ? `skipped: ${e.message}` : code === 'ENOENT' ? 'no such file' : (e as Error).message
  }
  return res
}

const say = (s: string) => opt.json || process.stdout.write(`${s}\n`)
const results: Result[] = []
for (const p of paths) {
  for (const job of await collect(p)) {
    const r = await run(job)
    results.push(r)
    if (r.error) { if (!opt.json) process.stderr.write(`${r.file}: ${r.error}\n`); continue }
    const n = r.remove!.length
    if (mode === 'clean') say(`${r.file} -> ${r.out}: ${n} field${n === 1 ? '' : 's'} removed${r.keep!.length ? `, ${r.keep!.length} kept` : ''}${r.content!.length ? `, ${r.content!.length} in the content left as they are` : ''}.`)
    else {
      say(`${r.file}  ${r.kind}, ${n} field${n === 1 ? '' : 's'} to remove`)
      for (const [tag, list] of [['remove', r.remove], ['keep', r.keep], ['content', r.content]] as const)
        for (const x of list!) say(`  ${tag.padEnd(8)}${x.group}  ${x.field}: ${x.value}${x.why ? `  (${x.why})` : ''}`)
      for (const w of r.name!) say(`  name    the file name carries ${w}`)
      if (r.note) say(`  note    ${r.note}`)
    }
  }
}
if (opt.json) process.stdout.write(`${JSON.stringify(results, null, 2)}\n`)
process.exitCode = results.some((r) => r.error) ? 1 : 0
