import { ArrowRight } from '@phosphor-icons/react'
import { Picker, type PickerApi } from '../ui/Picker'
import { Closer, Pill, Section } from '../ui/bits'
import { FORMATS } from '../content'

export const meta = {
  title: 'FileSanity: remove a file\'s metadata in your browser',
  description: 'Drop a photo, a document or a PDF. FileSanity reads the metadata it carries, shows it, and removes it on your own machine. Nothing is uploaded.',
}

const STEPS = [
  ['Drop', 'Drop a file on the panel, paste one, or browse. The browser hands the page a reference to the file; the file is not copied anywhere.'],
  ['Read', 'The parser reads only the header bytes it needs: a JPEG\'s segments, a PNG\'s chunks, an Office package\'s properties, a PDF\'s Info dictionary. Every field is listed.'],
  ['Download', 'The clean copy is assembled from slices of the original, with the metadata parts left out, and saved with a "-clean" suffix. The pixels and the text are byte for byte what they were.'],
]

export default function Home({ p }: { p: PickerApi }) {
  return (
    <>
      <section
        aria-labelledby="h1"
        className={`container-x pt-24 sm:pt-28 ${p.over ? 'is-over' : ''}`}
        {...p.dragProps}
      >
        <div className="bezel bezel-lg">
          <div className="plate plate-hero grid min-h-[calc(100dvh-8.5rem)] grid-cols-1 gap-8 p-5 sm:p-8 lg:min-h-[calc(100dvh-9rem)] lg:grid-cols-12 lg:gap-12 lg:p-12">
            <div className="flex flex-col lg:col-span-6">
              <span className="eyebrow self-start">Metadata cleaner</span>
              <h1 id="h1" className="mt-6 max-w-[20ch] text-[2.25rem] leading-[1.04] sm:text-[3rem] lg:text-[3.375rem]">
                The file never leaves your browser.
              </h1>
              <p className="mt-5 max-w-[40ch] text-[1.0625rem] leading-relaxed text-muted sm:text-[1.125rem]">
                Drop a photo, a document or a PDF. It is read and cleaned on your own machine. Nothing is uploaded.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <button type="button" className="pill" onClick={p.pick}>
                  Clean a file
                  <span className="orb"><ArrowRight size={16} weight="light" aria-hidden="true" /></span>
                </button>
                <a href="/how-it-works" className="link text-[0.9375rem]">How it works</a>
              </div>
              <p className="mt-auto hidden pt-10 text-[0.8125rem] text-muted lg:block">
                Drop anywhere on this panel. Open your browser's network panel first if you want to watch nothing leave.
              </p>
            </div>
            <div className="flex min-w-0 flex-col lg:col-span-6">
              <Picker p={p} />
            </div>
          </div>
        </div>
        {p.inputEl}
      </section>

      <Section labelledBy="h-carry">
        <span className="eyebrow">What a file carries</span>
        <h2 id="h-carry" className="mt-5 max-w-[24ch] text-[1.75rem] sm:text-[2.5rem]">A photo knows where it was taken. A document knows who wrote it.</h2>
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
          <a href="/photos" className="bezel group md:col-span-7 md:row-span-2" data-reveal="">
            <div className="plate flex h-full flex-col overflow-hidden">
              <img src="/img/photo-back.avif" srcSet="/img/photo-back-768.avif 768w, /img/photo-back.avif 1536w" sizes="(min-width: 768px) 50vw, 100vw" width={1536} height={1024} loading="lazy" decoding="async" alt="A photographic print lying face down on a grey surface, its blank back showing" className="aspect-[3/2] w-full object-cover" />
              <div className="p-6 sm:p-8">
                <h3 className="text-[1.25rem]">Photos</h3>
                <p className="mt-2 max-w-[48ch] text-muted">JPEG and PNG carry the camera and lens, the exact time, GPS coordinates to a few metres, the owner's name, the software used, and often a small copy of the original picture from before it was cropped.</p>
                <span className="mt-4 inline-flex items-center gap-2 text-[0.875rem] font-medium">Read about photos <ArrowRight size={14} weight="light" className="transition-transform duration-300 ease-[var(--ease)] group-hover:translate-x-0.5" aria-hidden="true" /></span>
              </div>
            </div>
          </a>
          <a href="/documents" className="bezel group md:col-span-5" data-reveal="" style={{ '--d': '80ms' } as React.CSSProperties}>
            <div className="plate flex h-full flex-col overflow-hidden">
              <img src="/img/paper-stack.avif" srcSet="/img/paper-stack-768.avif 768w, /img/paper-stack.avif 1536w" sizes="(min-width: 768px) 50vw, 100vw" width={1536} height={1024} loading="lazy" decoding="async" alt="A short stack of white paper on a grey surface" className="aspect-[3/1] w-full object-cover" />
              <div className="p-6 sm:p-8">
                <h3 className="text-[1.25rem]">Word, Excel, PowerPoint</h3>
                <p className="mt-2 text-muted">Author, company, who last saved it, the revision count, total editing time, and the names on every comment and tracked change.</p>
                <span className="mt-4 inline-flex items-center gap-2 text-[0.875rem] font-medium">Read about documents <ArrowRight size={14} weight="light" className="transition-transform duration-300 ease-[var(--ease)] group-hover:translate-x-0.5" aria-hidden="true" /></span>
              </div>
            </div>
          </a>
          <a href="/pdf" className="bezel group md:col-span-5" data-reveal="" style={{ '--d': '160ms' } as React.CSSProperties}>
            <div className="plate flex h-full flex-col bg-[linear-gradient(160deg,var(--panel),var(--accent-tint))] p-6 sm:p-8">
              <h3 className="text-[1.25rem]">PDF</h3>
              <p className="mt-2 text-muted">The Info dictionary and the XMP packet: author, creator software, producer, creation and modification dates. Some of it sits in compressed streams, and the page says which.</p>
              <span className="mt-4 inline-flex items-center gap-2 text-[0.875rem] font-medium">Read about PDF <ArrowRight size={14} weight="light" className="transition-transform duration-300 ease-[var(--ease)] group-hover:translate-x-0.5" aria-hidden="true" /></span>
            </div>
          </a>
        </div>
      </Section>

      <Section labelledBy="h-how">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="h-how" className="text-[1.75rem] sm:text-[2.25rem]">The browser does the work.</h2>
            <p className="mt-4 max-w-[40ch] text-muted">There is no server in the loop. Three steps, all of them on your machine.</p>
            <Pill href="/how-it-works" ghost className="mt-6">How it works</Pill>
          </div>
          <ol className="rows lg:col-span-8">
            {STEPS.map(([verb, text], i) => (
              <li key={verb} className="grid grid-cols-[3rem_1fr] gap-4 py-6 sm:grid-cols-[6rem_1fr]" data-reveal="" style={{ '--d': `${i * 80}ms` } as React.CSSProperties}>
                <span className="text-[0.8125rem] font-medium tabular-nums text-muted">0{i + 1}</span>
                <div>
                  <h3 className="text-[1.125rem]">{verb}</h3>
                  <p className="mt-1 max-w-[60ch] text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section labelledBy="h-formats">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="h-formats" className="text-[1.75rem] sm:text-[2.25rem]">Six formats today.</h2>
          <a href="/formats" className="link text-[0.9375rem]">Every format, read and removed</a>
        </div>
        <ul className="rows mt-8 border-b border-hair-2">
          {FORMATS.filter((f) => f.status === 'read').map((f, i) => (
            <li key={f.name} className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-12 sm:gap-6" data-reveal="" style={{ '--d': `${i * 50}ms` } as React.CSSProperties}>
              <span className="font-medium sm:col-span-3">{f.name}</span>
              <span className="text-[0.9375rem] text-muted sm:col-span-9">{f.removed}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="h-trust">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-6">
            <h2 id="h-trust" className="text-[1.75rem] sm:text-[2.25rem]">There is nothing here to trust.</h2>
            <p className="mt-4 max-w-[56ch] text-muted">A cleaner that uploads your file has to promise things: encrypted in transit, not stored, deleted after. FileSanity makes no promise because the file is never sent. There is no account, no cookie, no analytics script, and no server that could keep a log.</p>
            <p className="mt-4 max-w-[56ch] text-muted">You can check rather than believe. Open the network panel, drop a file, and watch. The counter beside your result reads the same panel.</p>
            <Pill href="/security" ghost className="mt-6">Security</Pill>
          </div>
          <div className="bezel lg:col-span-6" data-reveal="">
            <div className="plate overflow-hidden">
              <img src="/img/glass.avif" srcSet="/img/glass-768.avif 768w, /img/glass.avif 1536w" sizes="(min-width: 768px) 50vw, 100vw" width={1536} height={1024} loading="lazy" decoding="async" alt="A clear glass block on a grey surface, the surface visible through it" className="aspect-[3/2] w-full object-cover" />
            </div>
          </div>
        </div>
      </Section>

      <Closer
        title="Send the file, not the story of who made it."
        text="Free, for anyone, and it works offline once the page has loaded."
        cta={
          <button type="button" className="pill" onClick={p.pick}>
            Clean a file
            <span className="orb"><ArrowRight size={16} weight="light" aria-hidden="true" /></span>
          </button>
        }
      />
    </>
  )
}
