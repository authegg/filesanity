import type { ReactNode } from 'react'
import { ArrowRight } from '@phosphor-icons/react'
import { MAIL } from '../content'

/** Page header for every page but the home. */
export function PageHead({ eyebrow, title, lede, children }: { eyebrow?: string; title: string; lede?: ReactNode; children?: ReactNode }) {
  return (
    <header className="container-x pt-32 sm:pt-40">
      <div className="max-w-[46rem]">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="mt-5 text-[2.25rem] leading-[1.05] sm:text-[3.25rem]">{title}</h1>
        {lede && <p className="mt-5 max-w-[60ch] text-[1.125rem] leading-relaxed text-muted">{lede}</p>}
        {children}
      </div>
    </header>
  )
}

export function Section({ children, className = '', id, labelledBy }: { children: ReactNode; className?: string; id?: string; labelledBy?: string }) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`container-x pt-24 sm:pt-32 ${className}`}>
      {children}
    </section>
  )
}

export function Pill({ href, children, ghost, className = '' }: { href: string; children: ReactNode; ghost?: boolean; className?: string }) {
  return (
    <a href={href} className={`pill ${ghost ? 'pill-ghost' : ''} ${className}`}>
      {children}
      <span className="orb"><ArrowRight size={16} weight="light" aria-hidden="true" /></span>
    </a>
  )
}

/** The closing band: a bezel plate with the statement left and the one CTA right. */
export function Closer({ title, text, cta }: { title: string; text: ReactNode; cta?: ReactNode }) {
  return (
    <Section>
      <div className="bezel bezel-lg" data-reveal="">
        <div className="plate flex flex-col gap-6 px-6 py-8 sm:px-10 sm:py-12 md:flex-row md:items-center md:justify-between">
          <div className="max-w-[40rem]">
            <h2 className="text-[1.75rem] sm:text-[2.25rem]">{title}</h2>
            <p className="mt-3 max-w-[56ch] text-muted">{text}</p>
          </div>
          <div className="flex-none">{cta ?? <Pill href="/">Clean a file</Pill>}</div>
        </div>
      </div>
    </Section>
  )
}

export function Mailbox() {
  return <a className="link [overflow-wrap:anywhere]" href={`mailto:${MAIL}`}>{MAIL}</a>
}

/** Client-marked placeholder: visible, plain, and removed when the client supplies the fact. */
export function ClientNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 inline-block rounded-lg bg-accent-tint px-3 py-2 text-[0.8125rem] text-accent-deep">
      {/* CLIENT: replace before launch */}
      {children}
    </p>
  )
}
