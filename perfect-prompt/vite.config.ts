/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative base so the build works under GitHub Pages' /SeanJoudrie/perfect-prompt/.
  base: './',
  plugins: [react(), tailwindcss()],
  test: { include: ['src/**/*.test.ts'] },
})
