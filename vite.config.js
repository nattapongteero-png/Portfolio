import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Served from https://<user>.github.io/Portfolio/ on GitHub Pages.
  base: '/Portfolio/',
  // The lanyard's ID card is a .glb; without this Vite treats it as an unknown
  // file rather than an asset to hash and copy.
  assetsInclude: ['**/*.glb'],
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
})
