import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: globalThis.process?.env?.GITHUB_PAGES === 'true' ? '/Mentalix/' : '/',
  plugins: [react()],
  define: {
    'import.meta.env.VERCEL_ENV': JSON.stringify(globalThis.process?.env?.VERCEL_ENV || ''),
  },
  server: {
    host: true,
    allowedHosts: ['.manus.computer'],
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://mentalix-bot.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
