import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

/*
 * MXL-246 — Journal (JournalFlow из «Практик» и Theme journal из ThemeScreen)
 * должен оставаться устойчивым на tablet и desktop ширинах, не только на
 * мобильных Telegram/iPhone viewport. Оба экрана делят один и тот же
 * keyboard-safe action group (JournalTextarea floatingToolbar), который на
 * узких экранах закреплён к низу viewport — это и есть mobile thumb-zone
 * дизайн. На md+ (768px) он должен встраиваться в поток контента рядом с
 * редактором, а не оставаться "подвешенным" в углу широкого экрана.
 */

const EVIDENCE_ROOT = path.resolve('qa-evidence/mxl-246')

const MOBILE_VIEWPORT = { name: '390x844', width: 390, height: 844 }
const WIDE_VIEWPORTS = [
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
]

const TEST_USER = {
  id: 900246,
  first_name: 'Responsive QA',
  username: 'mxl246_fixture',
}

const THEMES = [
  { id: 701, title: 'о меньшем усилии', subtitle: 'Семь коротких наблюдений.', total_days: 7, reflected_days: 1 },
]
const THEME = {
  id: 701,
  title: 'о меньшем усилии',
  subtitle: 'Семь коротких наблюдений о том, что действительно двигает.',
  current_day: 2,
  free_days: 7,
  days: [
    {
      day: 1,
      text: 'Бывало так, что ты переставал давить — и дело вдруг шло легче?',
      prompt: 'Что тогда произошло на самом деле?',
      reflection: 'Я сделал один спокойный шаг.',
      locked: false,
    },
    {
      day: 2,
      text: 'Усилие и напряжение — разные вещи. Первое двигает, второе только изматывает.',
      prompt: 'Где сегодня ты напрягался вместо того, чтобы делать?',
      reflection: '',
      locked: false,
    },
    ...Array.from({ length: 5 }, (_, index) => ({
      day: index + 3,
      text: 'Следующий вопрос недели.',
      prompt: 'Что замечаешь?',
      reflection: '',
      locked: false,
    })),
  ],
}

function jsonResponse(body, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) }
}

async function handleRoute(route) {
  const request = route.request()
  const { pathname } = new URL(request.url())

  if (request.method() !== 'GET') return route.fulfill(jsonResponse({ ok: true }))

  if (pathname === '/api/profile') return route.fulfill(jsonResponse(TEST_USER))
  if (pathname === '/api/checkin/today') return route.fulfill(jsonResponse(null))
  if (pathname === '/api/checkin/history') return route.fulfill(jsonResponse([]))
  if (pathname === '/api/rituals') return route.fulfill(jsonResponse([]))
  if (pathname === '/api/ascezas') return route.fulfill(jsonResponse([]))
  if (pathname === '/api/quotes/today') return route.fulfill(jsonResponse({ text: 'Fixture quote.' }))
  if (pathname === '/api/profile/settings') return route.fulfill(jsonResponse({ review_hour: 24 }))
  if (pathname === '/api/analytics/pulse') return route.fulfill(jsonResponse({ active_today: 1 }))
  if (pathname === '/api/analytics') {
    return route.fulfill(
      jsonResponse({ period_days: 14, rituals: [], ascezas: [], insights: [], daily_activity: [] })
    )
  }
  if (pathname === '/api/articles') return route.fulfill(jsonResponse([]))
  if (pathname === '/api/themes') return route.fulfill(jsonResponse(THEMES))
  if (pathname === '/api/themes/701') return route.fulfill(jsonResponse(THEME))

  return route.fulfill(jsonResponse({}))
}

async function seedUser(context) {
  await context.addInitScript(user => {
    localStorage.setItem('mentalix_web_user', JSON.stringify(user))
    localStorage.setItem('mx-onboarded-v2', '1')
    localStorage.setItem('mx-app-lock-enabled', '0')
  }, TEST_USER)
}

async function newFixturePage(browser, baseURL, viewport) {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })
  await seedUser(context)
  await context.route('**/api/**', handleRoute)
  const page = await context.newPage()
  return { context, page }
}

async function assertNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  )
  expect(overflow).toBe(false)
}

