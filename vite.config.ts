import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In dev, a page route (/pricing, /account) is served the shell; the client renders it from location.pathname.
const routes = /^\/(?!api\/|src\/|@|node_modules\/)[a-z][a-z-]+\/?(\?.*)?$|^\/(\?.*)?$/

export default defineConfig({
  plugins: [react(), {
    name: 'dev-routes',
    configureServer: (s) => { s.middlewares.use((req, _res, next) => { if (req.url && routes.test(req.url)) req.url = '/index.html'; next() }) },
  }],
  appType: 'mpa',
  build: { assetsInlineLimit: 0, sourcemap: true },
})
