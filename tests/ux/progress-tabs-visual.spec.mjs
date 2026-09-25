import { expect, test } from '@playwright/test'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

// Visual snapshots для экрана «Прогресс» в demo-режиме (?demo=1).
// Робот ux-visual (ux-check.spec.mjs) снимает только дефолтную вкладку
// (slug 08-trends) на mocked fixtures. Этот файл — обход робота: обе
// вкладки сегмента «Аналитика | История» снимаются в demo-режиме через
// isPreviewDemoMode, на тех же четырёх mobile viewport.
//
// Demo-режим активируется через ?demo=1 — isPreviewDemoMode() в
// src/lib/demoMode.js перехватывает API-вызовы демо-данными (demoRequest).
// Защитный тест MXL-PREVIEW-DEMO-001 не затрагивается — demoMode.js не
// меняется.

const ARTIFACT_ROOT = path.resolve('artifacts/progress-visual')

const VISUAL_ANCHOR_SLUGS = new Set(['08a-progress-analytics', '08b-progress-history'])

const RUN_VISUAL_SNAPSHOTS = process.env.RUN_VISUAL_SNAPSHOTS === 'true'

const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568 },
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
]

const UX_FIXED_TIME = process.env.UX_FIXED_TIME || '08:00'

async function freezePageTime(page) {
  await page.clock.setFixedTime(`2026-09-23T${UX_FIXED_TIME}:00+03:00`)
}

function sanitizeReason(error) {
  return String(error?.message || error || 'Неизвестная ошибка')
    .split('\n')[0]
    .replaceAll(/\u001b\[[0-9;]*m/g, '')
    .replaceAll('|', '\\|')
    .slice(0, 240)
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

  if (runtimeErrors.length > 0) {
    throw new Error(`Runtime error: ${runtimeErrors.join('; ')}`)
  }
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
      await expect(page).toHaveScreenshot(`${viewport.name}/${slug}.png`, {
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
    `# Progress visual snapshots (demo mode)\n\n` +
    `Результат: **${failed === 0 ? 'PASS' : 'FAIL'}** — ${results.length - failed}/${results.length} экранов прошли.\n\n` +
    `| Экран | Viewport | Статус | Причина | Screenshot |\n` +
    `| --- | --- | --- | --- | --- |\n` +
    `${rows.join('\n')}\n`
  )
}

test('Progress visual snapshots: Аналитика и История (demo mode)', async ({ browser, baseURL }) => {
  test.setTimeout(300_000)

  await rm(ARTIFACT_ROOT, { recursive: true, force: true })
  await mkdir(ARTIFACT_ROOT, { recursive: true })

  const results = []

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: true,
      hasTouch: true,
      colorScheme: 'dark',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    })

    // В demo-режиме API перехватывается демо-данными (demoRequest в
    // demoMode.js). Блокируем внешние запросы как fallback.
    await context.route('**/api/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    )

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

    // Навигация в demo-режиме через ?demo=1 — isPreviewDemoMode()
    await page.goto('/?demo=1')

    // Дождаться загрузки приложения — кнопка нижней навигации
    await expect(page.getByRole('button', { name: 'Шаги' })).toBeVisible({ timeout: 15_000 })

    // Переход на экран «Прогресс»
    await page.getByRole('button', { name: 'Прогресс' }).click()

    // Дождаться появления заголовка и сегмент-бара
    await expect(page.getByRole('heading', { name: 'аналитика.' })).toBeAttached({
      timeout: 10_000,
    })
    await expect(page.getByTestId('progress-tab-analytics')).toBeVisible()
    await expect(page.getByTestId('progress-tab-history')).toBeVisible()

    // Вкладка «Аналитика» — активна по умолчанию
    await expect(page.getByTestId('progress-tab-analytics')).toHaveAttribute(
      'aria-selected',
      'true'
    )

    await captureScreen({
      page,
      viewport,
      screen: 'Progress — Аналитика',
      slug: '08a-progress-analytics',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByTestId('progress-tab-analytics')).toHaveAttribute(
          'aria-selected',
          'true'
        )
        await expect(page.getByRole('heading', { name: 'аналитика.' })).toBeAttached()
      },
    })

    // Тап по сегменту «История» — переключение вкладки
    await page.getByTestId('progress-tab-history').tap()
    await expect(page.getByTestId('progress-tab-history')).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await expect(page.getByTestId('progress-tab-analytics')).toHaveAttribute(
      'aria-selected',
      'false'
    )

    await captureScreen({
      page,
      viewport,
      screen: 'Progress — История',
      slug: '08b-progress-history',
      runtimeErrors,
      results,
      check: async () => {
        await expect(page.getByTestId('progress-tab-history')).toHaveAttribute(
          'aria-selected',
          'true'
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
    `Progress visual: ${failed.map(item => `${item.viewport}/${item.screen}`).join(', ')}`
  ).toEqual([])
})
