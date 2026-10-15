import { expect, test } from '@playwright/test'

/*
 * AUD-015: переписан под текущий «Прогресс» (Analytics.jsx).
 *
 * Идентификаторы карточек изменились: прежний progress-mood-trend больше
 * не существует. Текущие CardShell-карточки аналитики:
 *   progress-practices      — «Твои практики»
 *   progress-mood-calendar  — «Календарь настроения»
 *   progress-emotions       — «Главные эмоции»
 *   progress-conclusions-up — «Что тебя поднимает»
 *   progress-conclusions-down — «Что тебя опускает»
 *
 * Порядок графиков больше не настраивается кнопками «Выше/Ниже» —
 * вместо прежней шторки «Порядок графиков» теперь полноэкранный
 * слой «Настроить» (progress-customize) с toggle-чекбоксами show/hide.
 * Исходный замысел теста сохранён: порядок и видимость карточек
 * на экране аналитики.
 */

async function openDemo(page) {
  await page.goto('/?demo=1&tab=trends')
  await expect(page.getByRole('heading', { name: 'аналитика.' })).toBeVisible()
}

/** Видимые CardShell-карточки в порядке отрисовки (по data-testid). */
async function visibleCardIds(page) {
  return page
    .locator('[data-testid^="progress-"]')
    .filter({ has: page.locator('.mx-progress-card__head') })
    .evaluateAll(nodes => nodes.map(node => node.dataset.testid))
}

test('скрыть график из меню и вернуть через «Настроить»', async ({ page }) => {
  await openDemo(page)
  const card = page.getByTestId('progress-mood-calendar')
  await expect(card).toBeVisible()

  // Скрыть через меню карточки
  await card.getByRole('button', { name: 'Меню графика: Календарь настроения' }).click()
  await card.getByRole('button', { name: 'Скрыть этот график' }).click()
  await expect(card).toHaveCount(0)

  // Вернуть через слой «Настроить»
  await page.getByTestId('progress-customize-pill').click()
  await expect(page.getByTestId('progress-customize')).toBeVisible()
  await page.getByRole('checkbox', { name: 'Показывать: Календарь настроения' }).check()

  // Вернуться в аналитику через пилюлю «Назад» демо-шапки
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.getByRole('heading', { name: 'аналитика.' })).toBeVisible()
  await expect(card).toBeVisible()
})

test('порядок карточек по умолчанию соответствует конфигурации', async ({ page }) => {
  await openDemo(page)
  const ids = await visibleCardIds(page)
  // Порядок из ANALYTICS_CARDS (analyticsCardPreferences.js):
  // practices, calendar, emotions, up, down
  expect(ids.indexOf('progress-practices')).toBeLessThan(ids.indexOf('progress-mood-calendar'))
  expect(ids.indexOf('progress-mood-calendar')).toBeLessThan(ids.indexOf('progress-emotions'))
  expect(ids.indexOf('progress-emotions')).toBeLessThan(ids.indexOf('progress-conclusions-up'))
  expect(ids.indexOf('progress-conclusions-up')).toBeLessThan(ids.indexOf('progress-conclusions-down'))
})

test('аналитика рендерится без localStorage', async ({ page }) => {
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem
    const set = Storage.prototype.setItem
    Storage.prototype.getItem = function (key) {
      if (key === 'mentalix_analytics_cards') throw new Error('Storage blocked')
      return get.call(this, key)
    }
    Storage.prototype.setItem = function (key, value) {
      if (key === 'mentalix_analytics_cards') throw new Error('Storage blocked')
      return set.call(this, key, value)
    }
  })
  await openDemo(page)
  await expect(page.getByTestId('progress-practices')).toBeVisible()
  await expect(page.getByTestId('progress-mood-calendar')).toBeVisible()
})
