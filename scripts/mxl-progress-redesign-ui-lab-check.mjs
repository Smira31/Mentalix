import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.MXL_PROGRESS_BASE_URL || 'http://127.0.0.1:5173'
const OUTPUT_DIR = path.resolve('artifacts/mxl-progress-redesign-ui-lab')
const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568 },
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
]

await mkdir(OUTPUT_DIR, { recursive: true })
const browser = await chromium.launch({ headless: true })

try {
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      colorScheme: 'dark',
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))

    await page.goto(`${BASE_URL}/?ui_lab=progress-redesign`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: 'Полный редизайн «Прогресса»' }).waitFor()
    await page.getByRole('heading', { name: 'прогресс.' }).waitFor()

    const geometry = await page.evaluate(() => {
      const device = document.querySelector('.mx-progress-redesign__device')
      const rail = document.querySelector('.mx-progress-redesign__rail')
      const cards = [...document.querySelectorAll('.mx-progress-redesign__observation')]
      return {
        viewportWidth: window.innerWidth,
        bodyWidth: document.body.scrollWidth,
        deviceWidth: device?.getBoundingClientRect().width ?? 0,
        railScrollable: rail ? rail.scrollWidth > rail.clientWidth : false,
        railRight: rail?.getBoundingClientRect().right ?? 0,
        secondCardLeft: cards[1]?.getBoundingClientRect().left ?? 0,
        periods: document.querySelectorAll('.mx-progress-redesign__periods button').length,
        calendarDots: document.querySelectorAll('.mx-progress-redesign__calendar i').length,
        activities: document.querySelectorAll('.mx-progress-redesign__activities article').length,
      }
    })

    if (geometry.bodyWidth > geometry.viewportWidth + 1) {
      throw new Error(`${viewport.name}: горизонтальный overflow страницы`)
    }
    if (geometry.deviceWidth > geometry.viewportWidth + 1) {
      throw new Error(`${viewport.name}: макет устройства шире viewport`)
    }
    if (!geometry.railScrollable || geometry.secondCardLeft >= geometry.railRight) {
      throw new Error(`${viewport.name}: rail не показывает край следующей карточки`)
    }
    if (geometry.periods !== 4 || geometry.calendarDots !== 35 || geometry.activities !== 4) {
      throw new Error(`${viewport.name}: неполная композиция Progress`)
    }

    if (viewport.name === '390x844') {
      for (const label of ['Мало данных', 'Пусто', 'Загрузка', 'Ошибка', 'Есть данные']) {
        await page.getByRole('button', { name: label, exact: true }).click()
      }
      await page.locator('.mx-progress-redesign__rail').evaluate(element => {
        element.scrollLeft = element.scrollWidth
      })
    }

    await page.screenshot({
      path: path.join(OUTPUT_DIR, `${viewport.name}.png`),
      fullPage: true,
    })

    if (errors.length > 0) throw new Error(`${viewport.name}: ${errors.join('; ')}`)
    await context.close()
    console.log(`${viewport.name}: PASS`)
  }
} finally {
  await browser.close()
}
