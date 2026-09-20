/** node node.mjs [port]: the same handler on Node's http server. PORT and API_TOKEN from the environment. */
import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import { handle } from './handler'

const port = Number(process.argv[2] ?? process.env.PORT ?? 8787)
createServer(async (req, res) => {
  const chunks: Uint8Array[] = []
  for await (const c of req) chunks.push(c as Uint8Array)
  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v)
  const body = ['GET', 'HEAD', 'OPTIONS'].includes(req.method ?? '') ? undefined : Buffer.concat(chunks)
  const r = await handle(new Request(`http://${req.headers.host ?? 'localhost'}${req.url}`, { method: req.method, headers, body }), { API_TOKEN: process.env.API_TOKEN })
  res.writeHead(r.status, Object.fromEntries(r.headers))
  if (r.body) Readable.fromWeb(r.body as never).pipe(res)
  else res.end()
}).listen(port, () => console.log(`filesanity api on http://localhost:${port}${process.env.API_TOKEN ? ' (token required)' : ''}`))
