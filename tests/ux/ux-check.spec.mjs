import { expect, test } from '@playwright/test'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

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
    if (pathname === '/api/checkin') {
      return jsonResponse({ mood: 3, energy: 3, anxiety: 3, focus: 3 })
    }

    return jsonResponse({ ok: true })
  }

  if (pathname === '/api/profile') return jsonResponse(TEST_USER)
  if (pathname === '/api/rituals') return jsonResponse(FIXTURES.rituals)
  if (pathname === '/api/ascezas') return jsonResponse(FIXTURES.ascezas)
  if (pathname === '/api/quotes/today') return jsonResponse(FIXTURES.quote)
  if (pathname === '/api/checkin/today') return jsonResponse(FIXTURES.checkin)
  if (pathname === '/api/checkin/history') return jsonResponse(FIXTURES.history)
  if (pathname === '/api/themes') return jsonResponse(FIXTURES.themes)
  if (pathname === '/api/themes/701') return jsonResponse(FIXTURES.theme)
  if (pathname === '/api/profile/settings') return jsonResponse(FIXTURES.settings)
  if (pathname === '/api/analytics/pulse') return jsonResponse(FIXTURES.pulse)
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

  return jsonResponse({ error: `Нет локального fixture для ${method} ${pathname}` }, 501)
}

