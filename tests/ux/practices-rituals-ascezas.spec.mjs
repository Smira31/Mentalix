import { test, expect } from '@playwright/test'

/*
 * Фокусный UX-смоук ритуалов и аскез: единый каркас PracticeListFlow.
 *
 * Данные берём из демо-режима (?demo=1) — он единственный даёт практики без
 * backend. Поиск элементов — только по data-testid, текст проверяем как
 * отображение. Ожидания — по состоянию, без waitForTimeout.
 */

test.use({ viewport: { width: 393, height: 852 } })

test('список ритуалов: сетка, «сегодня N из M» и отметка без входа в практику', async ({
  page,
}) => {
  await page.goto('/?demo=1&tab=practices&action=rituals_list')

  await expect(page.getByTestId('practice-grid')).toBeVisible()
  await expect(page.getByTestId('practice-tile')).toHaveCount(4)
  await expect(page.getByTestId('practice-today-progress')).toHaveText('сегодня 3 из 4')
  await expect(page.locator('[data-testid="practice-tile"][data-done="true"]')).toHaveCount(3)
  await expect(page.getByTestId('practice-new-pill')).toBeVisible()

  // Кружок-отметка отмечает день, не открывая экран практики.
  await page.getByTestId('practice-tile').nth(2).getByTestId('practice-tile-check').click()

  // «Стакан воды» шёл с серией 2 — отметка доводит её до вехи 3 дня.
  await expect(page.getByTestId('practice-milestone')).toBeVisible()
  await expect(page.getByTestId('practice-milestone-days')).toHaveText('3 дня.')
  await page.getByTestId('practice-milestone-done').click()

  await expect(page.getByTestId('practice-today-progress')).toHaveText('сегодня 4 из 4')
  await expect(page.getByTestId('practice-tile').nth(2)).toHaveAttribute('data-done', 'true')
  await expect(page.getByTestId('practice-grid')).toBeVisible()
})

test('«Назад» возвращает туда, откуда пришёл: из «Сегодня» и из «Шагов»', async ({ page }) => {
  // Путь из «Сегодня»: раздел «Твои практики» → список ритуалов → назад = «Сегодня».
  await page.goto('/?demo=1&tab=today')
  const ritualsPin = page
    .getByTestId('practice-tile')
    .filter({ hasText: 'Ритуалы' })
    .first()
  await expect(ritualsPin).toBeVisible()
  await ritualsPin.click()

  await expect(page.getByTestId('practice-grid')).toBeVisible()
  await expect(page.locator('[data-demo-tab="practices"]')).toBeVisible()

  // Демо-шапка Telegram: «‹ Назад» ведёт обратно на «Сегодня».
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.locator('[data-demo-tab="today"]')).toBeVisible()

  // Путь из «Шагов»: каталог → коллекция «Ритуалы» → назад = каталог «Шагов».
  await page.goto('/?demo=1&tab=practices')
  await expect(page.locator('[data-collection-key="rituals"]')).toBeVisible()
  await page.locator('[data-collection-key="rituals"]').click()

  await expect(page.getByTestId('practice-grid')).toBeVisible()

  await page.getByTestId('demo-chrome-back').click()
  await expect(page.locator('[data-collection-key="rituals"]')).toBeVisible()
})

test('«Шаги» → Ритуалы → «+ Новый ритуал» → «‹ Назад» → список → «‹ Назад» → «Шаги»', async ({
  page,
}) => {
  // Путь из «Шагов»: каталог → коллекция «Ритуалы» → список.
  await page.goto('/?demo=1&tab=practices')
  await expect(page.locator('[data-collection-key="rituals"]')).toBeVisible()
  await page.locator('[data-collection-key="rituals"]').click()

  await expect(page.getByTestId('practice-grid')).toBeVisible()

  // «+ Новый ритуал» → экран «готовые».
  await page.getByTestId('practice-new-pill').click()
  await expect(page.getByTestId('practice-preset-card').first()).toBeVisible()

  // «‹ Назад» → список ритуалов.
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.getByTestId('practice-grid')).toBeVisible()

  // «‹ Назад» → каталог «Шагов».
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.locator('[data-collection-key="rituals"]')).toBeVisible()
})

test('«Свой» — два шага: после создания флоу закрывается, «новый ритуал» при 0 дней', async ({
  page,
}) => {
  await page.goto('/?demo=1&tab=practices&action=rituals_list')

  await page.getByTestId('practice-new-pill').click()
  await expect(page.getByTestId('practice-preset-card').first()).toBeVisible()
  await page.getByTestId('practice-own-pill').click()

  await expect(page.getByTestId('practice-own-input-0')).toBeVisible()
  await page.getByTestId('practice-own-input-0').fill('Тихое утро')
  await page.getByTestId('practice-own-go').click()

  await expect(page.getByTestId('practice-own-input-1')).toBeVisible()
  await page.getByTestId('practice-own-input-1').fill('одна страница')
  await page.getByTestId('practice-own-go').click()

  // Флоу закрылся: виден список, тост о добавлении, новая практика с 0 дней.
  await expect(page.getByTestId('practice-grid')).toBeVisible()
  await expect(page.getByText('Ритуал добавлен')).toBeVisible()
  await expect(page.getByTestId('practice-tile')).toHaveCount(5)
  await expect(page.getByTestId('practice-tile').last().getByText('новый ритуал')).toBeVisible()
})

