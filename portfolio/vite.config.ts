import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative base so the build works under any path. This repo publishes to
  // GitHub Pages as a *project site* (https://seanjoudrie.github.io/SeanJoudrie/),
  // not at the domain root, so absolute "/assets/..." URLs would 404.
  base: './',
  plugins: [react(), tailwindcss()],
})
