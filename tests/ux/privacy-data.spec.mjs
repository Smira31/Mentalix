// «Мои данные» в Профиль → Настройки — один UX-тест задачи.
//
// Проверяем раздел приватности: скачивание данных, отправка в Telegram
// (скрыт в вебе), удаление аккаунта с одноразовым кодом. Backend не нужен —
// ответы /api/privacy/* подменяются моком. Только Chromium; полный UX/WebKit — CI.

import { expect, test } from '@playwright/test'
import { TEST_USER, json } from './profile-helpers.mjs'

const VIEWPORT = { width: 390, height: 844 }

async function openProfileData(browser, baseURL, { guest = false } = {}) {
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
        return route.fulfill(json({ ok: true, delivery_method: 'email' }))
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

test('«Мои данные»: скачивание, скрытый Telegram, удаление с кодом', async ({ browser, baseURL }) => {
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
  await expect(page.getByTestId('profile-erasure-code-input')).toContainText('Код подтверждения отправлен')

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

test('«Мои данные»: гость видит приглашение войти', async ({ browser, baseURL }) => {
  const { context, page } = await openProfileData(browser, baseURL, { guest: true })

  // Гость видит сообщение, а не кнопки скачивания/удаления
  await expect(page.getByTestId('profile-data-guest-notice')).toBeVisible()
  await expect(page.getByTestId('profile-row-download-data')).toHaveCount(0)
  await expect(page.getByTestId('profile-row-erasure-start')).toHaveCount(0)

  await context.close()
})
