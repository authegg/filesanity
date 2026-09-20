import type { ComponentType } from 'react'
import type { PickerApi } from './ui/Picker'
import * as Home from './pages/Home'
import * as HowItWorks from './pages/HowItWorks'
import * as Photos from './pages/Photos'
import * as Documents from './pages/Documents'
import * as Pdf from './pages/Pdf'
import * as Formats from './pages/Formats'
import * as Pricing from './pages/Pricing'
import * as Batch from './pages/Batch'
import * as Cli from './pages/Cli'
import * as Api from './pages/Api'
import * as Extension from './pages/Extension'
import * as Security from './pages/Security'
import * as Faq from './pages/Faq'
import * as About from './pages/About'
import * as Contact from './pages/Contact'
import * as Privacy from './pages/Privacy'
import * as Terms from './pages/Terms'
import * as Changelog from './pages/Changelog'
import * as Blog from './pages/Blog'
import { postPage } from './pages/BlogPost'
import { POSTS } from './posts'
import * as NotFound from './pages/NotFound'

export type Route = { path: string; meta: { title: string; description: string }; Page: ComponentType<{ p: PickerApi }> }

/** Every page is prerendered to its own HTML file; links are plain anchors and each page loads whole. */
export const ROUTES: Route[] = [
  { path: '/', ...Home },
  { path: '/how-it-works', ...HowItWorks },
  { path: '/photos', ...Photos },
  { path: '/documents', ...Documents },
  { path: '/pdf', ...Pdf },
  { path: '/formats', ...Formats },
  { path: '/pricing', ...Pricing },
  { path: '/batch', ...Batch },
  { path: '/cli', ...Cli },
  { path: '/api', ...Api },
  { path: '/extension', ...Extension },
  { path: '/security', ...Security },
  { path: '/faq', ...Faq },
  { path: '/about', ...About },
  { path: '/contact', ...Contact },
  { path: '/privacy', ...Privacy },
  { path: '/terms', ...Terms },
  { path: '/changelog', ...Changelog },
  { path: '/blog', ...Blog },
  ...POSTS.map((post) => ({ path: `/blog/${post.meta.slug}`, meta: { title: post.meta.title, description: post.meta.description }, default: postPage(post) })),
  { path: '/404', ...NotFound },
].map((r) => ({ path: r.path, meta: r.meta, Page: r.default as Route['Page'] }))

/** For the feed and the JSON-LD written at prerender. */
export const posts = POSTS.map((p) => p.meta)

export const match = (pathname: string): Route => {
  const p = pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '') || '/'
  return ROUTES.find((r) => r.path === p) ?? ROUTES[ROUTES.length - 1]
}
