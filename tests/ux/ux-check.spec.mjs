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
  if (pathname === '/api/articles') return jsonResponse(FIXTURES.articles)
  if (pathname === '/api/analytics') return jsonResponse(FIXTURES.analytics)
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
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
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
  expect(geometry.documentWidth, 'document не должен иметь горизонтальный overflow').toBeLessThanOrEqual(
    geometry.viewportWidth + 1
  )
  expect(geometry.bodyWidth, 'body не должен иметь горизонтальный overflow').toBeLessThanOrEqual(
    geometry.viewportWidth + 1
  )
  expect(geometry.app, 'Корневой контейнер приложения должен существовать').not.toBeNull()
  expect(geometry.app.left, 'Основной контент не должен выходить за левую границу').toBeGreaterThanOrEqual(
    -1
  )
  expect(geometry.app.right, 'Основной контент не должен выходить за правую границу').toBeLessThanOrEqual(
    geometry.viewportWidth + 1
  )
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
        expect(overlap(ctaBox, navBox), `Нижняя навигация перекрывает CTA «${ctaLabel}»`).toBe(false)
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
    expect(label.labelLeft, `Подпись «${label.name}» выходит за левую границу кнопки`).toBeGreaterThanOrEqual(
      label.buttonLeft - epsilon
    )
    expect(label.labelRight, `Подпись «${label.name}» выходит за правую границу кнопки`).toBeLessThanOrEqual(
      label.buttonRight + epsilon
    )
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
  const soonPractices = ['Нейротренажёр', 'Дыхание', 'Фокус']

  for (const name of soonPractices) {
    await expect(page.getByRole('button', { name })).toBeDisabled()
  }

  await expect(page.getByText('Скоро', { exact: true })).toHaveCount(soonPractices.length)
  await expect(page.getByRole('button', { name: 'Медитация' })).toBeEnabled()
  await page.getByRole('button', { name: 'Медитация' }).click()
  await expect(page.getByRole('heading', { name: 'Вернись к тому, что действительно зависит от тебя' })).toBeVisible()
  await page.getByRole('button', { name: 'Назад' }).click()
  await page.getByRole('button', { name: 'Нейротренажёр' }).evaluate(element => element.click())
  await expect(page.getByRole('heading', { name: 'практики.' })).toBeVisible()
}

async function assertLibrarySoonControl(page) {
  const workshops = page.getByRole('button', { name: /Практикумы/ })
  await expect(workshops).toBeDisabled()
  await workshops.evaluate(element => element.click())
  await expect(page.getByPlaceholder('Поиск статей')).toBeVisible()
}

