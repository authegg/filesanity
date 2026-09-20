import { Closer, PageHead, Pill, Section } from '../ui/bits'

export const meta = {
  title: 'API: host the cleaner yourself',
  description: 'Two POST routes, inspect and clean, in one file you deploy to a Cloudflare Worker or run on Node. Files go to your server, never to FileSanity.',
}

const CALLS = [
  ['npx wrangler deploy', 'from the unzipped folder: a Worker on your own Cloudflare account'],
  ['API_TOKEN=change-me node node.mjs 8787', 'or a Node process, anywhere'],
  ['curl -H "Authorization: Bearer change-me" --data-binary @photo.jpg -H "X-Filename: photo.jpg" https://your-host/inspect', 'the report as JSON'],
  ['curl -H "Authorization: Bearer change-me" -F file=@offer.docx "https://your-host/clean?keep=core" -o offer-clean.docx', 'the clean file, with a policy'],
]

export default function Api() {
  return (
    <>
      <PageHead eyebrow="API" title="Host the cleaner yourself." lede="Two routes, inspect and clean, in one file with no dependencies. Deploy it as a Cloudflare Worker or run it on Node. Files go to your server and stop there; FileSanity never sees them." />
      <Section>
        <div className="bezel bezel-lg" data-reveal="">
          <div className="plate p-6 sm:p-10">
            <ol className="rows border-b border-hair-2">
              {CALLS.map(([cmd, what]) => (
                <li key={cmd} className="grid grid-cols-1 gap-1 py-4 md:grid-cols-12 md:gap-6">
                  <code className="text-[0.8125rem] [overflow-wrap:anywhere] md:col-span-8">{cmd}</code>
                  <span className="text-[0.875rem] text-muted md:col-span-4">{what}</span>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Pill href="/api/worker.mjs">Download worker.mjs</Pill>
              <a href="/api/node.mjs" className="link text-[0.9375rem]">node.mjs</a>
              <a href="/api/wrangler.jsonc" className="link text-[0.9375rem]">wrangler.jsonc</a>
              <a href="/api/README.md" className="link text-[0.9375rem]">README</a>
            </div>
          </div>
        </div>
      </Section>
      <Section>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-5">
            <h2 className="text-[1.75rem] sm:text-[2.25rem]">Bytes in, bytes out.</h2>
          </div>
          <div className="prose md:col-span-7">
            <p><code>POST /inspect</code> takes the file as the request body, or as a multipart part named <code>file</code>, and returns the same report the page shows: every segment, every field, what would be removed and what kept.</p>
            <p><code>POST /clean</code> takes the same input and returns the clean file, with <code>X-FileSanity-Removed</code> and <code>X-FileSanity-Kept</code> counts and, where the page would show a note, <code>X-FileSanity-Note</code>. <code>?keep=exif,xmp</code> applies a <a href="/batch" className="link">policy</a>.</p>
            <p>The name comes from the part, an <code>X-Filename</code> header or <code>?name=</code>; the bytes decide the format. Set <code>API_TOKEN</code> and every call needs a bearer token; without one the API is open, so keep it on a private network. Errors are 401, 415 for a format it does not read, 422 for a file it could not rewrite.</p>
            <p>Rather not host it? The same routes run as the <a href="/cloud" className="link">Cloud API</a> with a key and a monthly quota; that page says what changes when a file leaves your machine.</p>
            <p>Your server holds each file only for the length of the request. Nothing is written, logged or forwarded by the handler; what your platform logs is your platform's business.</p>
          </div>
        </div>
      </Section>
      <Closer title="Nothing to host?" text="The command line tool is the same parsers in one file for a shell." cta={<Pill href="/cli">Command line</Pill>} />
    </>
  )
}
