import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { staticFallback } from './plugins/static-fallback'

export default defineConfig({
  // Relative base so the build works under any path. This repo publishes to
  // GitHub Pages as a *project site* (https://seanjoudrie.github.io/SeanJoudrie/),
  // not at the domain root, so absolute "/assets/..." URLs would 404.
  base: './',
  // staticFallback bakes a readable, JS-free version of the site into
  // index.html so crawlers, link previews, and AI assistants can read the page
  // without executing the app.
  plugins: [react(), tailwindcss(), staticFallback()],
})