async function captureScreen({ page, viewport, screen, slug, runtimeErrors, results, check }) {
  const screenshotRelative = `${viewport.name}/${slug}.png`
  const screenshotAbsolute = path.join(ARTIFACT_ROOT, screenshotRelative)
  let status = 'pass'
  let reason = '—'

  try {
    await check()
    await assertCommonScreenChecks(page, runtimeErrors)

    if (VISUAL_ANCHOR_SLUGS.has(slug)) {
      const starterSetEnabled = process.env.VITE_STARTER_SET_ENABLED === 'true'
      const snapshotName =
        starterSetEnabled && viewport.name === '430x932' && slug === '01-today'
          ? `${viewport.name}/${slug}-starter-enabled.png`
          : `${viewport.name}/${slug}.png`
      await expect(page).toHaveScreenshot(snapshotName, {
        animations: 'disabled',
        caret: 'hide',
        maxDiffPixelRatio: 0.012,
      })
    }
  } catch (error) {
    status = 'fail'
    reason = sanitizeReason(error)
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

  return `# Mentalix UX check\n\n` +
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
    await expect(page.getByRole('button', { name: 'Практики' })).toBeVisible()

    await captureScreen({
      page,
      viewport,
      screen: 'Today',
      slug: '01-today',
      runtimeErrors,
      results,
      check: async () => {
        const checkin = page.getByRole('button', { name: /Пройти чек-ин|Разобрать день/ })
        await assertClickable(checkin)
      },
    })

    await page.getByRole('button', { name: /Пройти чек-ин|Разобрать день/ }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'Check-in',
      slug: '02-check-in',
      runtimeErrors,
      results,
      check: async () => {
        await assertClickable(page.getByRole('button', { name: 'Закрыть' }))
        await expect(page.getByText(/Чек-ин|Анализ дня/).first()).toBeVisible()
      },
    })

    for (const option of ['Нормально', 'Средне', 'Заметно', 'Держусь']) {
      await page.getByRole('button', { name: new RegExp(option, 'i') }).click()
      await page.waitForTimeout(320)
    }
    await page.getByRole('button', { name: 'ровно' }).click()
    await page.getByRole('button', { name: 'Дальше' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'Check-in writer',
      slug: '02b-check-in-writer',
      runtimeErrors,
      results,
      check: async () => {
        const editor = page.getByRole('textbox', { name: 'Утренняя мысль' })
        await expect(editor).toBeVisible()
        await editor.pressSequentially('Спокойное утро')
        await assertClickable(page.getByRole('button', { name: 'Показать форматирование' }))
        await assertClickable(page.getByRole('button', { name: 'Пойти глубже' }))
        await assertClickable(page.getByRole('button', { name: 'Завершить чек-ин' }))
      },
    })
    const checkinCloseButton = page.locator('button[aria-label="Закрыть"]')
    await checkinCloseButton.click()

    const draftDialog = page.locator('[role="dialog"][aria-labelledby="checkin-draft-dialog-title"]')
    await expect(draftDialog).toBeVisible()
    await draftDialog.getByRole('button', { name: 'Закрыть' }).click()

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

    await page.getByRole('button', { name: 'Практики' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'Practices',
      slug: '03-practices',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByRole('heading', { name: 'практики.' })).toBeVisible()
        const journalEntry = page.locator('section[aria-label="Журнал"] > button')
        await assertClickable(journalEntry)
        const practicesHeading = page.locator('h3').filter({ hasText: 'Практики' }).first()
        await expect(practicesHeading).toBeVisible()
        const journalBox = await journalEntry.boundingBox()
        const practicesBox = await practicesHeading.boundingBox()
        expect(journalBox?.y || 0).toBeLessThan(practicesBox?.y || Number.POSITIVE_INFINITY)
        await assertClickable(page.getByRole('button', { name: 'Ритуалы' }))
        await assertSoonControls(page)
      },
    })

    await page.locator('section[aria-label="Журнал"] > button').click()
    await captureScreen({
      page,
      viewport,
      screen: 'Journal intro',
      slug: '03b-journal-intro',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByText('Разложи день на четыре спокойных шага')).toBeVisible()
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
        const editor = page.getByRole('textbox', { name: 'Идея: Что сейчас занимает мои мысли?' })
        await expect(editor).toBeVisible()
        await expect(editor).toHaveAttribute('contenteditable', 'true')
        await expect(page.getByRole('button', { name: 'Назад' })).toHaveCount(1)
        await expect(page.getByRole('button', { name: 'Сохранить и продолжить' })).toBeVisible()
      },
    })
    const journalSteps = [
      ['Действие: Что из этого зависит от меня сегодня?', 'Сделать один спокойный шаг'],
      ['Анализ: Что произошло и что я заметил?', 'Заметить, что изменилось'],
      ['Новый шаг: Что я возьму с собой дальше?', 'Продолжить завтра'],
    ]
    const ideaEditor = page.getByRole('textbox', { name: 'Идея: Что сейчас занимает мои мысли?' })
    await ideaEditor.fill('Сегодня я замечаю главное')
    await expect(page.getByRole('button', { name: 'Сохранить и продолжить' })).toBeEnabled()
    await page.getByRole('button', { name: 'Сохранить и продолжить' }).click()
    for (const [label, text] of journalSteps) {
      const editor = page.getByRole('textbox', { name: label })
      await expect(editor).toBeVisible()
      await editor.fill(text)
      await page.getByRole('button', {
        name: label.startsWith('Новый шаг') ? 'Сохранить и завершить' : 'Сохранить и продолжить',
      }).click()
    }
    await captureScreen({
      page,
      viewport,
      screen: 'Journal complete',
      slug: '03d-journal-complete',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByText('Цикл сохранён')).toBeVisible()
        await assertClickable(page.getByRole('button', { name: 'Вернуться к практикам' }))
      },
    })
    await page.getByRole('button', { name: 'Вернуться к практикам' }).click()
    await expect(page.getByRole('heading', { name: 'практики.' })).toBeVisible()
    const reopenedJournalEntry = page.locator('section[aria-label="Журнал"] > button')
    await reopenedJournalEntry.scrollIntoViewIfNeeded()
    await reopenedJournalEntry.click()
    await expect(page.getByRole('heading', { name: 'Сегодняшняя запись сохранена' })).toBeVisible()
    await assertClickable(page.getByRole('button', { name: 'Открыть запись' }))
    await page.getByRole('button', { name: 'Открыть запись' }).click()
    const reopenedEditor = page.getByRole('textbox', { name: 'Новый шаг: Что я возьму с собой дальше?' })
    await expect(reopenedEditor).toHaveText('Продолжить завтра')
    await page.getByRole('button', { name: 'Назад' }).click()
    await expect(page.getByRole('heading', { name: 'практики.' })).toBeVisible()

    await page.getByRole('button', { name: 'Ритуалы' }).click()
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

    await page.getByRole('button', { name: 'Аскезы' }).click()
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

    await page.getByRole('button', { name: 'Первый шаг' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'First Step intro',
      slug: '06-first-step-intro',
      runtimeErrors,
      results,
      check: async () => {
        await expect(
          page.getByRole('heading', { name: 'Сделай маленький шаг, когда трудно начать' })
        ).toBeVisible()
        await assertClickable(page.getByRole('button', { name: 'Начать' }))
      },
    })
    await page.getByRole('button', { name: 'Начать' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'First Step',
      slug: '06a-first-step',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByRole('heading', { name: 'Что не двигается?' })).toBeVisible()
        const editor = page.getByRole('textbox', { name: 'Дело, которое не двигается' })
        await expect(editor).toBeVisible()
        await editor.fill('Подготовить презентацию')
        await expect(page.getByRole('button', { name: 'Показать форматирование' })).toHaveCount(0)
        await assertClickable(page.getByRole('button', { name: 'Дальше' }))
        await assertClickable(page.getByRole('button', { name: 'Назад' }))
      },
    })
    await page.getByRole('button', { name: 'Дальше' }).click()
    await page.getByRole('button', { name: 'Не знаю, с чего начать' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'First Step plan writer',
      slug: '06b-first-step-plan-writer',
      runtimeErrors,
      results,
      check: async () => {
        await expect(
          page.getByRole('heading', { name: 'Что можно сделать за пять минут?' })
        ).toBeVisible()
        const editor = page.getByRole('textbox', { name: 'Первый шаг на пять минут' })
        await expect(editor).toBeVisible()
        await editor.fill('Создать первый слайд')
        await expect(page.getByRole('button', { name: 'Показать форматирование' })).toHaveCount(0)
        await assertClickable(page.getByRole('button', { name: 'Начать пять минут' }))
      },
    })
    await page.getByRole('button', { name: 'Начать пять минут' }).click()
    await page.getByRole('button', { name: 'Остановить' }).click()
    await expect(page.getByRole('heading', { name: 'Как прошло?' })).toBeVisible()
    await page.getByRole('button', { name: 'Начал(а)', exact: true }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'First Step completion',
      slug: '06c-first-step-completion',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByRole('heading', { name: 'Ты начал(а)' })).toBeVisible()
        await assertClickable(page.getByRole('button', { name: 'Немного' }))
        await assertClickable(page.getByRole('button', { name: 'Завершить' }))
      },
    })
    await page.getByRole('button', { name: 'Назад' }).click()

    await page.getByRole('button', { name: 'Одно из всех' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'Narrow focus intro',
      slug: '06f0-narrow-focus-intro',
      runtimeErrors,
      results,
      check: async () => {
        await expect(
          page.getByRole('heading', { name: 'Сузь всё до одного дела' })
        ).toBeVisible()
        await assertClickable(page.getByRole('button', { name: 'Начать' }))
      },
    })
    await page.getByRole('button', { name: 'Начать' }).click()
    let narrowFocusAnchorTop
    await captureScreen({
      page,
      viewport,
      screen: 'Narrow focus dump writer',
      slug: '06c-narrow-focus-dump-writer',
      runtimeErrors,
      results,
      check: async () => {
        const editor = page.getByRole('textbox', { name: 'Всё, что крутится в голове' })
        await expect(editor).toBeVisible()
        await editor.fill('Ответить на письма\nПодготовить встречу')
        await expect(page.getByRole('button', { name: 'Показать форматирование' })).toHaveCount(0)
        const anchorBox = await page.locator('.narrow-focus-stage__anchor').boundingBox()
        expect(anchorBox).not.toBeNull()
        narrowFocusAnchorTop = anchorBox.y
        await assertClickable(page.getByRole('button', { name: 'Дальше' }))
      },
    })
    await page.getByRole('button', { name: 'Дальше' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'Narrow focus pick writer',
      slug: '06d-narrow-focus-pick-writer',
      runtimeErrors,
      results,
      check: async () => {
        const editor = page.getByRole('textbox', { name: 'Одно самое важное дело' })
        await expect(editor).toBeVisible()
        await editor.fill('Подготовить встречу')
        const anchorBox = await page.locator('.narrow-focus-stage__anchor').boundingBox()
        expect(anchorBox).not.toBeNull()
        expect(Math.abs(anchorBox.y - narrowFocusAnchorTop)).toBeLessThanOrEqual(1)
        await assertClickable(page.getByRole('button', { name: 'Дальше' }))
      },
    })
    await page.getByRole('button', { name: 'Дальше' }).click()
    await page.getByRole('button', { name: 'Дальше' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'Narrow focus plan writer',
      slug: '06e-narrow-focus-plan-writer',
      runtimeErrors,
      results,
      check: async () => {
        const editor = page.getByRole('textbox', { name: 'Первое действие по выбранному делу' })
        await expect(editor).toBeVisible()
        await editor.fill('Открыть заметки к встрече')
        await assertClickable(page.getByRole('button', { name: 'Начать пять минут' }))
      },
    })
    await page.getByRole('button', { name: 'Начать пять минут' }).click()
    await page.getByRole('button', { name: 'Остановить' }).click()
    await expect(page.getByRole('heading', { name: 'Как прошло?' })).toBeVisible()
    await page.getByRole('button', { name: 'Начал(а)', exact: true }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'Narrow focus completion',
      slug: '06f1-narrow-focus-completion',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByRole('heading', { name: 'Ты сузил(а) фокус' })).toBeVisible()
        await assertClickable(page.getByRole('button', { name: 'Немного' }))
        await assertClickable(page.getByRole('button', { name: 'Завершить' }))
      },
    })
    await page.getByRole('button', { name: 'Назад' }).click()

    await page.getByRole('button', { name: 'Один финиш' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'One finish intro',
      slug: '06f2-one-finish-intro',
      runtimeErrors,
      results,
      check: async () => {
        await expect(
          page.getByRole('heading', { name: 'Доведи один маленький кусок до конца' })
        ).toBeVisible()
        await assertClickable(page.getByRole('button', { name: 'Начать' }))
      },
    })
    await page.getByRole('button', { name: 'Начать' }).click()
    let oneFinishAnchorTop
    await captureScreen({
      page,
      viewport,
      screen: 'One finish project writer',
      slug: '06f-one-finish-project-writer',
      runtimeErrors,
      results,
      check: async () => {
        const editor = page.getByRole('textbox', { name: 'Проект, который завис на середине' })
        await expect(editor).toBeVisible()
        await editor.fill('Обновление портфолио')
        await expect(page.getByRole('button', { name: 'Показать форматирование' })).toHaveCount(0)
        const anchorBox = await page.locator('.one-finish-stage__anchor').boundingBox()
        expect(anchorBox).not.toBeNull()
        oneFinishAnchorTop = anchorBox.y
        await assertClickable(page.getByRole('button', { name: 'Дальше' }))
      },
    })
    await page.getByRole('button', { name: 'Дальше' }).click()
    await page.getByRole('button', { name: 'Не вижу конца' }).click()
    await page.getByRole('button', { name: 'Дальше' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'One finish action writer',
      slug: '06g-one-finish-action-writer',
      runtimeErrors,
      results,
      check: async () => {
        const editor = page.getByRole('textbox', { name: 'Маленький кусок для завершения' })
        await expect(editor).toBeVisible()
        await editor.fill('Добавить один завершённый проект')
        const anchorBox = await page.locator('.one-finish-stage__anchor').boundingBox()
        expect(anchorBox).not.toBeNull()
        expect(Math.abs(anchorBox.y - oneFinishAnchorTop)).toBeLessThanOrEqual(1)
        await assertClickable(page.getByRole('button', { name: 'Начать пять минут' }))
      },
    })
    await page.getByRole('button', { name: 'Начать пять минут' }).click()
    await page.getByRole('button', { name: 'Остановить' }).click()
    await expect(page.getByRole('heading', { name: 'Как прошло?' })).toBeVisible()
    await page.getByRole('button', { name: 'Начал(а)', exact: true }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'One finish completion',
      slug: '06g1-one-finish-completion',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByRole('heading', { name: 'Кусок завершён' })).toBeVisible()
        await assertClickable(page.getByRole('button', { name: 'Немного' }))
        await assertClickable(page.getByRole('button', { name: 'Завершить' }))
      },
    })
    await page.getByRole('button', { name: 'Назад' }).click()

    await page.getByRole('button', { name: 'Без вины' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'No blame intro',
      slug: '06h-no-blame-intro',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByRole('heading', { name: 'Вернись к делу без давления' })).toBeVisible()
        await assertClickable(page.getByRole('button', { name: 'Начать' }))
      },
    })
    await page.getByRole('button', { name: 'Начать' }).click()
    let noBlameAnchorTop
    await captureScreen({
      page,
      viewport,
      screen: 'No blame task writer',
      slug: '06i-no-blame-task-writer',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByRole('heading', { name: 'Что откладываешь?' })).toBeVisible()
        const editor = page.getByRole('textbox', { name: 'Дело, которое откладываешь' })
        await expect(editor).toBeVisible()
        const anchorBox = await page.locator('.no-blame-stage__anchor').boundingBox()
        expect(anchorBox).not.toBeNull()
        noBlameAnchorTop = anchorBox.y
        await editor.fill('Разобрать почту')
        await expect(page.getByRole('button', { name: 'Показать форматирование' })).toHaveCount(0)
        await assertClickable(page.getByRole('button', { name: 'Дальше' }))
      },
    })
    await page.getByRole('button', { name: 'Дальше' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'No blame centered choice',
      slug: '06j-no-blame-choice',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByRole('heading', { name: 'Что в этом неприятного?' })).toBeVisible()
        const anchorBox = await page.locator('.no-blame-stage__anchor').boundingBox()
        expect(anchorBox).not.toBeNull()
        expect(Math.abs(anchorBox.y - noBlameAnchorTop)).toBeLessThanOrEqual(1)
        await assertClickable(page.getByRole('button', { name: 'Тревожно' }))
      },
    })
    await page.getByRole('button', { name: 'Тревожно' }).click()
    await expect(page.locator('.no-blame-art--release')).toBeVisible()
    await page.getByRole('button', { name: 'Дальше' }).click()
    await expect(
      page.getByRole('heading', { name: 'Что обычно отвлекает вместо этого?' })
    ).toBeVisible()
    await page.getByRole('button', { name: 'Телефон' }).click()
    await expect(page.getByRole('heading', { name: 'Договорись с собой' })).toBeVisible()
    await page.getByRole('button', { name: 'Начать две минуты' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'No blame timer',
      slug: '06k-no-blame-timer',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByRole('heading', { name: 'Только эти две минуты' })).toBeVisible()
        await assertClickable(page.getByRole('button', { name: 'Остановить' }))
      },
    })
    await page.getByRole('button', { name: 'Остановить' }).click()
    await expect(page.getByRole('heading', { name: 'Как прошло?' })).toBeVisible()
    await page.getByRole('button', { name: 'Начал(а)', exact: true }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'No blame completion',
      slug: '06l-no-blame-completion',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByRole('heading', { name: 'Первый шаг сделан' })).toBeVisible()
        await assertClickable(page.getByRole('button', { name: 'Немного' }))
        await assertClickable(page.getByRole('button', { name: 'Завершить' }))
      },
    })
    await page.getByRole('button', { name: 'Назад' }).click()

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
        await assertClickable(page.getByPlaceholder('Поиск статей'))
        await assertLibrarySoonControl(page)
      },
    })

    await page.getByRole('button', { name: 'Тренды' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'Trends',
      slug: '08-trends',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByRole('heading', { name: 'Аналитика' })).toBeAttached()
        await expect(page.getByRole('button', { name: 'Тренды' })).toHaveAttribute(
          'aria-current',
          'page'
        )
      },
    })

    await context.close()
  }

  await writeFile(path.join(ARTIFACT_ROOT, 'report.md'), buildReport(results), 'utf8')

  const failed = results.filter(result => result.status === 'fail')
  expect(failed, `UX check: ${failed.map(item => `${item.viewport}/${item.screen}`).join(', ')}`).toEqual(
    []
  )
})


