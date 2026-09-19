import { Closer, PageHead, Section } from '../ui/bits'

export const meta = {
  title: 'Security: why there is nothing to trust',
  description: 'No server, no analytics, no cookies, inspectable source. The FileSanity threat model: what the page protects against, what it does not, and how to check.',
}

const NONE: [string, string][] = [
  ['No server', 'The site is static files. There is no backend, no upload endpoint, no database. A request to clean a file cannot be logged because no such request exists.'],
  ['No analytics', 'No tracking script, no pixel, no error reporter. The page cannot tell anyone it was opened.'],
  ['No cookies', 'Nothing is set, so nothing is read on your next visit and there is no banner to click.'],
  ['No account', 'Nothing to sign up for, nothing to leak if a database is breached, because there is no database.'],
  ['No third parties', 'The font, the stylesheet and the script are served from the same place as the page. No CDN of someone else\'s, no embedded widget.'],
  ['Published source', 'The parsers are published as plain text at /source, and the shipped script carries a source map, so the developer tools show the original files. Each parser is a few hundred lines; the network panel confirms what they do.'],
]

const MODEL: [string, string][] = [
  ['A recipient who reads metadata', 'Protected. That is what the page is for: the fields a reader, a marketplace or a newsroom would pull out of your file are gone before you send it.'],
  ['A recipient who reads the content', 'Not protected, and cannot be. A photo of your street is still your street; a document that names you still names you. Redact the content in your editor.'],
  ['What is not read yet', 'Not protected. Video, GIF, TIFF, PSD, legacy Office and the pictures pasted inside a Word document keep their metadata, and the page refuses what it cannot read rather than pretend. A PDF is partly protected: Info and uncompressed XMP are blanked, compressed XMP and object streams are shown and kept, and the result says when that has happened.'],
  ['This site being tampered with', 'Protected by what you can see. The site is served over HTTPS; the network panel shows what it loads and that it sends nothing. If the code ever did send something, that panel would show it.'],
  ['Your own machine', 'Not protected. A browser extension, a synced downloads folder or malware on the device sees the file regardless of this page.'],
]

export default function Security() {
  return (
    <>
      <PageHead
        eyebrow="Security"
        title="There is nothing here to trust."
        lede="Most cleaners ask you to trust their server. FileSanity has none, so the question does not arise. This page lists what the site does not have, and then, honestly, what the page can and cannot protect you from."
      />
      <Section labelledBy="h-none">
        <h2 id="h-none" className="text-[1.75rem] sm:text-[2.25rem]">What the site does not have.</h2>
        <div className="mt-6 grid grid-cols-1 gap-x-10 md:grid-cols-2">
          {NONE.map(([t, b], i) => (
            <div key={t} className="border-t border-hair-2 py-6" data-reveal="" style={{ '--d': `${i * 50}ms` } as React.CSSProperties}>
              <h3 className="text-[1.125rem]">{t}</h3>
              <p className="mt-2 max-w-[60ch] text-[0.9375rem] text-muted">{b}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section labelledBy="h-model">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="h-model" className="text-[1.75rem] sm:text-[2.25rem]">Threat model.</h2>
            <p className="mt-3 max-w-[36ch] text-muted">Who might learn something from your file, and whether this page stops them.</p>
          </div>
          <dl className="rows border-b border-hair-2 lg:col-span-8">
            {MODEL.map(([t, b]) => (
              <div key={t} className="grid grid-cols-1 gap-2 py-5 md:grid-cols-12 md:gap-6">
                <dt className="font-medium md:col-span-4">{t}</dt>
                <dd className="text-[0.9375rem] text-muted md:col-span-8">{b}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>
      <Section labelledBy="h-check">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <h2 id="h-check" className="text-[1.75rem] sm:text-[2.25rem] lg:col-span-4">How to check.</h2>
          <div className="prose lg:col-span-8">
            <p>Open the browser's network panel, drop a file, clean it. No request appears. The <a className="link" href="/how-it-works">how it works</a> page has the keystrokes for each browser. Then disconnect from the network and do it again; it still works, because nothing was needed from anywhere.</p>
            <p>Read the code that does it: <a className="link" href="/source/">the parsers, as plain text</a>. The same files are what the source map points the developer tools at.</p>
            <p>Found something wrong? Write to the address on the <a className="link" href="/contact">contact page</a>. A report about the parsers or the site is answered first.</p>
          </div>
        </div>
      </Section>
      <Closer title="Check it, then use it." text="The network panel is the audit. Drop a file and watch." />
    </>
  )
}
