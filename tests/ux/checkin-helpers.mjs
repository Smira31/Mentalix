import { expect } from '@playwright/test'

/**
 * Общие пошаговые помощники для MXL-010 и smoke-сценариев.
 * Все поиск — по data-testid, не по тексту/классам.
 * Никаких waitForTimeout — только ожидание состояния.
 */

/**
 * Круглая кнопка шага после ответа: «→» («Далее»).
 * @param {import('@playwright/test').Page} page
 */
export function nextStepButton(page) {
  return page.locator('[data-testid="checkin-next"][aria-label="Далее"]')
}

/**
 * Круглая кнопка шага без ответа: «✕» («Закрыть») — выход с черновиком.
 * Прежней заблокированной «→» на неотвеченном шаге больше нет.
 * @param {import('@playwright/test').Page} page
 */
export function closeStepButton(page) {
  return page.locator('[data-testid="checkin-next"][aria-label="Закрыть"]')
}

/**
 * Шаг шкалы: выбрать значение level и нажать «Далее», если кнопка видна и активна.
 * @param {import('@playwright/test').Page} page
 * @param {number} level — уровень шкалы (1–5)
 */
export async function scaleStep(page, level) {
  const option = page.locator(`[data-testid="checkin-scale-option"][data-level="${level}"]`)
  await expect(option).toBeVisible()
  await expect(page.locator('[data-testid="checkin-skip"]')).toHaveCount(0)
  // Пока ответа нет, круглая кнопка — «✕»: нажатие закрывает чек-ин с черновиком.
  await expect(closeStepButton(page)).toBeVisible()
  await option.click()
  await expect(option).toHaveAttribute('aria-checked', 'true')
  await expect(page.locator('[data-testid="checkin-scale-option"][aria-checked="true"]')).toHaveCount(1)

  const next = nextStepButton(page)
  if (await next.isVisible()) {
    await expect(next).toBeEnabled()
    await next.click()
  }
}

/**
 * Текстовый шаг: заполнить поле и нажать «Далее» (или submit-кнопку).
 * @param {import('@playwright/test').Page} page
 * @param {string} text — текст для ввода
 * @param {string} [submitTestId="checkin-next"] — data-testid кнопки отправки
 */
export async function textStep(page, text, submitTestId = 'checkin-next') {
  const input = page.locator('[data-testid="checkin-text-input"]')
  await expect(input).toBeVisible()
  await input.fill(text)

  const submit = page.locator(`[data-testid="${submitTestId}"]`)
  await expect(submit).toBeVisible()
  await expect(submit).toBeEnabled()
  await submit.click()
}

/**
 * Шаг эмоций: выбрать pill по названию эмоции.
 * @param {import('@playwright/test').Page} page
 * @param {string} emotion — название эмоции (например, 'ровно')
 */
export async function emotionStep(page, emotion) {
  const pill = page.locator(`[data-testid="checkin-emotion-pill"][data-emotion="${emotion}"]`)
  await expect(pill).toBeVisible()
  await pill.click()
}

/**
 * Завершить чек-ин: нажать кнопку завершения.
 * @param {import('@playwright/test').Page} page
 */
export async function completeCheckin(page) {
  const complete = page.locator('[data-testid="checkin-complete"]')
  await expect(complete).toBeVisible()
  await expect(complete).toBeEnabled()
  await complete.click()
}

/**
 * «Назад» в веб-превью — свайп от левого края (полоса 24px, порог 35% ширины
 * экрана): на шаге ≥ 1 возвращает на предыдущий шаг, на первом шаге закрывает
 * чек-ин так же, как «✕» на шаге. Системная кнопка Telegram и пилюля демо-шапки
 * вызывают тот же обработчик.
 * @param {import('@playwright/test').Page} page
 * @param {string} [selector=".mx-demo-checkin"] — поверхность чек-ина
 */
export async function edgeSwipeBack(page, selector = '.mx-demo-checkin') {
  await page.evaluate(selector => {
    const el = document.querySelector(selector)
    if (!el) throw new Error(`Элемент не найден: ${selector}`)

    const startX = 0 // левый край, в полосе EDGE_WIDTH (24px)
    const rect = el.getBoundingClientRect()
    const startY = rect.top + rect.height / 2
    const distance = window.innerWidth * 0.5 // 50% ширины > порога 35%

    function makeTouch(x, y) {
      return new Touch({
        identifier: 0,
        target: el,
        clientX: x,
        clientY: y,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 1,
      })
    }

    function dispatch(type, touch) {
      const event = new TouchEvent(type, {
        touches: type === 'touchend' ? [] : [touch],
        targetTouches: type === 'touchend' ? [] : [touch],
        changedTouches: [touch],
        bubbles: true,
        cancelable: true,
      })
      el.dispatchEvent(event)
    }

    dispatch('touchstart', makeTouch(startX, startY))

    const steps = 12
    for (let i = 1; i <= steps; i += 1) {
      dispatch('touchmove', makeTouch(startX + (distance * i) / steps, startY))
    }

    dispatch('touchend', makeTouch(startX + distance, startY))
  }, selector)
}

