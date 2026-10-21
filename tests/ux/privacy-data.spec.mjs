// «Мои данные» в Профиль → Настройки — один UX-тест задачи.
//
// Проверяем раздел приватности: скачивание данных, отправка в Telegram
// (скрыт в вебе), удаление аккаунта с одноразовым кодом. Backend не нужен —
// ответы /api/privacy/* подменяются моком. Только Chromium; полный UX/WebKit — CI.

import { expect, test } from '@playwright/test'
import { TEST_USER, json } from './profile-helpers.mjs'

const VIEWPORT = { width: 390, height: 844 }

async function openProfileData(browser, baseURL, { guest = false, erasureReply } = {}) {
  const context = await browser.newContext({
    baseURL,
    viewport: VIEWPORT,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })

  // Мокаем API — включая privacy-эндпоинты.
  await context.route('**/api/**', route => {
    const { pathname } = new URL(route.request().url())
    const method = route.request().method()

    // POST — privacy-эндпоинты
    if (method === 'POST') {
      if (pathname === '/api/privacy/account-erasure/request-code') {
        // Ответ задаёт тест: канал доставки, ошибка или «код не нужен» (Mini App).
        const reply = erasureReply
          ? erasureReply()
          : { status: 200, body: { ok: true, delivery_method: 'email' } }
        return route.fulfill(json(reply.body, reply.status))
      }
      if (pathname === '/api/privacy/account-erasure') {
        return route.fulfill(json({ ok: true }))
      }
      if (pathname === '/api/privacy/export/send-to-telegram') {
        return route.fulfill(json({ ok: true }))
      }
      return route.fulfill(json({ ok: true }))
    }

    // GET
    if (pathname === '/api/profile') return route.fulfill(json(TEST_USER))
    if (pathname === '/api/profile/settings') return route.fulfill(json({ review_hour: 19 }))
    if (pathname === '/api/checkin/today') return route.fulfill(json(null))
    if (pathname === '/api/subscription') return route.fulfill(json({ tier: 'base' }))
    if (pathname === '/api/analytics/pulse') return route.fulfill(json({ active_today: 0 }))
    if (/\/api\/(rituals|ascezas|themes|articles|checkin\/history)$/.test(pathname)) {
      return route.fulfill(json([]))
    }
    // GET /api/privacy/export — возвращаем JSON-файл
    if (pathname === '/api/privacy/export') {
      return route.fulfill(json({ profile: TEST_USER, checkins: [] }))
    }
    return route.fulfill(json({}))
  })

  await context.addInitScript(
    user => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem('mentalix_web_user', JSON.stringify(user))
      localStorage.setItem('mx-onboarded-v2', '1')
      localStorage.setItem('mx-app-lock-enabled', '0')
    },
    guest ? { ...TEST_USER, is_guest: true } : TEST_USER
  )

  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByTestId('today-profile-button')).toBeVisible()
  await page.getByTestId('today-profile-button').click()
  await expect(page.getByTestId('profile-screen')).toBeVisible()
  await page.getByTestId('profile-row-data').click()
  await expect(page.getByTestId('profile-sub-data')).toBeVisible()
  return { context, page }
}

test('«Мои данные»: скачивание, скрытый Telegram, удаление с кодом', async ({
  browser,
  baseURL,
}) => {
  const { context, page } = await openProfileData(browser, baseURL)

  // ── 1. «Скачать мои данные» — кнопка видна ──
  await expect(page.getByTestId('profile-row-download-data')).toBeVisible()
  await expect(page.getByTestId('profile-row-download-data')).toContainText('Скачать мои данные')

  // ── 2. «Отправить в Telegram» — скрыт в вебе ──
  await expect(page.getByTestId('profile-row-send-telegram')).toHaveCount(0)

  // ── 3. Гость не видит кнопок управления данными ──
  // (проверяем на отдельном контексте ниже, а здесь — постоянный аккаунт)

  // ── 4. «Удалить аккаунт» — предупреждение и кнопка запроса кода ──
  await expect(page.getByTestId('profile-erasure-warning')).toBeVisible()
  await expect(page.getByTestId('profile-row-erasure-start')).toBeVisible()
  await expect(page.getByTestId('profile-row-erasure-start')).toContainText('Удалить аккаунт')

  // ── 5. Запрос кода → появляется поле ввода и подсказка ──
  await page.getByTestId('profile-row-erasure-start').click()
  await expect(page.getByTestId('profile-erasure-code-input')).toBeVisible()
  await expect(page.getByTestId('profile-erasure-code-field')).toBeVisible()
  await expect(page.getByTestId('profile-erasure-confirm')).toBeVisible()
  // Подсказка о способе доставки
  await expect(page.getByTestId('profile-erasure-code-input')).toContainText(
    'Код подтверждения отправлен'
  )

  // ── 6. Ввод кода и финальная кнопка ──
  await page.getByTestId('profile-erasure-code-field').fill('123456')
  await expect(page.getByTestId('profile-erasure-confirm')).toBeEnabled()

  // ── 7. Финальное подтверждение → успех (экран «данные удалены») ──
  // showConfirm в вебе использует window.confirm — перехватываем
  page.on('dialog', dialog => dialog.accept())
  await page.getByTestId('profile-erasure-confirm').click()

  // После успеха показывается экран «данные удалены»
  await expect(page.getByText('данные удалены.')).toBeVisible({ timeout: 10_000 })

  await context.close()
})

