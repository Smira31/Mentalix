import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.MXL_PROGRESS_BASE_URL || 'http://127.0.0.1:5173'
const OUTPUT_DIR = path.resolve('artifacts/mxl-progress-production')
const PROGRESS_LAYOUT_V2_ENABLED = process.env.VITE_PROGRESS_LAYOUT_V2 === 'true'
const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568 },
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
]
const USER = { id: 900001, first_name: 'UX', username: 'progress_check' }
const CHECKINS = Array.from({ length: 40 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 7, 2 + index)).toISOString().slice(0, 10)
  return {
    date,
    mood: [3, 4, 3, 5, 4][index % 5],
    energy: [2, 4, 3, 4, 4][index % 5],
    anxiety: 2,
    focus: [2, 3, 3, 4, 4][index % 5],
    emotion: ['спокойствие', 'интерес', 'усталость', 'напряжение', 'радость'][index % 5],
    review_completed_at: index % 2 === 0 ? `${date}T20:00:00Z` : null,
  }
})

function response(body, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) }
}

function periodCheckins(days) {
  return days === 90 ? CHECKINS : CHECKINS.slice(-days)
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
        sourceDates: periodCheckins(days).slice(0, 8).map(item => item.date),
        caveat: 'Это описание доступных данных, а не доказательство причины.',
      },
      {
        text: 'Во второй половине периода настроение стало немного устойчивее.',
        sampleSize: periodCheckins(days).length,
        sourceDates: periodCheckins(days).map(item => item.date),
        caveat: 'Наблюдение зависит от полноты сохранённых check-in.',
      },
    ],
    insights: [],
    daily_activity: periodCheckins(days).map((item, index) => ({
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
    let analyticsRequests = 0
    await context.route('**/api/**', route => {
      const request = route.request()
      const url = new URL(request.url())
      if (url.pathname === '/api/profile') return route.fulfill(response(USER))
      if (url.pathname === '/api/profile/settings') {
        return route.fulfill(response({ review_hour: 24, insights_enabled: true }))
      }
      if (url.pathname === '/api/analytics') {
        analyticsRequests += 1
        return route.fulfill(response(analyticsFixture(Number(url.searchParams.get('days')) || 14)))
      }
      if (url.pathname === '/api/checkin/history') {
        return route.fulfill(response(periodCheckins(Number(url.searchParams.get('days')) || 14)))
      }
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
      const screen = document.querySelector('.mx-progress-redesign--live')
      const rail = document.querySelector('.mx-progress-redesign__rail')
      const cards = [...document.querySelectorAll('.mx-progress-redesign__observation')]
      const screenRect = screen?.getBoundingClientRect()
      const railRect = rail?.getBoundingClientRect()
      const fontSize = selector => {
        const element = document.querySelector(selector)
        return element ? Number.parseFloat(getComputedStyle(element).fontSize) : 0
      }
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        railScrollable: rail ? rail.scrollWidth > rail.clientWidth : false,
        screenLeft: screenRect?.left ?? -1,
        screenRight: screenRect?.right ?? window.innerWidth + 1,
        railRight: railRect?.right ?? window.innerWidth + 1,
        secondCardLeft: cards[1]?.getBoundingClientRect().left ?? 0,
        periods: document.querySelectorAll('.mx-progress-redesign__periods button').length,
        layoutV2: Boolean(document.querySelector('.mx-progress-layout-v2')),
        activities: document.querySelectorAll('.mx-progress-redesign__activities article').length,
        observationBodySize: fontSize('.mx-progress-redesign__observation p'),
        calendarNoteSize: fontSize('.mx-progress-redesign__calendar-card > p'),
        emotionRowSize: fontSize('.mx-progress-redesign__emotion-list > div'),
        activityLabelSize: fontSize('.mx-progress-redesign__activities article > span'),
        activityDetailSize: fontSize('.mx-progress-redesign__activities details'),
      }
    })
    if (geometry.documentWidth > geometry.viewportWidth + 1) {
      throw new Error(`${viewport.name}: горизонтальный overflow страницы`)
    }
    if (!geometry.railScrollable || geometry.secondCardLeft >= geometry.railRight) {
      throw new Error(`${viewport.name}: rail не показывает край следующей карточки`)
    }
    if (
      geometry.screenLeft < -1 ||
      geometry.screenRight > geometry.viewportWidth + 1 ||
      geometry.railRight > geometry.screenRight + 1
    ) {
      throw new Error(`${viewport.name}: production-контент выходит за границу viewport`)
    }
    if (
      (PROGRESS_LAYOUT_V2_ENABLED && (!geometry.layoutV2 || geometry.periods !== 0)) ||
      (!PROGRESS_LAYOUT_V2_ENABLED && geometry.periods !== 4) ||
      geometry.activities !== 4
    ) {
      throw new Error(`${viewport.name}: неполная production-композиция`)
    }
    const smallTextSizes = [
      geometry.observationBodySize,
      geometry.calendarNoteSize,
      geometry.emotionRowSize,
      geometry.activityLabelSize,
      geometry.activityDetailSize,
    ]
    if (smallTextSizes.some(size => size < 12)) {
      throw new Error(`${viewport.name}: текст внутри карточек меньше 12px`)
    }

    if (PROGRESS_LAYOUT_V2_ENABLED) {
      await page.getByRole('button', { name: /14 дней/ }).click()
      await page.getByRole('menuitemradio', { name: '30 дней' }).click()
      await page.getByRole('button', { name: /30 дней/ }).click()
      await page.getByRole('menuitemradio', { name: '90 дней' }).click()
      await page.getByText('Среднее настроение · 90 дней').waitFor()
      const requestsAfter90 = analyticsRequests
      const dataContract = await page.evaluate(() => ({
        chartPoints: document.querySelectorAll('.mx-progress-redesign__chart circle').length,
        average: document.querySelector('.mx-progress-redesign__hero-copy strong')?.textContent,
        observationEvidence: document.querySelectorAll(
          '.mx-progress-redesign__observation details'
        ).length,
        observationBases: [...document.querySelectorAll('.mx-progress-redesign__observation p')]
          .map(node => node.textContent)
          .filter(text => text.startsWith('Основа:')).length,
        emotionTotal: document.querySelector('.mx-progress-redesign__emotion-ring span')?.textContent,
        emotionRows: document.querySelectorAll('.mx-progress-redesign__emotion-list > div').length,
      }))
      if (dataContract.chartPoints !== 40 || dataContract.average !== '3.8') {
        throw new Error(`${viewport.name}: 90 дней не используют все 40 точек или среднее 3.8`)
      }
      if (dataContract.observationEvidence !== 2 || dataContract.observationBases !== 2) {
        throw new Error(`${viewport.name}: evidence не показан у всех V2 observations`)
      }
      if (dataContract.emotionTotal !== '40' || dataContract.emotionRows > 4) {
        throw new Error(`${viewport.name}: V2 total эмоций или top-4 рассчитан неверно`)
      }
      if (viewport.name === '390x844') {
        await page.screenshot({
          path: path.join(OUTPUT_DIR, 'scope-b-390x844-90-days.png'),
          fullPage: true,
        })
        await page.locator('.mx-progress-redesign__rail details').nth(1).click()
        await page.screenshot({
          path: path.join(OUTPUT_DIR, 'scope-b-390x844-observation-evidence.png'),
          fullPage: true,
        })
      }
      for (let index = 0; index < 4; index += 1) {
        const previousMonth = page.getByRole('button', { name: 'Предыдущий месяц' })
        if (await previousMonth.isDisabled()) break
        await previousMonth.click()
      }
      if (analyticsRequests !== requestsAfter90) {
        throw new Error(`${viewport.name}: переход между месяцами вызвал API-запрос`)
      }
      if (!(await page.getByRole('button', { name: 'Предыдущий месяц' }).isDisabled())) {
        throw new Error(`${viewport.name}: календарь разрешил месяц до начала 90-дневного периода`)
      }
      if (viewport.name === '390x844') {
        await page.screenshot({
          path: path.join(OUTPUT_DIR, 'scope-b-390x844-calendar-first-month.png'),
          fullPage: true,
        })
      }
      const requestsBeforeDisabledClick = analyticsRequests
      await page.evaluate(() => document.querySelector('button[aria-label="Предыдущий месяц"]')?.click())
      if (analyticsRequests !== requestsBeforeDisabledClick) {
        throw new Error(`${viewport.name}: disabled-стрелка вызвала API-запрос`)
      }
      for (let index = 0; index < 4; index += 1) {
        const nextMonth = page.getByRole('button', { name: 'Следующий месяц' })
        if (await nextMonth.isDisabled()) break
        await nextMonth.click()
      }
      if (!(await page.getByRole('button', { name: 'Следующий месяц' }).isDisabled())) {
        throw new Error(`${viewport.name}: календарь разрешил будущий месяц`)
      }
      if (viewport.name === '390x844') {
        await page.screenshot({
          path: path.join(OUTPUT_DIR, 'scope-b-390x844-calendar-current-month.png'),
          fullPage: true,
        })
      }
      await page.getByRole('button', { name: /90 дней/ }).click()
      await page.getByRole('menuitemradio', { name: '7 дней' }).click()
      if (!(await page.getByRole('button', { name: 'Предыдущий месяц' }).isDisabled())) {
        throw new Error(`${viewport.name}: monthCursor не ограничен после смены периода`)
      }
      await page.getByRole('button', { name: /7 дней/ }).click()
      await page.getByRole('menuitemradio', { name: '30 дней' }).click()
    } else {
      const legacyContract = await page.evaluate(() => ({
        periods: document.querySelectorAll('.mx-progress-redesign__periods button').length,
        secondaryDetails: document.querySelectorAll(
          '.mx-progress-redesign__observation:not([data-primary-observation="true"]) details'
        ).length,
        emotionTotal: document.querySelector('.mx-progress-redesign__emotion-ring span')?.textContent,
      }))
      if (
        legacyContract.periods !== 4 ||
        legacyContract.secondaryDetails !== 0 ||
        legacyContract.emotionTotal !== '12' ||
        (await page.getByRole('button', { name: 'Предыдущий месяц' }).isDisabled())
      ) {
        throw new Error(`${viewport.name}: legacy-граница Scope B нарушена`)
      }
      const requestsBeforeLegacyPeriod = analyticsRequests
      await page.getByRole('button', { name: '30 дней' }).click()
      await page.getByText('Среднее настроение · 30 дней').waitFor()
      if (analyticsRequests !== requestsBeforeLegacyPeriod + 1) {
        throw new Error(`${viewport.name}: выбор legacy периода не вызвал ожидаемый API-запрос`)
      }
    }
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
