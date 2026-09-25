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
 * Закрыть экран завершения разбора дня («Закрыть»).
 * @param {import('@playwright/test').Page} page
 */
export async function closeCompletion(page) {
  const close = page.locator('[data-testid="checkin-save"]')
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
 * Проверить, что неделя отрисована (7 дней).
 * @param {import('@playwright/test').Page} page
 */
export async function expectWeekStrip(page) {
  const days = page.locator('[data-testid="today-week-day"]')
  await expect(days).toHaveCount(7)
}

// ── Помощники для практики «Настроение» (MoodPractice) ──

/**
 * Начать практику: нажать «Начать» на экране вступления.
 * Если вступление уже пройдено (intro seen), шаг пропускается.
 * @param {import('@playwright/test').Page} page
 */
export async function moodPracticeStart(page) {
  const startBtn = page.locator('[data-testid="mood-practice-start"]')
  if (await startBtn.isVisible()) {
    await startBtn.click()
  }
  await expect(page.locator('[data-testid="mood-practice-step"][data-step="mood"]')).toBeVisible()
}

/**
 * Шаг шкалы настроения: выбрать уровень и нажать «Далее».
 * @param {import('@playwright/test').Page} page
 * @param {number} level — уровень (1–5)
 */
export async function moodPracticeMoodStep(page, level) {
  const option = page.locator('[data-testid="checkin-scale-option"][data-level="' + level + '"]')
  await expect(option).toBeVisible()
  await option.click()

  const next = page.locator('[data-testid="checkin-next"]')
  await expect(next).toBeEnabled()
  await next.click()
  await expect(
    page.locator('[data-testid="mood-practice-step"][data-step="emotion"]')
  ).toBeVisible()
}

/**
 * Шаг эмоций: выбрать pill по названию и нажать «Далее».
 * @param {import('@playwright/test').Page} page
 * @param {string} emotion — название эмоции (data-emotion)
 */
export async function moodPracticeEmotionStep(page, emotion) {
  const pill = page.locator('[data-testid="mood-practice-emotion"][data-emotion="' + emotion + '"]')
  await expect(pill).toBeVisible()
  await pill.click()

  const next = page.locator('[data-testid="checkin-next"]')
  await expect(next).toBeEnabled()
  await next.click()
  await expect(
    page.locator('[data-testid="mood-practice-step"][data-step="context"]')
  ).toBeVisible()
}

/**
 * Шаг контекста: опционально заполнить заметку и/или выбрать контекст, затем «Далее».
 * @param {import('@playwright/test').Page} page
 * @param {{ note?: string, context?: string }} [opts]
 */
export async function moodPracticeContextStep(page, opts = {}) {
  if (opts.note != null) {
    const textarea = page.locator('[data-testid="mood-practice-note"]')
    await expect(textarea).toBeVisible()
    await textarea.fill(opts.note)
  }

  if (opts.context != null) {
    const pill = page.locator(
      '[data-testid="mood-practice-context"][data-context="' + opts.context + '"]'
    )
    await expect(pill).toBeVisible()
    await pill.click()
  }

  const next = page.locator('[data-testid="checkin-next"]')
  await expect(next).toBeEnabled()
  await next.click()
  await expect(
    page.locator('[data-testid="mood-practice-step"][data-step="breathing"]')
  ).toBeVisible()
}

/**
 * Шаг дыхания: нажать «Не сейчас» (сохранить без дыхания).
 * @param {import('@playwright/test').Page} page
 */
export async function moodPracticeSkipBreathing(page) {
  const skip = page.locator('[data-testid="mood-practice-skip-breathing"]')
  await expect(skip).toBeVisible()
  await skip.click()
}

/**
 * Шаг дыхания: нажать «Подышать минуту» (сохранить с дыханием).
 * @param {import('@playwright/test').Page} page
 */
export async function moodPracticeBreathe(page) {
  const breathe = page.locator('[data-testid="mood-practice-breathe"]')
  await expect(breathe).toBeVisible()
  await breathe.click()
}

/**
 * Завершить практику: нажать «Готово» на экране завершения.
 * @param {import('@playwright/test').Page} page
 */
export async function moodPracticeDone(page) {
  const done = page.locator('[data-testid="mood-practice-done"]')
  await expect(done).toBeVisible()
  await done.click()
}

/**
 * Проверить, что сообщение об ошибке сохранения видно.
 * @param {import('@playwright/test').Page} page
 */
export async function expectMoodPracticeError(page) {
  const error = page.locator('[data-testid="mood-practice-error"]')
  await expect(error).toBeVisible()
}

/**
 * Дождаться экрана завершения практики.
 * @param {import('@playwright/test').Page} page
 */
export async function expectMoodPracticeCompletion(page) {
  await expect(page.locator('[data-testid="mood-practice-completion"]')).toBeVisible()
}
