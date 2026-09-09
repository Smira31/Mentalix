import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.MXL_526_BASE_URL || 'http://127.0.0.1:5175'
const OUTPUT_DIR = path.resolve('artifacts/mxl-526-library-production')
const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568 },
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
]

const user = { id: 900001, first_name: 'Проверка', username: 'library_check' }
const articles = [
  {
    id: 1,
    title: 'Как начать с одного шага',
    excerpt: 'Короткий материал о спокойном начале без лишнего давления.',
    tag: 'Фокус',
    minutes: 4,
    date: '2026-09-09',
    body: 'Начни с действия, которое помещается в сегодняшний день.\n\nПосле него станет понятнее, что делать дальше.',
  },
  {
    id: 2,
    title: 'Вернуть внимание к себе',
    excerpt: 'Несколько ориентиров для момента, когда мыслей стало слишком много.',
    tag: 'Внимание',
    minutes: 5,
    date: '2026-09-08',
    body: 'Остановись и назови то, что сейчас происходит.\n\nНе нужно сразу искать решение.',
  },
  {
    id: 3,
    title: 'Один вопрос перед сном',
    excerpt: 'Мягкий способ завершить день и оставить лишнее в прошлом.',
    tag: 'Рефлексия',
    minutes: 3,
    date: '2026-09-07',
    body: 'Что сегодня было действительно важным?',
  },
]

function json(body, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) }
}

async function expectVisible(page, selector, message) {
  const element = page.locator(selector).first()
  await element.waitFor({ state: 'visible', timeout: 8_000 })
  if (!(await element.isVisible())) throw new Error(message)
  return element
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
    const page = await context.newPage()
    const runtimeErrors = []
    page.on('pageerror', error => runtimeErrors.push(error.message))

    await page.addInitScript(currentUser => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem('mentalix_web_user', JSON.stringify(currentUser))
      localStorage.setItem('mx-onboarded-v2', '1')
      localStorage.setItem('mx-app-lock-enabled', '0')
    }, user)

    await context.route('**/api/**', route => {
      const url = new URL(route.request().url())
      if (url.pathname === '/api/profile') return route.fulfill(json(user))
      if (url.pathname === '/api/articles') return route.fulfill(json(articles))
      if (url.pathname === '/api/profile/settings') return route.fulfill(json({ review_hour: 24 }))
      if (url.pathname === '/api/mentalix/consent') {
        return route.fulfill(json({ context_consent: false }))
      }
      return route.fulfill(json([]))
    })

    await page.goto(`${BASE_URL}/?tab=library`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: 'библиотека.' }).waitFor()
    await expectVisible(page, '.mx-library-catalog__feature-card', 'Нет карточки статьи')

    const geometry = await page.evaluate(() => {
      const rail = document.querySelector('.mx-library-catalog__rail')
      const cards = [...document.querySelectorAll('.mx-library-catalog__feature-card')]
      return {
        bodyWidth: document.body.scrollWidth,
        viewportWidth: window.innerWidth,
        scrollable: rail ? rail.scrollWidth > rail.clientWidth : false,
        cards: cards.length,
        thirdLeft: cards[2]?.getBoundingClientRect().left ?? 0,
        railRight: rail?.getBoundingClientRect().right ?? 0,
      }
    })

    if (geometry.bodyWidth > geometry.viewportWidth + 1)
      throw new Error('Горизонтальный overflow страницы')
    if (!geometry.scrollable || geometry.cards !== 3)
      throw new Error('Rail не содержит три карточки')

    await page.screenshot({
      path: path.join(OUTPUT_DIR, `${viewport.name}-library.png`),
      fullPage: false,
    })

    if (viewport.name === '390x844') {
      await page.locator('.mx-library-catalog__rail').evaluate(element => {
        element.scrollLeft = element.scrollWidth
      })
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `${viewport.name}-library-scrolled.png`),
        fullPage: false,
      })

      await page.getByRole('button', { name: /Как начать с одного шага/ }).click()
      await page.getByRole('heading', { name: 'Как начать с одного шага' }).waitFor()
      await page.getByRole('button', { name: 'Назад' }).click()
      await page.getByRole('heading', { name: 'библиотека.' }).waitFor()

      await page.getByRole('button', { name: 'Открыть Статьи' }).click()
      await page.getByRole('heading', { name: 'Статьи.' }).waitFor()
      await page.getByRole('button', { name: 'Вернуться в библиотеку' }).click()

      await page.getByRole('button', { name: 'Открыть Направленные записи' }).click()
      await page.getByRole('heading', { name: 'Направленные записи' }).waitFor()
      await page.getByRole('button', { name: 'Вернуться в библиотеку' }).click()

      await page.getByRole('button', { name: 'Открыть поиск' }).click()
      await page.getByLabel('Найти материал').fill('несуществующий запрос')
      await page.getByText('Ничего не найдено', { exact: true }).waitFor()
    }

    if (runtimeErrors.length > 0) throw new Error(`Runtime errors: ${runtimeErrors.join('; ')}`)
    await context.close()
    console.log(`${viewport.name}: PASS`)
  }
} finally {
  await browser.close()
}
