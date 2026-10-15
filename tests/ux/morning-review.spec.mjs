import { expect, test } from '@playwright/test'
import {
  backToToday,
  dayFocusOptionStep,
  feedbackStep,
  openDayCard,
  scaleStep,
} from './checkin-helpers.mjs'

/*
 * AUD-015: переписан под текущий утренний чек-ин.
 *
 * Замысел сохранён: прохождение шагов утра до экрана завершения
 * и состояние карточки «Утро отмечено» на «Сегодня».
 *
 * Используется демо-режим (?demo=1 без today_state): утренняя карточка
 * активна (checkin = null → morning = 'active'). После завершения
 * чек-ина демо-движок сохраняет запись в localStorage, и карточка
 * переходит в состояние 'done'.
 *
 * Шаги утреннего чек-ина (CheckIn.jsx):
 *   1. «Как ты сейчас?»       — шкала (mood)
 *   2. «Как ты спал?»         — шкала (sleep_quality)
 *   3. «Сколько в тебе энергии?» — шкала (energy)
 *   4. «Уровень концентрации»  — шкала (focus)
 *   5. «Главный фокус на сегодня?» — выбор плитки (day_focus)
 *   6. Текстовый шаг (note)   — завершение кнопкой-галочкой
 *   7. Экран завершения: feedback, streak, «Вернуться в Сегодня»
 *
 * Ожидание состояний элементов, не waitForTimeout (AGENTS.md).
 */

const card = (page, kind) => page.getByTestId(`today-card-${kind}`)

test('утренний чек-ин: прохождение шагов до завершения и «Утро отмечено»', async ({ page }) => {
  await page.goto('/?demo=1')

  // Утренняя карточка активна (checkin = null)
  await expect(card(page, 'morning')).toBeVisible()
  await expect(card(page, 'morning')).toHaveAttribute('data-state', 'active')

  // Открыть утренний чек-ин
  await openDayCard(page, 'morning')

  // Шаг 1: «Как ты сейчас?» — шкала
  await expect(page.getByRole('heading', { name: 'Как ты сейчас?' })).toBeVisible()
  await scaleStep(page, 4)

  // Шаг 2: «Как ты спал?» — шкала
  await expect(page.getByRole('heading', { name: 'Как ты спал?' })).toBeVisible()
  await scaleStep(page, 3)

  // Шаг 3: «Сколько в тебе энергии?» — шкала
  await expect(page.getByRole('heading', { name: 'Сколько в тебе энергии?' })).toBeVisible()
  await scaleStep(page, 3)

  // Шаг 4: «Уровень концентрации» — шкала
  await expect(page.getByRole('heading', { name: 'Уровень концентрации' })).toBeVisible()
  await scaleStep(page, 3)

  // Шаг 5: «Главный фокус на сегодня?» — выбор плитки
  await expect(page.getByRole('heading', { name: 'Главный фокус на сегодня?' })).toBeVisible()
  await dayFocusOptionStep(page, 'Работа')

  // Шаг 6: текстовый шаг — кнопка-галочка «Завершить»
  await expect(page.getByTestId('checkin-complete')).toBeVisible()
  await expect(page.getByTestId('checkin-complete')).toHaveAttribute('aria-label', 'Завершить')
  await page.getByTestId('checkin-complete').click()

  // Экран завершения
  await expect(page.getByTestId('checkin-feedback-option').first()).toBeVisible()
  await expect(page.getByTestId('checkin-streak')).toBeVisible()
  await expect(page.getByTestId('checkin-back-to-today')).toBeVisible()

  // Вернуться на «Сегодня»
  await backToToday(page)

  // Карточка утра теперь «отмечена»
  await expect(card(page, 'morning')).toBeVisible()
  await expect(card(page, 'morning')).toHaveAttribute('data-state', 'done')
})
