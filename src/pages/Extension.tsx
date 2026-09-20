import { Closer, PageHead, Pill, Section } from '../ui/bits'

export const meta = {
  title: 'Extension: clean before upload, on any site',
  description: 'A browser extension that cleans a photo, Office document or PDF the moment you choose it for upload, on any site, inside the browser. Chrome, Edge, Firefox.',
}

const STEPS = [
  ['Unzip', 'Download the zip and unpack it anywhere.'],
  ['Load', 'Chrome, Edge, Brave: chrome://extensions, Developer mode, Load unpacked, pick the folder. Firefox: about:debugging, This Firefox, Load Temporary Add-on, pick manifest.json.'],
  ['Upload', 'Choose a file anywhere on the web. The page receives the clean copy. The toolbar button toggles it and counts.'],
]

export default function Extension() {
  return (
    <>
      <PageHead eyebrow="Extension" title="Clean before upload, everywhere." lede="A small extension that runs the same parsers the moment you choose a file in any site's picker. The page receives the clean copy; the original stays on your disk, untouched." />
      <Section>
        <div className="bezel bezel-lg" data-reveal="">
          <div className="plate p-6 sm:p-10">
            <ol className="rows border-b border-hair-2">
              {STEPS.map(([name, what], i) => (
                <li key={name} className="grid grid-cols-1 gap-2 py-5 md:grid-cols-12 md:gap-6">
                  <span className="text-[1.125rem] font-medium md:col-span-3"><span className="mr-3 text-muted tabular-nums">0{i + 1}</span>{name}</span>
                  <span className="text-[0.9375rem] text-muted md:col-span-9">{what}</span>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Pill href="/extension/filesanity-extension.zip">Download the extension</Pill>
              <a href="/extension/README.md" className="link text-[0.9375rem]">Install notes</a>
            </div>
          </div>
        </div>
      </Section>
      <Section>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-5">
            <span className="eyebrow">What it does and does not</span>
            <h2 className="mt-5 text-[1.75rem] sm:text-[2.25rem]">Only the picker.</h2>
          </div>
          <div className="prose md:col-span-7">
            <p>It watches every file input on every page. When you choose files, each JPEG, PNG, Word, Excel, PowerPoint or PDF is replaced by its clean copy before the page's own code sees the change. Files it cannot read pass through as they are.</p>
            <p>A file dragged straight onto a page, or pasted, does not go through a file input and is not cleaned; use the <a href="/" className="link">home page</a> first. It asks for one permission, storage, to remember the on-off switch and the count.</p>
            <p>It is not in a store yet. Loaded unpacked it works in Chrome, Edge and Brave until you remove it, and in Firefox until the browser closes. A signed build is the next step.</p>
          </div>
        </div>
      </Section>
      <Closer title="Many files at once?" text="Batch takes a folder and returns a clean folder, in the browser." cta={<Pill href="/batch">Batch</Pill>} />
    </>
  )
}
