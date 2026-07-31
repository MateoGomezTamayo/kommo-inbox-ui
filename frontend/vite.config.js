import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // En dev, Vite proxea /api, /auth y /webhooks al backend local
    proxy: {
      '/api':      'http://localhost:3001',
      '/auth':     'http://localhost:3001',
      '/webhooks': 'http://localhost:3001',
    },
  },
})