async function screenshot(page, viewport, slug) {
  const dir = path.join(EVIDENCE_ROOT, viewport.name)
  await mkdir(dir, { recursive: true })
  await page.screenshot({ path: path.join(dir, `${slug}.png`) })
}

test.describe('MXL-246 Journal responsive contract (tablet/desktop)', () => {
  for (const viewport of [MOBILE_VIEWPORT, ...WIDE_VIEWPORTS]) {
    const isWide = viewport.width >= 768

    test(`JournalFlow (Практики → Журнал) на ${viewport.name}`, async ({ browser, baseURL }) => {
      const { context, page } = await newFixturePage(browser, baseURL, viewport)

      await page.goto('/')
      await page.getByRole('button', { name: 'Практики' }).click()
      await page.getByRole('button', { name: 'Журнал' }).click()
      await expect(page.getByText('Разложи день на четыре спокойных шага')).toBeVisible()
      await assertNoHorizontalOverflow(page)
      await screenshot(page, viewport, '01-journal-intro')

      await page.getByRole('button', { name: 'Начать' }).click()
      const ideaEditor = page.getByRole('textbox', { name: 'Идея: Что сейчас занимает мои мысли?' })
      await expect(ideaEditor).toBeVisible()

      const fontSize = await ideaEditor.evaluate(element => parseFloat(getComputedStyle(element).fontSize))
      expect(fontSize).toBeGreaterThanOrEqual(16)

      const submitButton = page.getByRole('button', { name: 'Сохранить и продолжить' })
      const actionRowPosition = await submitButton.evaluate(
        element => getComputedStyle(element.closest('div')).position
      )
      expect(actionRowPosition).toBe(isWide ? 'static' : 'fixed')

      await ideaEditor.fill('Сегодня я замечаю главное')
      await assertNoHorizontalOverflow(page)
      await screenshot(page, viewport, '02-journal-writer')

      if (isWide) {
        const editorBox = await ideaEditor.boundingBox()
        const submitBox = await submitButton.boundingBox()
        // Кнопка сохранения должна оставаться в пределах читаемой колонки
        // редактора, а не "теряться" где-то ещё в широком viewport.
        expect(submitBox.x).toBeGreaterThanOrEqual(editorBox.x - 1)
        expect(submitBox.x + submitBox.width).toBeLessThanOrEqual(editorBox.x + editorBox.width + 1)
      }

      await submitButton.click()
      const journalSteps = [
        ['Действие: Что из этого зависит от меня сегодня?', 'Сделать один спокойный шаг'],
        ['Анализ: Что произошло и что я заметил?', 'Заметить, что изменилось'],
        ['Новый шаг: Что я возьму с собой дальше?', 'Продолжить завтра'],
      ]
      for (const [label, text] of journalSteps) {
        const editor = page.getByRole('textbox', { name: label })
        await expect(editor).toBeVisible()
        await editor.fill(text)
        await page
          .getByRole('button', {
            name: label.startsWith('Новый шаг') ? 'Сохранить и завершить' : 'Сохранить и продолжить',
          })
          .click()
      }

      await expect(page.getByText('Цикл сохранён')).toBeVisible()
      await assertNoHorizontalOverflow(page)
      await screenshot(page, viewport, '03-journal-complete')

      await context.close()
    })

    test(`Theme journal (день недели) на ${viewport.name}`, async ({ browser, baseURL }) => {
      const { context, page } = await newFixturePage(browser, baseURL, viewport)

      await page.goto('/')
      await page.getByRole('button', { name: /о меньшем усилии/ }).click()
      const dayEditor = page.getByRole('textbox', { name: 'Мысль по теме недели' })
      await expect(dayEditor).toBeVisible()
      await assertNoHorizontalOverflow(page)
      await expect(page.getByLabel('Дни журнала')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Наставник' })).toBeVisible()
      await screenshot(page, viewport, '04-theme-journal-day')

      const submitButton = page.getByRole('button', { name: /Сохранить мысль|Обновить мысль/ })
      const actionRowPosition = await submitButton.evaluate(
        element => getComputedStyle(element.closest('div')).position
      )
      expect(actionRowPosition).toBe(isWide ? 'static' : 'fixed')

      await context.close()
    })
  }
})