test('Mentor PersonaPicker сохраняет тематическую рамку и pager на mobile, tablet и desktop', async ({ browser, baseURL }) => {
  const layouts = [
    ...VIEWPORTS,
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
    await page.getByRole('button', { name: 'Наставник' }).click()
    await expect(page.getByRole('heading', { name: 'с кем говорим.' })).toBeVisible()
    await expect(page.getByLabel('Выбранный собеседник')).toHaveCount(0)
    const cards = page.getByTestId('mentor-persona-card')
    await expect(cards).toHaveCount(3)
    expect(await cards.evaluateAll(elements => elements.map(element => getComputedStyle(element).borderTopWidth))).toEqual([
      '1px',
      '1px',
      '1px',
    ])
    const pager = page.getByLabel('Страница собеседника')
    await expect(pager).toBeVisible()
    await expect(pager.getByRole('button')).toHaveCount(3)
    await expect(pager.getByRole('button', { name: 'Собеседник, страница 1 из 3' })).toHaveAttribute(
      'aria-current',
      'page'
    )

    if (viewport.width <= 430) {
      const track = page.getByTestId('mentor-persona-track')
      const cardWidth = await cards.first().evaluate(element => element.getBoundingClientRect().width)
      await track.evaluate((element, scrollLeft) => {
        element.scrollLeft = scrollLeft
        element.dispatchEvent(new Event('scroll'))
      }, cardWidth + 12)
      await expect(pager.getByRole('button', { name: 'Наставник, страница 2 из 3' })).toHaveAttribute(
        'aria-current',
        'page'
      )
    }

    await expect(page.getByText('У каждого своя история — разговоры не смешиваются.')).toBeVisible()

    const mentorCard = cards.filter({ hasText: 'Наставник' })
    await mentorCard.scrollIntoViewIfNeeded()
    await mentorCard.click()
    await expect(page.getByText('История kompas')).toBeVisible()
    await expect(page.getByText('История mayak')).toHaveCount(0)
    await assertClickable(page.getByRole('button', { name: 'Назад' }))
    await assertCommonScreenChecks(page, runtimeErrors)

    await context.close()
  }
})


