import { expect, test } from '@playwright/test'

/*
 * «Нет связи» вместо вечной загрузки (Timeweb-задача, часть 3).
 *
 * Когда API не отвечает, «Подключаемся…» под приветствием сменяется
 * тихим текстом «Нет связи» и кнопкой «Повторить» примерно через 8 секунд.
 * Кнопка запускает повторную загрузку данных.
 *
 * Сценарий открывается в режиме Telegram (hash запуска Mini App), потому
 * что экран «Сегодня» требует авторизованного пользователя; запросы к API
 * намеренно не отвечают.
 */

function telegramUrl() {
  const initData = new URLSearchParams({
    query_id: 'AAH-offline-state',
    user: JSON.stringify({ id: 900001, first_name: 'Offline' }),
    auth_date: '1793000000',
    hash: 'test-hash',
  }).toString()

  const hash = new URLSearchParams({
    tgWebAppData: initData,
    tgWebAppVersion: '8.0',
    tgWebAppPlatform: 'ios',
  }).toString()

  return `/#${hash}`
}

test('молчащий API: «Подключаемся…» через ~8 с сменяется на «Нет связи» и «Повторить»', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })

  await context.addInitScript(() => {
    window.TelegramWebviewProxy = { postEvent() {} }
    // Онбординг пройден — проверяем экран «Сегодня».
    localStorage.setItem('mx-onboarded-v2', '1')
  })

  let apiRequests = 0
  // API не отвечает вовсе: запросы остаются висеть, пока клиент не оборвёт их.
  await context.route('**/api/**', () => {
    apiRequests += 1
  })

  const page = await context.newPage()
  await page.goto(telegramUrl())

  // 1. Сначала — прежний ненавязчивый индикатор.
  await expect(page.getByTestId('today-connecting')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByTestId('today-connecting')).toHaveText('Подключаемся…')

  // 2. Через ~8 с — тихое «Нет связи» и «Повторить» вместо вечного индикатора.
  const offline = page.getByTestId('today-connection-offline')
  await expect(offline).toBeVisible({ timeout: 15_000 })
  await expect(offline).toContainText('Нет связи')
  await expect(page.getByTestId('today-connection-retry')).toHaveText('Повторить')

  // 3. «Повторить» запускает повторную загрузку данных.
  const requestsBeforeRetry = apiRequests
  await page.getByTestId('today-connection-retry').click()
  await expect
    .poll(() => apiRequests, { timeout: 10_000 })
    .toBeGreaterThan(requestsBeforeRetry)

  // Индикатор ошибки не остаётся на экране после повтора.
  await expect(page.getByTestId('today-connection-offline')).toHaveCount(0)

  await context.close()
})

test('молчащая тема недели: «Загрузка…» через ~8 с сменяется на «Нет связи» и «Повторить»', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })

  await context.addInitScript(() => {
    window.TelegramWebviewProxy = { postEvent() {} }
    localStorage.setItem('mx-onboarded-v2', '1')
  })

  let themeRequests = 0
  await context.route('**/api/**', route => {
    const url = route.request().url()

    // Тема недели не отвечает — проверяем тихое состояние вместо вечной загрузки.
    if (url.includes('/api/themes')) {
      themeRequests += 1
      return undefined
    }

    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  })

  const page = await context.newPage()
  await page.goto(`${telegramUrl()}`)

  // Вкладка «Шаги» (практики) с блоком «Тема недели».
  await page.getByRole('button', { name: 'Шаги' }).click()

  const offline = page.getByTestId('steps-theme-offline')
  await expect(offline).toBeVisible({ timeout: 20_000 })
  await expect(offline).toHaveText('Нет связи')

  const requestsBeforeRetry = themeRequests
  await page.getByTestId('steps-theme-retry').click()
  await expect
    .poll(() => themeRequests, { timeout: 10_000 })
    .toBeGreaterThan(requestsBeforeRetry)

  await context.close()
})
