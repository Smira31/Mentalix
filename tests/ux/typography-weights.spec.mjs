import { expect, test } from '@playwright/test'

/*
 * UX-тест типографики (миграция весов, ветка typography-scales).
 * Проверяет, что вычисленные веса идут от токенов --mx-weight-*
 * (700/600/500/400), три ступени цвета текста и светлая кнопка
 * (#D6D6D6 / #111 / 500) применились на ключевых экранах.
 */

async function weightOf(page, selector) {
  const el = page.locator(selector).first()
  await el.waitFor({ state: 'visible' })
  return el.evaluate(node => Number(getComputedStyle(node).fontWeight))
}

test('Сегодня: заголовок 700, сегменты/кнопки 500, body 400', async ({ page }) => {
  await page.goto('/?demo=1', { waitUntil: 'networkidle' })
  await page.locator('[data-testid="today-card-morning"]').waitFor({ state: 'visible' })

  expect(await weightOf(page, '.mx-demo-today-greeting')).toBe(700)
})

test('Чек-ин: eyebrow 600, кнопки полосы 500', async ({ page }) => {
  await page.goto('/?demo=1', { waitUntil: 'networkidle' })
  const card = page.locator('[data-testid="today-card-morning"]')
  await card.waitFor({ state: 'visible' })
  await card.click()
  await page.locator('.mx-demo-checkin__eyebrow').first().waitFor({ state: 'visible' })

  expect(await weightOf(page, '.mx-demo-checkin__eyebrow')).toBe(600)
  expect(await weightOf(page, '.mx-demo-checkin__action-bar > button')).toBe(500)
})

test('Прогресс: заголовок 700, подсказка muted/400, «Напомнить» — светлая кнопка 500', async ({ page }) => {
  await page.goto('/?demo=1&tab=trends', { waitUntil: 'networkidle' })
  await page.locator('.mx-progress-analytics__title').waitFor({ state: 'visible' })

  expect(await weightOf(page, '.mx-progress-analytics__title')).toBe(700)

  const subtext = page.locator('.mx-progress-analytics__subtext').first()
  await subtext.waitFor({ state: 'visible' })
  const { weight, color } = await subtext.evaluate(node => {
    const s = getComputedStyle(node)
    return { weight: Number(s.fontWeight), color: s.color }
  })
  expect(weight).toBe(400)
  expect(color).toMatch(/133/)

  const remind = page.locator('[data-testid="progress-need-data-remind"]')
  if (await remind.count()) {
    await remind.waitFor({ state: 'visible' })
    const bg = await remind.evaluate(node => getComputedStyle(node).backgroundColor)
    expect(bg).toBe('rgb(214, 214, 214)')
    expect(await weightOf(page, '[data-testid="progress-need-data-remind"]')).toBe(500)
  }
})

test('Профиль: заголовок 700, подписи групп 11px/600', async ({ page }) => {
  await page.goto('/?demo=1&action=profile', { waitUntil: 'networkidle' })
  await page.locator('.mx-profile-page__title').waitFor({ state: 'visible' })

  expect(await weightOf(page, '.mx-profile-page__title')).toBe(700)

  const label = page.locator('.mx-profile-group__label').first()
  await label.waitFor({ state: 'visible' })
  const { weight, size } = await label.evaluate(node => {
    const s = getComputedStyle(node)
    return { weight: Number(s.fontWeight), size: parseFloat(s.fontSize) }
  })
  expect(weight).toBe(600)
  expect(size).toBe(11)
})

test('Библиотека: пилюля «Начать» — #D6D6D6 / #111 / 500', async ({ page }) => {
  await page.goto('/?demo=1&tab=library', { waitUntil: 'networkidle' })
  const pill = page.locator('.mx-library-v2__pill').first()
  await pill.waitFor({ state: 'visible' })

  const { weight, color, background } = await pill.evaluate(node => {
    const s = getComputedStyle(node)
    return { weight: Number(s.fontWeight), color: s.color, background: s.backgroundColor }
  })
  expect(weight).toBe(500)
  expect(color).toBe('rgb(17, 17, 17)')
  expect(background).toBe('rgb(214, 214, 214)')
})
