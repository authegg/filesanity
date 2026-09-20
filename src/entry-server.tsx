import { renderToString } from 'react-dom/server'
import App from './App'
import { ROUTES, match, SOURCE } from './routes'
export { SOURCE }

export { posts } from './routes'
export { FAQ } from './content'

export const routes = ROUTES.map((r) => r.path)
export function render(path: string) {
  const { meta } = match(path)
  return { html: renderToString(<App path={path} />), ...meta }
}
