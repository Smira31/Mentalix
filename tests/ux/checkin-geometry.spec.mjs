import { expect, test } from '@playwright/test'

/*
 * Геометрия чек-ина (MXL-010): центр ряда шкалы и центр ряда
 * «Нет / Немного / Да» на экране завершения совпадают с центром экрана
 * (±2 px) на эталонных мобильных ширинах 393 (iPhone 16) и 440
 * (iPhone 16 Pro Max). Для ряда «Нет / Немного / Да» меряются крайние
 * КНОПКИ, а не контейнер: контейнер может быть по центру, а кнопки внутри —
 * нет. Кнопка «…» в сегодняшней записи истории стоит у правого края
 * карточки (±2 px), а повторное «Завершить» после ошибки отправляет те же
 * ответы. Поиск — только по data-testid; никаких
 * waitForTimeout — только ожидание состояния.
 */

const TEST_USER = {
  id: 900001,
  first_name: 'UX',
  username: 'local_ux_check',
}

const VIEWPORTS = [
  { name: '393x852', width: 393, height: 852 }, // iPhone 16
  { name: '440x956', width: 440, height: 956 }, // iPhone 16 Pro Max
]

const FIXTURES = {
  rituals: [],
  ascezas: [],
  quote: { text: 'Один спокойный шаг важнее идеального плана.' },
  checkin: null,
  themes: [],
  settings: { review_hour: 24 },
  pulse: { active_today: 12 },
  pinnedPractices: [],
  articles: [],
  analytics: {
    period_days: 14,
    rituals: [],
    ascezas: [],
    insights: [],
    daily_activity: [],
  },
  history: [],
}

function jsonResponse(body, status = 200) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  }
}

function fixtureFor(request) {
  const url = new URL(request.url())
  const pathname = url.pathname
  const method = request.method()

  if (method !== 'GET') {
    return jsonResponse({ ok: true })
  }

  if (pathname === '/api/profile') return jsonResponse(TEST_USER)
  if (pathname === '/api/rituals') return jsonResponse(FIXTURES.rituals)
  if (pathname === '/api/ascezas') return jsonResponse(FIXTURES.ascezas)
  if (pathname === '/api/quotes/today') return jsonResponse(FIXTURES.quote)
  if (pathname === '/api/checkin/today') return jsonResponse(FIXTURES.checkin)
  if (pathname === '/api/checkin/history') return jsonResponse(FIXTURES.history)
  if (pathname === '/api/themes') return jsonResponse(FIXTURES.themes)
  if (pathname === '/api/profile/settings') return jsonResponse(FIXTURES.settings)
  if (pathname === '/api/analytics/pulse') return jsonResponse(FIXTURES.pulse)
  if (pathname === '/api/pinned-practices') return jsonResponse(FIXTURES.pinnedPractices)
  if (pathname === '/api/articles') return jsonResponse(FIXTURES.articles)
  if (pathname === '/api/analytics') return jsonResponse(FIXTURES.analytics)
  if (pathname === '/api/mentalix/consent') return jsonResponse({ context_consent: false })
  if (pathname === '/api/mentalix/messages') return jsonResponse([])

  return jsonResponse({ error: `Нет локального fixture для ${method} ${pathname}` }, 501)
}

/** Центр ряда кнопок (от левого края первой до правого края последней) = центр экрана (±2 px). */
async function expectButtonsCenteredOnScreen(page, testId, viewportName) {
  const buttons = page.locator(`[data-testid="${testId}"]`)
  await expect(buttons).toHaveCount(3)
  const first = await buttons.first().boundingBox()
  const last = await buttons.last().boundingBox()
  expect(first, `${testId} (левая) на ${viewportName}`).not.toBeNull()
  expect(last, `${testId} (правая) на ${viewportName}`).not.toBeNull()

  const screenWidth = await page.evaluate(() => window.innerWidth)
  const leftGap = first.x
  const rightGap = screenWidth - (last.x + last.width)
  const drift = Math.abs(leftGap - rightGap) / 2

  expect(
    drift,
    `${testId} на ${viewportName}: слева ${leftGap} px, справа ${rightGap} px (допуск ±2 px)`
  ).toBeLessThanOrEqual(2)
}

/** Центр ряда по горизонтали совпадает с центром экрана (±2 px). */
async function expectRowCenteredOnScreen(page, testId, viewportName) {
  const box = await page.locator(`[data-testid="${testId}"]`).boundingBox()
  expect(box, `${testId} должен иметь bounding box на ${viewportName}`).not.toBeNull()

  const screenCenter = await page.evaluate(() => window.innerWidth / 2)
  const rowCenter = box.x + box.width / 2
  const drift = Math.abs(rowCenter - screenCenter)

  expect(
    drift,
    `${testId} на ${viewportName}: центр ряда ${rowCenter} ≠ центр экрана ${screenCenter} (допуск ±2 px)`
  ).toBeLessThanOrEqual(2)
}

