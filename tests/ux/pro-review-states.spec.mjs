import path from 'node:path'
import { test, expect } from '@playwright/test'

import { createEvidenceWriter, describeFrames } from './typography-evidence.mjs'

/*
 * PRO-002b/c — доказательная съёмка экранов Mentalix Pro.
 *
 * Что доказывает прогон (без backend: работает dev-only mock `?proMock=…`):
 *  1) состояния API: согласие → «ещё не собран» → готовый разбор → план →
 *     прогресс, а также ограничения доступа (402 pro_required, 404
 *     pro_*_disabled), недостаток данных, кризисный ответ, конфликт сборки,
 *     конфликт версий и конфликт пересборки;
 *  2) геометрия на 393×852 и 360×640: нет горизонтального выхода;
 *  3) MXL-KEYBOARD-001 в Pro: вход в правку («Изменить») ставит фокус в
 *     основное поле сам, фактический размер ввода — 16px.
 *
 * Кадр снимается через общий писатель доказательств: он требует уникальный
 * признак экрана, ждёт завершения анимации входа, отклоняет пустой кадр и
 * кадр, совпавший с другим состоянием. Поэтому «FAIL-» заглушки здесь
 * невозможны: состояние либо снято как доказательство, либо прогон падает.
 *
 * Запуск в web-контейнере (VITE_PRO_REVIEW_PLAN_ENABLED=true задаёт конфиг):
 *   npm run ux:pro-states
 */

const OUT_DIR = path.join('qa-evidence', 'pro-review-plan')
const MOCK_STATE_KEY = 'mx-pro-mock-state:v1'

const VIEWPORTS = [
  { name: '393x852', width: 393, height: 852 },
  { name: '360x640', width: 360, height: 640 },
]

const DESKTOP_PHONE = { width: 393, height: 852 }

/* ── Измерения и проверки ── */

/** Фактический (computed) размер поля и владеет ли он фокусом. */
async function readField(page, testId) {
  return page.evaluate(id => {
    const el = document.querySelector(`[data-testid="${id}"]`)
    if (!el) return null
    const cs = getComputedStyle(el)
    return {
      size: Math.round(parseFloat(cs.fontSize) * 100) / 100,
      focused: document.activeElement === el,
    }
  }, testId)
}

/** Горизонтальный выход: сам документ и элементы, пересёкшие правую границу. */
async function readOverflow(page) {
  return page.evaluate(() => {
    const de = document.documentElement
    const offenders = [...document.querySelectorAll('body *')]
      .filter(el => {
        const rect = el.getBoundingClientRect()
        return rect.width > 0 && rect.right > de.clientWidth + 2
      })
      .slice(0, 5)
      .map(el => `${el.tagName.toLowerCase()}${el.getAttribute('data-testid') ? `[${el.getAttribute('data-testid')}]` : ''}`)

    return { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, offenders }
  })
}

function assertNoOverflow(overflow, label) {
  expect(
    overflow.scrollWidth,
    `${label}: горизонтальный выход (виновники: ${overflow.offenders.join(', ')})`
  ).toBeLessThanOrEqual(overflow.clientWidth + 2)
}

/* ── Прохождение экранов Pro ── */

/** «Прогресс» → «Аналитика» → карточка «Разбор и план недели». Вход тот же, что у пользователя. */
async function openPro(page, scenario) {
  /*
   * Состояние mock живёт в localStorage: согласие, собранный разбор и план
   * переживают перезагрузку страницы, поэтому каждый сценарий начинается с
   * чистого состояния — иначе он получил бы данные предыдущего.
   */
  await page.addInitScript(key => {
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* хранилище недоступно — состояние и так пустое */
    }
  }, MOCK_STATE_KEY)

  await page.goto(`/?demo=1&frame=0&proMock=${scenario}`)
  await expect(page.getByRole('button', { name: 'Прогресс' })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Прогресс' }).click()
  await expect(page.getByTestId('progress-pro-card')).toBeVisible()
  await page.getByTestId('progress-pro-card').click()
  await expect(page.locator('.mx-page-title')).toContainText('мой разбор.')
}

/** Согласие → сборка разбора. Общий первый шаг почти всех сценариев. */
async function buildReport(page) {
  await page.getByTestId('pro-consent-enable').click()
  await expect(page.getByTestId('pro-generate-report')).toBeVisible()
  await page.getByTestId('pro-generate-report').click()
}

