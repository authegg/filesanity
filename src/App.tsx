import { useEffect } from 'react'
import { Nav } from './ui/Nav'
import { Footer } from './ui/Footer'
import { usePicker } from './ui/Picker'
import { match } from './routes'

export default function App({ path }: { path: string }) {
  const route = match(path)
  const p = usePicker()
  const home = route.path === '/'

  // Entrances: one observer for the page, adds .in once. Under reduced motion the CSS renders everything at rest.
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]')
    if (!els.length) return
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
    }, { rootMargin: '0px 0px -8% 0px' })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [route.path])

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-40 focus:rounded-full focus:bg-panel focus:px-4 focus:py-2">Skip to content</a>
      <Nav path={route.path} onClean={home ? p.pick : undefined} />
      <main id="main">
        <route.Page p={p} />
      </main>
      <Footer path={route.path} />
    </>
  )
}