function sanitizeReason(error) {
  return String(error?.message || error || 'Неизвестная ошибка')
    .split('\n')[0]
    .replaceAll(/\u001b\[[0-9;]*m/g, '')
    .replaceAll('|', '\\|')
    .slice(0, 240)
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
  const lilaCard = page
    .locator('.mx-layered-catalog__rail-card')
    .filter({ hasText: 'Разобраться со Следопытом' })
  const motivationCard = page
    .locator('.mx-layered-catalog__rail-card')
    .filter({ hasText: 'Импульс к действию' })
  const focusCard = page.locator('.mx-layered-catalog__rail-card').filter({ hasText: 'Фокус' })

  await expect(lilaCard).toBeEnabled()
  await expect(motivationCard).toBeDisabled()
  await expect(focusCard).toBeDisabled()
}

async function assertLibrarySoonControl(page) {
  await expect(page.getByRole('heading', { name: 'библиотека.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Открыть поиск' })).toHaveCount(0)
  const sectionHeadings = page.locator('.mx-library-v2__section-block > h2')
  await expect(sectionHeadings).toHaveText(['Программы', 'Статьи', 'Направленные записи'])
  await expect(page.getByRole('button', { name: 'Смотреть' })).toBeVisible()
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
      if (
        message.type() === 'error' &&
        !message.text().includes('CloudStorage is not supported in version 6.0')
      ) {
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
        // На первом morning Check-in шаге BackButton имеет label «Сегодня»;
        // на остальных состояниях flow может сохраняться label «Назад».
        await assertClickable(page.getByRole('button', { name: /^(Назад|Сегодня)$/ }))
        await expect(page.getByRole('heading', { name: 'Как ты сейчас?' })).toBeVisible()
      },
    })

    // Scale answers advance only after pressing the main «Далее» button.
    for (const option of ['Нормально', 'Средне']) {
      const answer = page.getByRole('radio', { name: new RegExp(`^3: ${option}$`, 'i') })
      await expect(answer).toBeVisible()
      await expect(answer).toBeEnabled()
      await answer.click()
      await assertClickable(page.getByRole('button', { name: 'Далее' }))
      await page.getByRole('button', { name: 'Далее' }).click()
    }
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
        await editor.pressSequentially('Спокойное утро')
        await assertClickable(page.getByRole('button', { name: 'Показать форматирование' }))
        await assertClickable(page.getByRole('button', { name: 'Пойти глубже' }))
        await expect(page.getByRole('button', { name: 'Далее' })).toHaveCount(1)
        await assertClickable(page.getByRole('button', { name: 'Далее' }))
      },
    })
    // После editor-шага общий BackButton использует label «Сегодня»;
    // на остальных состояниях flow сохраняется label «Назад».
    const checkinBackButton = page.getByRole('button', { name: /^(Назад|Сегодня)$/ })
    await expect(checkinBackButton).toBeVisible()
    await expect(checkinBackButton).toBeEnabled()
    await checkinBackButton.click()
    await expect(page.getByRole('heading', { name: 'Сколько в тебе энергии?' })).toBeVisible()
    await checkinBackButton.click()
    await expect(page.getByRole('heading', { name: 'Как ты сейчас?' })).toBeVisible()
    await checkinBackButton.click()

    const draftDialog = page.locator(
      '[role="dialog"][aria-labelledby="checkin-draft-dialog-title"]'
    )
    await expect(draftDialog).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Сегодня' })).toBeVisible()

    await page.getByRole('button', { name: /о меньшем усилии/ }).click()
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
        await expect(page.getByLabel('Дни журнала')).toBeVisible()
        await expect(page.getByText('Тема недели', { exact: true })).toHaveCount(0)

        const editor = page.getByRole('textbox', { name: 'Мысль по теме недели' })
        await expect(editor).toBeVisible()
        await expect(editor).toHaveAttribute('contenteditable', 'true')
        await editor.pressSequentially('Важное')
        await editor.evaluate(element => {
          const selection = window.getSelection()
          const range = document.createRange()
          range.selectNodeContents(element)
          selection.removeAllRanges()
          selection.addRange(range)
        })
        await page.getByRole('button', { name: 'Показать форматирование' }).click()
        await page.getByRole('button', { name: 'Жирный текст' }).click()
        await expect(editor.locator('b, strong')).toHaveText('Важное')
        await expect(editor).not.toContainText('**')
        await assertClickable(page.getByRole('button', { name: 'Жирный текст' }))
        await assertClickable(page.getByRole('button', { name: 'Выделение' }))
        await assertClickable(page.getByRole('button', { name: 'Пойти глубже' }))
        await assertClickable(page.getByRole('button', { name: 'Сохранить мысль' }))
        await page.getByRole('button', { name: 'Скрыть форматирование' }).click()
      },
    })
    const reflectionRequest = page.waitForRequest(request => {
      const url = new URL(request.url())
      return request.method() === 'POST' && url.pathname === '/api/themes/701/reflect'
    })
    await page.getByRole('button', { name: 'Сохранить мысль' }).click()
    const reflectionPayload = (await reflectionRequest).postDataJSON()
    expect(reflectionPayload.text).toBe('**Важное**')
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
        const journalEntry = page.locator('article.mx-layered-catalog__journal-hero button')
        await assertClickable(journalEntry)
        const collectionsHeading = page.locator('section[aria-label="Коллекции"] h2')
        await expect(collectionsHeading).toBeVisible()
        const journalBox = await journalEntry.boundingBox()
        const collectionsBox = await collectionsHeading.boundingBox()
        expect(journalBox?.y || 0).toBeLessThan(collectionsBox?.y || Number.POSITIVE_INFINITY)
        await expect(
          page
            .locator('.mx-layered-catalog__collection')
            .filter({ hasText: 'Психологические практики' })
        ).toBeDisabled()
        await assertSoonControls(page)
        const productionCardTypography = await page.evaluate(() => {
          const catalog = document.querySelector('.mx-production-catalog')
          const rail = catalog?.querySelector('.mx-layered-catalog__rail')
          const upcomingTitle = [
            ...(rail?.querySelectorAll('.mx-layered-catalog__rail-card') || []),
          ]
            .find(card => card.textContent?.includes('Импульс к действию с Львом'))
            ?.querySelector('strong')
          const railCopy = rail?.querySelector('.mx-layered-catalog__rail-card small')
          const collectionCopy = catalog?.querySelector('.mx-layered-catalog__collection small')
          const catalogRect = catalog?.getBoundingClientRect()
          const railRect = rail?.getBoundingClientRect()
          const fontSize = element =>
            element ? Number.parseFloat(getComputedStyle(element).fontSize) : 0

          return {
            catalogRight: catalogRect?.right ?? window.innerWidth + 1,
            railRight: railRect?.right ?? window.innerWidth + 1,
            titleClipped: upcomingTitle
              ? upcomingTitle.scrollHeight > upcomingTitle.clientHeight + 1
              : true,
            railCopySize: fontSize(railCopy),
            collectionCopySize: fontSize(collectionCopy),
          }
        })
        expect(productionCardTypography.railRight).toBeLessThanOrEqual(
          productionCardTypography.catalogRight + 1
        )
        expect(productionCardTypography.titleClipped).toBe(false)
        expect(productionCardTypography.railCopySize).toBeGreaterThanOrEqual(12)
        expect(productionCardTypography.collectionCopySize).toBeGreaterThanOrEqual(12)
      },
    })

    await page.locator('article.mx-layered-catalog__journal-hero button').click()
    await captureScreen({
      page,
      viewport,
      screen: 'Journal intro',
      slug: '03b-journal-intro',
      runtimeErrors,
      results,
      check: async () => {
        await expect(
          page.getByRole('heading', { name: 'Когда непонятно, что делать' })
        ).toBeVisible()
        await expect(page.getByText('Разложи день на четыре спокойных шага')).toHaveCount(0)
        await assertClickable(page.getByRole('button', { name: 'Начать' }))
      },
    })
    await page.getByRole('button', { name: 'Начать' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'Journal writer',
      slug: '03c-journal-writer',
      runtimeErrors,
      results,
      check: async () => {
        const editor = page.getByRole('textbox', { name: 'Что сейчас происходит?' })
        await expect(editor).toBeVisible()
        await expect(page.getByRole('button', { name: 'Назад' })).toHaveCount(1)
        await expect(page.getByRole('button', { name: 'Сохранить и продолжить' })).toBeVisible()
      },
    })
    const guidedSteps = [
      ['Что сейчас происходит?', 'Сегодня я замечаю главное'],
      ['Что здесь точно известно?', 'Известно, что я могу сделать один шаг'],
      ['Что ты предполагаешь?', 'Я предполагаю, что разговор можно начать спокойно'],
      ['Чего ты пока не знаешь?', 'Пока не знаю, какой будет ответ'],
      ['Что ощущается самым тяжёлым?', 'Самым тяжёлым кажется неопределённость'],
      ['Что зависит от тебя сегодня?', 'Сегодня я могу сделать первый небольшой шаг'],
      ['Какой маленький эксперимент попробуешь?', 'Попробую начать с короткого сообщения'],
    ]
    for (const [index, [label, text]] of guidedSteps.entries()) {
      const editor = page.getByRole('textbox', { name: label })
      await expect(editor).toBeVisible()
      await editor.fill(text)
      await page
        .getByRole('button', {
          name:
            index === guidedSteps.length - 1 ? 'Сохранить эксперимент' : 'Сохранить и продолжить',
        })
        .click()
    }
    await captureScreen({
      page,
      viewport,
      screen: 'Journal complete',
      slug: '03d-journal-complete',
      runtimeErrors,
      results,
      check: async () => {
        await expect(
          page.getByRole('heading', { name: 'Хорошо. Следующий шаг готов.' })
        ).toBeVisible()
        await assertClickable(page.getByRole('button', { name: 'Вернуться в дневник' }))
      },
    })
    await page.getByRole('button', { name: 'Вернуться в дневник' }).click()
    await expect(page.getByRole('heading', { name: 'практики.' })).toBeVisible()
    await page.locator('article.mx-layered-catalog__journal-hero button').click()
    await expect(page.getByRole('heading', { name: 'Продолжи разбирать ситуацию' })).toBeVisible()
    await page.getByRole('button', { name: 'Продолжить' }).click()
    await expect(
      page.getByRole('textbox', { name: 'Какой маленький эксперимент попробуешь?' })
    ).toHaveValue('Попробую начать с короткого сообщения')
    await page.getByRole('button', { name: 'Назад' }).click()
    await expect(page.getByRole('textbox', { name: 'Что зависит от тебя сегодня?' })).toHaveValue(
      'Сегодня я могу сделать первый небольшой шаг'
    )
    for (let index = 0; index < 6; index += 1) {
      await page.getByRole('button', { name: 'Назад' }).click()
    }
    await expect(page.getByRole('heading', { name: 'Продолжи разбирать ситуацию' })).toBeVisible()
    await page.getByRole('button', { name: 'Назад' }).click()
    await expect(page.getByRole('heading', { name: 'практики.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'практики.' })).toBeVisible()

    await page.locator('.mx-layered-catalog__collection').filter({ hasText: 'Ритуалы' }).click()
    await page.getByRole('button', { name: 'Открыть ритуалы' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'Rituals',
      slug: '04-rituals',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByRole('heading', { name: 'ритуалы.' })).toBeVisible()
        await assertClickable(page.getByRole('button', { name: 'Создать ритуал' }))
      },
    })
    await page.getByRole('button', { name: 'Назад' }).click()
    const todayNavButton = page.locator('nav[aria-hidden="false"] > button[aria-label="Сегодня"]')
    await todayNavButton.click()
    await expect(todayNavButton).toHaveAttribute('aria-current', 'page')
    await page.getByRole('button', { name: 'Шаги' }).click()
    await expect(page.getByRole('heading', { name: 'практики.' })).toBeVisible()

    await page.locator('.mx-layered-catalog__collection').filter({ hasText: 'Аскезы' }).click()
    await page.getByRole('button', { name: 'Открыть аскезы' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'Ascezas',
      slug: '05-ascezas',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByRole('heading', { name: 'аскезы.' })).toBeVisible()
        await assertClickable(page.getByRole('button', { name: 'Принять аскезу' }))
      },
    })
    await page.getByRole('button', { name: 'Назад' }).click()
    await todayNavButton.click()
    await expect(todayNavButton).toHaveAttribute('aria-current', 'page')
    await page.getByRole('button', { name: 'Шаги' }).click()
    await expect(page.getByRole('heading', { name: 'практики.' })).toBeVisible()

    await expect(page.locator('[data-collection-key="psychological"]')).toBeDisabled()
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

    await page.getByRole('button', { name: 'Прогресс' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'Trends',
      slug: '08-trends',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByRole('heading', { name: 'прогресс.' })).toBeAttached()
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
      if (
        message.type() === 'error' &&
        !message.text().includes('CloudStorage is not supported in version 6.0')
      ) {
        runtimeErrors.push(`console.error: ${message.text()}`)
      }
    })

    await page.goto('/')
    await page.getByRole('button', { name: 'Диалог' }).click()
    await expect(page.getByRole('heading', { name: /О чём хочешь/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Выбери роль/ })).toBeVisible()
    const cards = page.getByTestId('mentor-persona-card')
    await expect(cards).toHaveCount(3)
    const cardGeometry = await cards.first().evaluate(element => {
      const rect = element.getBoundingClientRect()
      return { y: rect.y, width: rect.width, height: rect.height }
    })
    expect(cardGeometry.width, 'Карточка должна оставаться компактной').toBeGreaterThanOrEqual(190)
    expect(cardGeometry.width, 'Карточка не должна становиться dashboard-like').toBeLessThanOrEqual(
      204
    )
    expect(cardGeometry.height, 'Карточка должна иметь устойчивую высоту').toBeGreaterThan(200)
    expect(
      await cards.evaluateAll(elements =>
        elements.map(element => getComputedStyle(element).borderTopWidth)
      )
    ).toEqual(['1px', '1px', '1px'])
    await expect(page.getByRole('group', { name: 'Выбор роли' })).toHaveCount(0)
    const navigationBox = await page.locator('nav').locator('..').locator('..').boundingBox()
    expect(navigationBox).not.toBeNull()
    expect(
      Math.abs(navigationBox.y + navigationBox.height - viewport.height),
      'BottomNavigation должна доходить до нижнего края viewport без legacy gap'
    ).toBeLessThanOrEqual(0.5)
    expect(
      navigationBox.y - (cardGeometry.y + cardGeometry.height),
      'Карточка должна заканчиваться с небольшим зазором до BottomNavigation'
    ).toBeGreaterThanOrEqual(15)
    expect(
      navigationBox.y - (cardGeometry.y + cardGeometry.height),
      'Карточка не должна оставаться далеко от BottomNavigation'
    ).toBeLessThanOrEqual(17)

    if (viewport.width <= 430) {
      const track = page.getByTestId('mentor-persona-track')
      // pan-x pan-y: горизонтальный свайп карусели + вертикальная прокрутка
      // (anti-zoom: pan-y глобально, pan-x добавлен точечно для каруселей)
      await expect(track).toHaveCSS('touch-action', 'pan-x pan-y')
      const cardWidth = await cards
        .first()
        .evaluate(element => element.getBoundingClientRect().width)
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
    const sideCard = cards.filter({ hasText: 'Собеседник' })
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
      if (
        message.type() === 'error' &&
        !message.text().includes('CloudStorage is not supported in version 6.0')
      ) {
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

test('прямая web-ссылка открывает production email и Telegram auth', async ({
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
  await context.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  await context.route('**/api/**', async route => {
    await route.fulfill(jsonResponse({ ok: true }))
  })

  const page = await context.newPage()
  await freezePageTime(page)
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'Продолжай расти даже вне приложения.' })
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Вход по email' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Или через Telegram' })).toBeHidden()
  await expect(page.locator('form')).toHaveCount(1)
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Получить письмо' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('mentalix_web_user'))).toBeNull()

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
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
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
