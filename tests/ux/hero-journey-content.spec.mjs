import { expect, test } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { DEMO_HERO_JOURNEY } from '../../src/data/demoContent.js'

const url = '/?demo=1&tab=library&action=hero_journey&frame=0'
const evidence = 'qa-evidence/hero-journey-ui/final'
const publicSteps = DEMO_HERO_JOURNEY.steps.filter(step => step.intro)
const tid = (page, id) => page.getByTestId(id)

async function assertFits(page) {
  await expect
    .poll(() =>
      page
        .locator('.mx-hj-hero img')
        .evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))
    )
    .toBe(true)
  // Screen реагирует на visualViewport через кадр: ждём применения новой
  // высоты поверхности, а не сравниваем поле старой высоты с новым доком.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const column = document.querySelector(
          '.mx-hj-step-intro, .mx-hj-write-col, .mx-hj-step-complete'
        )
        return column.getBoundingClientRect().bottom <= window.innerHeight + 1
      })
    )
    .toBe(true)
  const metrics = await page.evaluate(() => {
    const column = document.querySelector(
      '.mx-hj-step-intro, .mx-hj-write-col, .mx-hj-step-complete'
    )
    const button = document.querySelector(
      '[data-testid="hero-story-next"], [data-testid="hero-step-start"], [data-testid="hero-write-next"], [data-testid="hero-action-next"], [data-testid="hero-complete-map"]'
    )
    const editor = document.querySelector(
      '[data-testid="hero-write-input"], [data-testid="hero-action-input"]'
    )
    const thought = document.querySelector('.mx-hj-story__thought-block')
    const text = document.querySelector('.mx-hj-step-intro__text')
    return {
      overflow: column.scrollHeight - column.clientHeight,
      horizontalOverflow:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      buttonBottom: button.getBoundingClientRect().bottom,
      buttonTop: button.getBoundingClientRect().top,
      editorBottom: editor?.getBoundingClientRect().bottom ?? null,
      thoughtGap:
        thought && text
          ? thought.getBoundingClientRect().top - text.getBoundingClientRect().bottom
          : null,
      height: window.innerHeight,
      imageFilters: [...document.querySelectorAll('.mx-hj-hero img')].map(
        img => getComputedStyle(img).filter
      ),
    }
  })
  expect(metrics.overflow).toBeLessThanOrEqual(1)
  expect(metrics.horizontalOverflow).toBeLessThanOrEqual(2)
  expect(metrics.buttonBottom).toBeLessThanOrEqual(metrics.height)
  expect(metrics.buttonTop).toBeGreaterThanOrEqual(0)
  if (metrics.editorBottom !== null)
    expect(metrics.editorBottom).toBeLessThanOrEqual(metrics.buttonTop)
  if (metrics.thoughtGap !== null) expect(metrics.thoughtGap).toBeCloseTo(20, 0)
  expect(metrics.imageFilters.every(filter => filter === 'none')).toBe(true)
  return metrics
}

