import { test, expect } from '@playwright/test'

/*
 * UX-смок Журнала: Шаги → Открыть журнал → настройка пропуском →
 * Перечитай → Поток (✕ при пустом, ✓ при тексте) → Вопрос → финал «день 1».
 *
 * Данные берём из демо-режима (?demo=1). Поиск — по data-testid.
 */

test.use({ viewport: { width: 393, height: 852 } })

test('журнал: полный поток — настройка пропуском, поток, вопрос, финал день 1', async ({
  page,
}) => {
  await page.goto('/?demo=1&tab=practices')

  // Карточка журнала на «Шагах»
  await expect(page.getByTestId('journal-open-cta')).toBeVisible()
  await expect(page.locator('.mx-steps-journal__title')).toHaveText('Страница для себя')
  await page.getByTestId('journal-open-cta').click()

  // ── Настройка: 4 шага, все пропуском ──
  // Шаг 1 — Цели (пусто → ✕)
  await expect(page.getByTestId('dj-setup-next')).toBeVisible()
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 1 из 4 · Цели')
  await page.getByTestId('dj-setup-next').click()

  // Шаг 2 — Кем я становлюсь (пусто → ✕)
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 2 из 4 · Кем я становлюсь')
  await page.getByTestId('dj-setup-next').click()

  // Шаг 3 — Картинка будущего (пусто → ✕)
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 3 из 4 · Картинка будущего')
  await page.getByTestId('dj-setup-next').click()

  // Шаг 4 — Вопросы (есть дефолт → ✓)
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 4 из 4 · Мои вопросы')
  await page.getByTestId('dj-setup-next').click()

  // ── Перечитай ──
  await expect(page.locator('.mx-dj-review')).toBeVisible()
  // Настройка пустая → плашка
  await expect(page.locator('.mx-dj-review__empty')).toBeVisible()
  await page.getByTestId('dj-review-next').click()

  // ── Поток ──
  await expect(page.getByTestId('dj-stream-input')).toBeVisible()
  const streamValue = await page.getByTestId('dj-stream-input').inputValue()
  // Первая строка подставлена: «{дата}, {время}. Я сейчас…»
  expect(streamValue).toContain('Я сейчас')
  // Полоса «страницы» видна
  await expect(page.locator('.mx-dj-stream__bar')).toBeVisible()

  // Поле пустое (только первая строка) → кнопка ✕ (skip)
  const streamBtn = page.getByTestId('dj-stream-next')
  await expect(streamBtn).toHaveClass(/mx-round-next-btn--skip/)

  // Вводим текст → кнопка меняется на ✓
  await page.getByTestId('dj-stream-input').fill(
    '2 октября, 10:15. Я сейчас… сижу дома, пью чай. Думаю о том, что нужно сделать сегодня.'
  )
  await expect(streamBtn).not.toHaveClass(/mx-round-next-btn--skip/)
  await streamBtn.click()

  // ── Один вопрос ──
  await expect(page.getByTestId('dj-question-input')).toBeVisible()
  await expect(page.locator('.mx-dj-question__text')).toBeVisible()
  // Пустой ответ → ✕ (skip)
  const questionBtn = page.getByTestId('dj-question-next')
  await expect(questionBtn).toHaveClass(/mx-round-next-btn--skip/)
  await questionBtn.click()

  // ── Финал ──
  await expect(page.locator('.mx-completion')).toBeVisible()
  await expect(page.locator('.mx-completion__title')).toContainText('сохранена')
  // Плашка «день 1»
  await expect(page.locator('.mx-completion__date-pill')).toContainText('день 1')
  // Кнопка «Сохранить и выйти»
  await expect(page.getByTestId('dj-complete-close')).toBeVisible()
  await expect(page.getByTestId('dj-complete-close')).toHaveText('Сохранить и выйти')
})
