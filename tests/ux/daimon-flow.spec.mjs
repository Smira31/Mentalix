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

    // После ввода запроса сразу поле: «Как играть» больше не показывается само
    await expect(page.getByTestId('daimon-board')).toBeVisible()
    await expect(page.getByTestId('daimon-help-done')).toBeHidden()
    await expect(page.getByTestId('daimon-roll')).toBeVisible()
    await expect(page.getByTestId('daimon-position')).toContainText('Начни с броска кубика')

    // Тап по клетке — нижняя шторка с номером и названием
    await page.getByTestId('daimon-cell-3').click()
    await expect(page.getByTestId('daimon-cell-sheet')).toBeVisible()
    await expect(page.getByTestId('daimon-cell-sheet')).toContainText('Клетка 3')
    await expect(page.getByTestId('daimon-sheet-handle')).toBeVisible()
    await page.getByTestId('daimon-cell-sheet').click({ position: { x: 8, y: 8 } })
    await expect(page.getByTestId('daimon-cell-sheet')).toBeHidden()

    // «?» открывает «Как играть» снова — лимит бросков в честной формулировке
    await page.getByTestId('daimon-help').click()
    await expect(page.getByTestId('daimon-help-done')).toBeVisible()
    await expect(page.getByTestId('daimon-help')).toContainText('3 броска')
    await expect(page.getByTestId('daimon-help-throws')).toHaveText(
      'В день — 3 броска: так над каждой клеткой есть время подумать.'
    )
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

    // Вывод — отдельный экран «Что тебе открылось на этой клетке?»
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

/*
 * Остаток бросков: Pro без лимита (бэкенд #254 отдаёт throws_limit = null и
 * throws_unlimited = true) и прежний числовой лимит Free.
 */
const THROWS_STATE_KEY = mode => `mentalix_preview_demo_state_v6:daimon:${mode}`

async function seedThrows(page, mode, patch) {
  await page.goto(`${DEMO_URL}&frame=0&daimonTest=${mode}`, { waitUntil: 'networkidle' })
  await expect(page.getByTestId('daimon-board')).toBeVisible()
  await page.evaluate(
    ({ key, values }) => {
      const state = JSON.parse(localStorage.getItem(key))
      Object.assign(state.daimon.game, values)
      localStorage.setItem(key, JSON.stringify(state))
    },
    { key: THROWS_STATE_KEY(mode), values: patch }
  )
  await page.reload({ waitUntil: 'networkidle' })
  await expect(page.getByTestId('daimon-board')).toBeVisible()
}

test('Pro без лимита: бросок активен и строка остатка без числа', async ({ page }) => {
  await page.goto(`${DEMO_URL}&frame=0&daimonTest=proUnlimited`, { waitUntil: 'networkidle' })
  await expect(page.getByTestId('daimon-board')).toBeVisible()

  // throws_limit = null, throws_unlimited = true, throws_today = 7
  await expect(page.getByTestId('daimon-roll')).toBeEnabled()
  await expect(page.getByTestId('daimon-throws-left')).toHaveText('Сегодня без лимита бросков')

  await page.getByTestId('daimon-help').click()
  await expect(page.getByTestId('daimon-help-throws')).toHaveText('Бросков в день — без лимита')
  await page.getByTestId('daimon-help-done').click()
  await expect(page.getByTestId('daimon-board')).toBeVisible()

  // Бросок сверх старого лимита (7 уже сегодня) проходит.
  await page.getByTestId('daimon-roll').click()
  await expect(page.getByTestId('daimon-cell-title')).toBeVisible({ timeout: 5000 })
})

test('Free: лимит 3 и 3 броска — кнопка неактивна, текст прежний', async ({ page }) => {
  await seedThrows(page, 'nearSnake', { throws_limit: 3, throws_today: 3 })

  await expect(page.getByTestId('daimon-roll')).toBeDisabled()
  await expect(page.getByTestId('daimon-throws-left')).toHaveText(
    'На сегодня всё. Возвращайся завтра — Даймон подождёт.'
  )
})

test('старый ответ без throws_unlimited и с числом 3 работает как раньше', async ({ page }) => {
  await seedThrows(page, 'nearSnake', { throws_limit: 3, throws_today: 1 })
  await page.evaluate(key => {
    const state = JSON.parse(localStorage.getItem(key))
    delete state.daimon.game.throws_unlimited
    localStorage.setItem(key, JSON.stringify(state))
  }, THROWS_STATE_KEY('nearSnake'))
  await page.reload({ waitUntil: 'networkidle' })
  await expect(page.getByTestId('daimon-board')).toBeVisible()

  await expect(page.getByTestId('daimon-roll')).toBeEnabled()
  await expect(page.getByTestId('daimon-throws-left')).toHaveText('Осталось бросков сегодня: 2')

  await page.getByTestId('daimon-help').click()
  await expect(page.getByTestId('daimon-help-throws')).toHaveText(
    'В день — 3 броска: так над каждой клеткой есть время подумать.'
  )
})
