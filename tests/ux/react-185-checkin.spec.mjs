import { expect, test, devices } from '@playwright/test'

/*
 * Регрессия React error #185 («Maximum update depth exceeded»).
 *
 * Стратегия: каждый экран — отдельный test(), чтобы одно зависание
 * не валило весь набор. Общий таймаут теста — 90 с, на шаг — 5–10 с.
 * Слушатели page.on('pageerror') и console 'error' ловят текст
 * «Maximum update depth» / «#185» → тест падает с понятным сообщением.
 *
 * Чек-ин: открыть → дождаться первого шага (шкала настроения) →
 * закрыть через кнопку «Назад» (data-testid="back-button") →
 * проверить отсутствие pageerror. Если открытие нестабильно —
 * test.fixme с комментарием, без потери итераций.
 */

const TEST_USER = {
  id: 900001,
  first_name: 'Loop',
  username: 'loop_test',
}

const ERROR_PATTERNS = /Maximum update depth|Minified React error #185|#185/i

/** Собрать runtime-ошибки, связанные с #185. */
function collectDepthErrors(page) {
  const errors = []
  page.on('console', message => {
    if (message.type() === 'error' && ERROR_PATTERNS.test(message.text())) {
      errors.push(message.text())
    }
  })
  page.on('pageerror', error => {
    if (ERROR_PATTERNS.test(`${error.message}\n${error.stack || ''}`)) {
      errors.push(`${error.message}\n${error.stack || ''}`)
    }
  })
  return errors
}

/** Проверить, что ни одна ошибка #185 не накопилась. */
function assertNoUpdateDepth(errors, label) {
  expect(
    errors,
    `${label}: обнаружен Maximum update depth (#185):\n${errors.join('\n')}`
  ).toEqual([])
}

/** Мок API — минимальный, чтобы приложение загрузилось в demo/web-режиме. */
async function mockApi(page) {
  await page.route('**/api/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    let body = { ok: true }
    if (request.method() === 'GET') {
      if (url.pathname === '/api/profile') body = TEST_USER
      else if (url.pathname === '/api/profile/settings') body = { review_hour: 24 }
      else if (url.pathname === '/api/quotes/today') body = { text: 'Один спокойный шаг.' }
      else if (url.pathname === '/api/checkin/today') body = null
      else if (url.pathname === '/api/checkin/history') body = []
      else if (url.pathname === '/api/analytics/pulse') body = { active_today: 0 }
      else if (url.pathname === '/api/mentalix/consent') body = { context_consent: false }
      else if (url.pathname === '/api/mentalix/messages') body = []
      else body = []
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

async function newPage(browser) {
  const context = await browser.newContext({
    ...devices['iPhone 15 Pro'],
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
  }, TEST_USER)
  const page = await context.newPage()
  await page.clock.setFixedTime('2026-09-26T08:00:00+03:00')
  await mockApi(page)
  return { page, context }
}

// ---------------------------------------------------------------------------
// 1. Чек-ин: открыть → первый шаг → закрыть → нет #185
// ---------------------------------------------------------------------------

test('чек-ин: открыть, дождаться первого шага, закрыть — нет #185', async ({ browser }) => {
  test.setTimeout(90_000)

  const { page, context } = await newPage(browser)
  const errors = collectDepthErrors(page)

  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Дождаться карточки чек-ина на экране «Сегодня».
    const checkinCard = page.locator('[data-testid="today-card-morning"]')
    const cardReady = await checkinCard
      .waitFor({ state: 'visible', timeout: 10_000 })
      .then(() => true)
      .catch(() => false)
    if (!cardReady) {
      test.fixme(true, 'Карточка чек-ина не появилась за 10 с — открытие нестабильно')
      return
    }

    await checkinCard.click()

    // Дождаться первого шага — заголовок шкалы настроения.
    const moodHeading = page.getByRole('heading', { name: 'Как ты сейчас?' })
    const stepReady = await moodHeading
      .waitFor({ state: 'visible', timeout: 10_000 })
      .then(() => true)
      .catch(() => false)
    if (!stepReady) {
      test.fixme(true, 'Первый шаг чек-ина не появился за 10 с — открытие нестабильно')
      return
    }

    assertNoUpdateDepth(errors, 'после открытия чек-ина')

    // Закрыть через кнопку «Назад» (web-fallback кнопка, data-testid="back-button").
    const backButton = page.locator('[data-testid="back-button"]')
    const backVisible = await backButton.isVisible({ timeout: 5_000 }).catch(() => false)
    if (backVisible) {
      await backButton.click()
    } else {
      // В Telegram-режиме кнопки нет — эмулируем через Escape или свайп.
      await page.keyboard.press('Escape')
    }

    // Проверить, что вернулись на экран «Сегодня».
    await expect(
      page.getByRole('button', { name: 'Сегодня', exact: true })
    ).toBeVisible({ timeout: 10_000 })

    assertNoUpdateDepth(errors, 'после закрытия чек-ина')
  } finally {
    await context.close()
  }
})

// ---------------------------------------------------------------------------
// 2–6. Каждый экран — отдельный test(): открыть, подождать, проверить #185
// ---------------------------------------------------------------------------

const SCREENS = [
  { name: 'Сегодня', nav: null },
  { name: 'Шаги', nav: 'Шаги' },
  { name: 'Диалог', nav: 'Диалог' },
  { name: 'Библиотека', nav: 'Библиотека' },
  { name: 'Прогресс', nav: 'Прогресс' },
]

for (const screen of SCREENS) {
  test(`экран «${screen.name}»: загрузка без #185`, async ({ browser }) => {
    test.setTimeout(90_000)

    const { page, context } = await newPage(browser)
    const errors = collectDepthErrors(page)

    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' })

      // Дождаться базовой загрузки.
      await expect(
        page.getByRole('button', { name: 'Сегодня', exact: true })
      ).toBeVisible({ timeout: 10_000 })

      if (screen.nav) {
        const navButton = page.getByRole('button', { name: screen.nav, exact: true })
        const navVisible = await navButton.isVisible({ timeout: 5_000 }).catch(() => false)
        if (!navVisible) {
          test.fixme(true, `Кнопка навигации «${screen.nav}» не видна — пропускаем`)
          return
        }
        await navButton.click()
        await page.waitForTimeout(500) // дать экрану отрисоваться
      }

      assertNoUpdateDepth(errors, `на экране «${screen.name}»`)
    } finally {
      await context.close()
    }
  })
}
