import { expect, test } from '@playwright/test'

/*
 * UX-тест флоу Даймона: вход → запрос → бросок → клетка → вывод → поле.
 * В демо-режиме. Открывается через sub 'daimon' в Practices.
 */

const DEMO_URL =
  process.env.DAIMON_FLOW_URL ||
  'http://127.0.0.1:5173/?demo=1&tab=practices&sub=daimon'

test.describe('Даймон — флоу игры', () => {
  test('вход → запрос → бросок → клетка → вывод → поле', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 402, height: 874 },
      colorScheme: 'dark',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    })

    const page = await context.newPage()
    await page.goto(DEMO_URL, { waitUntil: 'networkidle' })

    // Вход — экран интро
    await expect(page.getByRole('heading', { name: 'Даймон' })).toBeVisible()
    await expect(page.getByTestId('daimon-start')).toBeVisible()

    // Запрос
    await page.getByTestId('daimon-start').click()
    await expect(page.getByTestId('daimon-request-input')).toBeVisible()
    await page.getByTestId('daimon-request-input').fill('Не понимаю, куда двигаться дальше в жизни')
    await page.getByTestId('daimon-request-submit').click()

    // Поле
    await expect(page.getByTestId('daimon-board')).toBeVisible()
    await expect(page.getByTestId('daimon-roll')).toBeVisible()

    // Бросок
    await page.getByTestId('daimon-roll').click()
    await expect(page.getByTestId('daimon-rolling')).toBeVisible({ timeout: 5000 })

    // Клетка
    await expect(page.getByTestId('daimon-cell-title')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('daimon-chat')).toBeVisible()

    // Разговор: отвечаем на 3 вопроса
    for (let i = 0; i < 3; i++) {
      await expect(page.getByTestId('daimon-chat-input')).toBeVisible({ timeout: 5000 })
      await page.getByTestId('daimon-chat-input').fill(`Ответ ${i + 1}`)
      await page.getByTestId('daimon-chat-send').click()
    }

    // Вывод — поле insight
    await expect(page.getByTestId('daimon-insight-input')).toBeVisible({ timeout: 5000 })
    await page.getByTestId('daimon-insight-input').fill('Я увидел, что стою на месте')
    await page.getByTestId('daimon-insight-submit').click()

    // Возврат на поле (или переход, или финиш)
    await expect(page.getByTestId('daimon-board').or(page.getByTestId('daimon-transition'))).toBeVisible({ timeout: 5000 })

    await context.close()
  })

  test('✕ на пустом поле запроса — возврат к интро', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 402, height: 874 },
      colorScheme: 'dark',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    })

    const page = await context.newPage()
    await page.goto(DEMO_URL, { waitUntil: 'networkidle' })

    await page.getByTestId('daimon-start').click()
    await expect(page.getByTestId('daimon-request-input')).toBeVisible()

    // ✕ на пустом поле = назад
    await page.getByTestId('daimon-request-submit').click()
    await expect(page.getByRole('heading', { name: 'Даймон' })).toBeVisible()

    await context.close()
  })
})
