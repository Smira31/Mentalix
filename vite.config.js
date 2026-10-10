import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { privacyPolicy } from './src/content/privacyPolicy.js'

const JOURNAL_PATH = path.resolve('docs/working/ui-lab/EXPERIMENT_JOURNAL.md')
const DECISION_PATH = path.resolve('docs/working/ui-lab/DECISION_LOG.md')
const DECISIONS = new Set(['accept', 'repeat', 'defer', 'reject'])
const LABELS = { accept: 'принять', repeat: 'повторить', defer: 'отложить', reject: 'отклонить' }

function fontPreloadPlugin() {
  return {
    name: 'font-preload',
    writeBundle(options) {
      const outDir = options.dir || 'dist'
      const assetsDir = path.resolve(outDir, 'assets')
      if (!fs.existsSync(assetsDir)) return

      // Основной шрифт (Onest 400, кириллица) — preload для параллельной
      // загрузки с CSS/JS, чтобы первый кадр не ждал разбора @font-face.
      const fontFile = fs
        .readdirSync(assetsDir)
        .find(name => name.startsWith('onest-cyrillic-400-normal') && name.endsWith('.woff2'))
      if (!fontFile) return

      const htmlPath = path.resolve(outDir, 'index.html')
      let html = fs.readFileSync(htmlPath, 'utf8')
      if (html.includes('rel="preload"')) return

      const preload = `<link rel="preload" href="/assets/${fontFile}" as="font" type="font/woff2" crossorigin />`
      html = html.replace('<title>Mentalix</title>', `${preload}\n  <title>Mentalix</title>`)
      fs.writeFileSync(htmlPath, html)
    },
  }
}

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

/*
 * Публичная страница политики конфиденциальности: /privacy (для BotFather).
 * Текст берётся из src/content/privacyPolicy.js — единственного источника
 * правды; страница статичная (без React и Telegram SDK), шрифт Onest
 * встроен в HTML, внешних запросов нет.
 */
const PRIVACY_FONT_CSS = ['cyrillic-400.css', 'latin-400.css', 'cyrillic-700.css']

let cachedPrivacyFontCss = null

function privacyFontCss() {
  if (cachedPrivacyFontCss !== null) return cachedPrivacyFontCss
  try {
    const pkg = path.resolve('node_modules/@fontsource/onest')
    cachedPrivacyFontCss = PRIVACY_FONT_CSS.map(name => {
      const css = fs.readFileSync(path.resolve(pkg, name), 'utf8')
      return css.replace(/url\(\.\/files\/([^)]+)\)/g, (match, file) =>
        `url(data:font/woff2;base64,${fs.readFileSync(path.resolve(pkg, 'files', file)).toString('base64')})`
      )
    }).join('\n')
  } catch {
    // Шрифт недоступен — остаётся системный стек, страница всё равно собирается.
    cachedPrivacyFontCss = ''
  }
  return cachedPrivacyFontCss
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]
  )
}

function renderPrivacyParts(parts) {
  return parts
    .map(part => {
      if (part.href && /^(https?:|mailto:)/.test(part.href)) {
        return `<a href="${escapeHtml(part.href)}">${escapeHtml(part.text)}</a>`
      }
      return escapeHtml(part.text)
    })
    .join('')
}

function renderPrivacyBlock(block) {
  if (block.type === 'list') {
    return `        <ul>\n${block.items.map(item => `          <li>${escapeHtml(item)}</li>`).join('\n')}\n        </ul>`
  }
  const text = block.parts ? renderPrivacyParts(block.parts) : escapeHtml(block.text)
  return `        <p>${text}</p>`
}

function renderPrivacyHtml() {
  const sections = privacyPolicy.sections
    .map(
      section =>
        `      <section>\n        <h2>${section.id}. ${escapeHtml(section.heading)}</h2>\n${section.blocks
          .map(renderPrivacyBlock)
          .join('\n')}\n      </section>`
    )
    .join('\n')

  return `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Политика конфиденциальности Mentalix" />
    <title>Политика конфиденциальности — Mentalix</title>
    <style>
${privacyFontCss()}
      *, *::before, *::after { box-sizing: border-box; }
      html { background: #000; }
      body {
        margin: 0;
        background: #000;
        color: #E8E8E8;
        font-family: 'Onest', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
        font-size: 16px;
        line-height: 1.6;
        -webkit-font-smoothing: antialiased;
      }
      .mx-privacy {
        max-width: 640px;
        margin: 0 auto;
        padding: 40px 16px;
      }
      h1 {
        margin: 0 0 8px;
        color: #fff;
        font-size: 24px;
        font-weight: 700;
        line-height: 1.25;
        letter-spacing: -0.01em;
      }
      .mx-privacy__meta {
        margin: 0 0 32px;
        color: #888;
        font-size: 14px;
      }
      section + section { margin-top: 28px; }
      h2 {
        margin: 0 0 14px;
        color: #fff;
        font-size: 18px;
        font-weight: 700;
        line-height: 1.3;
        letter-spacing: -0.01em;
      }
      p { margin: 0 0 14px; }
      ul { margin: 0 0 14px; padding-left: 20px; }
      li + li { margin-top: 8px; }
      a { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
      section > :last-child { margin-bottom: 0; }
    </style>
  </head>
  <body>
    <article class="mx-privacy">
      <h1>${escapeHtml(privacyPolicy.title)}</h1>
      <p class="mx-privacy__meta">Версия ${escapeHtml(privacyPolicy.version)} · действует с ${escapeHtml(privacyPolicy.effectiveDate)}</p>
${sections}
    </article>
  </body>
</html>
`
}

function privacyPagePlugin() {
  return {
    name: 'privacy-page',
    // В dev-сервере страница доступна по тем же адресам, что и в проде.
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = (request.url || '').split('?')[0]
        if (url !== '/privacy' && url !== '/privacy/' && url !== '/privacy.html') return next()
        response.setHeader('content-type', 'text/html; charset=utf-8')
        response.end(renderPrivacyHtml())
      })
    },
    writeBundle(options) {
      const outDir = options.dir || 'dist'
      fs.writeFileSync(path.join(outDir, 'privacy.html'), renderPrivacyHtml())
    },
  }
}

export default defineConfig({
  base: globalThis.process?.env?.GITHUB_PAGES === 'true' ? '/Mentalix/' : '/',
  plugins: [react(), fontPreloadPlugin(), uiLabDecisionWriter(), privacyPagePlugin()],
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
  // sourcemap + keepNames: в проде сохраняются имена компонентов в
  // componentStack React-ошибок. Minify остаётся включённым.
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        // Крупные библиотеки — в стабильные именованные чанки, чтобы
        // код приложения не перевыгружался при правке экранов.
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          icons: ['lucide-react'],
          query: ['@tanstack/react-query'],
          telegram: ['@twa-dev/sdk'],
        },
      },
    },
  },
  esbuild: {
    keepNames: true,
  },
})
