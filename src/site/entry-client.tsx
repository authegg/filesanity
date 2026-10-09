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
