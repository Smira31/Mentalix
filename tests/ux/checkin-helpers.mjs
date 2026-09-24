import { expect } from '@playwright/test'

/**
 * Общие пошаговые помощники для MXL-010 и smoke-сценариев.
 * Все поиск — по data-testid, не по тексту/классам.
 * Никаких waitForTimeout — только ожидание состояния.
 */

/**
 * Шаг шкалы: выбрать значение level и нажать «Далее», если кнопка видна и активна.
 * @param {import('@playwright/test').Page} page
 * @param {number} level — уровень шкалы (1–5)
 */
export async function scaleStep(page, level) {
  const option = page.locator(`[data-testid="checkin-scale-option"][data-level="${level}"]`)
  await expect(option).toBeVisible()
  await option.click()

  const next = page.locator('[data-testid="checkin-next"]')
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
 * Проверить, что неделя отрисована (7 дней).
 * @param {import('@playwright/test').Page} page
 */
export async function expectWeekStrip(page) {
  const days = page.locator('[data-testid="today-week-day"]')
  await expect(days).toHaveCount(7)
}
