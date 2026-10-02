import { expect, test, devices } from '@playwright/test'

/*
 * UX-тест черновиков подэкранов «Сегодня» (#1, #6).
 *
 * Сценарий 1 — вечерний разбор:
 *   demo ?demo=1&review_open=1 → «Сегодня» → вечерняя карта →
 *   2 шкалы → эмоция → 3 текстовых поля → ввести текст →
 *   page.reload() → открыть разбор заново → текст восстановлен →
 *   завершить разбор → ключ черновика удалён из localStorage.
 *
 * Сценарий 2 — тема недели:
 *   открыть тему → «Начать» → ввести текст → page.reload() → текст на месте.
 *
 * Поиск — только по data-testid. Никаких waitForTimeout.
 */

const DEMO_URL = '/?demo=1&review_open=1'

/** Ключ вечернего черновика в localStorage. */
function eveningDraftKey(userId = 900001) {
  const today = new Date().toISOString().slice(0, 10)
  return `mx-evening-draft-v1:${userId}:${today}`
}

/** Пройти две шкалы вечернего разбора (настроение + фокус). */
async function passScales(page) {
  for (let i = 0; i < 2; i++) {
    const opt = page.locator('[data-testid="checkin-scale-option"][data-level="3"]')
    await expect(opt).toBeVisible()
    await opt.click()
    const next = page.getByTestId('checkin-next')
    await expect(next).toBeEnabled()
    await next.click()
  }
}

/** Выбрать эмоцию и нажать «Далее». */
async function passEmotion(page) {
  const pill = page.getByTestId('checkin-emotion-pill').first()
  await expect(pill).toBeVisible()
  await pill.click()
  const next = page.getByTestId('checkin-next')
  await expect(next).toBeEnabled()
  await next.click()
}

/** Дойти до первого текстового поля разбора. */
async function reachTextStep(page) {
  await passScales(page)
  await passEmotion(page)
  await expect(page.getByTestId('checkin-text-input')).toBeVisible()
}

/** Прочитать текст из contenteditable-поля по data-testid. */
async function readEditorText(page) {
  return page.locator('[data-testid="checkin-text-input"]').textContent()
}

// ── Сценарий 1: вечерний разбор ──

test('вечерний разбор: черновик восстанавливается после reload и очищается после сохранения', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    ...devices['iPhone 15 Pro'],
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })
  const page = await context.newPage()
  await page.goto(DEMO_URL)

  // «Сегодня» — вкладка по умолчанию в demo.
  await expect(page.getByTestId('today-card-evening')).toHaveAttribute('data-state', 'active')
  await page.getByTestId('today-card-evening').click()

  // Дойти до первого текстового поля.
  await reachTextStep(page)

  // Ввести текст в первое поле → «Далее» → второе поле → «Далее» → третье.
  const input1 = page.getByTestId('checkin-text-input')
  await expect(input1).toBeVisible()
  await input1.fill('Тест: что получилось')
  await page.getByTestId('checkin-next').click()

  const input2 = page.getByTestId('checkin-text-input')
  await expect(input2).toBeVisible()
  await input2.fill('Тест: что было трудно')
  await page.getByTestId('checkin-next').click()

  const input3 = page.getByTestId('checkin-text-input')
  await expect(input3).toBeVisible()
  await input3.fill('Тест: какой вывод забираешь')

  // Подождать debounced-сохранения черновика (500 мс).
  await page.waitForFunction(
    (key) => {
      const raw = localStorage.getItem(key)
      if (!raw) return false
      try {
        const parsed = JSON.parse(raw)
        return Boolean(parsed.done && parsed.hard && parsed.lesson)
      } catch {
        return false
      }
    },
    eveningDraftKey(),
    { timeout: 5000 }
  )

  // Перезагрузка.
  await page.reload()

  // Снова открыть вечерний разбор.
  await expect(page.getByTestId('today-card-evening')).toHaveAttribute('data-state', 'active')
  await page.getByTestId('today-card-evening').click()
  await reachTextStep(page)

  // Текст восстановлен (contenteditable → textContent).
  await expect(page.getByTestId('checkin-text-input')).toContainText('Тест: что получилось')

  // Дойти до второго и третьего поля — проверить восстановление.
  await page.getByTestId('checkin-next').click()
  await expect(page.getByTestId('checkin-text-input')).toContainText('Тест: что было трудно')
  await page.getByTestId('checkin-next').click()
  await expect(page.getByTestId('checkin-text-input')).toContainText('Тест: какой вывод забираешь')

  // Завершить разбор — нажать «Далее» на последнем поле → submit().
  await page.getByTestId('checkin-next').click()

  // Экран завершения.
  await expect(page.getByTestId('checkin-back-to-today')).toBeVisible({ timeout: 10000 })

  // Ключ черновика удалён из localStorage.
  await expect.poll(async () => page.evaluate(k => localStorage.getItem(k), eveningDraftKey()), {
    timeout: 5000,
  }).toBeNull()

  await context.close()
})

// ── Сценарий 2: тема недели ──

test('тема недели: черновик восстанавливается после reload', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    ...devices['iPhone 15 Pro'],
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })
  const page = await context.newPage()
  await page.goto(DEMO_URL)

  // Открыть тему недели.
  const themeCard = page.getByTestId('today-theme-card')
  await expect(themeCard).toBeVisible()
  await themeCard.click()

  // Дождаться экрана темы. Если intro — нажать «Начать».
  await expect(page.getByTestId('journal-day-content')).toBeVisible({ timeout: 10000 }).catch(async () => {
    const startBtn = page.getByTestId('theme-start')
    await expect(startBtn).toBeVisible({ timeout: 5000 })
    await startBtn.click()
    await expect(page.getByTestId('journal-day-content')).toBeVisible({ timeout: 5000 })
  })

  const input = page.getByTestId('theme-text-input')
  await expect(input).toBeVisible()
  await input.click()
  await page.keyboard.type('Черновик темы — тест восстановления')

  // Отладка: проверить, что текст попал в редактор
  const editorText = await input.textContent()
  // eslint-disable-next-line no-console
  console.log('THEME editor text:', editorText)
  const allKeys = await page.evaluate(() => Object.keys(localStorage))
  // eslint-disable-next-line no-console
  console.log('THEME localStorage keys:', allKeys)

  // Подождать debounced-сохранения (500 мс).
  await page.waitForFunction(
    () => {
      const keys = Object.keys(localStorage)
      const themeKey = keys.find(k => k.startsWith('mx-theme-draft-v1:'))
      if (!themeKey) return false
      try {
        const parsed = JSON.parse(localStorage.getItem(themeKey))
        return parsed.text === 'Черновик темы — тест восстановления'
      } catch {
        return false
      }
    },
    undefined,
    { timeout: 5000 }
  )

  // Перезагрузка.
  await page.reload()

  // Снова открыть тему.
  await expect(page.getByTestId('today-theme-card')).toBeVisible()
  await page.getByTestId('today-theme-card').click()

  // Если intro — нажать «Начать».
  await expect(page.getByTestId('journal-day-content')).toBeVisible({ timeout: 10000 }).catch(async () => {
    const startBtn = page.getByTestId('theme-start')
    await expect(startBtn).toBeVisible({ timeout: 5000 })
    await startBtn.click()
    await expect(page.getByTestId('journal-day-content')).toBeVisible({ timeout: 5000 })
  })

  // Текст восстановлен (contenteditable → textContent).
  await expect(page.getByTestId('theme-text-input')).toContainText('Черновик темы — тест восстановления')

  await context.close()
})
