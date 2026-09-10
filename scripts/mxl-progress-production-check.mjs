import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.MXL_PROGRESS_BASE_URL || 'http://127.0.0.1:5173'
const OUTPUT_DIR = path.resolve('artifacts/mxl-progress-production')
const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568 },
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
]
const USER = { id: 900001, first_name: 'UX', username: 'progress_check' }
const CHECKINS = Array.from({ length: 10 }, (_, index) => ({
  date: `2026-09-${String(index + 1).padStart(2, '0')}`,
  mood: [3, 4, 3, 5, 4, 4, 5, 4, 3, 4][index],
  energy: [2, 4, 3, 4, 4, 3, 5, 4, 3, 4][index],
  anxiety: 2,
  focus: [2, 3, 3, 4, 4, 3, 5, 4, 3, 4][index],
  emotion: ['спокойствие', 'интерес', 'усталость'][index % 3],
  review_completed_at:
    index % 2 === 0 ? `2026-09-${String(index + 1).padStart(2, '0')}T20:00:00Z` : null,
}))

function response(body, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) }
}

function analyticsFixture(days) {
  return {
    period_days: days,
    rituals: [
      { id: 1, name: 'Утренняя прогулка', completion_rate: 80 },
      { id: 2, name: 'Стакан воды', completion_rate: 70 },
    ],
    ascezas: [
      {
        id: 3,
        name: 'Без телефона после полуночи',
        clean_rate: 76,
        held_days: 8,
        breaks: 2,
        streak: 3,
      },
    ],
    observations: [
      {
        text: 'В дни с утренней прогулкой энергия в этой выборке отмечалась выше.',
        sampleSize: 8,
        sourceDates: CHECKINS.slice(0, 8).map(item => item.date),
        caveat: 'Это описание доступных данных, а не доказательство причины.',
      },
      {
        text: 'Во второй половине периода настроение стало немного устойчивее.',
        sampleSize: 10,
        sourceDates: CHECKINS.map(item => item.date),
        caveat: 'Наблюдение зависит от полноты сохранённых check-in.',
      },
    ],
    insights: [],
    daily_activity: CHECKINS.map((item, index) => ({
      date: item.date,
      count: index % 3 === 0 ? 2 : 1,
      breaks: index === 6 ? 1 : 0,
      held_ascezas: 1,
    })),
  }
}

await mkdir(OUTPUT_DIR, { recursive: true })
const browser = await chromium.launch({ headless: true })

try {
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      colorScheme: 'dark',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    })
    await context.addInitScript(user => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem('mentalix_web_user', JSON.stringify(user))
      localStorage.setItem('mx-onboarded-v2', '1')
      localStorage.setItem('mx-app-lock-enabled', '0')
    }, USER)
    await context.route('**/api/**', route => {
      const request = route.request()
      const url = new URL(request.url())
      if (url.pathname === '/api/profile') return route.fulfill(response(USER))
      if (url.pathname === '/api/profile/settings') {
        return route.fulfill(response({ review_hour: 24, insights_enabled: true }))
      }
      if (url.pathname === '/api/analytics') {
        return route.fulfill(response(analyticsFixture(Number(url.searchParams.get('days')) || 14)))
      }
      if (url.pathname === '/api/checkin/history') return route.fulfill(response(CHECKINS))
      return route.fulfill(response([]))
    })

    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${BASE_URL}/?tab=trends`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: 'прогресс.' }).waitFor()
    await page.getByText('Что повторяется').waitFor()
    await page.getByText('Календарь').waitFor()
    await page.getByText('Эмоции').waitFor()
    await page.getByText('Активности').waitFor()

    const geometry = await page.evaluate(() => {
      const rail = document.querySelector('.mx-progress-redesign__rail')
      const cards = [...document.querySelectorAll('.mx-progress-redesign__observation')]
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        railScrollable: rail ? rail.scrollWidth > rail.clientWidth : false,
        railRight: rail?.getBoundingClientRect().right ?? 0,
        secondCardLeft: cards[1]?.getBoundingClientRect().left ?? 0,
        periods: document.querySelectorAll('.mx-progress-redesign__periods button').length,
        activities: document.querySelectorAll('.mx-progress-redesign__activities article').length,
      }
    })
    if (geometry.documentWidth > geometry.viewportWidth + 1) {
      throw new Error(`${viewport.name}: горизонтальный overflow страницы`)
    }
    if (!geometry.railScrollable || geometry.secondCardLeft >= geometry.railRight) {
      throw new Error(`${viewport.name}: rail не показывает край следующей карточки`)
    }
    if (geometry.periods !== 4 || geometry.activities !== 4) {
      throw new Error(`${viewport.name}: неполная production-композиция`)
    }

    await page.getByRole('button', { name: '30 дней' }).click()
    await page.getByText('Среднее настроение · 30 дней').waitFor()
    await page.getByText('Показать ритуалы').click()
    await page.getByText('Утренняя прогулка').waitFor()
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${viewport.name}.png`), fullPage: true })

    if (errors.length > 0) throw new Error(`${viewport.name}: ${errors.join('; ')}`)
    await context.close()
    console.log(`${viewport.name}: PASS`)
  }
} finally {
  await browser.close()
}
