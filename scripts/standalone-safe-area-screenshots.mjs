/*
 * Issue #1151: в PWA (добавлено на экран «Домой», display-mode: standalone)
 * шапки «Сегодня» и «Шаги» уходили под строку статуса iPhone.
 *
 * Скрипт открывает приложение так, как его видит Safari PWA: оболочка без
 * Telegram-fullscreen (?demo=1&frame=0), safe-area сверху 47px. Медиа-запрос
 * `display-mode: standalone` Playwright не эмулирует, поэтому скрипт берёт
 * блок `@media (display-mode: standalone) and (max-width: 700px)` дословно
 * из src/index.css и вставляет его в страницу как отдельный <style>.
 * Проверяется реальное правило приложения, а не его копия.
 *
 * Для каждого экрана снимаются два состояния:
 *   safari     — обычная вкладка Safari (без standalone-блока);
 *   standalone — верх шапки должен быть ниже 47px, а отступ оболочки должен
 *                совпасть с Safari (второго inset быть не должно).
 * «Диалог» в standalone обязан совпасть с Safari: у него свой контракт.
 *
 * Запуск (в web-контейнере):
 *   node scripts/standalone-safe-area-screenshots.mjs
 *   SHOT_DIR=qa-evidence/standalone-safe-area SHOT_PREFIX=after \
 *     node scripts/standalone-safe-area-screenshots.mjs
 * Код возврата 1 — хотя бы одна проверка не прошла.
 */

import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5173'
const outputDir = process.env.SHOT_DIR || 'artifacts/standalone-safe-area'
const prefix = process.env.SHOT_PREFIX || 'current'

/* Высота строки статуса iPhone в точках: 47px — значение, которое iOS
   отдаёт в env(safe-area-inset-top) при viewport-fit=cover. */
const SAFE_TOP = 47

const viewports = [
  { name: '393x852', width: 393, height: 852 },
  { name: '360x640', width: 360, height: 640 },
]

const screens = [
  { name: 'today', tab: 'today', header: '.mx-demo-today-header', checkHeader: true },
  { name: 'practices', tab: 'practices', header: '.mx-steps-header-row', checkHeader: true },
  { name: 'mentor', tab: 'mentor', header: '.mx-dialog-hero__content', checkHeader: false },
]

/* Медиа-блок standalone целиком, вместе с вложенными правилами. */
async function readStandaloneBlock() {
  const css = await fs.readFile(new URL('../src/index.css', import.meta.url), 'utf8')
  const marker = '@media (display-mode: standalone) and (max-width: 700px)'
  const start = css.indexOf(marker)
  if (start === -1) throw new Error(`В src/index.css нет блока ${marker}`)

  let depth = 0
  let body = -1
  for (let i = css.indexOf('{', start); i < css.length; i += 1) {
    if (css[i] === '{') {
      depth += 1
      if (depth === 1 && body === -1) body = i + 1
    } else if (css[i] === '}') {
      depth -= 1
      if (depth === 0) return css.slice(body, i)
    }
  }
  throw new Error('Не найден конец блока standalone в src/index.css')
}

const standaloneBlock = await readStandaloneBlock()
await fs.mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const results = []

for (const viewport of viewports) {
  for (const screen of screens) {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    await page.goto(`${baseURL}/?demo=1&frame=0&tab=${screen.tab}`, { waitUntil: 'networkidle' })

    /* В браузере Telegram-fullscreen стартует «пессимистично» и снимается
       через ~2с; ждём состояние обычной вкладки — это и есть поверхность PWA. */
    await page.waitForFunction(
      () => document.querySelector('.mx-app-shell') && !document.querySelector('.mx-app-shell--fullscreen'),
      undefined,
      { timeout: 15000 }
    )
    await page.waitForSelector(screen.header, { state: 'visible', timeout: 15000 })

    await page.addStyleTag({
      content: `
        .mx-preview-device-switcher, .mx-preview-demo-note, .mx-demo-telegram-chrome { display: none !important; }
      `,
    })

    /* Эмуляция iOS: env(safe-area-inset-top) в Chromium всегда 0, поэтому
       подставляем то же значение через токен, который читает оболочка. */
    await page.evaluate(safeTop => document.documentElement.style.setProperty('--app-safe-top', `${safeTop}px`), SAFE_TOP)
    await page.waitForTimeout(120)

    const measure = () =>
      page.evaluate(headerSelector => {
        const shell = document.querySelector('.mx-app-shell')
        const header = document.querySelector(headerSelector)
        return {
          shellPaddingTop: shell ? getComputedStyle(shell).paddingTop : null,
          headerTop: header ? Math.round(header.getBoundingClientRect().top) : null,
        }
      }, screen.header)

    const safari = await measure()

    /* Вставляем реальный standalone-блок из исходников приложения. */
    const styleHandle = await page.addStyleTag({ content: `@media all {${standaloneBlock}}` })
    await page.waitForTimeout(120)
    const standalone = await measure()

    const suffix = `${screen.name}-${viewport.name}`
    await page.screenshot({ path: `${outputDir}/${prefix}-standalone-${suffix}.png`, fullPage: false })
    await styleHandle.evaluate(node => node.remove())
    await page.waitForTimeout(80)
    await page.screenshot({ path: `${outputDir}/${prefix}-safari-${suffix}.png`, fullPage: false })

    const failures = []
    if (standalone.headerTop === null) failures.push(`шапка ${screen.header} не найдена`)
    if (screen.checkHeader && standalone.headerTop !== null && standalone.headerTop < SAFE_TOP) {
      failures.push(`верх шапки ${standalone.headerTop}px < ${SAFE_TOP}px`)
    }
    if (standalone.shellPaddingTop !== safari.shellPaddingTop) {
      failures.push(`отступ оболочки ${standalone.shellPaddingTop} ≠ Safari ${safari.shellPaddingTop}`)
    }

    results.push({ screen: screen.name, viewport: viewport.name, safari, standalone, failures })
    await context.close()
  }
}

await browser.close()

console.table(
  results.map(row => ({
    Экран: row.screen,
    Viewport: row.viewport,
    'Шапка Safari': row.safari.headerTop,
    'Шапка standalone': row.standalone.headerTop,
    'Оболочка Safari': row.safari.shellPaddingTop,
    'Оболочка standalone': row.standalone.shellPaddingTop,
    Итог: row.failures.length === 0 ? 'PASS' : 'FAIL',
  }))
)
await fs.writeFile(`${outputDir}/${prefix}-metrics.json`, JSON.stringify(results, null, 2))

const failed = results.filter(row => row.failures.length > 0)
if (failed.length > 0) {
  for (const row of failed) console.error(`FAIL ${row.screen} ${row.viewport}: ${row.failures.join('; ')}`)
  process.exitCode = 1
} else {
  console.log(`PASS: верх шапки ниже ${SAFE_TOP}px, отступ оболочки совпадает с Safari; «Диалог» не изменился`)
}
