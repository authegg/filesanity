import { Closer, PageHead, Pill, Section } from '../ui/bits'

export const meta = {
  title: 'Command line: the same cleaner in a shell',
  description: 'One file, no dependencies, Node 20 or newer. The parsers behind filesanity.com run from a terminal on a file or a whole folder, with the same policy switches.',
}

const LINES = [
  ['curl -O https://filesanity.com/cli/filesanity.mjs', 'one file, 47 kB, no install step'],
  ['node filesanity.mjs photo.jpg', 'writes photo-clean.jpg beside it'],
  ['node filesanity.mjs --out clean/ ./outbox', 'a folder in, the same shape out'],
  ['node filesanity.mjs --inspect --json report.pdf', 'read only, one JSON line per file'],
  ['node filesanity.mjs --keep exif,iptc *.jpg', 'a policy: keep those kinds, remove the rest'],
]

export default function Cli() {
  return (
    <>
      <PageHead eyebrow="Command line" title="The same cleaner, in a shell." lede="One JavaScript file bundled from the parsers this site runs. No dependencies, no account, nothing phoned home. Node 20 or newer." />
      <Section>
        <div className="bezel bezel-lg" data-reveal="">
          <div className="plate p-6 sm:p-10">
            <ol className="rows border-b border-hair-2">
              {LINES.map(([cmd, what]) => (
                <li key={cmd} className="grid grid-cols-1 gap-1 py-4 md:grid-cols-12 md:gap-6">
                  <code className="text-[0.875rem] [overflow-wrap:anywhere] md:col-span-7">{cmd}</code>
                  <span className="text-[0.875rem] text-muted md:col-span-5">{what}</span>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Pill href="/cli/filesanity.mjs">Download filesanity.mjs</Pill>
              <a href="/cli/README.md" className="link text-[0.9375rem]">Read the options</a>
            </div>
          </div>
        </div>
      </Section>
      <Section>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-5">
            <span className="eyebrow">Options</span>
            <h2 className="mt-5 text-[1.75rem] sm:text-[2.25rem]">Five switches.</h2>
          </div>
          <div className="prose md:col-span-7">
            <p><code>--out DIR</code> writes the clean files under a folder, keeping the shape of what came in. Without it each clean file lands beside its original with a "-clean" suffix.</p>
            <p><code>--keep a,b,c</code> is the policy from the <a href="/batch" className="link">batch page</a>, by kind: exif, xmp, iptc, com, text, exif-png, time, core, app, custom, thumbnail, info.</p>
            <p><code>--inspect</code> reads and reports, writes nothing. <code>--json</code> prints one JSON object per file, the same report the page shows. <code>--quiet</code> prints only errors.</p>
            <p>Exit code 1 if any file was refused, 2 for a usage error. The source is the <a href="/source/" className="link">published parsers</a>; the bundle is built from them at every release.</p>
          </div>
        </div>
      </Section>
      <Closer title="A server, not a shell?" text="The same handler runs as an API you host yourself, on a Cloudflare Worker or a Node process." cta={<Pill href="/api">The API</Pill>} />
    </>
  )
}
