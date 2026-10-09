import { useEffect, useRef } from 'react'

/** Scroll progress through a tall element, 0 at its top reaching the viewport top, 1 when its bottom reaches the viewport bottom.
 *  Written as the CSS variable --p on the element: one passive listener, batched through requestAnimationFrame, no React state. */
export function useProgress<T extends HTMLElement>(onP?: (p: number) => void) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const tick = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const span = r.height - innerHeight
      const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0
      el.style.setProperty('--p', p.toFixed(4))
      onP?.(p)
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(tick) }
    tick()
    addEventListener('scroll', on, { passive: true })
    addEventListener('resize', on)
    return () => { removeEventListener('scroll', on); removeEventListener('resize', on); cancelAnimationFrame(raf) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return ref
}
