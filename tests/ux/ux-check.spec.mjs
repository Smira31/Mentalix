import { expect, test } from '@playwright/test'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ARTIFACT_ROOT = path.resolve('artifacts/ux-check')

const VIEWPORTS = [
  { name: '390x844', width: 390, height: 844 },
  { name: '320x568', width: 320, height: 568 },
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

    for (let index = 0; index < count; index += 1) {
      const ctaBox = await criticalCtas.nth(index).boundingBox()

      if (ctaBox) {
        expect(overlap(ctaBox, navBox), 'Нижняя навигация перекрывает критический CTA').toBe(false)
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

async function assertSoonControls(page) {
  const soonPractices = ['Нейротренажёр', 'Дыхание', 'Фокус', 'Медитации']

  for (const name of soonPractices) {
    await expect(page.getByRole('button', { name })).toBeDisabled()
  }

  await expect(page.getByText('Скоро', { exact: true })).toHaveCount(soonPractices.length)
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
    `- disabled/«Скоро» элементы в Practices и Library не открываются.\n\n` +
    `## Обязательный ручной iPhone gate\n\n` +
    `Этот отчёт не является доказательством корректности Telegram safe-area, iOS keyboard, fullscreen Telegram, swipe physics или WebView performance. Эти пять областей нужно проверять вручную на реальном iPhone внутри Telegram.\n`
}

test('локальный UX smoke по основному маршруту', async ({ browser, baseURL }) => {
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
    await page.getByRole('button', { name: 'Закрыть' }).click()

    await page.getByRole('button', { name: 'Разгрузить голову' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'Today focus writer',
      slug: '02c-today-focus-writer',
      runtimeErrors,
      results,
      check: async () => {
        const editor = page.getByRole('textbox', { name: 'Дела, которые тянут внимание' })
        await expect(editor).toBeVisible()
        await expect(editor).toHaveAttribute('contenteditable', 'true')
        await editor.fill('Написать отчёт\nРазобрать почту')
        await expect(page.getByRole('button', { name: 'Показать форматирование' })).toHaveCount(0)
        await assertClickable(page.getByRole('button', { name: 'Продолжить' }))
      },
    })
    await page.getByRole('button', { name: 'Продолжить' }).click()
    await page.getByRole('button', { name: 'Написать отчёт' }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'Today first step writer',
      slug: '02d-today-first-step-writer',
      runtimeErrors,
      results,
      check: async () => {
        const editor = page.getByRole('textbox', { name: 'Первый шаг' })
        await expect(editor).toBeVisible()
        await editor.fill('Открыть документ')
        await expect(page.getByRole('button', { name: 'Показать форматирование' })).toHaveCount(0)
        await assertClickable(page.getByRole('button', { name: 'Подсказать шаг' }))
        await assertClickable(page.getByRole('button', { name: 'Сохранить шаг' }))
      },
    })
    await page.getByRole('button', { name: 'Сохранить шаг' }).click()

    await page.getByRole('button', { name: /о меньшем усилии/ }).click()
    await captureScreen({
      page,
      viewport,
      screen: 'Theme journal',
      slug: '03-theme-journal',
      runtimeErrors,
      results,
      check: async () => {
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
        await assertClickable(page.getByRole('button', { name: 'Ритуалы' }))
        await assertSoonControls(page)
      },
    })

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
      screen: 'First Step',
      slug: '06-first-step',
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
    await page.getByRole('button', { name: 'Назад' }).click()

    await page.getByRole('button', { name: 'Одно из всех' }).click()
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
    await page.getByRole('button', { name: 'Назад' }).click()

    await page.getByRole('button', { name: 'Один финиш' }).click()
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
        await assertClickable(page.getByRole('button', { name: 'Начать пять минут' }))
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
