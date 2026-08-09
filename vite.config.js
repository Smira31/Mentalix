import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VERCEL_ENV': JSON.stringify(
      globalThis.process?.env?.VERCEL_ENV || '',
    ),
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://mentalix-bot-production.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
