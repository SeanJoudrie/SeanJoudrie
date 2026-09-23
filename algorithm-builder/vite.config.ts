/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { handleSearch } from './server/search'

/** Serves /api/search in `vite dev` with the same handler Netlify uses. */
function devApi(apiKey: string | undefined, apiUrl: string | undefined): Plugin {
  const handler = async (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => {
    const url = new URL(req.url ?? '', 'http://localhost')
    const r = await handleSearch(url.searchParams, { apiKey, apiUrl, client: req.socket.remoteAddress ?? 'dev' })
    res.statusCode = r.status
    for (const [k, v] of Object.entries(r.headers)) res.setHeader(k, v)
    res.end(JSON.stringify(r.body))
  }
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/search', handler)
    },
    // `vite preview` serves the production build with the same API, which is
    // what the end-to-end run tests against.
    configurePreviewServer(server) {
      server.middlewares.use('/api/search', handler)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    // Relative base so the same build works at a domain root (Netlify) and
    // under a sub-path (GitHub Pages: /SeanJoudrie/algorithm-builder/).
    base: './',
    plugins: [react(), tailwindcss(), devApi(env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY, env.YOUTUBE_API_URL || process.env.YOUTUBE_API_URL)],
    test: { include: ['src/**/*.test.ts', 'server/**/*.test.ts', 'scripts/**/*.test.mjs'] },
  }
})
