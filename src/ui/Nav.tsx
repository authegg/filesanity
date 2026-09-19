import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from '@phosphor-icons/react'

export const NAV = [
  ['/', 'Home'],
  ['/how-it-works', 'How it works'],
  ['/formats', 'Formats'],
  ['/pricing', 'Pricing'],
  ['/security', 'Security'],
  ['/faq', 'FAQ'],
] as const

/** Floating detached nav pill. "Clean a file" opens the picker on the home
 *  page and leads to it from every other page. */
export function Nav({ path, onClean }: { path: string; onClean?: () => void }) {
  const [open, setOpen] = useState(false)
  const first = useRef<HTMLAnchorElement>(null)
  const burger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) first.current?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false)
        burger.current?.focus()
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [open])

  const cta = onClean ? (
    <button type="button" className="pill pill-sm" onClick={onClean}>
      Clean a file
      <span className="orb"><ArrowRight size={14} weight="light" aria-hidden="true" /></span>
    </button>
  ) : (
    <a className="pill pill-sm" href="/">
      Clean a file
      <span className="orb"><ArrowRight size={14} weight="light" aria-hidden="true" /></span>
    </a>
  )

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center px-4 pt-4 sm:pt-6">
      <nav
        aria-label="Main"
        className="pointer-events-auto flex w-full max-w-[52rem] items-center gap-2 rounded-full bg-[rgb(253_253_252/0.78)] p-1.5 pl-4 shadow-[0_0_0_1px_var(--hair),var(--shadow)] backdrop-blur-xl lg:w-max"
      >
        <a href="/" className="mr-auto text-[0.9375rem] font-semibold tracking-[-0.01em] lg:mr-2" aria-label="FileSanity home">
          FileSanity
        </a>
        <ul className="hidden items-center lg:flex">
          {NAV.map(([href, label]) => (
            <li key={href}>
              <a
                href={href}
                aria-current={path === href ? 'page' : undefined}
                className="block rounded-full px-3 py-1.5 text-[0.875rem] text-muted transition-colors duration-200 hover:text-ink aria-[current=page]:text-ink"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
        {cta}
        <button
          ref={burger}
          type="button"
          className="burger relative h-9 w-10 rounded-full lg:hidden"
          aria-expanded={open}
          aria-controls="menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </nav>
      <div
        id="menu"
        data-open={open}
        className="menu pointer-events-auto fixed inset-0 z-[-1] bg-[rgb(241_241_239/0.86)] backdrop-blur-2xl lg:hidden"
        style={{ opacity: open ? 1 : 0, visibility: open ? 'visible' : 'hidden' }}
      >
        <ul className="flex h-full flex-col justify-center gap-2 px-8">
          {NAV.map(([href, label], i) => (
            <li key={href} style={{ '--d': `${80 + i * 50}ms` } as React.CSSProperties} className="menu-item">
              <a
                ref={i === 0 ? first : undefined}
                href={href}
                aria-current={path === href ? 'page' : undefined}
                tabIndex={open ? 0 : -1}
                className="block py-2 text-[2rem] font-medium tracking-[-0.02em] text-ink aria-[current=page]:text-accent"
                style={{ '--d': `${80 + i * 50}ms` } as React.CSSProperties}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
