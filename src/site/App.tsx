import { match } from './routes'
import { Footer, Nav } from './ui'
import { useCleaner } from '../shared/useCleaner'
import '../shared/page.css'
import '../shared/tray.css'
import '../shared/aw.css'
import '../j/j.css'
import './site.css'

/** Every route: the nav, the page, the footer. Pages with a cleaner on them get it from here, so the nav's button opens it. */
export function App({ path }: { path: string }) {
  const r = match(path)
  const c = useCleaner('/sample.jpg', !!r.tool)
  return (
    <div className="page v-j jv-1">
      <a className="skip" href="#main">Skip to content</a>
      <Nav path={r.path} onCta={r.tool ? c.open : undefined} />
      <main id="main"><r.Page c={c} /></main>
      <Footer samples={r.path === '/' || r.path === '/batch'} />
    </div>
  )
}
