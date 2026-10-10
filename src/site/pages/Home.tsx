import { useState } from 'react'
import { Tray } from '../../shared/Tray'
import type { Cleaner } from '../../shared/useCleaner'
import { CTA, EXAMPLES, FAQ } from '../content'
import { PLANS, PAID, fmtPrice } from '../plans'

export const tool = true
export const meta = {
  title: 'FileSanity: remove hidden metadata from files, in your browser',
  description: 'Photos, Word, Excel, PowerPoint and PDF files carry who made them, where and when. FileSanity removes it inside your browser. The file is never uploaded.',
}

// Smooth only when the visitor allows motion.
const toCleaner = () => document.getElementById('cleaner')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' })

const KINDS = [
  { href: '/photos', name: 'Photos', fmt: 'JPEG, PNG, HEIC, WebP, MP4, MOV', says: 'GPS position, camera and serial number, the time to the second, editing app, your name' },
  { href: '/documents', name: 'Office documents', fmt: 'Word, Excel, PowerPoint, OpenDocument', says: 'Author, last editor, company, manager, editing minutes, custom fields, a thumbnail of page one' },
  { href: '/pdf', name: 'PDF', fmt: 'PDF', says: 'Author, title, subject, the program that made it, created and modified dates, XMP' },
]

export default function Home({ c }: { c: Cleaner }) {
  const [ex, setEx] = useState<(typeof EXAMPLES)[number]>(EXAMPLES[0])
  return (
    <>
      <section className="hero" aria-labelledby="h1">
        <div className="wrap hero-in">
          <div className="hero-copy">
            <h1 id="h1">Your files say too much.</h1>
            <p className="lede">Photos and documents carry who made them, where and when. FileSanity removes that in your browser. Nothing is uploaded.</p>
            <div className="ctas"><button className="btn" data-cta onClick={c.open}>{CTA}</button><a className="btn ghost" href="/pricing">See pricing</a></div>
          </div>
          <div className="hero-tool" id="cleaner"><Tray c={c} /></div>
        </div>
      </section>

      <section className="sec says" aria-labelledby="says">
        <div className="wrap says-in">
          {/* The three supported kinds as the logo's file shape, and they are the switch: no photo, no drawn page. */}
          <div className="says-files" role="group" aria-label="Example file">
            {EXAMPLES.map((e) => (
              <button key={e.key} aria-pressed={e.key === ex.key} onClick={() => setEx(e)}>
                <span className="says-glyph"><svg viewBox="12 6 40 52" aria-hidden="true"><path className="body" d="M26 6H38L52 20V44A14 14 0 0 1 38 58H26A14 14 0 0 1 12 44V20A14 14 0 0 1 26 6Z" /><path className="flap" d="M42.2 6H52V15.8Z" /></svg><b>{e.ext}</b></span>
                <span>{e.tab}</span>
              </button>
            ))}
          </div>
          {/* All three are laid in one cell and only the chosen one shows, so switching never changes the section's height. */}
          <div className="says-stack">{EXAMPLES.map((e) => (
            <div key={e.key} className="says-ex" style={e.key === ex.key ? undefined : { visibility: 'hidden' }} aria-hidden={e.key !== ex.key || undefined}>
              <h2 id={e.key === ex.key ? 'says' : undefined}>{e.title}</h2>
              <dl className="says-list">{e.rows.map((x) => <div key={x.k}><dt>{x.k}</dt><dd>{x.v}</dd></div>)}</dl>
              <p className="says-foot">{e.fields} fields in all. <button className="link-btn" onClick={() => { c.sample(e.url); toCleaner() }}>Open it in the cleaner</button> and remove them. The names and values are invented.</p>
            </div>
          ))}</div>
        </div>
      </section>

      <section className="sec" aria-labelledby="how">
        <div className="wrap">
          <h2 id="how">Three steps, all on your machine.</h2>
          <ol className="steps">
            <li><h3>Drop</h3><p>Drop, paste or choose a photo, an Office document or a PDF.</p></li>
            <li><h3>Read</h3><p>FileSanity lists what the file carries, sorted by what it gives away: the person, the place, the time, the device.</p></li>
            <li><h3>Clean</h3><p>Remove it and download the clean copy. The picture, text and cells are not touched.</p></li>
          </ol>
          <p className="more"><a href="/how-it-works">How it works, in detail</a></p>
        </div>
      </section>

      <section className="sec" aria-labelledby="kinds">
        <div className="wrap">
          <h2 id="kinds">What each kind of file gives away.</h2>
          <table className="kinds">
            <thead><tr><th scope="col">File</th><th scope="col">Formats</th><th scope="col">What it carries</th></tr></thead>
            <tbody>{KINDS.map((k) => <tr key={k.href}><th scope="row"><a href={k.href}>{k.name}</a></th><td>{k.fmt}</td><td>{k.says}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="sec proof" aria-labelledby="proof">
        <div className="wrap proof-in">
          <p className="proof-n" aria-hidden="true">0</p>
          <div>
            <h2 id="proof">Network requests while your file is cleaned.</h2>
            <p>The counter under the cleaner reads the browser's own record of every request this page makes after your file arrives. It stays at zero because the reading and the rewriting happen in this tab. Load the page, turn off Wi-Fi, and clean a file: it still works. The code is open, so anyone can check.</p>
            <p className="more"><a href="/security">How to check it yourself</a></p>
          </div>
        </div>
      </section>

      <section className="sec" aria-labelledby="plans">
        <div className="wrap">
          <h2 id="plans">Free for one file. Paid for many.</h2>
          <div className="plan-grid four">
            {(['free', ...PAID] as const).map((k) => {
              const p = PLANS[k]
              return (
                <div className="plan" key={k}>
                  <h3>{p.name}</h3>
                  <p className="plan-note">{p.who}</p>
                  <p className="plan-price"><b>{fmtPrice(p)}</b> a month</p>
                  <ul>{p.items.map((x) => <li key={x}>{x}</li>)}</ul>
                </div>
              )
            })}
          </div>
          <p className="fine">Prices in US dollars. <a href="/pricing">Compare the plans</a></p>
        </div>
      </section>

      <section className="sec faq" aria-labelledby="faq">
        <div className="wrap faq-in">
          <h2 id="faq">Questions</h2>
          <dl>{FAQ[0].items.slice(0, 4).map(([q, a]) => <div key={q}><dt>{q}</dt><dd>{a}</dd></div>)}</dl>
        </div>
      </section>

      <section className="sec close" aria-labelledby="close">
        <div className="wrap close-in">
          <h2 id="close">Clean the next file before you send it.</h2>
          <button className="btn" data-cta onClick={() => { toCleaner(); c.open() }}>{CTA}</button>
        </div>
      </section>
    </>
  )
}
