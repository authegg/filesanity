import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App'

hydrateRoot(
  document.getElementById('root')!,
  <StrictMode>
    <App path={location.pathname} />
  </StrictMode>,
)

// Offline after the first visit: the worker precaches the site's own files, nothing else.
if (import.meta.env.PROD && 'serviceWorker' in navigator)
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