/**
 * Шаг «Главный фокус дня»: выбрать плитку из сетки 3×3 (ровно 9 плиток,
 * без «Показать все»). Проверяем выбранное значение, а не только наличие кнопки.
 */
export async function dayFocusOptionStep(page, label) {
  const tiles = page.locator('[data-testid="checkin-day-focus-option"]')
  await expect(tiles).toHaveCount(9)
  await expect(page.locator('[data-testid="checkin-day-focus-show-all"]')).toHaveCount(0)
  // Пока плитка не выбрана, круглая кнопка — «✕»: шаг вперёд без выбора больше не пропускается.
  await expect(closeStepButton(page)).toBeVisible()
  const tile = page.locator(`[data-testid="checkin-day-focus-option"][data-value="${label}"]`)
  await expect(tile).toBeVisible()
  await tile.click()
  await expect(tile).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('[data-testid="checkin-day-focus-input"]')).toHaveCount(0)
  await expect(page.locator('[data-testid="checkin-day-focus-option"][aria-pressed="true"]')).toHaveCount(1)
  const next = nextStepButton(page)
  await expect(next).toBeEnabled()
  await next.click()
}

/**
 * Ответить на «Было полезно?» на экране завершения.
 * @param {import('@playwright/test').Page} page
 * @param {'no'|'some'|'yes'} value — значение кнопки: «Нет» / «Немного» / «Да»
 */
export async function feedbackStep(page, value) {
  const option = page.locator(`[data-testid="checkin-feedback-option"][data-value="${value}"]`)
  await expect(option).toBeVisible()
  await option.click()
}

/**
 * Закрыть экран завершения разбора дня («Вернуться в Сегодня»).
 * @param {import('@playwright/test').Page} page
 */
export async function closeCompletion(page) {
  const close = page.locator('[data-testid="checkin-back-to-today"]')
  await expect(close).toBeVisible()
  await close.click()
}

/**
 * Вернуться на экран «Сегодня» после завершения.
 * @param {import('@playwright/test').Page} page
 */
export async function backToToday(page) {
  const back = page.locator('[data-testid="checkin-back-to-today"]')
  await expect(back).toBeVisible()
  await back.click()
}

/**
 * Открыть карточку дня по kind (morning/evening).
 * @param {import('@playwright/test').Page} page
 * @param {string} kind — 'morning' или 'evening'
 */
export async function openDayCard(page, kind) {
  const card = page.locator(`[data-testid="today-card-${kind}"]`)
  await expect(card).toBeVisible()
  await expect(card).toHaveAttribute('data-state', /active|done/)
  await card.click()
}

/**
 * Нажать «Назад» (общая кнопка возврата).
 * @param {import('@playwright/test').Page} page
 */
export async function goBack(page) {
  const back = page.locator('[data-testid="back-button"]')
  await expect(back).toBeVisible()
  await back.click()
}

/**
 * Закрыть чек-ин круглой «✕» на шаге (выход на «Сегодня» с сохранением черновика).
 * Своей кнопки закрытия в шапке экрана больше нет: без ответа на шаге «✕» стоит
 * на месте «Далее», а на экране завершения выход даёт пилюля WebActionBar.
 * @param {import('@playwright/test').Page} page
 */
export async function closeCheckin(page) {
  const close = closeStepButton(page)
  await expect(close).toBeVisible()
  await close.click()
}

/**
 * Подтвердить закрытие с несохранённым черновиком (диалог «Закрыть запись?»).
 * @param {import('@playwright/test').Page} page
 */
export async function confirmCloseWithDraft(page) {
  const closeBtn = page.locator('[data-testid="checkin-close-draft-confirm"]')
  await expect(closeBtn).toBeVisible()
  await closeBtn.click()
}

/**
 * Проверить, что неделя отрисована (7 дней).
 * @param {import('@playwright/test').Page} page
 */
export async function expectWeekStrip(page) {
  const days = page.locator('[data-testid="today-week-day"]')
  await expect(days).toHaveCount(7)
}

/** Открыть вчерашний разбор из предложения восстановления серии. */
export async function startStreakRecovery(page) {
  const offer = page.locator('[data-testid="streak-recovery-surface"]')
  await expect(offer).toBeVisible()
  await page.locator('[data-testid="streak-recovery-start"]').click()
  await expect(page.locator('[data-testid="streak-recovery-date"]')).toBeVisible()
}

/** Проверить подтверждение после сохранения вчерашнего разбора. */
export async function expectStreakRecovered(page) {
  await expect(page.locator('[data-testid="streak-recovery-title"]')).toContainText('Серия спасена')
  await page.locator('[data-testid="streak-recovery-finish"]').click()
  await expect(page.locator('[data-testid="today-streak-chip"]')).toBeVisible()
}
