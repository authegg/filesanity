// Runs the built CLI (npm run build:cli first) on the repo's samples and fixtures, with every network API made fatal.
// Run: node cli/test.mjs
import { spawnSync } from 'node:child_process'
import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const root = fileURLToPath(new URL('..', import.meta.url))
const bin = join(root, 'cli/dist/filesanity.mjs')
const tmp = mkdtempSync(join(tmpdir(), 'fs-cli-'))
const guard = join(tmp, 'guard.mjs')
// Any socket, DNS lookup, HTTP request or fetch exits 99, so a run that touches the network cannot pass.
writeFileSync(guard, `import net from 'node:net'; import tls from 'node:tls'; import dns from 'node:dns'; import http from 'node:http'; import https from 'node:https'; import { syncBuiltinESMExports } from 'node:module'
const no = (what) => () => { process.stderr.write('NETWORK ' + what + '\\n'); process.exit(99) }
net.Socket.prototype.connect = no('socket'); net.connect = net.createConnection = no('net'); tls.connect = no('tls')
dns.lookup = dns.resolve = dns.promises.lookup = dns.promises.resolve = no('dns')
http.request = http.get = https.request = https.get = no('http')
globalThis.fetch = no('fetch'); globalThis.WebSocket = no('websocket')
syncBuiltinESMExports()
`)
const env = { ...process.env, NODE_OPTIONS: `--import ${guard}` }
const cli = (...args) => {
  const r = spawnSync(process.execPath, [bin, ...args], { env, encoding: 'utf8' })
  assert.notEqual(r.status, 99, `network use: ${r.stderr}`)
  return r
}
const json = (...args) => JSON.parse(cli(...args, '--json').stdout)
let n = 0
const ok = (name) => console.log(`ok ${++n} ${name}`)

try {
  assert.equal(spawnSync(process.execPath, ['-e', "fetch('http://127.0.0.1:9')"], { env }).status, 99)
  assert.equal(spawnSync(process.execPath, ['-e', "require('node:net').connect(9, '127.0.0.1')"], { env }).status, 99)
  ok('the network guard trips on fetch and sockets')

  assert.equal(cli('--version').status, 0)
  assert.match(cli('--help').stdout, /--keep[\s\S]*exif-png/)
  assert.equal(cli().status, 2)
  assert.equal(cli('--bogus', 'x.jpg').status, 2)
  assert.equal(cli('--keep', 'gps', 'x.jpg').status, 2)
  assert.equal(cli('--in-place', '-o', tmp, 'x.jpg').status, 2)
  assert.equal(cli('inspect').status, 2)
  ok('help, version and usage errors exit 0 and 2')

  // Every fixture and sample, cleaned into one folder; the junk among them is skipped and makes the run exit 1.
  const src = join(tmp, 'src'), out = join(tmp, 'out')
  cpSync(join(root, 'tests/files'), src, { recursive: true })
  for (const f of ['public/sample.jpg', ...readdirSync(join(root, 'public/samples')).map((f) => `public/samples/${f}`)]) copyFileSync(join(root, f), join(src, `sample-${f.split('/').pop()}`))
  const run = spawnSync(process.execPath, [bin, '-o', out, src, '--json'], { env, encoding: 'utf8' })
  assert.notEqual(run.status, 99, run.stderr)
  assert.equal(run.status, 1)
  const res = JSON.parse(run.stdout)
  const failed = res.filter((r) => r.error).map((r) => r.file.split('/').pop()).sort()
  assert.ok(failed.includes('notes.txt') && failed.includes('notajpeg.jpg'), failed.join())
  for (const r of res.filter((r) => !r.error)) {
    assert.ok(existsSync(r.out), r.out)
    assert.equal(r.out, join(out, 'src', r.file.slice(src.length + 1)))
    assert.deepEqual(r.left, [], r.file)
  }
  const done = res.filter((r) => !r.error && r.remove.length)
  assert.ok(done.length >= 30, `${done.length} cleaned`)
  ok(`cleaned ${done.length} files with metadata, skipped ${failed.join(', ')}, exit 1`)

  const again = json('inspect', ...done.map((r) => r.out))
  assert.equal(again.length, done.length)
  for (const r of again) assert.deepEqual(r.remove, [], `${r.file} still carries ${JSON.stringify(r.remove)}`)
  ok('re-inspecting every output finds nothing left to remove')

  const sample = again.find((r) => r.file.endsWith('sample-sample.jpg'))
  assert.ok(sample && !JSON.stringify(sample).match(/GPS|Artist|City/), 'sample still has GPS, Artist or City')
  ok('the sample photo has no GPS, Artist or City')

  const kept = join(tmp, 'kept')
  assert.equal(cli('-o', kept, '--keep', 'exif,iptc', join(root, 'public/sample.jpg')).status, 0)
  const [k] = json('inspect', '--keep', 'exif,iptc', join(kept, 'sample.jpg'))
  assert.deepEqual(k.remove, [])
  assert.ok(k.keep.some((x) => x.group === 'EXIF' && x.field === 'Artist') && k.keep.some((x) => x.group === 'IPTC'))
  assert.ok(!k.keep.some((x) => x.group === 'XMP'))
  ok('--keep exif,iptc keeps those two and removes XMP')

  const place = join(tmp, 'place'); mkdirSync(place)
  copyFileSync(join(root, 'public/samples/offer.docx'), join(place, 'offer.docx'))
  const before = statSync(join(place, 'offer.docx')).size
  assert.equal(cli('--in-place', join(place, 'offer.docx')).status, 0)
  assert.deepEqual(readdirSync(place), ['offer.docx'])
  assert.notEqual(statSync(join(place, 'offer.docx')).size, before)
  assert.deepEqual(json('inspect', join(place, 'offer.docx'))[0].remove, [])
  ok('--in-place replaces the file and leaves no temp file')

  const tree = join(tmp, 'tree'); mkdirSync(join(tree, 'a/b'), { recursive: true })
  copyFileSync(join(root, 'public/sample.jpg'), join(tree, 'a/b/photo.jpg'))
  copyFileSync(join(root, 'public/samples/memo.pdf'), join(tree, 'memo.pdf'))
  assert.equal(cli(tree).status, 0)
  assert.ok(existsSync(join(tree, 'a/b/photo-clean.jpg')) && existsSync(join(tree, 'memo-clean.pdf')))
  assert.equal(cli(tree).status, 0)
  assert.ok(!existsSync(join(tree, 'a/b/photo-clean-clean.jpg')))
  ok('folders recurse, write name-clean.ext beside each file, and skip earlier outputs')

  const named = join(tmp, 'named'); mkdirSync(named)
  copyFileSync(join(root, 'public/sample.jpg'), join(named, 'IMG_20260411_draft.jpg'))
  copyFileSync(join(root, 'public/sample.jpg'), join(named, 'IMG_20260412.jpg'))
  const nn = json('-o', join(tmp, 'nn'), '--neutral-name', named)
  assert.deepEqual(nn.map((r) => r.out.split('/').pop()), ['photo.jpg', 'photo-2.jpg'])
  ok('--neutral-name renames giveaway names without one overwriting another')

  const one = cli('inspect', join(root, 'public/sample.jpg'))
  assert.equal(one.status, 0)
  assert.match(one.stdout, /remove {2}EXIF {2}GPS latitude/)
  ok('inspect prints group, field and value')
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