/** Согласие → разбор → план недели. */
async function buildPlan(page) {
  await buildReport(page)
  await expect(page.getByTestId('pro-open-plan')).toBeVisible()
  await page.getByTestId('pro-open-plan').click()
  await expect(page.getByTestId('pro-generate-plan')).toBeVisible()
  await page.getByTestId('pro-generate-plan').click()
  await expect(page.getByTestId('pro-plan-progress')).toBeVisible()
}

/**
 * Снять состояние: сначала довести признак в видимую область (кадр снимается
 * с текущей позиции прокрутки), затем снять через писатель доказательств.
 */
async function capture(page, writer, { name, marker, label }) {
  await page
    .locator(marker)
    .first()
    .scrollIntoViewIfNeeded()
    .catch(() => {})

  const overflow = await readOverflow(page)
  assertNoOverflow(overflow, `${name} (${label})`)

  await writer.capture(page, { name, marker, markerLabel: label })

  return overflow
}

/* ── Полный путь на двух размерах телефона ── */

for (const viewport of VIEWPORTS) {
  test.describe(`Pro: полный путь — ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('согласие → разбор → план → правки → прогресс', async ({ page }) => {
      const writer = createEvidenceWriter({ dir: path.join(OUT_DIR, viewport.name) })

      await openPro(page, 'ready')

      // 1. Согласие на использование записей.
      await capture(page, writer, {
        name: '1-consent.png',
        marker: '[data-testid="pro-consent-enable"]',
        label: 'Pro: согласие',
      })

      // 2. Разбор ещё не собран.
      await page.getByTestId('pro-consent-enable').click()
      await capture(page, writer, {
        name: '2-report-not-generated.png',
        marker: '[data-testid="pro-generate-report"]',
        label: 'Pro: разбор не собран',
      })

      // 3. Готовый разбор.
      await page.getByTestId('pro-generate-report').click()
      await capture(page, writer, {
        name: '3-report-ready.png',
        marker: '[data-testid="pro-open-plan"]',
        label: 'Pro: разбор недели готов',
      })

      // 4. План ещё не собран.
      await page.getByTestId('pro-open-plan').click()
      await capture(page, writer, {
        name: '4-plan-not-generated.png',
        marker: '[data-testid="pro-generate-plan"]',
        label: 'Pro: план не собран',
      })

      // 5. Готовый план недели.
      await page.getByTestId('pro-generate-plan').click()
      await capture(page, writer, {
        name: '5-plan-ready.png',
        marker: '[data-testid="pro-plan-progress"]',
        label: 'Pro: план недели готов',
      })

      // 6. Правка общей цели: фокус без второго нажатия, поле 16px.
      await page.getByTestId('pro-goal-edit').click()
      await expect(page.getByTestId('pro-goal-edit-input')).toBeFocused()
      await capture(page, writer, {
        name: '6-goal-edit-focus.png',
        marker: '[data-testid="pro-goal-edit-input"]',
        label: 'Pro: правка цели с фокусом',
      })

      const goalField = await readField(page, 'pro-goal-edit-input')
      expect(goalField.focused, 'правка цели: поле получило фокус само').toBe(true)
      expect(goalField.size, 'правка цели: фактический размер ввода').toBeCloseTo(16, 1)

      await page.getByRole('button', { name: 'Отмена' }).click()

      // 7. Правка действия дня: фокус в поле действия, оба поля 16px.
      await page.getByTestId('pro-day-1-edit').click()
      await expect(page.getByTestId('pro-plan-edit-input')).toBeFocused()
      await capture(page, writer, {
        name: '7-day-edit-focus.png',
        marker: '[data-testid="pro-plan-edit-input"]',
        label: 'Pro: правка дня с фокусом',
      })

      const actionField = await readField(page, 'pro-plan-edit-input')
      const criteriaField = await readField(page, 'pro-plan-edit-criteria')
      expect(actionField.focused, 'правка дня: поле действия получило фокус само').toBe(true)
      expect(actionField.size, 'правка дня: размер поля действия').toBeCloseTo(16, 1)
      expect(criteriaField.size, 'правка дня: размер поля критерия').toBeCloseTo(16, 1)

      await page.getByRole('button', { name: 'Отмена' }).click()

      // 8. Прогресс недели.
      await page.getByTestId('pro-open-progress').click()
      await capture(page, writer, {
        name: '8-progress.png',
        marker: '[data-testid="pro-progress-completion"]',
        label: 'Pro: прогресс недели',
      })

      console.log(`Pro ${viewport.name}:\n${describeFrames(writer)}`)
    })
  })
}

/* ── Состояния доступа и особые ответы API ── */

test.describe('Pro: доступ и особые состояния', () => {
  test.use({ viewport: DESKTOP_PHONE })

  test('402 pro_required и 404 pro_report_disabled', async ({ page }) => {
    const writer = createEvidenceWriter({ dir: OUT_DIR })

    await openPro(page, 'nopro')
    await capture(page, writer, {
      name: '9-blocked-nopro.png',
      marker: '[data-testid="pro-blocked-state"]',
      label: 'Pro: нет подписки (402)',
    })
    await expect(page.locator('[data-testid="pro-blocked-state"]')).toContainText('Pro недоступен')

    await openPro(page, 'disabled')
    await capture(page, writer, {
      name: '10-blocked-disabled.png',
      marker: '[data-testid="pro-blocked-state"]',
      label: 'Pro: функция отключена (404)',
    })
    await expect(page.locator('[data-testid="pro-blocked-state"]')).toContainText('Функция пока отключена')

    console.log(`Pro доступ:\n${describeFrames(writer)}`)
  })

  test('недостаточно данных, кризисный ответ и конфликт сборки', async ({ page }) => {
    const writer = createEvidenceWriter({ dir: OUT_DIR })

    // Недостаточно данных (409 insufficient_data).
    await openPro(page, 'insufficient')
    await buildReport(page)
    await capture(page, writer, {
      name: '11-insufficient.png',
      marker: '[data-testid="pro-insufficient-state"]',
      label: 'Pro: недостаточно данных',
    })

    // Кризисный ответ (200 crisis) — разбор не собирается.
    await openPro(page, 'crisis')
    await buildReport(page)
    await expect(page.getByText('Похоже, сейчас тебе по-настоящему тяжело')).toBeVisible()
    await capture(page, writer, {
      name: '12-crisis.png',
      marker: '.mx-page-title',
      label: 'Pro: кризисный ответ',
    })

    // Конфликт сборки: POST отвечает 409, разбор доходит ограниченным GET.
    await openPro(page, 'conflict')
    await buildReport(page)
    await capture(page, writer, {
      name: '13-conflict-ready.png',
      marker: '[data-testid="pro-open-plan"]',
      label: 'Pro: сборка после 409 завершилась',
    })

    console.log(`Pro состояния:\n${describeFrames(writer)}`)
  })

  test('конфликт пересборки и конфликт версий сохраняют план и ввод', async ({
    page,
  }) => {
    const writer = createEvidenceWriter({ dir: OUT_DIR })

    // Конфликт пересборки: план уже собран и изменён на сервере.
    await openPro(page, 'rebuild_conflict')
    await buildPlan(page)
    page.on('dialog', dialog => dialog.accept())
    await page.getByTestId('pro-rebuild-plan').click()
    await expect(page.getByText('Пересборка не выполнена')).toBeVisible()
    await capture(page, writer, {
      name: '14-rebuild-conflict.png',
      marker: '[data-testid="pro-plan-progress"]',
      label: 'Pro: конфликт пересборки',
    })

    // Конфликт версий: правка не сохраняется, введённый текст остаётся.
    await openPro(page, 'version_conflict')
    await buildPlan(page)
    await page.getByTestId('pro-day-1-edit').click()
    await page.getByTestId('pro-plan-edit-input').fill('Проверка сохранения ввода при конфликте')
    await page.getByTestId('pro-plan-edit-save').click()
    await expect(page.getByTestId('pro-conflict-card')).toBeVisible()
    await capture(page, writer, {
      name: '15-version-conflict.png',
      marker: '[data-testid="pro-conflict-card"]',
      label: 'Pro: конфликт версий, ввод сохранён',
    })
    await expect(page.getByTestId('pro-plan-edit-input')).toHaveValue(
      'Проверка сохранения ввода при конфликте'
    )

    console.log(`Pro конфликты:\n${describeFrames(writer)}`)
  })
})
