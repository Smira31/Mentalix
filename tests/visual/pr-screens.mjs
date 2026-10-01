/**
 * PR-скриншоты ключевых экранов Mentalix.
 *
 * Снимает экраны на двух размерах (393×852 и 440×956) в Telegram-режиме
 * демо (?demo=1). Скриншоты складываются в artifacts/pr-screenshots/.
 *
 * Запуск:
 *   node tests/visual/pr-screens.mjs
 *
 * В CI собирается в один лист и публикуется артефактом + комментарием в PR.
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '../../artifacts/pr-screenshots')
const BASE_URL = process.env.PR_SCREENSHOTS_BASE_URL || 'http://127.0.0.1:5173'

const DEVICES = [
  { name: '393', width: 393, height: 852 },
  { name: '440', width: 440, height: 956 },
]

const SCREENS = [
  { id: 'today', label: 'Сегодня', url: '/?demo=1&tab=today' },
  { id: 'daily-thought', label: 'Мысль дня', url: '/?demo=1&tab=today', tap: 'today-quote-card' },
  { id: 'my-thoughts', label: 'Мои мысли', url: '/?demo=1&tab=today', tap: 'today-thoughts' },
  {
    id: 'rituals-list',
    label: 'Ритуалы список',
    url: '/?demo=1&tab=practices&action=rituals_list',
  },
  {
    id: 'ritual-detail',
    label: 'Ритуал практика',
    url: '/?demo=1&tab=practices&action=ritual_detail',
  },
  {
    id: 'ritual-own',
    label: 'Свой ритуал',
    url: '/?demo=1&tab=practices&action=rituals_list',
    tap: 'practice-new-pill',
    tap2: 'practice-own-pill',
  },
  { id: 'profile', label: 'Профиль', url: '/?demo=1&tab=profile' },
  { id: 'progress', label: 'Прогресс', url: '/?demo=1&tab=progress' },
  { id: 'library', label: 'Библиотека', url: '/?demo=1&tab=library' },
  {
    id: 'hero-map',
    label: 'Путь героя карта',
    url: '/?demo=1&tab=progress',
    tap: 'progress-hero-journey',
  },
  {
    id: 'hero-step',
    label: 'Путь героя шаг',
    url: '/?demo=1&tab=progress',
    tap: 'progress-hero-journey',
    tap2: 'hero-step-0',
  },
]

async function run() {
  await mkdir(OUT_DIR, { recursive: true })

  const browser = await chromium.launch()
  const results = []

  for (const device of DEVICES) {
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      deviceScaleFactor: 3,
      colorScheme: 'dark',
      reducedMotion: 'reduce',
    })

    // localStorage: онбординг пройден, блокировка выкл.
    await context.addInitScript(() => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem('mx-onboarded-v2', '1')
      localStorage.setItem('mx-app-lock-enabled', '0')
    })

    for (const screen of SCREENS) {
      const page = await context.newPage()
      try {
        await page.goto(`${BASE_URL}${screen.url}`, { waitUntil: 'networkidle', timeout: 30_000 })
        await page.waitForTimeout(800)

        if (screen.tap) {
          const el = page.getByTestId(screen.tap)
          await el.waitFor({ state: 'visible', timeout: 10_000 })
          await el.click()
          await page.waitForTimeout(800)
        }

        if (screen.tap2) {
          const el2 = page.getByTestId(screen.tap2)
          await el2.waitFor({ state: 'visible', timeout: 10_000 })
          await el2.click()
          await page.waitForTimeout(800)
        }

        const filename = `${screen.id}-${device.name}.png`
        await page.screenshot({
          path: resolve(OUT_DIR, filename),
          fullPage: false,
        })
        results.push({ ...screen, device: device.name, filename })
      } catch (err) {
        console.error(`  ✗ ${screen.label} (${device.name}): ${err.message}`)
        results.push({ ...screen, device: device.name, error: err.message })
      } finally {
        await page.close()
      }
    }

    await context.close()
  }

  await browser.close()

  // Markdown-лист скриншотов
  const md = [
    '# PR-скриншоты',
    '',
    `Снято: ${new Date().toISOString()}`,
    '',
    '| Экран | 393×852 | 440×956 |',
    '|-------|---------|---------|',
  ]

  for (const screen of SCREENS) {
    const d393 = results.find(r => r.id === screen.id && r.device === '393')
    const d440 = results.find(r => r.id === screen.id && r.device === '440')
    const cell393 = d393?.error ? '✗ ошибка' : `![${screen.label}](./${d393?.filename})`
    const cell440 = d440?.error ? '✗ ошибка' : `![${screen.label}](./${d440?.filename})`
    md.push(`| ${screen.label} | ${cell393} | ${cell440} |`)
  }

  const { writeFile } = await import('node:fs/promises')
  await writeFile(resolve(OUT_DIR, 'README.md'), md.join('\n') + '\n')

  console.log(`\n✓ ${results.filter(r => !r.error).length} скриншотов в ${OUT_DIR}`)
  console.log(`✓ Markdown-лист: ${resolve(OUT_DIR, 'README.md')}`)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