test('список аскез: те же плитки, «держишься» вместо серии и отметка тапом', async ({ page }) => {
  await page.goto('/?demo=1&tab=practices&action=ascezas_list')

  await expect(page.getByTestId('practice-grid')).toBeVisible()
  await expect(page.getByTestId('practice-tile')).toHaveCount(4)
  await expect(page.getByTestId('practice-today-progress')).toHaveText('сегодня 3 из 4')
  await expect(page.getByTestId('practice-new-pill')).toBeVisible()
  await expect(page.getByText('держишься 5 дней')).toBeVisible()

  await page.getByTestId('practice-tile').nth(2).getByTestId('practice-tile-check').click()

  await expect(page.getByTestId('practice-today-progress')).toHaveText('сегодня 4 из 4')
  await expect(page.getByTestId('practice-tile').nth(2)).toHaveAttribute('data-done', 'true')
})

test('экран ритуала: неделя, «Отметить вчера», аккордеоны и меню «…»', async ({ page }) => {
  await page.goto('/?demo=1&tab=practices&action=ritual_detail')

  await expect(page.getByTestId('practice-detail-week')).toBeVisible()
  await expect(page.getByTestId('practice-restore-yesterday')).toBeVisible()
  await expect(page.getByTestId('practice-detail-toggle')).toBeVisible()
  await expect(page.getByTestId('practice-accordion-why')).toBeVisible()
  await expect(page.getByTestId('practice-accordion-how')).toBeVisible()
  // Пустая «Заметка» не рисуется вовсе: у демо-ритуала заметки нет.
  await expect(page.getByTestId('practice-accordion-note')).toHaveCount(0)
  // Необязательная строка «+ Оптимум» живёт в карточке «Как», рядом с минимумом.
  await page.getByTestId('practice-accordion-how').click()
  await expect(page.getByTestId('practice-detail-field-optimal_version')).toContainText(
    '+ Оптимум'
  )
  await page.getByTestId('practice-accordion-how').click()

  // Меню «…» даёт правку, знак и удаление.
  await page.getByTestId('practice-detail-menu').click()
  await expect(page.getByTestId('practice-detail-edit')).toBeVisible()
  await expect(page.getByTestId('practice-detail-sign')).toBeVisible()
  await expect(page.getByTestId('practice-detail-delete')).toBeVisible()
  await page.getByTestId('practice-detail-menu-overlay').click()
  await expect(page.getByTestId('practice-detail-edit')).toHaveCount(0)

  // Восстановление вчерашнего дня: лист → день → ступень → подтверждение.
  await page.getByTestId('practice-restore-yesterday').click()
  await expect(page.getByTestId('practice-restore-submit')).toBeDisabled()
  await page.getByTestId('practice-restore-day-1').click()
  await page.getByTestId('practice-restore-choice-min').click()
  await page.getByTestId('practice-restore-submit').click()

  // Серия продлилась, сегодняшняя отметка не сдвинулась, восстанавливать больше нечего.
  await expect(page.getByTestId('practice-restore-yesterday')).toHaveCount(0)
  await expect(page.getByText('серия 2 дня')).toBeVisible()
  await expect(page.getByTestId('practice-detail-week')).toBeVisible()
})

test('ритуал с двумя ступенями отмечается минимумом или оптимумом', async ({ page }) => {
  await page.goto('/?demo=1&tab=practices&action=rituals_list')

  await page.getByTestId('practice-tile').nth(1).click()

  await expect(page.getByTestId('practice-detail-level-min')).toBeVisible()
  await expect(page.getByTestId('practice-detail-level-optimal')).toBeVisible()
  await expect(page.getByTestId('practice-detail-toggle')).toHaveCount(0)

  await page.getByTestId('practice-detail-level-min').click()

  await expect(page.getByTestId('practice-detail-level-min')).toHaveAttribute(
    'aria-pressed',
    'true'
  )
  await expect(page.getByTestId('practice-detail-level-optimal')).toHaveAttribute(
    'aria-pressed',
    'false'
  )
})

test('экран аскезы: «Сорвался сегодня», строки «+ …» и отметка «Держусь»', async ({ page }) => {
  await page.goto('/?demo=1&tab=practices&action=asceza_detail')

  await expect(page.getByTestId('practice-detail-week')).toBeVisible()
  await expect(page.getByTestId('practice-restore-yesterday')).toBeVisible()
  await expect(page.getByTestId('practice-detail-toggle')).toHaveText('Держусь ✓')
  await expect(page.getByText('Сорвался сегодня')).toBeVisible()
  // Ступеней у аскезы нет — отметка одна.
  await expect(page.getByTestId('practice-detail-level-optimal')).toHaveCount(0)
  // Триггер и замена ещё не заданы — обе строки приглашают заполнить.
  await expect(page.getByTestId('practice-detail-field-trigger')).toContainText(
    '+ Что тебя тянет?'
  )
  await expect(page.getByTestId('practice-detail-field-replacement')).toContainText(
    '+ Чем заменишь?'
  )
})
