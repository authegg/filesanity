import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { CTA, MAIL, MAKER, MAKER_URL, NAV, REPO } from './content'

/** The mark: a file that is a zero (no requests, nothing hidden), its corner removed in the accent. Drawn in assets-src/logo, A6. */
export function Logo() {
  return (
    <svg className="logo" viewBox="12 6 40 52" aria-hidden="true" focusable="false">
      <path fillRule="evenodd" d="M26 6H38L52 20V44A14 14 0 0 1 38 58H26A14 14 0 0 1 12 44V20A14 14 0 0 1 26 6ZM32 21C37 21 40 26.5 40 34S37 47 32 47 24 41.5 24 34 27 21 32 21Z" />
      <path className="logo-flap" d="M42.2 6H52V15.8Z" />
    </svg>
  )
}

export function Mark() {
  return <><Logo /><span>File<span className="mark-s">Sanity</span></span></>
}

/** One line at desktop; under 960px the links fold into a full-height sheet under the bar. */
export function Nav({ path, onCta }: { path: string; onCta?: () => void }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    document.documentElement.style.overflow = 'hidden' // the page under the sheet does not scroll
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    addEventListener('keydown', esc)
    return () => { document.documentElement.style.overflow = ''; removeEventListener('keydown', esc) }
  }, [open])
  // The bar's CTA steps back while a page's own "Clean a file" button is on screen, so the two never show at once.
  // Starts hidden on home, whose hero button is always on the first screen, so the prerendered page never shows it then hides it.
  const [twin, setTwin] = useState(path === '/')
  useEffect(() => {
    const els = document.querySelectorAll('[data-cta]')
    if (!els.length) return
    const seen = new Set<Element>()
    const io = new IntersectionObserver((es) => { for (const e of es) e.isIntersecting ? seen.add(e.target) : seen.delete(e.target); setTwin(seen.size > 0) })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  const cur = (href: string) => (path === href ? 'page' : undefined)
  return (
    <header className={`nav ${open ? 'open' : ''}`}>
      <div className="wrap nav-in">
        <a className="mark" href="/" aria-current={cur('/')}><Mark /></a>
        <nav aria-label="Main" id="menu">
          {NAV.map((l, i) => <a key={l.href} href={l.href} aria-current={cur(l.href)} style={{ '--i': i } as CSSProperties}>{l.label}</a>)}
          <a className="signin" href="/account" aria-current={path === '/account' || path === '/sign-in' ? 'page' : undefined} style={{ '--i': NAV.length } as CSSProperties}>Account</a>
          <div className="menu-extra"><a href="/faq">FAQ</a><a href="/about">About</a><a href="/contact">Contact</a><a href={`mailto:${MAIL}`}>{MAIL}</a></div>
        </nav>
        <div className={`nav-end ${twin && !open ? 'twin' : ''}`}>
          {onCta ? <button className="btn sm" onClick={onCta}>{CTA}</button> : <a className="btn sm" href="/#cleaner">{CTA}</a>}
          <button className="menu-btn" aria-expanded={open} aria-controls="menu" aria-label={open ? 'Close menu' : 'Menu'} onClick={() => setOpen(!open)}><i /><i /></button>
        </div>
      </div>
    </header>
  )
}

export function Footer({ samples = false }: { samples?: boolean }) {
  return (
    <footer className="foot">
      <div className="wrap foot-in">
        <div className="foot-brand"><a className="mark" href="/"><Mark /></a><p>Removes hidden metadata from photos, documents and PDFs, in your browser. Made by <a href={MAKER_URL} target="_blank" rel="noopener">{MAKER}</a>. Open source, MIT.</p></div>
        <nav aria-label="Product"><h2>Product</h2><a href="/how-it-works">How it works</a><a href="/batch">Batch</a><a href="/developers">API</a><a href="/extension">Browser extension</a><a href="/pricing">Pricing</a><a href="/account">Account</a></nav>
        <nav aria-label="Files"><h2>Files</h2><a href="/photos">Photos</a><a href="/documents">Office documents</a><a href="/pdf">PDF</a><a href="/guides">Guides</a><a href="/security">Security</a><a href="/faq">FAQ</a></nav>
        <nav aria-label="Company"><h2>Company</h2><a href="/about">About</a><a href="/contact">Contact</a><a href={REPO}>Source code</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav>
        {samples && <p className="foot-fine">The sample files are generated and their metadata is invented.</p>}
      </div>
    </footer>
  )
}

/** A page's opening: the headline and one paragraph, optionally a tool beside them. */
export function Head({ h1, lede, children }: { h1: ReactNode; lede: ReactNode; children?: ReactNode }) {
  return (
    <section className={`head ${children ? 'head-split' : ''}`} aria-labelledby="h1">
      <div className="wrap head-in">
        <div><h1 id="h1">{h1}</h1><p className="lede">{lede}</p></div>
        {children}
      </div>
    </section>
  )
}

/** A titled block: heading in the left third, body in the right two thirds, one rule above. */
export function Block({ id, title, children }: { id: string; title: ReactNode; children: ReactNode }) {
  return (
    <section className="block" aria-labelledby={id}>
      <div className="wrap block-in">
        <h2 id={id}>{title}</h2>
        <div className="prose">{children}</div>
      </div>
    </section>
  )
}

