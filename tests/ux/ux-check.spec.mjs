import { devices, expect, test } from '@playwright/test'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { DAIMON_CELLS, DAIMON_LEVELS } from '../../src/lib/daimonBoard.js'

const ARTIFACT_ROOT = path.resolve('artifacts/ux-check')

// Anchor states: достаточно компактный набор для быстрого release gate.
// Полный UX-report продолжает снимать все состояния, а эти экраны
// дополнительно сравниваются с сохранёнными визуальными эталонами.
const VISUAL_ANCHOR_SLUGS = new Set([
  '01-today',
  '02-check-in',
  '03-practices',
  '03b-journal-intro',
  '06-first-step-intro',
  '06f0-narrow-focus-intro',
  '07-library',
  '08-trends',
])

const RUN_VISUAL_SNAPSHOTS = process.env.RUN_VISUAL_SNAPSHOTS === 'true'

const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568 },
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
]

const TEST_USER = {
  id: 900001,
  first_name: 'UX',
  username: 'local_ux_check',
}

const UX_FIXED_TIME = process.env.UX_FIXED_TIME || '08:00'

async function freezePageTime(page) {
  await page.clock.setFixedTime(`2026-09-23T${UX_FIXED_TIME}:00+03:00`)
}

// Stateful fixture для Daily Journal: хранит записи, созданные через POST,
// чтобы повторный GET /entries возвращал запись текущего дня.
let dailyJournalEntries = []

const FIXTURES = {
  rituals: [],
  ascezas: [],
  quote: { text: 'Один спокойный шаг важнее идеального плана.' },
  checkin: null,
  themes: [
    {
      id: 701,
      title: 'о меньшем усилии',
      subtitle: 'Семь коротких наблюдений о том, что действительно двигает.',
      total_days: 7,
      reflected_days: 1,
    },
    {
      id: 702,
      title: 'Границы и забота о себе',
      subtitle: 'Неделя про «нет», которое бережёт «да».',
      total_days: 7,
      reflected_days: 0,
    },
  ],
  theme: {
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
        reflection: 'Я сделал **один** спокойный шаг.',
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
  },
  settings: { review_hour: 24 },
  pulse: { active_today: 12 },
  pinnedPractices: [],
  theme2: {
    id: 702,
    title: 'Границы и забота о себе',
    subtitle: 'Неделя про «нет», которое бережёт «да».',
    current_day: 1,
    free_days: 7,
    days: [
      {
        day: 1,
        text: 'Какое «нет» сегодня было трудным и почему?',
        prompt: 'Запиши одно наблюдение без оценки.',
        reflection: '',
        locked: false,
      },
      ...Array.from({ length: 6 }, (_, index) => ({
        day: index + 2,
        text: 'Следующий вопрос недели.',
        prompt: 'Что замечаешь?',
        reflection: '',
        locked: false,
      })),
    ],
  },
  articles: [
    {
      id: 1,
      title: 'Как начать с одного шага',
      excerpt: 'Короткий локальный материал для проверки карточки библиотеки.',
      tag: 'Фокус',
      minutes: 4,
      date: '2026-08-22',
      body: 'Первый абзац локального материала.\n\nВторой абзац не обращается к production.',
    },
  ],
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
    if (method === 'PUT' && pathname === '/api/checkin/yesterday') {
      return jsonResponse({ detail: 'not_recoverable' }, 409)
    }
    if (pathname === '/api/checkin') {
      return jsonResponse({ mood: 3, energy: 3, anxiety: 3, focus: 3 })
    }

    // Pinned practices: POST возвращает созданный элемент, DELETE — ok.
    if (method === 'POST' && pathname === '/api/pinned-practices') {
      let body = {}
      try {
        body = JSON.parse(request.postData() || '{}')
      } catch {
        /* empty body */
      }
      return jsonResponse({ id: Date.now(), practice_id: body.practice_id })
    }
    if (method === 'DELETE' && pathname.match(/^\/api\/pinned-practices\/[^/]+$/)) {
      return jsonResponse({ ok: true })
    }

    // Daily Journal: POST создаёт запись, PATCH обновляет helpful.
    if (method === 'POST' && pathname === '/api/daily-journal/entries') {
      let body = {}
      try {
        body = JSON.parse(request.postData() || '{}')
      } catch {
        /* empty body */
      }
      const entry = {
        id: Date.now(),
        date: body.date,
        stream_text: body.stream_text || '',
        prompt_text: body.prompt_text || '',
        prompt_answer: body.prompt_answer || '',
        day_number: dailyJournalEntries.length + 1,
      }
      dailyJournalEntries.push(entry)
      return jsonResponse(entry)
    }
    if (method === 'PATCH' && pathname.match(/^\/api\/daily-journal\/entries\/[^/]+$/)) {
      return jsonResponse({ ok: true })
    }
    if (method === 'PUT' && pathname === '/api/daily-journal/setup') {
      return jsonResponse({ updated_at: new Date().toISOString(), prompts: [] })
    }

    return jsonResponse({ ok: true })
  }

  // Canonical streak (GET /api/streak): пустая history-фикстура — нулевая серия.
  if (pathname === '/api/streak') {
    return jsonResponse({
      current_streak: 0,
      longest_streak: 0,
      total_active_days: 0,
      is_active_today: false,
    })
  }
  if (pathname === '/api/streak/recovery') {
    return jsonResponse({ recoverable: false, date: null, streak_before: 0 })
  }
  if (pathname === '/api/profile') return jsonResponse(TEST_USER)
  if (pathname === '/api/rituals') return jsonResponse(FIXTURES.rituals)
  if (pathname === '/api/ascezas') return jsonResponse(FIXTURES.ascezas)
  if (pathname === '/api/quotes/today') return jsonResponse(FIXTURES.quote)
  if (pathname === '/api/checkin/today') return jsonResponse(FIXTURES.checkin)
  if (pathname === '/api/checkin/history') return jsonResponse(FIXTURES.history)
  if (pathname === '/api/themes') return jsonResponse(FIXTURES.themes)
  if (pathname === '/api/themes/701') return jsonResponse(FIXTURES.theme)
  if (pathname === '/api/themes/702') return jsonResponse(FIXTURES.theme2)
  if (pathname === '/api/profile/settings') return jsonResponse(FIXTURES.settings)
  if (pathname === '/api/analytics/pulse') return jsonResponse(FIXTURES.pulse)
  if (pathname === '/api/analytics/influences') {
    return jsonResponse({
      period: { from: '2026-09-21', to: '2026-09-27' },
      days_with_data: 0,
      top_emotions: [],
      lifts: [],
      drags: [],
      enough_data: false,
    })
  }
  if (pathname === '/api/pinned-practices') return jsonResponse(FIXTURES.pinnedPractices)
  if (pathname === '/api/mood-practices') return jsonResponse([])
  if (pathname === '/api/practice-days') return jsonResponse({ days: [] })
  if (pathname === '/api/articles') return jsonResponse(FIXTURES.articles)
  if (pathname === '/api/analytics') return jsonResponse(FIXTURES.analytics)
  // Today будит бэкенд до загрузки данных — health не должен считаться
  // ошибкой рантайма в smoke-сценариях.
  if (pathname === '/api/health') return jsonResponse({ status: 'ok' })
  if (pathname === '/api/mentalix/consent') return jsonResponse({ context_consent: false })
  if (pathname === '/api/mentalix/messages') {
    const persona = url.searchParams.get('persona') || 'unknown'
    return jsonResponse([
      {
        id: `fixture-${persona}`,
        role: 'assistant',
        content: `История ${persona}`,
      },
    ])
  }
  // Разговоры «Диалога»: список и сообщения разговора. Пустые списки —
  // блок «Продолжить разговор» в smoke не нужен.
  if (pathname === '/api/mentalix/conversations') return jsonResponse([])
  if (/^\/api\/mentalix\/conversations\/[^/]+\/messages$/.test(pathname)) return jsonResponse([])

  // Даймон: поле из статических данных, пустое состояние → интро новой игры.
  if (pathname === '/api/daimon/board') {
    return jsonResponse({ levels: DAIMON_LEVELS, cells: DAIMON_CELLS })
  }
  if (pathname === '/api/daimon/state') return jsonResponse({ game: null })
  if (pathname === '/api/daimon/games') return jsonResponse([])

  // Daily Journal: setup без updated_at → intro, entries — stateful.
  if (pathname === '/api/daily-journal/setup') {
    return jsonResponse({ prompts: ['Что ты откладываешь, хотя знаешь, что это важно?'] })
  }
  if (pathname === '/api/daily-journal/entries') {
    return jsonResponse({ items: dailyJournalEntries, total_days: dailyJournalEntries.length })
  }

  return jsonResponse({ error: `Нет локального fixture для ${method} ${pathname}` }, 501)
}