for (const [width, height, keyboardHeight] of [
  [430, 932, 596],
  [360, 640, 360],
]) {
  test(`Публичный контент: полная фактическая структура и запись ${width}×${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height })
    // Свежий изолированный контекст Playwright, без сессии владельца.
    // Демо-режим изолирован в обёртке API: курс показывается из встроенной
    // публичной части, на сервер не уходим. Авторизованный курс здесь
    // непроверяем — нужна настоящая сессия (см. отчёт о покрытии).
    const serverRequests = []
    page.on('request', request => {
      if (request.url().includes('/api/content/hero-journey')) serverRequests.push(request.url())
    })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(url)
    const map = tid(page, 'hero-journey-map')
    await expect(map).toHaveAttribute('data-content-source', 'demo')
    await expect(map).toHaveAttribute('data-content-status', 'ready')
    /* Закрытые главы II–IV: в бандле только структура, ни текстов шагов,
       ни открытых карточек шагов. Проверка по факту, а не по классу. */
    await expect(page.locator('.mx-hj-chapter--demo-locked')).toHaveCount(3)
    for (const locked of DEMO_HERO_JOURNEY.steps.filter(step => !step.intro)) {
      await expect(tid(page, `hero-step-${locked.id}`)).toHaveCount(0)
    }
    await expect(map).not.toContainText('undefined')
    await mkdir(evidence, { recursive: true })
    const report = []

    for (const step of publicSteps) {
      await tid(page, 'hero-continue').click()
      const pages = step.pages || []
      const seen = []
      if (pages.length) {
        for (const [index, sheet] of pages.entries()) {
          await expect(tid(page, 'hero-story-page')).toHaveAttribute('data-page', String(index + 1))
          await expect(tid(page, 'hero-story-page')).toContainText(sheet.label)
          // Проверяем весь текст, включая вынесенную мысль, а не только заголовок.
          const rendered = await page.locator('.mx-hj-story__viewport').innerText()
          for (const paragraph of sheet.text.replaceAll('**', '').split('\n\n')) {
            expect(rendered.replace(/\s+/g, ' ')).toContain(paragraph.replace(/\s+/g, ' '))
          }
          const metrics = await assertFits(page)
          seen.push({ page: index + 1, ...metrics })
          await page.screenshot({ path: `${evidence}/${width}x${height}-sheet-${index + 1}.png` })
          await tid(page, 'hero-story-next').click()
        }
      } else {
        await expect(tid(page, 'hero-step-start')).toBeVisible()
        await expect(page.locator('.mx-hj-story__viewport')).toBeVisible()
        const intro = await page.locator('.mx-hj-step-intro__desc').allTextContents()
        expect(intro.join('\n\n')).toBe(step.intro)
        await assertFits(page)
        if (step.number === 2)
          await page.screenshot({ path: `${evidence}/${width}x${height}-step-2-intro.png` })
        await tid(page, 'hero-step-start').click()
      }
      await expect(tid(page, 'hero-write-input')).toBeVisible()
      const reflection = `Проверочная запись шага ${step.number}`
      const action = `Проверочное действие шага ${step.number}`
      await tid(page, 'hero-write-input').fill(reflection)
      await page.setViewportSize({ width, height: keyboardHeight })
      const write = await assertFits(page)
      if (step.number === 1)
        await page.screenshot({
          path: `${evidence}/${width}x${height}-write-keyboard-simulated.png`,
        })
      await tid(page, 'hero-write-next').click()
      await expect(tid(page, 'hero-action-input')).toBeVisible()
      await tid(page, 'hero-action-input').fill(action)
      const actionMetrics = await assertFits(page)
      if (step.number === 1)
        await page.screenshot({
          path: `${evidence}/${width}x${height}-action-keyboard-simulated.png`,
        })
      await page.setViewportSize({ width, height })
      await tid(page, 'hero-action-next').click()
      await expect(tid(page, 'hero-complete-map')).toBeVisible()
      await expect(page.locator('.mx-hj-complete__support')).toContainText(action)
      const complete = await assertFits(page)
      const saved = await page.evaluate(id => {
        const progress = JSON.parse(localStorage.getItem('mx-hero-journey-progress:900001'))
        return {
          reflection: progress.reflections[id],
          action: progress.actions[id],
          completed: Boolean(progress.completed[id]),
          draft: localStorage.getItem(`mx-hero-journey-draft:900001:${id}`),
        }
      }, step.id)
      expect(saved).toEqual({ reflection, action, completed: true, draft: null })
      if (step.number === 1)
        await page.screenshot({ path: `${evidence}/${width}x${height}-complete.png` })
      report.push({
        id: step.id,
        source: 'demoContent.js',
        storySheets: seen.length,
        introductions: pages.length ? 0 : 1,
        seen,
        write,
        action: actionMetrics,
        complete,
        saved: true,
      })
      await tid(page, 'hero-complete-map').click()
      if (step.number === 4) await tid(page, 'hero-pause-stay').click()
      await expect(map).toBeVisible()
      await expect(tid(page, `hero-step-${step.id}`)).toHaveAttribute('data-state', 'done')
    }
    await expect(tid(page, 'hero-continue')).toHaveCount(0)
    await expect(map).not.toContainText('undefined')
    await expect(page.locator('.mx-hj-chapter--demo-locked')).toHaveCount(3)
    // Курс ни разу не запросил сервер: демо-режим остаётся изолированным.
    expect(serverRequests).toEqual([])
    await page.screenshot({ path: `${evidence}/${width}x${height}-locked-chapters.png` })
    // Повторный вход читает сохранённый прогресс через настоящий путь экрана.
    await tid(page, 'demo-chrome-back').click()
    await tid(page, 'library-hero').click()
    await expect(tid(page, 'hero-step-abundance')).toHaveAttribute('data-state', 'done')
    expect(errors).toEqual([])
    await writeFile(`${evidence}/${width}x${height}-metrics.json`, JSON.stringify(report, null, 2))
    // Всё записанное принадлежит этому изолированному демо-контексту.
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })
}

/* Только тестовые подмены: обычный путь приложения, без demo=1.
 * Ни пользователь, ни bearer ниже не являются подтверждённой сессией сервера.
 * Все API перехвачены, чтобы тест не обращался к настоящему backend.
 * Используем исключительно опубликованные тексты главы I. */
const serverPayload = {
  course: {
    title: DEMO_HERO_JOURNEY.title,
    description: 'Тестовый ответ загрузки: публичная глава I.',
  },
  chapters: [
    ...DEMO_HERO_JOURNEY.chapters.filter(chapter => !chapter.demoLocked),
    { key: 'threshold', roman: 'II', title: 'Тестовая глава', trialIds: ['body'] },
  ],
  // Проверяем доступный шаг II главы: текст — копия ПУБЛИЧНОГО шага 1,
  // а не закрытый материал сервера; число листов настоящего шага 5 неизвестно.
  trials: [
    ...publicSteps,
    { ...publicSteps[0], id: 'body', number: 5, title: 'Тестовый шаг сервера' },
  ],
  prologue: null,
  finale: null,
}
const testToken = 'hero-content-test-only-not-a-real-session'
const cases = ['success', 'empty-course', 'empty-body', '401', '403', '503', 'network', 'malformed']

for (const [width, height] of [
  [430, 932],
  [360, 640],
]) {
  for (const scenario of cases) {
    test(`Обычный режим, тестовый ответ ${scenario}: ${width}×${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      await page.addInitScript(
        ({ token, ids }) => {
          localStorage.setItem(
            'mentalix_web_user',
            JSON.stringify({ id: 900992, first_name: 'Тест' })
          )
          localStorage.setItem('mentalix_session_token', token)
          localStorage.setItem('mx-onboarded-v2', '1')
          localStorage.setItem(
            'mx-hero-journey-progress:900992',
            JSON.stringify({
              completed: Object.fromEntries(ids.map(id => [id, new Date().toISOString()])),
              signs: {},
              reflections: {},
              actions: {},
            })
          )
        },
        { token: testToken, ids: publicSteps.map(step => step.id) }
      )
      await mkdir(evidence, { recursive: true })
      const requests = []
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      let recovered = scenario === 'success'
      await page.route('**/api/**', route =>
        route.fulfill({ contentType: 'application/json', body: '[]' })
      )
      await page.route('**/api/content/hero-journey', route => {
        requests.push(route.request())
        if (recovered) return route.fulfill({ json: serverPayload })
        if (scenario === 'network') return route.abort('failed')
        if (['401', '403', '503'].includes(scenario))
          return route.fulfill({ status: Number(scenario), json: { detail: 'test-only' } })
        if (scenario === 'empty-body') return route.fulfill({ status: 200, body: '' })
        return route.fulfill({
          json:
            scenario === 'empty-course'
              ? { ...serverPayload, trials: [], chapters: [] }
              : { ok: true },
        })
      })
      await page.goto('/?tab=library&frame=0')
      await tid(page, 'library-hero').click()
      const map = tid(page, 'hero-journey-map')
      if (scenario === 'empty-course') {
        await expect(map).toHaveAttribute('data-content-source', 'server')
        await expect(map).toHaveAttribute('data-content-status', 'empty')
        await expect(tid(page, 'hero-empty-course')).toBeVisible()
        await expect(tid(page, 'hero-continue')).toHaveCount(0)
        await expect(tid(page, 'hero-content-failure')).toHaveCount(0)
        await page.screenshot({ path: `${evidence}/${width}x${height}-test-empty-course.png` })
      } else {
        if (!recovered) {
          const denied = ['401', '403'].includes(scenario)
          await expect(tid(page, 'hero-journey-error')).toHaveAttribute(
            'data-content-status',
            denied ? 'access' : 'error'
          )
          await expect(tid(page, 'hero-content-failure')).toBeVisible()
          await expect(map).toHaveCount(0)
          await expect(tid(page, 'hero-empty-course')).toHaveCount(0)
          if (denied) {
            await expect(tid(page, 'hero-content-failure')).toContainText('недоступен')
            await expect(tid(page, 'hero-content-failure')).not.toContainText('Проверь интернет')
          }
          if (scenario === '401')
            expect(
              await page.evaluate(() => localStorage.getItem('mentalix_session_token'))
            ).toBeNull()
          else
            expect(await page.evaluate(() => localStorage.getItem('mentalix_session_token'))).toBe(
              testToken
            )
          await page.screenshot({ path: `${evidence}/${width}x${height}-test-${scenario}.png` })
          const failedRequests = requests.length
          recovered = true
          await tid(page, 'hero-retry').click()
          await expect(map).toHaveAttribute('data-content-source', 'server')
          expect(requests.length).toBeGreaterThan(failedRequests)
        }
        await expect(map).toHaveAttribute('data-content-source', 'server')
        await expect(map).toHaveAttribute('data-content-status', 'ready')
        await expect(map).toContainText(serverPayload.course.description)
        await expect(page.locator('.mx-hj-chapter--demo-locked')).toHaveCount(0)
        await expect(tid(page, 'hero-step-body')).toHaveAttribute('data-state', 'open')
        if (scenario === 'success')
          await page.screenshot({ path: `${evidence}/${width}x${height}-test-success.png` })
        await tid(page, 'hero-continue').click()
        for (const [index, sheet] of publicSteps[0].pages.entries()) {
          await expect(tid(page, 'hero-story-page')).toHaveAttribute('data-page', String(index + 1))
          await expect(tid(page, 'hero-story-page')).toContainText(sheet.label)
          await assertFits(page)
          await tid(page, 'hero-story-next').click()
        }
        await expect(tid(page, 'hero-write-input')).toBeVisible()
      }
      expect(requests.length).toBeGreaterThan(0)
      expect(requests[0].headers().authorization).toBe(`Bearer ${testToken}`)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        )
      ).toBeLessThanOrEqual(2)
      expect(errors).toEqual([])
      await mkdir(evidence, { recursive: true })
      await writeFile(
        `${evidence}/${width}x${height}-${scenario}.json`,
        JSON.stringify(
          {
            scenario,
            width,
            height,
            source: 'test-route-not-real-backend',
            requests: requests.length,
            recovered,
            publicSheets: recovered ? publicSteps[0].pages.length : 0,
          },
          null,
          2
        )
      )
      await page.evaluate(() => {
        localStorage.clear()
        sessionStorage.clear()
      })
    })
  }
}
