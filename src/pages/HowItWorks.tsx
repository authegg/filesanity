import { Closer, PageHead, Section } from '../ui/bits'

export const meta = {
  title: 'How it works: the browser does the work',
  description: 'How FileSanity reads and removes metadata without a server: the file API, header-only parsing, a clean copy built from slices, and how to verify it yourself in the network panel.',
}

const STEPS: [string, string, string][] = [
  ['Drop', 'The browser hands the page a File object.', 'When you drop, paste or choose a file, the browser gives the page a handle to it, the same interface a web mail client uses before you press send. A handle is not a copy: nothing is read until the page asks, and the page asks by byte range.'],
  ['Sniff', 'The first bytes say what the file is.', 'JPEG begins FF D8 FF, PNG with an eight-byte signature, PDF with %PDF, an Office document with PK. The extension is not consulted, so a renamed file is refused rather than parsed wrong.'],
  ['Read', 'Only the header bytes are read.', 'A JPEG parser walks the segment markers and reads EXIF, XMP, IPTC and comments. A PNG parser walks the chunks. An Office file is a zip; only docProps and the thumbnail are inflated, with the browser\'s own DecompressionStream. A PDF is scanned for its Info dictionary and XMP packet. Each field is listed with the part it sits in.'],
  ['Show', 'Every field, and what happens to it.', 'The table names the part, the field, the value and its fate: removed, or kept with the reason. Kept rows are the colour profile, which is how the picture is meant to look, and comment authors in a Word document, because removing them edits the document.'],
  ['Clean', 'A new file is assembled from slices of the old.', 'The clean copy is a Blob made of byte ranges of the original with the metadata parts left out. Office packages are rewritten part for part with their entry timestamps reset. PDF values are blanked in place at the same length, so no offset in the file moves. Nothing is decoded or re-encoded.'],
  ['Download', 'Saved with a -clean suffix.', 'The browser saves the Blob under the original name with "-clean" before the extension. The before and after sizes and field counts are shown, and the table strikes through what went.'],
]

export default function HowItWorks() {
  return (
    <>
      <PageHead
        eyebrow="How it works"
        title="The browser does the work."
        lede="A metadata cleaner does not need a server. Reading a file's header and writing a copy without it is a few hundred lines of code, and your browser can run them. Here is what happens, step by step."
      />
      <Section labelledBy="h-steps">
        <h2 id="h-steps" className="sr-only">Steps</h2>
        <ol className="rows border-b border-hair-2">
          {STEPS.map(([verb, lead, body], i) => (
            <li key={verb} className="grid grid-cols-1 gap-3 py-8 md:grid-cols-12 md:gap-8" data-reveal="" style={{ '--d': `${i * 60}ms` } as React.CSSProperties}>
              <div className="flex items-baseline gap-4 md:col-span-4">
                <span className="text-[0.8125rem] font-medium tabular-nums text-muted">0{i + 1}</span>
                <div>
                  <h3 className="text-[1.375rem]">{verb}</h3>
                  <p className="mt-1 text-muted">{lead}</p>
                </div>
              </div>
              <p className="max-w-[62ch] md:col-span-8">{body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section labelledBy="h-verify">
        <div className="bezel bezel-lg" data-reveal="">
          <div className="plate grid grid-cols-1 gap-8 p-6 sm:p-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 id="h-verify" className="text-[1.75rem] sm:text-[2.25rem]">Verify it yourself.</h2>
              <p className="mt-4 max-w-[48ch] text-muted">You do not have to take any of this on trust. The browser keeps a record of every request a page makes, and you can watch it while you clean a file.</p>
            </div>
            <ol className="rows lg:col-span-7">
              {[
                ['Open the developer tools.', 'Firefox: Ctrl+Shift+E (Cmd+Option+E on a Mac) opens the Network panel directly. Chrome and Edge: F12, then the Network tab. Safari: enable the Develop menu in Settings, then Develop, Show Web Inspector, Network.'],
                ['Clear the list, then drop a file.', 'The page loads its script, its stylesheet and its font once. Clear the list after that so only new requests show.'],
                ['Press "Remove all and download".', 'The clean copy is built and saved. No row appears in the panel. The only URL involved begins with blob:, which is the browser\'s name for a file that exists only in memory on your machine.'],
                ['Check the counter.', 'Beside your result the page shows "Requests since read", taken from the same browser record through the PerformanceObserver interface. It reads 0.'],
              ].map(([lead, body], i) => (
                <li key={lead} className="grid grid-cols-[2.5rem_1fr] gap-3 py-5">
                  <span className="text-[0.8125rem] font-medium tabular-nums text-muted">0{i + 1}</span>
                  <div>
                    <h3 className="text-[1.0625rem]">{lead}</h3>
                    <p className="mt-1 max-w-[58ch] text-[0.9375rem] text-muted">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      <Section labelledBy="h-limits">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <h2 id="h-limits" className="text-[1.75rem] sm:text-[2.25rem] lg:col-span-4">What it does not do.</h2>
          <div className="prose lg:col-span-8">
            <p>It does not change the content. A photo of your street is still a photo of your street; a letter that names you in its first line still names you. Metadata is what the file carries about itself, and that is all FileSanity removes.</p>
            <p>It does not reach inside embedded files. A picture pasted into a Word document keeps its own EXIF inside the package, and a PDF's compressed object streams are not opened. Both are listed on the formats page as not yet.</p>
            <p>It does not remember. There is no history, no recent files, no account. Close the tab and the page has nothing.</p>
          </div>
        </div>
      </Section>

      <Closer title="Try it with the network panel open." text="Drop a file, watch nothing leave, download the clean copy." />
    </>
  )
}
