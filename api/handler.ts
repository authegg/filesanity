/** The self-hosted API: one fetch handler, so it runs unchanged on Cloudflare Workers, Deno, Bun, and Node (node.ts).
 *
 *   POST /inspect   the file as the request body (or multipart, field "file"); returns the report as JSON
 *   POST /clean     same input; returns the clean file. ?keep=exif,xmp applies a policy. Headers on the reply:
 *                   X-FileSanity-Removed, X-FileSanity-Kept, X-FileSanity-Note
 *   GET  /health    ok
 *
 * The file name comes from the multipart part, the X-Filename header or ?name=; it only picks the reply's name and
 * the error message, the bytes decide the format. If API_TOKEN is set, every call needs "Authorization: Bearer <token>".
 */
import { applyPolicy, cleanName, fieldCount, inspect, keptCount, parsePolicy, strip, Unsupported } from '../src/lib/index'

export type Env = { API_TOKEN?: string }

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Filename', 'Access-Control-Expose-Headers': 'Content-Disposition, X-FileSanity-Removed, X-FileSanity-Kept, X-FileSanity-Note' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

async function fileFrom(req: Request, url: URL): Promise<File> {
  const type = req.headers.get('Content-Type') ?? ''
  if (type.startsWith('multipart/form-data')) {
    const f = (await req.formData()).get('file')
    if (!(f instanceof File)) throw new Unsupported('multipart body without a "file" part')
    return f
  }
  const name = req.headers.get('X-Filename') || url.searchParams.get('name') || 'file'
  return new File([await req.arrayBuffer()], name, { type })
}

export async function handle(req: Request, env: Env = {}): Promise<Response> {
  const url = new URL(req.url)
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
  if (req.method === 'GET') {
    if (url.pathname === '/health') return new Response('ok', { headers: CORS })
    return new Response('FileSanity API. POST a file to /inspect or /clean. See README.md.\n', { headers: { 'Content-Type': 'text/plain', ...CORS } })
  }
  if (env.API_TOKEN && req.headers.get('Authorization') !== `Bearer ${env.API_TOKEN}`) return json({ error: 'unauthorised' }, 401)
  if (req.method !== 'POST' || !['/inspect', '/clean'].includes(url.pathname)) return json({ error: 'POST /inspect or POST /clean' }, 404)
  try {
    const file = await fileFrom(req, url)
    const report = applyPolicy(await inspect(file), parsePolicy(url.search))
    if (url.pathname === '/inspect') return json(report)
    const out = await strip(file, report)
    return new Response(out, {
      headers: {
        ...CORS,
        'Content-Type': out.type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${cleanName(file.name).replace(/["\\\r\n]/g, '_')}"`,
        'X-FileSanity-Removed': String(fieldCount(report)),
        'X-FileSanity-Kept': String(keptCount(report)),
        ...(report.note ? { 'X-FileSanity-Note': report.note.replace(/[^\x20-\x7e]/g, ' ') } : {}),
      },
    })
  } catch (e) {
    if (e instanceof Unsupported) return json({ error: e.message }, 415)
    return json({ error: e instanceof Error ? e.message : 'could not process the file' }, 422)
  }
}