// Коды ответа бэкенда на запрос кода удаления: у каждого свой текст, успешный
// ответ показывает поле кода с точной или нейтральной подсказкой, а 409
// telegram_init_data_sufficient код не спрашивает вовсе (Mini App).
test('«Мои данные»: запрос кода — свой текст на каждую ошибку и нейтральная подсказка', async ({
  browser,
  baseURL,
}) => {
  let reply = { status: 200, body: { ok: true, delivery_method: 'email' } }
  const { context, page } = await openProfileData(browser, baseURL, {
    erasureReply: () => reply,
  })

  const start = page.getByTestId('profile-row-erasure-start')
  const retry = page.getByTestId('profile-row-erasure-retry')
  const errorNote = page.getByTestId('profile-erasure-error')
  const codeInput = page.getByTestId('profile-erasure-code-input')

  // ── 1. Каждая ошибка показывает свой текст, повтор остаётся доступен ──
  const failures = [
    {
      status: 429,
      body: { detail: 'email_hour_limit' },
      text: 'Слишком часто. Попробуй чуть позже',
    },
    {
      status: 502,
      body: { detail: 'telegram_send_failed' },
      text: 'Не удалось отправить код в Telegram. Открой чат с ботом Mentalix, нажми Start и попробуй снова',
    },
    {
      status: 503,
      body: { detail: 'telegram_delivery_not_configured' },
      text: 'Отправка кода сейчас недоступна. Напиши в поддержку',
    },
    {
      status: 409,
      body: { detail: 'no_delivery_channel' },
      text: 'Не нашли, куда отправить код. Напиши в поддержку',
    },
    { status: 500, body: {}, text: 'Не получилось. Попробуй ещё раз' },
  ]

  for (const [index, failure] of failures.entries()) {
    reply = { status: failure.status, body: failure.body }
    await (index === 0 ? start : retry).click()
    await expect(errorNote).toHaveText(failure.text)
    // Поля ввода кода при ошибке нет — только повтор.
    await expect(codeInput).toHaveCount(0)
  }

  // ── 2. 200 без названного канала: поле кода и нейтральная подсказка ──
  reply = { status: 200, body: { ok: true } }
  await retry.click()
  await expect(codeInput).toBeVisible()
  await expect(codeInput).toContainText('Код подтверждения придёт в Telegram или на email')
  await expect(page.getByTestId('profile-erasure-code-field')).toBeVisible()
  await expect(errorNote).toHaveCount(0)

  await context.close()

  // ── 3. 409 telegram_init_data_sufficient: код не нужен, сразу финальное подтверждение ──
  const miniApp = await openProfileData(browser, baseURL, {
    erasureReply: () => ({
      status: 409,
      body: { detail: 'telegram_init_data_sufficient' },
    }),
  })
  await miniApp.page.getByTestId('profile-row-erasure-start').click()
  await expect(miniApp.page.getByTestId('profile-erasure-no-code')).toBeVisible()
  await expect(miniApp.page.getByTestId('profile-erasure-code-field')).toHaveCount(0)
  await expect(miniApp.page.getByTestId('profile-erasure-confirm')).toBeEnabled()
  await expect(miniApp.page.getByTestId('profile-erasure-error')).toHaveCount(0)

  await miniApp.context.close()
})

test('«Мои данные»: гость видит приглашение войти', async ({ browser, baseURL }) => {
  const { context, page } = await openProfileData(browser, baseURL, { guest: true })

  // Гость видит сообщение, а не кнопки скачивания/удаления
  await expect(page.getByTestId('profile-data-guest-notice')).toBeVisible()
  await expect(page.getByTestId('profile-row-download-data')).toHaveCount(0)
  await expect(page.getByTestId('profile-row-erasure-start')).toHaveCount(0)

  await context.close()
})
