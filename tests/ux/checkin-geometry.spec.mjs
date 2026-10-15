import fs from 'node:fs'
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

test('ряды шкал центрированы по экрану на 393 и 440', async ({
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

    // Четыре шкалы (настроение → сон → энергия → концентрация): ряд по центру экрана.
    for (const heading of ['Как ты сейчас?', 'Как ты спал?', 'Сколько в тебе энергии?', 'Уровень концентрации']) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
      await expectRowCenteredOnScreen(page, 'checkin-scale-row', viewport.name)
      await page.locator('[data-testid="checkin-scale-option"][data-level="3"]').click()
      await page.locator('[data-testid="checkin-next"]').click()
    }

    // Шаг «Главный фокус дня»: без выбора плитки вперёд не идёт — выбираем.
    await page.locator('[data-testid="checkin-day-focus-option"][data-value="Работа"]').click()
    await page.locator('[data-testid="checkin-next"][aria-label="Далее"]').click()

    // Текстовый шаг → экран завершения.
    const editor = page.getByRole('textbox', { name: 'Что на уме' })
    await expect(editor).toBeVisible()
    await editor.pressSequentially('Спокойное утро')
    await page.locator('[data-testid="checkin-complete"]').click()

    await expect(page.getByRole('heading', { name: 'Ты прошёл утренний чек-ин.' })).toBeVisible()

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
    // Своей кнопки «Назад» у чек-ина больше нет: возврат — системная кнопка
    // Telegram, поэтому из раскладки ничего убирать не нужно.

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

  // Четыре шкалы: mood=4, sleep_quality=3, energy=2, focus=3
  for (const level of ['4', '3', '2', '3']) {
    await page.locator(`[data-testid="checkin-scale-option"][data-level="${level}"]`).click()
    await page.locator('[data-testid="checkin-next"]').click()
  }
  // Шаг «Главный фокус дня»: без выбора плитки вперёд не идёт — выбираем.
  await page.locator('[data-testid="checkin-day-focus-option"][data-value="Работа"]').click()
  await page.locator('[data-testid="checkin-next"][aria-label="Далее"]').click()

  const editor = page.getByRole('textbox', { name: 'Что на уме' })
  await editor.pressSequentially('Спокойное утро')

  const complete = page.locator('[data-testid="checkin-complete"]')
  await complete.click()
  await expect(page.getByRole('alert')).toHaveText('Не удалось сохранить. Попробуй ещё раз.')
  await expect.poll(() => bodies.length).toBe(1)

  await complete.click()
  await expect.poll(() => bodies.length).toBe(2)
  expect(bodies[1]).toEqual(bodies[0])
  expect(bodies[0]).toMatchObject({ mood: 4, sleep_quality: 3, energy: 2, focus: 3, note: 'Спокойное утро' })

  await context.close()
})

/*
 * Навигация чек-ина (UX-аудит, пакет 1): крестик выхода повторяет
 * геометрию круглой навигации DailyJournal (токен --mx-header-control,
 * 43×43, круглая, стекло), а «Далее» — общий размер круглой кнопки
 * 45×45. Клавиатурный focus-visible остаётся доступным. Снимки и геометрия —
 * 393×852, 360×640 и 430×932.
 */
const NAV_VIEWPORTS = [
  { name: '393x852', width: 393, height: 852, screenshot: true },
  { name: '360x640', width: 360, height: 640, screenshot: true },
  { name: '430x932', width: 430, height: 932, screenshot: true },
]

const NAV_EVIDENCE_DIR = 'qa-evidence/checkin-navigation-ux'

/** Сегодняшний день в заданный локальный час (даты — только относительно текущего дня). */
function todayAt(hour) {
  const date = new Date()
  date.setHours(hour, 0, 0, 0)
  return date
}

async function boxSize(locator, label) {
  const box = await locator.boundingBox()
  expect(box, `${label}: нужен bounding box`).not.toBeNull()
  return [Math.round(box.width), Math.round(box.height)]
}

test('навигация чек-ина: одна круглая кнопка шага 45×45 («✕»/«→»), focus-visible доступен', async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(240_000)

  fs.mkdirSync(NAV_EVIDENCE_DIR, { recursive: true })

  for (const viewport of NAV_VIEWPORTS) {
    const context = await newMobileContext(browser, baseURL, viewport, fixtureFor)
    const page = await context.newPage()
    await page.clock.setFixedTime(todayAt(8))
    await page.goto('/')
    await page.getByRole('button', { name: /Утренний чек-ин/ }).click()
    await expect(page.getByRole('heading', { name: 'Как ты сейчас?' })).toBeVisible()

    // Одна круглая кнопка шага: без ответа «✕», после ответа «→» — в обоих
    // состояниях та же геометрия 45×45, разметка кнопки не перестраивается.
    const stepButton = page.locator('[data-testid="checkin-next"]')
    await expect(stepButton).toHaveAttribute('aria-label', 'Закрыть')
    expect(await boxSize(stepButton, `кнопка шага (✕) ${viewport.name}`)).toEqual([45, 45])

    await page.locator('[data-testid="checkin-scale-option"][data-level="3"]').click()
    await expect(stepButton).toHaveAttribute('aria-label', 'Далее')
    expect(await boxSize(stepButton, `кнопка шага (→) ${viewport.name}`)).toEqual([45, 45])

    // Клавиатурный фокус: после Tab-модальности :focus-visible совпадает,
    // и золотое кольцо из index.css не погашено.
    await page.keyboard.press('Tab')
    const ring = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="checkin-next"]')
      el.focus()
      const style = getComputedStyle(el)
      return {
        focusVisible: el.matches(':focus-visible'),
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
      }
    })
    expect(ring.focusVisible, `focus-visible круглой кнопки на ${viewport.name}`).toBe(true)
    expect(ring.outlineStyle, `обводка фокуса на ${viewport.name}`).toBe('solid')
    expect(parseFloat(ring.outlineWidth), `толщина обводки на ${viewport.name}`).toBeGreaterThan(0)

    if (viewport.screenshot) {
      await page.screenshot({ path: `${NAV_EVIDENCE_DIR}/checkin-nav-${viewport.name}.png` })
    }

    await context.close()
  }

  // ── Сравнение с DailyJournal: та же круглая навигация и та же «→» ──
  const context = await newMobileContext(browser, baseURL, { width: 393, height: 852 }, request => {
    const pathname = new URL(request.url()).pathname
    if (pathname.startsWith('/api/daily-journal/entries')) return jsonResponse([])
    if (pathname.startsWith('/api/daily-journal')) return jsonResponse({})
    return fixtureFor(request)
  })
  const page = await context.newPage()
  await page.clock.setFixedTime(todayAt(8))
  await page.goto('/?tab=practices')

  await expect(page.getByTestId('journal-open-cta')).toBeVisible()
  await page.getByTestId('journal-open-cta').click()
  await expect(page.getByTestId('dj-intro-skip')).toBeVisible()

  const djBack = page.locator('[data-testid="back-button"]')
  await expect(djBack).toBeVisible()
  expect(await boxSize(djBack, 'навигация DailyJournal')).toEqual([43, 43])

  await page.getByTestId('dj-intro-skip').click()
  await expect(page.getByTestId('dj-stream-next')).toBeVisible()
  expect(await boxSize(page.getByTestId('dj-stream-next'), '«→» DailyJournal')).toEqual([45, 45])

  await context.close()
})
