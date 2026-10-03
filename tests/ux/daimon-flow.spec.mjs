import { expect, test } from '@playwright/test'

/*
 * UX-тест флоу Даймона: вход → запрос → «Как играть» → поле → бросок → клетка → вывод → поле.
 * В демо-режиме. Открывается через sub 'daimon' в Practices.
 */

const DEMO_URL =
  process.env.DAIMON_FLOW_URL ||
  'http://127.0.0.1:5173/?demo=1&tab=practices&sub=daimon'

test.describe('Даймон — флоу игры', () => {
  test('вход → запрос → «Как играть» → поле → бросок → клетка → вывод', async ({ browser }) => {
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

    // Запрос — крупный заголовок и поле
    await page.getByTestId('daimon-start').click()
    await expect(page.getByTestId('daimon-request-input')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'С чем ты приходишь?' })).toBeVisible()
    await page.getByTestId('daimon-request-input').fill('Не понимаю, куда двигаться дальше в жизни')
    await page.getByTestId('daimon-request-submit').click()

    // «Как играть» показывается один раз автоматически после ввода запроса
    await expect(page.getByTestId('daimon-help')).toBeVisible()
    await expect(page.getByTestId('daimon-help-done')).toBeVisible()
    await page.getByTestId('daimon-help-done').click()

    // Поле
    await expect(page.getByTestId('daimon-board')).toBeVisible()
    await expect(page.getByTestId('daimon-roll')).toBeVisible()
    await expect(page.getByTestId('daimon-position')).toContainText('Начни с броска кубика')

    // Тап по клетке — нижняя шторка с номером и названием
    await page.getByTestId('daimon-cell-3').click()
    await expect(page.getByTestId('daimon-cell-sheet')).toBeVisible()
    await expect(page.getByTestId('daimon-cell-sheet')).toContainText('Клетка 3')
    await expect(page.getByTestId('daimon-sheet-handle')).toBeVisible()
    await page.getByTestId('daimon-cell-sheet').click({ position: { x: 8, y: 8 } })
    await expect(page.getByTestId('daimon-cell-sheet')).toBeHidden()

    // «?» открывает «Как играть» снова
    await page.getByTestId('daimon-help').click()
    await expect(page.getByTestId('daimon-help-done')).toBeVisible()
    await page.getByTestId('daimon-help-done').click()
    await expect(page.getByTestId('daimon-board')).toBeVisible()

    // Бросок
    await page.getByTestId('daimon-roll').click()
    await expect(page.getByTestId('daimon-rolling')).toBeVisible({ timeout: 5000 })

    // Клетка
    await expect(page.getByTestId('daimon-cell-title')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('daimon-chat')).toBeVisible()

    // Ждём первый авто-вопрос ассистента (монтирование клетки шлёт chat(''))
    await expect(page.locator('.mx-daimon-chat__msg--assistant')).toBeVisible({ timeout: 5000 })

    // На клетке: пустое поле — только микрофон
    await expect(page.getByTestId('daimon-chat-input')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('daimon-chat-mic')).toBeVisible()
    // При введённом тексте микрофон исчезает, кнопка показывает ✓
    await page.getByTestId('daimon-chat-input').fill('тест')
    await expect(page.getByTestId('daimon-chat-mic')).toBeHidden()
    await expect(page.getByTestId('daimon-chat-send')).toHaveText('✓')
    await page.getByTestId('daimon-chat-input').fill('')

    // Разговор: отвечаем на 2 вопроса (первый вопрос — авто, askedCount=1;
    // после второго ответа askedCount=3 → askInsight=true)
    for (let i = 0; i < 2; i++) {
      await expect(page.getByTestId('daimon-chat-input')).toBeVisible({ timeout: 5000 })
      await page.getByTestId('daimon-chat-input').fill(`Ответ ${i + 1}`)
      await page.getByTestId('daimon-chat-send').click()
    }

    // Вывод — отдельный экран «Что ты увидел на этой клетке?»
    await expect(page.getByTestId('daimon-insight')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('daimon-skip')).toBeVisible()
    // Верхняя строка: «Клетка N · Название»
    await expect(page.getByTestId('daimon-insight-top')).toContainText('·')
    await expect(page.getByTestId('daimon-insight-input')).toHaveAttribute(
      'placeholder',
      'Например: я боюсь не провала, а что скажут'
    )
    await page.getByTestId('daimon-insight-input').fill('Я увидел, что стою на месте')
    await page.getByTestId('daimon-insight-submit').click()

    // Короткий экран-отклик «Записано»
    await expect(page.getByTestId('daimon-saved')).toBeVisible({ timeout: 5000 })

    // Возврат на поле (или переход, или финиш)
    await expect(
      page.getByTestId('daimon-board').or(page.getByTestId('daimon-transition'))
    ).toBeVisible({ timeout: 5000 })

    // «Твой путь · N клеток» — тихая ссылка под счётчиком бросков
    await expect(page.getByTestId('daimon-board')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('daimon-path-link')).toBeVisible()
    await page.getByTestId('daimon-path-link').click()
    await expect(page.getByTestId('daimon-path-view')).toBeVisible()
    await expect(page.getByTestId('daimon-path-view')).toContainText('Твой запрос')
    await expect(page.getByTestId('daimon-path-view')).toContainText('Я увидел, что стою на месте')

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

  test('заголовки Даймона набраны Lora с первого кадра — без сдвига через 1 с', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 402, height: 874 },
      colorScheme: 'dark',
      serviceWorkers: 'block',
    })

    const page = await context.newPage()
    await page.goto(DEMO_URL, { waitUntil: 'domcontentloaded' })

    const measure = locator =>
      locator.evaluate(el => ({
        width: el.getBoundingClientRect().width,
        fontFamily: getComputedStyle(el).fontFamily,
        loraReady: document.fonts.check('600 1rem Lora', el.textContent.trim()),
      }))

    // Первый кадр экрана входа: заголовок уже рисуется Lora, без подмены серифом.
    const introTitle = page.getByRole('heading', { name: 'Даймон' })
    await introTitle.waitFor({ state: 'visible' })
    const introFirst = await measure(introTitle)
    expect(introFirst.fontFamily).toContain('Lora')
    expect(introFirst.loraReady).toBe(true)

    // Через секунду ширина не «прыгает»: подмена шрифта не двигает заголовок.
    await page.waitForTimeout(1000)
    const introLater = await measure(introTitle)
    expect(introLater.fontFamily).toBe(introFirst.fontFamily)
    expect(Math.abs(introLater.width - introFirst.width) / introFirst.width).toBeLessThanOrEqual(
      0.02
    )

    // Экран запроса: та же серифная пара.
    await page.getByTestId('daimon-start').click()
    const requestTitle = page.getByRole('heading', { name: 'С чем ты приходишь?' })
    await requestTitle.waitFor({ state: 'visible' })
    const requestFont = await measure(requestTitle)
    expect(requestFont.fontFamily).toContain('Lora')
    expect(requestFont.loraReady).toBe(true)

    await context.close()
  })
})