test('History показывает user-scoped local Journal на mobile и tablet', async ({ browser, baseURL }) => {
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
    await page.getByRole('button', { name: 'День' }).click()
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


test('прямая web-ссылка объясняет Telegram Mini App и сохраняет OTP recovery', async ({ browser, baseURL }) => {
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

  let verifyAttempts = 0
  await context.route('**/api/**', async route => {
    const request = route.request()
    const pathname = new URL(request.url()).pathname

    if (request.method() === 'POST' && pathname === '/api/auth/email/request-code') {
      await new Promise(resolve => setTimeout(resolve, 75))
      await route.fulfill(jsonResponse({ dev_code: '123456' }))
      return
    }

    if (request.method() === 'POST' && pathname === '/api/auth/email/verify') {
      verifyAttempts += 1
      if (verifyAttempts === 1) {
        await route.fulfill(jsonResponse({ ok: false }))
      } else {
        await route.fulfill(
          jsonResponse({
            ok: true,
            user: {
              app_user_id: 42,
              web_user_id: 84,
              first_name: 'Web',
              email: 'person@example.com',
              linked: true,
            },
          })
        )
      }
      return
    }

    await route.fulfill(jsonResponse({ ok: true }))
  })

  const page = await context.newPage()
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'Лучше открыть Mentalix через Telegram Mini App' })
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Вход через браузер' })).toBeVisible()
  await expect(
    page.getByText('Это поддерживаемый web-вход; он не обходит аутентификацию и не создаёт фиктивного пользователя.')
  ).toBeVisible()

  const emailInput = page.getByRole('textbox', { name: 'Email для входа' })
  const requestButton = page.getByRole('button', { name: 'Получить одноразовый код на email' })
  await expect(emailInput).toBeFocused()
  await emailInput.fill('person@example.com')
  await page.keyboard.press('Tab')
  await expect(requestButton).toBeFocused()
  await expect(requestButton).toBeEnabled()

  await requestButton.press('Enter')
  await expect(page.locator('form')).toHaveAttribute('aria-busy', 'true')
  await expect(page.getByRole('status')).toHaveText('Подожди, выполняю запрос…')
  await expect(page.getByRole('textbox', { name: 'Одноразовый код' })).toBeVisible()
  await expect(page.locator('form')).toHaveAttribute('aria-busy', 'false')

  const codeInput = page.getByRole('textbox', { name: 'Одноразовый код' })
  const verifyButton = page.getByRole('button', { name: 'Проверить одноразовый код' })
  await expect(codeInput).toHaveAttribute('autocomplete', 'one-time-code')
  await expect(codeInput).toBeFocused()
  await codeInput.fill('000000')
  await verifyButton.press('Enter')

  await expect(page.getByRole('alert')).toHaveText('Неверный или истёкший код. Проверь его и отправь ещё раз.')
  await expect(codeInput).toHaveAttribute('aria-invalid', 'true')
  await expect(verifyButton).toBeEnabled()
  expect(verifyAttempts).toBe(1)
  expect(await page.evaluate(() => localStorage.getItem('mentalix_web_user'))).toBeNull()

  await codeInput.fill('123456')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(codeInput).toHaveAttribute('aria-invalid', 'false')
  await expect(verifyButton).toBeEnabled()
  await verifyButton.press('Enter')
  await expect(page.getByRole('heading', { name: 'Вход через браузер' })).toHaveCount(0)
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('mentalix_web_user'))).id).toBe(42)
  expect(verifyAttempts).toBe(2)

  await context.close()
})

test('Today не маскирует ошибку критичного API под пустой список практик', async ({ browser, baseURL }) => {
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

  await context.route('**/api/**', route => {
    const pathname = new URL(route.request().url()).pathname

    if (pathname === '/api/rituals') {
      return route.fulfill(jsonResponse({ error: 'fixture failure' }, 503))
    }

    return route.fulfill(fixtureFor(route.request()))
  })

  const page = await context.newPage()
  await page.goto('/')

  await expect(page.getByRole('alert')).toHaveText(/Проверь соединение/)
  await expect(page.getByText('Добавь первый ритуал')).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Повторить' })).toBeEnabled()

  await context.close()
})

test('Today retry после критичного сбоя повторно загружает данные без пустого cache snapshot', async ({ browser, baseURL }) => {
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
  await page.goto('/')
  await expect(page.getByRole('alert')).toHaveText(/Проверь соединение/)
  await page.getByRole('button', { name: 'Повторить' }).click()
  await expect.poll(() => ritualsRequests).toBe(4)
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Практики' })).toBeVisible()
  await context.close()
})
