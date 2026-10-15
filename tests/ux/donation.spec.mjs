// Донат («Поддержать проект») через ЮKassa — один UX-тест задачи.
//
// Экран доната работает только при включённом VITE_PAYMENT_UI_ENABLED
// (src/lib/paymentConfig.js), поэтому набор идёт своим dev-сервером:
// `npm run ux:donation` (playwright.donation.config.mjs). Общий `ux:check`
// запускается без флага, его поведение не меняется.
//
// Проверяем обе стороны требования: гость запрос не отправляет и видит
// приглашение войти; постоянный аккаунт по «›» отправляет POST /api/donations
// с выбранной суммой и открывает confirmation_url. Бэкенд не нужен —
// ответ /api/donations подменяется моком.

import { expect, test } from '@playwright/test'
import { TEST_USER, mockApi } from './profile-helpers.mjs'

const VIEWPORT = { width: 390, height: 844 }
const CONFIRMATION_URL = 'https://yoomoney.ru/api-pages/v2/checkout/777'
const DONATION_RESPONSE = { confirmation_url: CONFIRMATION_URL, payment_id: 'd-777' }

function json(body, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) }
}

/* Web-контекст: обычный или гостевой аккаунт; API мокается как в остальных спеках профиля. */
async function openProfile(browser, baseURL, { guest = false } = {}) {
  const context = await browser.newContext({
    baseURL,
    viewport: VIEWPORT,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
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
  await mockApi(context)
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByTestId('today-profile-button')).toBeVisible()
  return { context, page }
}

async function openDonateScreen(page) {
  await page.getByTestId('today-profile-button').click()
  await page.getByTestId('profile-banner-support').click()
  await expect(page.getByTestId('profile-screen-donate')).toBeVisible()
}

test('донат: сумма, круглая кнопка, гость и оформление', async ({ browser, baseURL }) => {
  // ── Фаза 1: гость — запрос не отправляется, виден вход ──
  {
    const { context, page } = await openProfile(browser, baseURL, { guest: true })
    const posts = []
    await context.route('**/api/donations**', route => {
      posts.push(route.request().postDataJSON())
      return route.fulfill(json(DONATION_RESPONSE))
    })
    try {
      await openDonateScreen(page)

      // Плитки сумм и «Своя» на месте.
      await expect(page.getByRole('button', { name: '100 ₽' })).toBeVisible()
      await expect(page.getByRole('button', { name: '300 ₽' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Своя' })).toBeVisible()

      // Пока сумма не выбрана — круглая кнопка «✕» (закрыть).
      await expect(page.getByTestId('donate-submit')).toHaveAttribute('aria-label', 'Закрыть')

      // После выбора — «›» (оформить).
      await page.getByRole('button', { name: '300 ₽' }).click()
      await expect(page.getByTestId('donate-submit')).toHaveAttribute('aria-label', 'Оформить')

      // Гость: запрос не уходит, показано приглашение войти.
      await page.getByTestId('donate-submit').click()
      await expect(page.getByTestId('donate-guest-note')).toHaveText(
        'Войди через Telegram, чтобы поддержать проект'
      )
      await expect(page.getByTestId('donate-guest-login')).toBeVisible()
      expect(posts).toHaveLength(0)
    } finally {
      await context.close()
    }
  }

  // ── Фаза 2: постоянный аккаунт — POST с суммой и открытие confirmation_url ──
  {
    const { context, page } = await openProfile(browser, baseURL)
    const posts = []
    await context.route('**/api/donations**', route => {
      posts.push(route.request().postDataJSON())
      return route.fulfill(json(DONATION_RESPONSE))
    })
    // Страница оплаты не должна уходить в реальную сеть.
    await context.route('https://yoomoney.ru/**', route =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>checkout</body></html>' })
    )
    try {
      await openDonateScreen(page)
      await page.getByRole('button', { name: '300 ₽' }).click()

      const navigated = page.waitForURL(/yoomoney\.ru/, { timeout: 10_000 })
      await page.getByTestId('donate-submit').click()
      await navigated

      expect(posts).toEqual([{ amount: 300 }])
      expect(page.url()).toContain('yoomoney.ru')
    } finally {
      await context.close()
    }
  }
})
