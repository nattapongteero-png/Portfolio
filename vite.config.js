import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Served from https://<user>.github.io/Portfolio/ on GitHub Pages.
  base: '/Portfolio/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
})
