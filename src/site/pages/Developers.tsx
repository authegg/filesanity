import { REPO } from '../content'
import { PLANS } from '../plans'
import { Block, Head } from '../ui'

export const meta = {
  title: 'API: clean files from your own systems',
  description: 'The FileSanity API cleans photos, Office documents and PDFs by API key, with a monthly quota and signed reports. Unlike the website, a file sent here leaves your device.',
}

const BASE = 'https://filesanity.com/api/v1'

export default function Developers() {
  return (
    <>
      <Head h1="The same cleaner, for your systems." lede="Send a file with an API key, get the clean file back. For upload forms, document pipelines and anything that cannot open a browser." />
      <Block id="h-leaves" title="This one uploads">
        <p className="callout">Unlike everything else on this site, a file sent to the API leaves your device. It is held in memory on Cloudflare's network for the length of one request and then dropped. Nothing about the file is stored or logged; only a count of files for your quota is kept.</p>
        <p>If a file must never leave your own servers, run the same API yourself: it is one fetch handler in the <a href={REPO}>open-source repository</a> and runs on Node, Deno, Bun or Cloudflare Workers.</p>
      </Block>
      <Block id="h-start" title="Start">
        <ol>
          <li><a href="/sign-in">Sign in</a> with your email address. No password.</li>
          <li>On your <a href="/account">account page</a>, create a key. It is shown once.</li>
          <li>Call the API with the key as a bearer token.</li>
        </ol>
        <pre><code>{`curl -H "Authorization: Bearer $FILESANITY_KEY" \\
  -F file=@photo.jpg \\
  "${BASE}/clean" -o photo-clean.jpg -D -`}</code></pre>
      </Block>
      <Block id="h-ends" title="Endpoints">
        <table className="spec"><tbody>
          <tr><th scope="row"><code>POST /clean</code></th><td>The file as a multipart part named <code>file</code>, or as the raw body with <code>X-Filename</code>. Returns the clean file. Headers <code>X-FileSanity-Removed</code>, <code>-Kept</code> and <code>-Note</code> say what happened.</td></tr>
          <tr><th scope="row"><code>POST /inspect</code></th><td>Same input. Returns the report as JSON: every field found, grouped by part, and whether it would be removed.</td></tr>
          <tr><th scope="row"><code>GET /usage</code></th><td>Your plan, files used this month, and the quota.</td></tr>
          <tr><th scope="row"><code>?keep=exif,xmp</code></th><td>A policy: kinds of field to keep. The same keys as the batch page.</td></tr>
          <tr><th scope="row"><code>?report=1</code></th><td>On <code>/clean</code>, Team and API plans: adds <code>X-FileSanity-Report</code>, a base64 JSON record with the clean file's SHA-256, and <code>X-FileSanity-Report-Signature</code>, an Ed25519 signature over it.</td></tr>
        </tbody></table>
        <p>All paths are under <code>{BASE}</code>. Errors are JSON with an <code>error</code> field: 401 for a missing or revoked key, 402 when the month's files are used, 413 for a file over your plan's size, 415 for a format FileSanity does not read.</p>
      </Block>
      <Block id="h-verify" title="Checking a signed report">
        <p>The public key is at <code>https://filesanity.com/api/report-key</code>. Anyone holding the clean file, the report and the signature can check that this file came out of FileSanity on that date with those fields removed, without trusting the person who sent it.</p>
        <pre><code>{`// Node 20+
const res = await fetch('https://filesanity.com/api/report-key')
const key = await crypto.subtle.importKey(
  'jwk', await res.json(), { name: 'Ed25519' }, false, ['verify'])
const report = Buffer.from(reportHeader, 'base64')
const sig = Buffer.from(signatureHeader, 'base64')
const ok = await crypto.subtle.verify('Ed25519', key, sig, report)`}</code></pre>
      </Block>
      <Block id="h-limits" title="Quotas">
        <table className="spec"><tbody>
          {(['free', 'pro', 'team', 'api'] as const).map((k) => <tr key={k}><th scope="row">{PLANS[k].name}</th><td>{PLANS[k].apiFiles.toLocaleString('en')} files a month, up to {PLANS[k].maxBytes / 1e6} MB each</td></tr>)}
        </tbody></table>
        <p>The count resets on the first of each month, UTC.</p>
      </Block>
    </>
  )
}
