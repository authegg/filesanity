import { StrictMode } from 'react'
import { hydrateRoot, createRoot } from 'react-dom/client'
import './font.css'
import { App } from './App'

const root = document.getElementById('root')!
const app = <StrictMode><App path={location.pathname} /></StrictMode>
// Prerendered in production; in dev the shell is empty.
if (root.firstElementChild) hydrateRoot(root, app); else createRoot(root).render(app)

// Offline after the first visit: the worker precaches the site's own files, nothing else.
if (import.meta.env.PROD && 'serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))

// Cloudflare Web Analytics: cookieless page counts, on the live host only so test runs are not counted. spa off: it reports on load and on leaving, never mid-clean.
const BEACON = 'ff1b20446305413daddf6f9e5d63871f'
if (BEACON && location.hostname === 'filesanity.com' && !location.search.includes('t=')) { // a sign-in link's token never reaches the counter
  const s = document.createElement('script')
  s.defer = true
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  s.dataset.cfBeacon = JSON.stringify({ token: BEACON, spa: false })
  document.body.append(s)
}
