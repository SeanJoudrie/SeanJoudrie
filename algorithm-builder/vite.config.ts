/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { handleSearch } from './server/search'

/** Serves /api/search in `vite dev` with the same handler Netlify uses. */
function devApi(apiKey: string | undefined): Plugin {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/search', async (req, res) => {
        const url = new URL(req.url ?? '', 'http://localhost')
        const r = await handleSearch(url.searchParams, { apiKey, client: req.socket.remoteAddress ?? 'dev' })
        res.statusCode = r.status
        for (const [k, v] of Object.entries(r.headers)) res.setHeader(k, v)
        res.end(JSON.stringify(r.body))
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: '/',
    plugins: [react(), tailwindcss(), devApi(env.YOUTUBE_API_KEY)],
    test: { include: ['src/**/*.test.ts', 'server/**/*.test.ts'] },
  }
})
