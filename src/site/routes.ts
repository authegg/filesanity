import type { ComponentType } from 'react'
import { createElement } from 'react'
import type { Cleaner } from '../shared/useCleaner'
import * as Home from './pages/Home'
import * as How from './pages/How'
import { Photos, Documents, Pdf } from './pages/Formats'
import * as Batch from './pages/Batch'
import * as Pricing from './pages/Pricing'
import * as Developers from './pages/Developers'
import * as Extension from './pages/Extension'
import * as Security from './pages/Security'
import * as Faq from './pages/Faq'
import * as About from './pages/About'
import * as Contact from './pages/Contact'
import * as Privacy from './pages/Privacy'
import * as Terms from './pages/Terms'
import * as SignIn from './pages/SignIn'
import * as Account from './pages/Account'
import * as NotFound from './pages/NotFound'
import * as Guides from './pages/Guides'

type Mod = { meta: { title: string; description: string }; default: ComponentType<{ c: Cleaner }>; tool?: boolean; index?: boolean }
export type Route = { path: string; meta: Mod['meta']; Page: Mod['default']; tool?: boolean; index?: boolean }

/** Guides are text only: the server renders them inside a static wrapper and the client keeps that HTML instead of
 * shipping the guide text in every page's bundle. The client needs only the paths. */
const GUIDE_SLUGS = ['remove-location-from-photos', 'remove-author-from-office-files', 'remove-pdf-metadata', 'photo-metadata-explained', 'marketplace-photo-metadata', 'check-a-file-is-clean']
const Static = (Page?: ComponentType<{ c: Cleaner }>, c?: Cleaner) =>
  Page ? createElement('div', { 'data-static': '' }, createElement(Page, { c: c! })) : createElement('div', { 'data-static': '', dangerouslySetInnerHTML: { __html: '' }, suppressHydrationWarning: true })
const island = (m?: Mod): Mod => ({ meta: m?.meta ?? { title: '', description: '' }, index: m?.index, default: ({ c }) => Static(m?.default, c) })
function guideRoutes(): [string, Mod][] {
  if (!import.meta.env.SSR) return ['/guides', ...GUIDE_SLUGS.map((s) => `/guides/${s}`)].map((p) => [p, island()])
  if (Guides.GUIDES.map((g) => g.slug).join() !== GUIDE_SLUGS.join()) throw new Error('routes.ts GUIDE_SLUGS is out of step with pages/Guides.tsx')
  return [['/guides', island(Guides)], ...Guides.GUIDES.map((g): [string, Mod] => [`/guides/${g.slug}`, island(Guides.guideModule(g))])]
}

/** Every page is prerendered to its own HTML file; links are plain anchors. */
const TABLE: [string, Mod][] = [
  ['/', Home], ['/how-it-works', How], ['/photos', Photos], ['/documents', Documents], ['/pdf', Pdf],
  ['/batch', Batch], ['/pricing', Pricing], ['/developers', Developers], ['/extension', Extension], ['/security', Security], ['/faq', Faq],
  ...guideRoutes(),
  ['/about', About], ['/contact', Contact], ['/privacy', Privacy], ['/terms', Terms],
  ['/sign-in', SignIn], ['/account', Account], ['/404', NotFound],
]
export const ROUTES: Route[] = TABLE.map(([path, m]) => ({ path, meta: m.meta, Page: m.default, tool: m.tool, index: m.index }))

export const match = (pathname: string): Route => {
  const p = pathname.replace(/\/index\.html$/, '').replace(/\.html$/, '').replace(/\/+$/, '') || '/'
  return ROUTES.find((r) => r.path === p) ?? ROUTES[ROUTES.length - 1]
}