test('ряды шкал и «Нет/Немного/Да» центрированы по экрану на 393 и 440', async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(180_000)

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      baseURL,
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
    }, TEST_USER)

    await context.route('**/api/**', route => route.fulfill(fixtureFor(route.request())))

    const page = await context.newPage()
    await page.clock.setFixedTime('2026-09-23T08:00:00+03:00')

    await page.goto('/')
    await page.getByRole('button', { name: /Утренний чек-ин/ }).click()

    // Обе шкалы (настроение, затем энергия): ряд по центру экрана.
    for (const heading of ['Как ты сейчас?', 'Сколько в тебе энергии?']) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
      await expectRowCenteredOnScreen(page, 'checkin-scale-row', viewport.name)
      await page.locator('[data-testid="checkin-scale-option"][data-level="3"]').click()
      await page.locator('[data-testid="checkin-next"]').click()
    }

    // Текстовый шаг → экран завершения.
    const editor = page.getByRole('textbox', { name: 'Что на уме' })
    await expect(editor).toBeVisible()
    await editor.pressSequentially('Спокойное утро')
    await page.locator('[data-testid="checkin-next"]').click()

    await expect(page.getByRole('heading', { name: /Утренний чек-ин/ })).toBeVisible()
    await expectButtonsCenteredOnScreen(page, 'checkin-feedback-option', viewport.name)

    await context.close()
  }
})

async function newMobileContext(browser, baseURL, viewport, handler) {
  const context = await browser.newContext({
    baseURL,
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
  }, TEST_USER)
  await context.route('**/api/**', route => route.fulfill(handler(route.request())))
  return context
}

const TODAY_CHECKIN = {
  date: '2026-09-23',
  mood: 4,
  energy: 3,
  note: 'Спокойное утро',
  created_at: '2026-09-23T05:00:00Z',
}

test('история «Сегодня»: «…» у правого края карточки, меню не обрезает заголовок', async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(120_000)

  for (const viewport of VIEWPORTS) {
    const context = await newMobileContext(browser, baseURL, viewport, request => {
      const pathname = new URL(request.url()).pathname
      if (request.method() === 'GET' && pathname === '/api/checkin/today') {
        return jsonResponse(TODAY_CHECKIN)
      }
      if (request.method() === 'GET' && pathname === '/api/checkin/history') {
        return jsonResponse([TODAY_CHECKIN])
      }
      return fixtureFor(request)
    })
    const page = await context.newPage()
    await page.clock.setFixedTime('2026-09-23T08:00:00+03:00')
    await page.goto('/')
    await page.locator('[data-testid="today-card-morning"]').click()
    // В Telegram своей кнопки «Назад» нет (BackButton → null, системная
    // кнопка Telegram). Убираем веб-кнопку из раскладки так же, как там.
    await page.addStyleTag({ content: '[data-testid="back-button"]{display:none!important}' })

    const button = page.locator('[data-testid="history-redo-button"]')
    const card = page.locator('[data-testid="history-today-card"]')
    await expect(button).toBeVisible()
    await expect(card).toBeVisible()

    const buttonBox = await button.boundingBox()
    const cardBox = await card.boundingBox()
    const drift = Math.abs(buttonBox.x + buttonBox.width - (cardBox.x + cardBox.width))
    expect(
      drift,
      `«…» на ${viewport.name}: правый край ${buttonBox.x + buttonBox.width} ≠ правый край карточки ${cardBox.x + cardBox.width}`
    ).toBeLessThanOrEqual(2)

    await button.click()
    const menu = page.locator('[data-testid="history-redo-menu"]')
    await expect(menu).toBeVisible()
    const menuBox = await menu.boundingBox()
    // Меню открывается вниз от правого края и не выходит за карточку справа.
    expect(menuBox.y).toBeGreaterThanOrEqual(buttonBox.y + buttonBox.height - 1)
    expect(
      Math.abs(menuBox.x + menuBox.width - (buttonBox.x + buttonBox.width))
    ).toBeLessThanOrEqual(2)
    // Меню — непрозрачный поповер над карточкой (частично обрезанного
    // заголовка сквозь полупрозрачный фон не бывает).
    const menuBg = await menu.evaluate(el => getComputedStyle(el).backgroundColor)
    expect(menuBg).not.toMatch(/rgba\(.*, 0(\.\d+)?\)$/)

    await context.close()
  }
})

test('ошибка сохранения чек-ина: понятное сообщение, повторное «Завершить» шлёт те же ответы', async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(120_000)

  const bodies = []
  const context = await newMobileContext(browser, baseURL, VIEWPORTS[1], request => {
    const pathname = new URL(request.url()).pathname
    if (request.method() === 'POST' && pathname === '/api/checkin') {
      bodies.push(request.postDataJSON())
      return bodies.length === 1
        ? jsonResponse({ detail: 'Ошибка сервера' }, 500)
        : jsonResponse({ ok: true })
    }
    return fixtureFor(request)
  })
  const page = await context.newPage()
  await page.clock.setFixedTime('2026-09-23T08:00:00+03:00')
  await page.goto('/')
  await page.getByRole('button', { name: /Утренний чек-ин/ }).click()

  for (const level of ['4', '2']) {
    await page.locator(`[data-testid="checkin-scale-option"][data-level="${level}"]`).click()
    await page.locator('[data-testid="checkin-next"]').click()
  }
  const editor = page.getByRole('textbox', { name: 'Что на уме' })
  await editor.pressSequentially('Спокойное утро')
  await page.locator('[data-testid="checkin-next"]').click()

  const complete = page.locator('[data-testid="checkin-complete"]')
  await complete.click()
  await expect(page.getByRole('alert')).toHaveText('Не удалось сохранить. Попробуй ещё раз.')
  await expect.poll(() => bodies.length).toBe(1)

  await complete.click()
  await expect.poll(() => bodies.length).toBe(2)
  expect(bodies[1]).toEqual(bodies[0])
  expect(bodies[0]).toMatchObject({ mood: 4, energy: 2, note: 'Спокойное утро' })

  await context.close()
})
