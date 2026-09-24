import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const JOURNAL_PATH = path.resolve('docs/working/ui-lab/EXPERIMENT_JOURNAL.md')
const DECISION_PATH = path.resolve('docs/working/ui-lab/DECISION_LOG.md')
const DECISIONS = new Set(['accept', 'repeat', 'defer', 'reject'])
const LABELS = { accept: 'принять', repeat: 'повторить', defer: 'отложить', reject: 'отклонить' }

function uiLabDecisionWriter() {
  return {
    name: 'ui-lab-decision-writer',
    configureServer(server) {
      server.middlewares.use('/__ui_lab/decision', (request, response, next) => {
        if (request.method !== 'POST') return next()
        let body = ''
        request.on('data', chunk => {
          body += chunk
        })
        request.on('end', () => {
          try {
            const { experimentId, decision } = JSON.parse(body)
            if (experimentId !== 'UI-EXP-003' || !DECISIONS.has(decision))
              throw new Error('invalid decision')
            const date = new Date().toISOString().slice(0, 10)
            const label = LABELS[decision]
            fs.appendFileSync(
              JOURNAL_PATH,
              `\n\n### ${experimentId} · результат focused-check (${date})\n\n- **Результат:** ${label}\n- **Источник:** режим сфокусированной проверки в UI Lab\n- **Evidence:** зафиксировано локальным tooling; ручной Telegram/iPhone gate остаётся отдельным evidence.\n- **Граница:** production не изменён.\n`
            )
            fs.appendFileSync(
              DECISION_PATH,
              `\n\n### ${experimentId} · ${label} (${date})\n\n- **Решение:** ${label}.\n- **Evidence:** запись сделана кнопкой focused-check в UI Lab.\n- **Не следует из решения:** production не изменён; перенос требует отдельного PR.\n`
            )
            response.setHeader('content-type', 'application/json')
            response.end(JSON.stringify({ ok: true }))
          } catch (error) {
            response.statusCode = 400
            response.end(JSON.stringify({ error: error.message }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  base: globalThis.process?.env?.GITHUB_PAGES === 'true' ? '/Mentalix/' : '/',
  plugins: [react(), uiLabDecisionWriter()],
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