function sanitizeReason(error) {
  return String(error?.message || error || 'Неизвестная ошибка')
    .split('\n')[0]
    .replaceAll(/\u001b\[[0-9;]*m/g, '')
    .replaceAll('|', '\\|')
    .slice(0, 240)
}

// Безобидные браузеро-специфичные console.error, которые не являются
// ошибками приложения и не должны валить UX smoke. WebKit, в отличие от
// Chromium, не поддерживает viewport-свойство interactive-widget и
// логирует предупреждение — это шум, а не баг.
const IGNORED_CONSOLE_ERRORS = [
  'CloudStorage is not supported in version 6.0',
  'Viewport argument key "interactive-widget" not recognized and ignored.',
]

function isIgnorableConsoleError(text) {
  return IGNORED_CONSOLE_ERRORS.some(pattern => text.includes(pattern))
}

function overlap(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

async function assertCommonScreenChecks(page, runtimeErrors) {
  await expect(page.locator('body')).not.toHaveText('', { timeout: 8_000 })

  const geometry = await page.evaluate(() => {
    const app = document.querySelector('#root > div')
    const rect = app?.getBoundingClientRect()

    return {
      bodyTextLength: document.body.innerText.trim().length,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      app: rect
        ? {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
          }
        : null,
    }
  })

  expect(geometry.bodyTextLength, 'Экран не должен быть пустым').toBeGreaterThan(20)
  expect(
    geometry.documentWidth,
    'document не должен иметь горизонтальный overflow'
  ).toBeLessThanOrEqual(geometry.viewportWidth + 1)
  expect(geometry.bodyWidth, 'body не должен иметь горизонтальный overflow').toBeLessThanOrEqual(
    geometry.viewportWidth + 1
  )
  expect(geometry.app, 'Корневой контейнер приложения должен существовать').not.toBeNull()
  expect(
    geometry.app.left,
    'Основной контент не должен выходить за левую границу'
  ).toBeGreaterThanOrEqual(-1)
  expect(
    geometry.app.right,
    'Основной контент не должен выходить за правую границу'
  ).toBeLessThanOrEqual(geometry.viewportWidth + 1)
  expect(geometry.app.height, 'Основной контейнер должен занимать экран').toBeGreaterThanOrEqual(
    geometry.viewportHeight - 1
  )

  const visibleNav = page.locator('nav[aria-hidden="false"]')
  const navBox = (await visibleNav.count()) > 0 ? await visibleNav.boundingBox() : null

  if (navBox) {
    const criticalCtas = page.locator('button.cta-pill:visible:not(:disabled)')
    const count = await criticalCtas.count()

    await assertBottomNavigationLabelsFit(page)

    for (let index = 0; index < count; index += 1) {
      const ctaBox = await criticalCtas.nth(index).boundingBox()

      /*
       * `:visible` включает элементы, которые уже начинаются за fixed dock:
       * это следующий scrollable-контент, а не CTA, доступная до прокрутки.
       * Проверяем только кнопку, начинающуюся в незакрытой области над dock.
       */
      const ctaStartsAboveNav = ctaBox && ctaBox.y >= 0 && ctaBox.y < navBox.y

      if (ctaStartsAboveNav) {
        const ctaLabel = (await criticalCtas.nth(index).innerText()).trim()
        expect(overlap(ctaBox, navBox), `Нижняя навигация перекрывает CTA «${ctaLabel}»`).toBe(
          false
        )
      }
    }
  }

  if (runtimeErrors.length > 0) {
    throw new Error(`Runtime error: ${runtimeErrors.join('; ')}`)
  }
}

async function assertClickable(locator) {
  await expect(locator).toBeVisible()
  await expect(locator).toBeEnabled()
  const box = await locator.boundingBox()
  expect(box?.width || 0, 'Кликабельный элемент должен иметь ширину').toBeGreaterThan(0)
  expect(box?.height || 0, 'Кликабельный элемент должен иметь высоту').toBeGreaterThan(0)
}

async function assertBottomNavigationLabelsFit(page) {
  const labels = await page.locator('nav[aria-hidden="false"] > button').evaluateAll(buttons =>
    buttons.map(button => {
      const buttonRect = button.getBoundingClientRect()
      const label = button.querySelector('span')
      const labelRect = label?.getBoundingClientRect()

      return {
        name: button.getAttribute('aria-label'),
        buttonLeft: buttonRect.left,
        buttonRight: buttonRect.right,
        labelLeft: labelRect?.left ?? null,
        labelRight: labelRect?.right ?? null,
      }
    })
  )

  const epsilon = 0.5

  for (const label of labels) {
    expect(label.labelLeft, `Подпись «${label.name}» должна иметь геометрию`).not.toBeNull()
    expect(label.labelRight, `Подпись «${label.name}» должна иметь геометрию`).not.toBeNull()
    expect(
      label.labelLeft,
      `Подпись «${label.name}» выходит за левую границу кнопки`
    ).toBeGreaterThanOrEqual(label.buttonLeft - epsilon)
    expect(
      label.labelRight,
      `Подпись «${label.name}» выходит за правую границу кнопки`
    ).toBeLessThanOrEqual(label.buttonRight + epsilon)
  }

  for (let index = 1; index < labels.length; index += 1) {
    const previous = labels[index - 1]
    const current = labels[index]

    expect(
      current.labelLeft,
      `Подписи «${previous.name}» и «${current.name}» не должны пересекаться`
    ).toBeGreaterThanOrEqual(previous.labelRight - epsilon)
  }
}

async function assertSoonControls(page) {
  await assertClickable(page.getByRole('button', { name: 'Открыть Даймон' }))
  // Каталог владельца показывает будущие практики как неактивные карточки.
  await expect(page.getByRole('button', { name: /Импульс со Львом/ })).toBeDisabled()
  await expect(page.getByRole('button', { name: /Фокус, скоро/ })).toBeDisabled()
}

async function assertLibrarySoonControl(page) {
  await expect(page.getByRole('heading', { name: 'библиотека.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Открыть поиск' })).toHaveCount(0)
  await expect(page.getByTestId('library-hero')).toBeVisible()
  await expect(page.getByTestId('library-topic')).toHaveCount(3)
  await expect(page.getByText('Программы', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Направленные записи', { exact: true })).toHaveCount(0)
}

async function captureScreen({ page, viewport, screen, slug, runtimeErrors, results, check }) {
  const screenshotRelative = `${viewport.name}/${slug}.png`
  const screenshotAbsolute = path.join(ARTIFACT_ROOT, screenshotRelative)
  let status = 'pass'
  let reason = '—'

  try {
    await check()
    await assertCommonScreenChecks(page, runtimeErrors)

    if (RUN_VISUAL_SNAPSHOTS && VISUAL_ANCHOR_SLUGS.has(slug)) {
      const starterSetEnabled = process.env.VITE_STARTER_SET_ENABLED === 'true'
      const snapshotName =
        starterSetEnabled && viewport.name === '430x932' && slug === '01-today'
          ? `${viewport.name}/${slug}-starter-enabled.png`
          : `${viewport.name}/${slug}.png`
      await expect(page).toHaveScreenshot(snapshotName, {
        animations: 'disabled',
        caret: 'hide',
        maxDiffPixelRatio: 0.01,
      })
    }
  } catch (error) {
    status = 'fail'
    reason = sanitizeReason(error)
    if (
      RUN_VISUAL_SNAPSHOTS &&
      VISUAL_ANCHOR_SLUGS.has(slug) &&
      String(error?.message || '').includes('to have screenshot')
    ) {
      status = 'visual_diff'
    }
  }

  await mkdir(path.dirname(screenshotAbsolute), { recursive: true })

  try {
    await page.screenshot({ path: screenshotAbsolute, fullPage: false })
  } catch (error) {
    status = 'fail'
    reason = `Не удалось сохранить screenshot: ${sanitizeReason(error)}`
  }

  results.push({
    screen,
    viewport: viewport.name,
    status,
    reason,
    screenshot: screenshotRelative.replaceAll('\\', '/'),
  })

  runtimeErrors.length = 0
}

function buildReport(results) {
  const rows = results.map(
    result =>
      `| ${result.screen} | ${result.viewport} | ${result.status} | ${result.reason} | [${result.screenshot}](${result.screenshot}) |`
  )
  const failed = results.filter(result => result.status === 'fail').length

  return (
    `# Mentalix UX check\n\n` +
    `Результат: **${failed === 0 ? 'PASS' : 'FAIL'}** — ${results.length - failed}/${results.length} экранов прошли проверки.\n\n` +
    `| Экран | Viewport | Статус | Причина | Screenshot |\n` +
    `| --- | --- | --- | --- | --- |\n` +
    `${rows.join('\n')}\n\n` +
    `## Что проверяет автоматический gate\n\n` +
    `- локальный web-маршрут на детерминированных fixtures без запросов к production API;\n` +
    `- отсутствие горизонтального overflow и пустого экрана;\n` +
    `- границы корневого контента внутри viewport;\n` +
    `- отсутствие пересечения видимых критических CTA с нижней навигацией;\n` +
    `- отсутствие page runtime errors и console.error;\n` +
    `- доступность ожидаемых интерактивных элементов;\n` +
    `- disabled/«Скоро» элементы в Practices и Library не открываются;\n` +
    `- визуальное сравнение восьми anchor-состояний на четырёх mobile viewport.\n\n` +
    `## Обязательный ручной iPhone gate\n\n` +
    `Этот отчёт не является доказательством корректности Telegram safe-area, iOS keyboard, fullscreen Telegram, swipe physics или WebView performance. Эти пять областей нужно проверять вручную на реальном iPhone внутри Telegram.\n`
  )
}

test('локальный UX smoke по основному маршруту', async ({ browser, baseURL }) => {
  test.setTimeout(300_000)

  await rm(ARTIFACT_ROOT, { recursive: true, force: true })
  await mkdir(ARTIFACT_ROOT, { recursive: true })

  const results = []

  for (const viewport of VIEWPORTS) {
    dailyJournalEntries.length = 0

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
    await freezePageTime(page)
    const runtimeErrors = []

    page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`))
    page.on('console', message => {
      if (message.type() === 'error' && !isIgnorableConsoleError(message.text())) {
        runtimeErrors.push(`console.error: ${message.text()}`)
      }
    })

    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Шаги' })).toBeVisible()

    await captureScreen({
      page,
      viewport,
      screen: 'Today',
      slug: '01-today',
      runtimeErrors,
      results,
      check: async () => {
        const checkin = page.getByRole('button', { name: /Утренний чек-ин/ })
        await assertClickable(checkin)
      },
    })

    await page.getByRole('button', { name: /Утренний чек-ин/ }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'Check-in',
      slug: '02-check-in',
      runtimeErrors,
      results,
      check: async () => {
        await assertClickable(page.getByTestId('back-button'))
        await expect(page.getByTestId('back-button')).toHaveCount(1)
        await expect(page.getByText(/‹\s*Назад|К каталогу/)).toHaveCount(0)
        await expect(page.getByRole('heading', { name: 'Как ты сейчас?' })).toBeVisible()
      },
    })

    // Scale answers advance only after pressing the main «Далее» button.
    // Порядок: mood → sleep_quality → energy → focus
    for (const option of ['Нормально', 'Нормально', 'Средне', 'Держусь']) {
      const answer = page.getByRole('radio', { name: new RegExp(`^3: ${option}$`, 'i') })
      await expect(answer).toBeVisible()
      await expect(answer).toBeEnabled()
      await expect(page.getByTestId('checkin-skip')).toHaveCount(0)
      await expect(page.getByTestId('checkin-next')).toBeDisabled()
      await answer.click()
      await assertClickable(page.getByRole('button', { name: 'Далее' }))
      await page.getByRole('button', { name: 'Далее' }).click()
    }

    // Главный фокус дня: девять плиток, один выбор, без собственного ввода.
    // «→» активна и без выбора плитки.
    const focusTiles = page.getByTestId('checkin-day-focus-option')
    await expect(focusTiles).toHaveCount(9)
    await expect(page.getByText('Выбери одно главное на сегодня.')).toBeVisible()
    await expect(page.getByTestId('checkin-day-focus-input')).toHaveCount(0)
    await expect(page.getByTestId('checkin-day-focus-counter')).toHaveCount(0)
    await expect(page.getByTestId('checkin-skip')).toHaveCount(0)
    await expect(page.getByTestId('checkin-next')).toBeEnabled()
    await focusTiles.first().click()
    await expect(focusTiles.first()).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('checkin-day-focus-show-all')).toHaveCount(0)
    await focusTiles.nth(1).click()
    await expect(page.locator('[data-testid="checkin-day-focus-option"][aria-pressed="true"]')).toHaveCount(1)
    await assertClickable(page.getByRole('button', { name: 'Далее' }))
    await page.getByRole('button', { name: 'Далее' }).click()

    await captureScreen({
      page,
      viewport,
      screen: 'Check-in writer',
      slug: '02b-check-in-writer',
      runtimeErrors,
      results,
      check: async () => {
        const editor = page.getByRole('textbox', { name: 'Что на уме' })
        await expect(editor).toBeVisible()
        await expect(page.locator('[data-testid="checkin-complete"]')).toBeEnabled()
        await editor.pressSequentially('Спокойное утро')
        await expect(page.getByRole('button', { name: 'Показать форматирование' })).toHaveCount(0)
        await expect(page.getByRole('button', { name: 'Жирный текст' })).toHaveCount(0)
        await expect(page.getByRole('button', { name: 'Дополнительные действия' })).toHaveCount(0)
        await expect(page.locator('[data-testid="checkin-skip"]')).toHaveCount(0)
        await expect(page.locator('[data-testid="checkin-complete"]')).toHaveAttribute(
          'aria-label',
          'Далее'
        )
        await assertClickable(page.locator('[data-testid="checkin-complete"]'))
      },
    })
    const checkinBackButton = page.getByTestId('back-button')
    await expect(checkinBackButton).toBeVisible()
    await expect(checkinBackButton).toBeEnabled()
    await checkinBackButton.click()
    await expect(page.getByRole('heading', { name: 'Главный фокус на сегодня?' })).toBeVisible()
    await checkinBackButton.click()
    await expect(page.getByRole('heading', { name: 'Уровень концентрации' })).toBeVisible()
    await checkinBackButton.click()
    await expect(page.getByRole('heading', { name: 'Сколько в тебе энергии?' })).toBeVisible()
    await checkinBackButton.click()
    await expect(page.getByRole('heading', { name: 'Как ты спал?' })).toBeVisible()
    await checkinBackButton.click()
    await expect(page.getByRole('heading', { name: 'Как ты сейчас?' })).toBeVisible()
    await checkinBackButton.click()

    const draftDialog = page.locator(
      '[role="dialog"][aria-labelledby="checkin-draft-dialog-title"]'
    )
    await expect(draftDialog).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Сегодня' })).toBeVisible()

    // «Все темы ›» открывает карусель темы недели
    await page.getByTestId('today-theme-all').click()
    // Карусель темы недели: видимая карточка вопроса имеет высоту > 120px
    // и виден текст вопроса.
    const carouselCard = page.locator('.mx-tqc-card').first()
    await expect(carouselCard).toBeVisible()
    const carouselCardBox = await carouselCard.boundingBox()
    expect(carouselCardBox?.height || 0).toBeGreaterThan(120)
    await expect(carouselCard.locator('.mx-tqc-card__question')).toBeVisible()

    // Карусель темы недели: CTA «Начать запись» открывает ThemeScreen
    await page.getByTestId('theme-carousel-cta').click()
    await captureScreen({
      page,
      viewport,
      screen: 'Theme journal',
      slug: '03-theme-journal',
      runtimeErrors,
      results,
      check: async () => {
        const journalContent = page.getByTestId('journal-day-content')
        await expect(journalContent).toHaveCSS('text-align', 'left')
        await expect(page.getByText('Тема недели', { exact: true })).toHaveCount(0)

        const editor = page.getByRole('textbox', { name: 'Мысль по теме недели' })
        await expect(editor).toBeVisible()
        await expect(editor).toHaveAttribute('contenteditable', 'true')
        await editor.pressSequentially('Важное')
        await assertClickable(page.getByRole('button', { name: 'Сохранить мысль' }))
      },
    })
    const reflectionRequest = page.waitForRequest(request => {
      const url = new URL(request.url())
      return request.method() === 'POST' && url.pathname === '/api/themes/701/reflect'
    })
    await page.getByRole('button', { name: 'Сохранить мысль' }).click()
    const reflectionPayload = (await reflectionRequest).postDataJSON()
    expect(reflectionPayload.text.trim()).toBe('Важное')
    // «Назад» из ThemeScreen → карусель, ещё «Назад» → Сегодня
    await page.getByRole('button', { name: 'Назад' }).click()
    // После открытия другой темы из «Другие темы» — есть хотя бы один вопрос
    await page.getByRole('button', { name: /Границы и забота о себе/ }).first().click()
    await expect(page.locator('.mx-tqc-card').first()).toBeVisible()
    await expect(page.locator('.mx-tqc-card__question').first()).toBeVisible()
    await page.getByRole('button', { name: 'Назад' }).click()

    await page.getByRole('button', { name: 'Шаги' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'Practices',
      slug: '03-practices',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByRole('heading', { name: 'практики.' })).toBeVisible()
        const journalEntry = page.getByRole('button', { name: 'Открыть журнал' })
        await assertClickable(journalEntry)
        const collectionsHeading = page.getByRole('heading', { name: 'Коллекции' })
        await expect(collectionsHeading).toBeVisible()
        const journalBox = await journalEntry.boundingBox()
        const collectionsBox = await collectionsHeading.boundingBox()
        expect(journalBox?.y || 0).toBeLessThan(collectionsBox?.y || Number.POSITIVE_INFINITY)
        await assertSoonControls(page)
        await assertClickable(page.getByRole('button', { name: 'Открыть Ритуалы' }))
        await assertClickable(page.getByRole('button', { name: 'Открыть Аскезы' }))
        const productionCardTypography = await page.evaluate(() => {
          const catalog = document.querySelector('.mx-steps-explore-catalog')
          const rail = catalog?.querySelector('.mx-steps-rail')
          const practiceTitle = [...(rail?.querySelectorAll('strong') || [])].find(title =>
            title.textContent?.includes('Даймон')
          )
          const practiceCopy = rail?.querySelector('small')
          const collectionCopy = catalog?.querySelector('.mx-steps-collection__desc')
          // Ряд — full-bleed до края экрана: граница — окно, а не поля каталога.
          const catalogRect = { right: window.innerWidth }
          const railRect = rail?.getBoundingClientRect()
          const fontSize = element =>
            element ? Number.parseFloat(getComputedStyle(element).fontSize) : 0

          return {
            catalogRight: catalogRect?.right ?? window.innerWidth + 1,
            gridRight: railRect?.right ?? window.innerWidth + 1,
            titleClipped: practiceTitle
              ? practiceTitle.scrollHeight > practiceTitle.clientHeight + 1
              : true,
            practiceCopySize: fontSize(practiceCopy),
            collectionCopySize: fontSize(collectionCopy),
          }
        })
        expect(productionCardTypography.gridRight).toBeLessThanOrEqual(
          productionCardTypography.catalogRight + 1
        )
        expect(productionCardTypography.titleClipped).toBe(false)
        expect(productionCardTypography.practiceCopySize).toBeGreaterThanOrEqual(11)
        expect(productionCardTypography.collectionCopySize).toBeGreaterThanOrEqual(11)
      },
    })

    // ── Daily Journal «Страница для себя» (новый флоу) ──
    await page.getByTestId('journal-open-cta').click()
    await captureScreen({
      page,
      viewport,
      screen: 'Journal intro',
      slug: '03b-journal-intro',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByRole('heading', { name: 'Страница для себя' })).toBeVisible()
        await assertClickable(page.getByTestId('dj-intro-skip'))
        await assertClickable(page.getByTestId('dj-intro-setup'))
      },
    })
    // «Начать без настройки» — короткий путь сразу в поток
    await page.getByTestId('dj-intro-skip').click()
    await captureScreen({
      page,
      viewport,
      screen: 'Journal flow',
      slug: '03c-journal-flow',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByTestId('dj-stream-input')).toBeVisible()
        await assertClickable(page.getByTestId('dj-stream-next'))
      },
    })
    // Поток: вводим текст → ✓ (далее в вопрос)
    await page.getByTestId('dj-stream-input').fill('Замечаю главное, пишу без оценки.')
    await page.getByTestId('dj-stream-next').click()
    // Вопрос дня: вводим ответ → ✓ (сохранить)
    await expect(page.getByTestId('dj-question-input')).toBeVisible()
    await page.getByTestId('dj-question-input').fill('Один спокойный шаг.')
    await page.getByTestId('dj-question-next').click()
    await captureScreen({
      page,
      viewport,
      screen: 'Journal complete',
      slug: '03d-journal-complete',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.locator('.mx-completion')).toBeVisible()
        await assertClickable(page.getByTestId('dj-complete-close'))
      },
    })
    // Выход → повторный вход в тот же день: экран сегодняшней записи с «Дописать»
    await page.getByTestId('dj-complete-close').click()
    await expect(page.getByRole('heading', { name: 'практики.' })).toBeVisible()
    await page.getByTestId('journal-open-cta').click()
    await expect(page.getByTestId('dj-today')).toBeVisible()
    await assertClickable(page.getByTestId('dj-today-append'))
    // Выход обратно в практики
    await page.getByTestId('back-button').click()
    await expect(page.getByRole('heading', { name: 'практики.' })).toBeVisible()
    await page.getByRole('button', { name: 'Открыть Даймон' }).click()
    await expect(page.getByRole('heading', { name: 'Даймон' })).toBeVisible()
    await page.getByRole('button', { name: 'Назад' }).click()
    await expect(page.getByRole('heading', { name: 'практики.' })).toBeVisible()

    // Коллекция ведёт прямо в единый список практик, без промежуточного экрана.
    await page.getByRole('button', { name: 'Открыть Ритуалы' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'Rituals',
      slug: '04-rituals',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByRole('heading', { name: 'новый ритуал.' })).toBeVisible()
        await assertClickable(page.getByRole('button', { name: 'Свой ритуал' }))
      },
    })
    await page.getByRole('button', { name: 'Назад' }).click()
    const todayNavButton = page.locator('nav[aria-hidden="false"] > button[aria-label="Сегодня"]')
    await todayNavButton.click()
    await expect(todayNavButton).toHaveAttribute('aria-current', 'page')
    await page.getByRole('button', { name: 'Шаги' }).click()
    await expect(page.getByRole('heading', { name: 'практики.' })).toBeVisible()

    await page.getByRole('button', { name: 'Открыть Аскезы' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'Ascezas',
      slug: '05-ascezas',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByRole('heading', { name: 'новая аскеза.' })).toBeVisible()
        await assertClickable(page.getByRole('button', { name: 'Своя аскеза' }))
      },
    })
    await page.getByRole('button', { name: 'Назад' }).click()
    await todayNavButton.click()
    await expect(todayNavButton).toHaveAttribute('aria-current', 'page')
    await page.getByRole('button', { name: 'Шаги' }).click()
    await expect(page.getByRole('heading', { name: 'практики.' })).toBeVisible()

    await page.getByRole('button', { name: 'Библиотека' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'Library',
      slug: '07-library',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByRole('heading', { name: 'библиотека.' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Открыть поиск' })).toHaveCount(0)
        await assertLibrarySoonControl(page)
      },
    })

    // Плитка → шторка → чтение → возврат в главный каталог.
    await page.getByTestId('library-article-tile').first().click()
    await expect(page.getByTestId('article-sheet')).toBeVisible()
    await page.getByTestId('article-sheet-read').click()
    await expect(page.getByTestId('article-reader')).toBeVisible()
    await page.getByTestId('demo-chrome-back').click()
    await expect(page.getByTestId('library-home')).toBeVisible()

    await page.getByRole('button', { name: 'Прогресс' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'Trends',
      slug: '08-trends',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByRole('heading', { name: 'аналитика.' })).toBeAttached()
        await expect(page.getByRole('button', { name: 'Прогресс' })).toHaveAttribute(
          'aria-current',
          'page'
        )
      },
    })

    await context.close()
  }

  await writeFile(path.join(ARTIFACT_ROOT, 'report.md'), buildReport(results), 'utf8')

  const visualDiffs = results
    .filter(result => result.status === 'visual_diff')
    .map(result => {
      const slug = result.screenshot.replace(/^[^/]+\//, '').replace(/\.png$/, '')
      return {
        screen: result.screen,
        slug,
        viewport: result.viewport,
        actual: result.screenshot,
        reason: result.reason,
      }
    })
  await writeFile(
    path.join(ARTIFACT_ROOT, 'visual-diffs.json'),
    JSON.stringify({ diffs: visualDiffs }, null, 2),
    'utf8'
  )

  const failed = results.filter(result => result.status === 'fail')
  expect(
    failed,
    `UX check: ${failed.map(item => `${item.viewport}/${item.screen}`).join(', ')}`
  ).toEqual([])
})

test('Mentor PersonaPicker сохраняет тематическую рамку без pager и gap под навигацией', async ({
  browser,
  baseURL,
}) => {
  const layouts = [
    ...VIEWPORTS,
    { name: '393x852', width: 393, height: 852 }, // iPhone 16
    { name: '402x874', width: 402, height: 874 }, // iPhone 16 Pro
    { name: '430x932', width: 430, height: 932 }, // iPhone 16 Pro Max
    { name: '768x1024', width: 768, height: 1024 },
    { name: '1280x800', width: 1280, height: 800 },
  ]

  for (const viewport of layouts) {
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
    await freezePageTime(page)
    const runtimeErrors = []
    page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`))
    page.on('console', message => {
      if (message.type() === 'error' && !isIgnorableConsoleError(message.text())) {
        runtimeErrors.push(`console.error: ${message.text()}`)
      }
    })

    await page.goto('/')
    await page.getByRole('button', { name: 'Диалог' }).click()
    await expect(page.getByRole('heading', { name: /О чём хочешь/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Выбери роль/ })).toBeVisible()
    const cards = page.getByTestId('mentor-persona-card')
    await expect(cards).toHaveCount(4)
    // 4-я карточка — Даймон (открывает игру, а не создаёт разговор).
    await expect(cards.last()).toContainText('Даймон')
    // Активная карточка — полного размера (204px), соседние уменьшены
    // масштабом ~0.86 и приглушены: карусель ролей повторяет поведение
    // «Темы недели» в «Шагах» (PersonaPicker.applyScale).
    const activeCard = page.locator('[data-testid="mentor-persona-card"][aria-current="true"]')
    await expect(activeCard).toHaveCount(1)
    const cardGeometry = await activeCard.evaluate(element => {
      const rect = element.getBoundingClientRect()
      return { y: rect.y, width: rect.width, height: rect.height }
    })
    expect(
      cardGeometry.width,
      'Активная карточка должна оставаться компактной (204px)'
    ).toBeCloseTo(204, 0)
    expect(cardGeometry.height, 'Карточка должна иметь устойчивую высоту').toBeGreaterThan(200)
    const neighborGeometry = await cards.first().evaluate(element => {
      const rect = element.getBoundingClientRect()
      return {
        width: rect.width,
        center: rect.top + rect.height / 2,
        opacity: Number(getComputedStyle(element).opacity),
      }
    })
    expect(
      neighborGeometry.width,
      'Соседняя карточка должна быть уменьшена масштабом ~0.86'
    ).toBeLessThan(cardGeometry.width)
    expect(neighborGeometry.opacity, 'Соседняя карточка должна быть приглушена').toBeLessThan(0.5)
    expect(
      Math.abs(neighborGeometry.center - (cardGeometry.y + cardGeometry.height / 2)),
      'Соседняя карточка должна стоять по центру активной'
    ).toBeLessThanOrEqual(1)
    expect(
      await cards.evaluateAll(elements =>
        elements.map(element => getComputedStyle(element).borderTopWidth)
      )
    ).toEqual(['1px', '1px', '1px', '1px'])
    await expect(page.getByRole('group', { name: 'Выбор роли' })).toHaveCount(0)
    const navigationBox = await page.locator('nav').locator('..').locator('..').boundingBox()
    expect(navigationBox).not.toBeNull()
    // Панель стоит на штатном нижнем отступе приложения: без лишнего зазора,
    // но и без наезда на край. Отступ читаем из токена, чтобы проверка не
    // зависела от того, прижат navbar к краю или плавает.
    const navOffset = await page.evaluate(
      () =>
        Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue('--bottom-nav-offset')
        ) || 0
    )
    expect(
      Math.abs(viewport.height - (navigationBox.y + navigationBox.height) - navOffset),
      'BottomNavigation должна стоять на штатном нижнем отступе без legacy gap'
    ).toBeLessThanOrEqual(0.5)
    // Раньше карточка была прижата к панели на 15–17px: «Диалог» был
    // фиксированным экраном. Теперь он листается страницей целиком (см.
    // tests/ux/dialog-screen.spec.mjs), поэтому здесь проверяем только то,
    // что навигация стоит на своём штатном месте без лишнего зазора.

    if (viewport.width <= 430) {
      const track = page.getByTestId('mentor-persona-track')
      // pan-x pan-y: горизонтальный свайп карусели + вертикальная прокрутка
      // (anti-zoom: pan-y глобально, pan-x добавлен точечно для каруселей)
      await expect(track).toHaveCSS('touch-action', 'pan-x pan-y')
      // Ширина в разметке (204px), а не визуальная: сосед уменьшен масштабом.
      const cardWidth = await cards.first().evaluate(element => element.offsetWidth)
      await track.evaluate((element, scrollLeft) => {
        element.scrollLeft = scrollLeft
        element.dispatchEvent(new Event('scroll'))
      }, cardWidth + 12)
      await expect(cards.nth(1)).toHaveAttribute('aria-current', 'true')
    }

    const cardTextGeometry = await cards.evaluateAll(elements =>
      elements.map(element => {
        const cardRect = element.getBoundingClientRect()
        const textNodes = [...element.querySelectorAll('h3, p')]
        const textRects = textNodes
          .map(node => node.getBoundingClientRect())
          .filter(rect => rect.width > 0 && rect.height > 0)
        return {
          cardRight: cardRect.right,
          cardLeft: cardRect.left,
          textRight: Math.max(...textRects.map(rect => rect.right)),
          textLeft: Math.min(...textRects.map(rect => rect.left)),
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
        }
      })
    )
    for (const geometry of cardTextGeometry) {
      expect(
        geometry.textRight,
        'Текст не должен выходить за правую границу карточки'
      ).toBeLessThanOrEqual(geometry.cardRight + 0.5)
      expect(
        geometry.textLeft,
        'Текст не должен выходить за левую границу карточки'
      ).toBeGreaterThanOrEqual(geometry.cardLeft - 0.5)
      expect(
        geometry.scrollWidth,
        'Карточка не должна иметь горизонтального overflow'
      ).toBeLessThanOrEqual(geometry.clientWidth)
    }
    const mentorCard = cards.filter({ hasText: 'Наставник' })
    const sideCard = cards.filter({ hasText: 'Спутник' })
    await sideCard.click()
    await expect(sideCard).toHaveAttribute('aria-current', 'true')
    await expect(mentorCard).not.toHaveAttribute('aria-current', 'true')
    await expect(page.getByText('История kompas')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Назад' })).toHaveCount(0)

    await mentorCard.click()
    await expect(mentorCard).toHaveAttribute('aria-current', 'true')
    await expect(
      mentorCard.getByRole('button', { name: 'Начать разговор: Наставник' })
    ).toBeVisible()
    await expect(page.getByText('История kompas')).toHaveCount(0)

    await mentorCard.getByRole('button', { name: 'Начать разговор: Наставник' }).click()
    await expect(page.getByText('История kompas')).toBeVisible()
    await expect(page.getByText('История mayak')).toHaveCount(0)
    await assertClickable(page.getByRole('button', { name: 'Назад' }))
    await assertCommonScreenChecks(page, runtimeErrors)

    await context.close()
  }
})

test.skip('Legacy: History показывает user-scoped local Journal на mobile и tablet', async ({
  browser,
  baseURL,
}) => {
  const layouts = [
    { name: '390x844', width: 390, height: 844 },
    { name: '768x1024', width: 768, height: 1024 },
  ]
  const journalStore = {
    version: 2,
    entries: {
      '2026-08-27': {
        date: '2026-08-27',
        version: 2,
        cycle: {
          idea: { text: 'Сначала замечаю главное.', status: 'draft' },
          action: { text: 'Делаю один спокойный шаг.', status: 'draft' },
          analysis: { text: '', status: 'draft' },
          newStep: { text: '', status: 'draft' },
        },
        freeWrites: [],
        updatedAt: '2026-08-27T12:00:00.000Z',
      },
    },
  }

  for (const viewport of layouts) {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: viewport.width, height: viewport.height },
      colorScheme: 'dark',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    })

    await context.addInitScript(
      ({ user, store }) => {
        localStorage.clear()
        sessionStorage.clear()
        localStorage.setItem('mentalix_web_user', JSON.stringify(user))
        localStorage.setItem('mx-onboarded-v2', '1')
        localStorage.setItem('mx-app-lock-enabled', '0')
        localStorage.setItem(`mx-journal-v2:user:${user.id}`, JSON.stringify(store))
      },
      { user: TEST_USER, store: journalStore }
    )

    await context.route('**/api/**', route => {
      const pathname = new URL(route.request().url()).pathname
      if (route.request().method() === 'GET' && pathname === '/api/rituals') {
        return route.fulfill(jsonResponse([{ id: 1, title: 'Тестовый ритуал' }]))
      }
      return route.fulfill(fixtureFor(route.request()))
    })

    const page = await context.newPage()
    await freezePageTime(page)
    const runtimeErrors = []
    page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`))
    page.on('response', response => {
      if (response.status() >= 500) {
        runtimeErrors.push(`HTTP ${response.status()}: ${new URL(response.url()).pathname}`)
      }
    })
    page.on('console', message => {
      if (message.type() === 'error' && !isIgnorableConsoleError(message.text())) {
        runtimeErrors.push(`console.error: ${message.text()}`)
      }
    })

    await page.goto('/')
    await page.getByRole('button', { name: 'История' }).click()
    await page.getByRole('button', { name: 'История' }).click()
    await expect(page.getByTestId('local-journal-history')).toBeVisible()
    await expect(page.getByText('Локальный журнал')).toBeVisible()
    await expect(page.getByText('2/4 шага')).toBeVisible()
    await expect(page.getByText('Идея')).toBeVisible()
    await expect(page.getByText('Действие')).toBeVisible()
    await expect(page.getByText('Сначала замечаю главное.')).toBeVisible()
    await expect(page.getByText('Делаю один спокойный шаг.')).toBeVisible()
    await assertCommonScreenChecks(page, runtimeErrors)

    await context.close()
  }
})

test('прямая web-ссылка автоматически создаёт гостя; email и Telegram доступны из Профиля', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'block',
  })
  await context.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('mx-onboarded-v2', '1')
  })
  const guest = { id: 900002, first_name: 'Гость', is_guest: true }
  let guestRequests = 0
  let mergeRequests = 0
  await context.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/auth/guest') {
      guestRequests += 1
      return route.fulfill(
        jsonResponse({
          ok: true,
          user: guest,
          merge_token: 'merge-guest',
          session_token: 'guest-session',
        })
      )
    }
    if (path === '/api/auth/email/verify')
      return route.fulfill(
        jsonResponse({ ok: true, user: TEST_USER, session_token: 'email-session' })
      )
    if (path === '/api/auth/guest/merge') {
      mergeRequests += 1
      expect(route.request().postDataJSON().merge_token).toBe('merge-guest')
      return route.fulfill(jsonResponse({ user: TEST_USER }))
    }
    return route.fulfill(fixtureFor(route.request()))
  })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByTestId('today-profile-button')).toBeVisible()
  expect(guestRequests).toBe(1)
  await expect(page.getByRole('heading', { name: 'Вход по email' })).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('mentalix_session_token'))).toBe(
    'guest-session'
  )
  expect(await page.evaluate(() => localStorage.getItem('mentalix_guest_merge_token'))).toBe(
    'merge-guest'
  )

  await page.getByTestId('today-profile-button').click()
  await page.getByTestId('profile-guest-login-link').click()
  await expect(page.getByRole('heading', { name: 'Вход по email' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Или через Telegram' })).toBeHidden()
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Email' }).fill('test@example.com')
  await page.getByRole('button', { name: 'Получить письмо' }).click()
  await page.getByRole('textbox', { name: 'Код из email' }).fill('123456')
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page.getByTestId('profile-screen')).toBeVisible()
  await expect(page.getByTestId('profile-guest-login-link')).toHaveCount(0)
  expect(mergeRequests).toBe(1)
  expect(await page.evaluate(() => localStorage.getItem('mentalix_guest_merge_token'))).toBeNull()
  await context.close()
})

test('ошибка гостевого входа оставляет рабочий email и повтор гостевого входа', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ baseURL, serviceWorkers: 'block' })
  await context.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  let attempts = 0
  await context.route('**/api/**', route => {
    if (new URL(route.request().url()).pathname === '/api/auth/guest') {
      attempts += 1
      return route.fulfill(
        jsonResponse(
          attempts === 1
            ? { error: 'unavailable' }
            : { ok: true, user: TEST_USER, merge_token: 'retry' },
          attempts === 1 ? 503 : 200
        )
      )
    }
    return route.fulfill(fixtureFor(route.request()))
  })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Вход по email' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Или через Telegram' })).toBeHidden()
  await page.getByTestId('web-auth-guest-button').click()
  await expect(page.getByText(/Пара вопросов — и приложение/)).toBeVisible()
  expect(attempts).toBe(2)
  await context.close()
})

test('email-подтверждение не запускает автогостя', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, serviceWorkers: 'block' })
  await context.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  let guestRequests = 0
  await context.route('**/api/**', route => {
    if (new URL(route.request().url()).pathname === '/api/auth/guest') guestRequests += 1
    return route.fulfill(fixtureFor(route.request()))
  })
  const page = await context.newPage()
  await page.goto('/?email=test%40example.com&code=123456')
  await expect(page.getByRole('heading', { name: 'Вход по email' })).toBeVisible()
  expect(guestRequests).toBe(0)
  await page.goto('/?token=magic-link-token')
  await expect(page.getByRole('heading', { name: 'Вход по email' })).toBeVisible()
  expect(guestRequests).toBe(0)
  await context.close()
})

test('Telegram Mini App не создаёт web-гостя', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, serviceWorkers: 'block' })
  await context.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
    window.TelegramWebviewProxy = { postEvent() {} }
  })
  let guestRequests = 0
  await context.route('**/api/**', route => {
    if (new URL(route.request().url()).pathname === '/api/auth/guest') guestRequests += 1
    return route.fulfill(fixtureFor(route.request()))
  })
  const page = await context.newPage()
  await page.goto('/')
  await expect(
    page.getByText('Открой приложение через кнопку в боте, чтобы Менталикс увидел тебя')
  ).toBeVisible()
  expect(guestRequests).toBe(0)
  await expect(page.getByRole('heading', { name: 'Вход по email' })).toHaveCount(0)
  await context.close()
})

test('Today не маскирует ошибку критичного API под пустой список практик', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
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
  // Ускоряем автоповтор Today: 503 повторяемая, все попытки падают —
  // экран ошибки должен появиться после исчерпания автоповторов.
  await context.addInitScript(() => {
    window.__MX_TODAY_RETRY_DELAYS_MS__ = [0, 0, 0]
  })

  await context.route('**/api/**', route => {
    const pathname = new URL(route.request().url()).pathname

    if (pathname === '/api/rituals') {
      return route.fulfill(jsonResponse({ error: 'fixture failure' }, 503))
    }

    return route.fulfill(fixtureFor(route.request()))
  })

  const page = await context.newPage()
  await freezePageTime(page)
  await page.goto('/')

  await expect(page.getByRole('alert')).toHaveText(/Обычно это меньше минуты/)
  await expect(page.getByText('Добавь первый ритуал')).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Повторить' })).toBeEnabled()

  await context.close()
})

test('Today retry после критичного сбоя повторно загружает данные без пустого cache snapshot', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
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
  // Автоповтор Today переживает кратковременный сбой без участия
  // пользователя: ускоряем задержки, чтобы 4 попытки уложились в тест.
  await context.addInitScript(() => {
    window.__MX_TODAY_RETRY_DELAYS_MS__ = [0, 0, 0]
  })
  let ritualsRequests = 0
  await context.route('**/api/**', route => {
    const pathname = new URL(route.request().url()).pathname
    if (route.request().method() === 'GET' && pathname === '/api/rituals') {
      ritualsRequests += 1
      if (ritualsRequests <= 3) {
        return route.fulfill(jsonResponse({ error: 'temporary fixture failure' }, 503))
      }
    }
    return route.fulfill(fixtureFor(route.request()))
  })
  const page = await context.newPage()
  await freezePageTime(page)
  await page.goto('/')
  // 3 попытки падают (503 — повторяемая), 4-я успешна: данные дня
  // загружаются, пустой cache snapshot не создаётся, экран ошибки не нужен.
  await expect.poll(() => ritualsRequests).toBe(4)
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Шаги' })).toBeVisible()
  await context.close()
})

test('Evening Review проходится real touch tap на 390x844', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
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
  await freezePageTime(page)
  await page.goto('/?ui_lab=experiments')

  const entryCta = page.getByRole('button', { name: 'Разобрать день' }).last()
  await expect(entryCta).toBeVisible()
  await entryCta.tap()
  await expect(page.getByText('Фактический результат')).toBeVisible()

  for (const option of [
    'Сделал главное',
    'Ясность',
    'Маленький шаг помогает',
    'Начать с пяти минут',
  ]) {
    await page.getByRole('radio', { name: option }).tap()
    await page.getByRole('button', { name: /Дальше|Закрыть день/ }).tap()
  }

  await expect(page.getByText('День закрыт')).toBeVisible()
  await page.locator('.mx-evening-review__closed').getByRole('button', { name: 'Продолжить' }).tap()
  await expect(page.getByRole('button', { name: 'Разобрать день' }).last()).toBeVisible()
  await context.close()
})

test('старый флаг настроения не блокирует Сегодня и отсутствует в настройках', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, serviceWorkers: 'block' })
  await context.addInitScript(user => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('mentalix_web_user', JSON.stringify(user))
    localStorage.setItem('mx-onboarded-v2', '1')
    localStorage.setItem('mx-mood-check-enabled', '1')
  }, TEST_USER)
  await context.route('**/api/**', route => route.fulfill(fixtureFor(route.request())))
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByTestId('today-card-morning')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Как ты сейчас?' })).toHaveCount(0)
  await page.getByTestId('today-profile-button').click()
  await page.getByTestId('profile-row-checkins').click()
  await expect(page.getByTestId('profile-row-mood-check')).toHaveCount(0)
  await expect(page.getByTestId('profile-row-review-hour')).toBeVisible()
  await context.close()
})

test('завершённые карточки сохраняют высоту без рисунка и линии', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, serviceWorkers: 'block' })
  await context.addInitScript(user => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('mentalix_web_user', JSON.stringify(user))
    localStorage.setItem('mx-onboarded-v2', '1')
  }, TEST_USER)
  await context.route('**/api/**', route => {
    if (new URL(route.request().url()).pathname === '/api/checkin/today') {
      return route.fulfill(jsonResponse({ mood: 3, review_completed_at: new Date().toISOString() }))
    }
    return route.fulfill(fixtureFor(route.request()))
  })
  const page = await context.newPage()
  await page.goto('/')
  for (const kind of ['morning', 'evening']) {
    const card = page.getByTestId(`today-card-${kind}`)
    await expect(card).toHaveAttribute('data-state', 'done')
    await expect(card.getByTestId('today-card-illustration')).toHaveCount(0)
    await expect(card).toHaveCSS('height', '260px')
  }
  await context.close()
})

test('демо на реальном телефоне 440×956 — капсула активной вкладки, сворачивание навбара, production-размеры', async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 440, height: 956 },
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })

  // В демо-режиме API перехватывается демо-данными (demoRequest в demoMode.js).
  await context.route('**/api/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  )

  const page = await context.newPage()
  await page.goto('/?demo=1')

  // Дождаться загрузки приложения
  await expect(page.getByRole('button', { name: 'Шаги' })).toBeVisible({ timeout: 15_000 })

  // data-mentalix-demo-frame не должен быть установлен на реальном телефоне
  // (иначе активная вкладка прозрачная, nav полноширинный, заголовки скрыты)
  const shell = page.locator('.mx-app-shell')
  await expect(shell).not.toHaveAttribute('data-mentalix-demo-frame', 'true')

  // 1. Активная вкладка имеет видимую капсулу (не прозрачный фон)
  const activeTab = page.locator('.mx-bottom-nav > div nav button.is-active').first()
  await expect(activeTab).toBeVisible()
  const activeBg = await activeTab.evaluate(el => getComputedStyle(el).backgroundColor)
  expect(activeBg, 'активная вкладка должна иметь видимый фон-капсулу').not.toBe('rgba(0, 0, 0, 0)')
  expect(activeBg, 'активная вкладка не должна быть прозрачной').not.toBe('transparent')

  // 2. Размеры кнопки профиля 43×43 (±1) и отступ контента 21 (±1)
  const profileButton = page.getByTestId('today-profile-button')
  await expect(profileButton).toBeVisible()
  const profileBox = await profileButton.boundingBox()
  expect(Math.abs(profileBox.width - 43), 'ширина кнопки профиля ≈ 43px').toBeLessThanOrEqual(1)
  expect(Math.abs(profileBox.height - 43), 'высота кнопки профиля ≈ 43px').toBeLessThanOrEqual(1)
  // Отступ от правого края экрана до кнопки профиля = --mx-header-edge (21px)
  const rightOffset = 440 - (profileBox.x + profileBox.width)
  expect(Math.abs(rightOffset - 21), 'отступ контента ≈ 21px').toBeLessThanOrEqual(1)

  // 3. После прокрутки вниз на 600px навбар сворачивается.
  // Демо-контент при 440px может не переполнять scroll-root, поэтому
  // добавляем spacer, чтобы гарантировать возможность прокрутки.
  await page.evaluate(() => {
    const content = document.querySelector('.mx-app-scroll-root > div')
    if (content) {
      const spacer = document.createElement('div')
      spacer.style.height = '800px'
      spacer.style.width = '100%'
      spacer.setAttribute('data-testid', 'scroll-test-spacer')
      content.appendChild(spacer)
    }
    const root = document.querySelector('.mx-app-scroll-root')
    if (root) {
      root.scrollTop = 600
      root.dispatchEvent(new Event('scroll', { bubbles: true }))
    }
  })
  await expect(
    page.locator('.mx-bottom-nav.mx-demo-bottom-nav--collapsed'),
    'навбар должен свернуться после прокрутки вниз'
  ).toHaveCount(1, { timeout: 5_000 })
  const restore = page.getByRole('button', { name: 'Открыть навигацию: Сегодня' })
  await expect(restore).toBeVisible()
  await expect(restore.locator('svg')).toBeVisible()
  await expect(page.locator('.mx-bottom-nav nav')).toHaveAttribute('aria-hidden', 'true')
  await restore.tap()
  await expect(page.locator('.mx-bottom-nav nav')).toHaveAttribute('aria-hidden', 'false')
  await expect(page.getByRole('button', { name: 'Шаги' })).toBeVisible()

  // 4. После прокрутки вверх навбар раскрывается
  await page.evaluate(() => {
    const root = document.querySelector('.mx-app-scroll-root')
    if (root) {
      root.scrollTop = 0
      root.dispatchEvent(new Event('scroll', { bubbles: true }))
    }
  })
  await expect(
    page.locator('.mx-bottom-nav.mx-demo-bottom-nav--collapsed'),
    'навбар должен раскрыться после прокрутки вверх'
  ).toHaveCount(0, { timeout: 5_000 })

  await context.close()
})

test('Today при медленном API: «Сегодня» видно ≤2 с, потом данные подтягиваются в фоне', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
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

  // Имитируем холодный старт Render free: все API-запросы (кроме health)
  // отвечают с задержкой 3 с — дольше, чем скелетон (2 с), но достаточно
  // быстро для теста. health отвечает мгновенно (сигнал пробуждения).
  const SLOW_DELAY_MS = 3000
  await context.route('**/api/**', async route => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname === '/api/health') {
      return route.fulfill(jsonResponse({ status: 'ok' }))
    }
    await new Promise(resolve => setTimeout(resolve, SLOW_DELAY_MS))
    return route.fulfill(fixtureFor(route.request()))
  })

  const page = await context.newPage()
  await freezePageTime(page)
  await page.goto('/')

  // ≤2 с: скелетон («Загрузка…») или шапка «Сегодня» видны — не пустой экран.
  await expect(page.getByText('Загрузка...')).toBeVisible({ timeout: 2_000 })

  // После 2 с: скелетон сменяется экраном «Сегодня» с «Подключаемся…».
  await expect(page.getByTestId('today-connecting')).toBeVisible({ timeout: 5_000 })
  await expect(page.getByText('Загрузка...')).toHaveCount(0)

  // После ответа API (~3 с): данные появляются, «Подключаемся…» исчезает.
  await expect(page.getByTestId('today-theme-card')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('today-connecting')).toHaveCount(0)

  await context.close()
})

/*
 * WebKit (iPhone 15 Pro, 393×852): регрессия «Что на уме?» — первый тап
 * по кнопке «→» при открытой клавиатуре iOS не срабатывал (pointerdown
 * забирал фокус у contentEditable, клавиатура закрывалась, кнопка смещалась,
 * click не доходил). Фикс — onPointerDown preventDefault на RoundSubmitButton.
 * Тест: ввести текст → один тап → переход на экран завершения.
 */
test('WebKit iPhone 15 Pro: «Что на уме?» — один тап по кнопке переходит дальше', async ({
  playwright,
}) => {
  const browser = await playwright.webkit.launch()
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4173',
    ...devices['iPhone 15 Pro'],
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })
  await context.route('**/api/**', route => route.fulfill(fixtureFor(route.request())))
  const page = await context.newPage()

  await page.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('mx-onboarded-v2', '1')
    localStorage.setItem('mx-app-lock-enabled', '0')
  })

  await page.goto('/?demo=1&action=mind_step')
  // ?demo=1&action=mind_step задаёт начальный шаг внутри MorningCheckInFlow,
  // но оверлей чек-ина нужно открыть явно — кликом по карточке утра.
  await expect(page.getByTestId('today-card-morning')).toBeVisible({ timeout: 15_000 })
  await page.getByTestId('today-card-morning').tap()
  await expect(page.getByRole('heading', { name: 'Что на уме?' })).toBeVisible({
    timeout: 15_000,
  })

  const editor = page.getByRole('textbox', { name: 'Что на уме' })
  await expect(editor).toBeVisible()
  await editor.pressSequentially('Спокойное утро')

  const submit = page.locator('[data-testid="checkin-complete"]')
  await expect(submit).toBeVisible()
  await expect(submit).toBeEnabled()
  // Один тап — должен сразу перейти на экран завершения, без потери тапа.
  await submit.tap()

  await expect(page.getByTestId('checkin-back-to-today')).toBeVisible({ timeout: 10_000 })

  await context.close()
  await browser.close()
})
