import { renderToString } from 'react-dom/server'
import { App } from './App'
import { ROUTES, match } from './routes'
export { FAQ } from './content'
export { GUIDES, GUIDES_CHECKED } from './pages/Guides'

export const routes = ROUTES.map((r) => r.path)
export function render(path: string) {
  const r = match(path)
  return { html: renderToString(<App path={path} />), ...r.meta, index: r.index !== false }
}
