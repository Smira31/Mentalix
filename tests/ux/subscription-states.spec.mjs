// PAY-UI-001: экран «Подписка» в каждом demo payState показывает ожидаемый
// заголовок и кнопку/плашку; возврат с ЮKassa (?payment=return) открывает
// экран подписки и решает состояние только по свежему has_pro; кнопка
// «Оформить Pro» в карточке «Прогресс» ведёт в тот же путь оплаты.
// Гость в вебе вместо тупика «Сначала сохрани прогресс по email» получает вход
// через Telegram и возврат к оплате без второго нажатия — набор идёт в той же
// конфигурации, что и продакшн: VITE_EMAIL_LOGIN_ENABLED=false (см. конфиг).
// Нужен флаг VITE_PAYMENT_UI_ENABLED=true, поэтому набор запускается своим
// dev-сервером: `npm run ux:payment-ui` (playwright.payment-ui.config.mjs).
// Флаг VITE_PRO_REVIEW_PLAN_ENABLED=true в том же конфиге нужен только для
// карточки «Разбор и план недели».
// В песочнице флаги заданы docker-compose.base44.yml.
// Web-контекст (не Telegram): базовая кнопка оплаты ведёт на ЮKassa.

import { expect, test } from '@playwright/test'
import { TEST_USER, json, mockApi, openWeb } from './profile-helpers.mjs'

const VIEWPORT = { width: 390, height: 844 }

// Тест-иды кнопок — те же, что в SubscriptionManager (renderFooter).
const CASES = [
  { payState: 'guest', title: 'Войди через Telegram, чтобы оформить Pro', testId: 'subscription-pay-button' },
  { payState: 'base', title: 'Готов открыть свой потенциал?', testId: 'subscription-pay-button' },
  { payState: 'pro', title: 'Pro активен', testId: null },
  { payState: 'success', title: 'pro активен.', testId: 'subscription-success-continue', success: true },
  { payState: 'expired', title: 'Срок Pro закончился', testId: 'subscription-pay-button' },
  {
    payState: 'pending',
    title: 'Оплата обрабатывается',
    testId: 'subscription-check-payment',
    support: true,
  },
]

for (const { payState, title, testId, success, support } of CASES) {
  test(`экран «Подписка» — payState=${payState}`, async ({ browser, baseURL }) => {
    const { context, page } = await openWeb(browser, baseURL, VIEWPORT)
    try {
      await page.goto(`/?demo=1&payState=${payState}`)
      await expect(page.getByTestId('today-profile-button')).toBeVisible()
      await page.getByTestId('today-profile-button').click()
      await page.getByTestId('profile-screen').getByText('Подписка').click()
      if (payState === 'success') {
        // Полноэкранный экран успеха заменяет обычный экран подписки.
        await expect(page.getByTestId('subscription-success-title')).toBeVisible()
      } else {
        await expect(page.getByTestId('profile-screen-subscription')).toBeVisible()
      }
      await expect(page.getByText(title)).toBeVisible()
      if (testId) {
        await expect(page.getByTestId(testId)).toBeVisible()
      } else {
        // pro — кнопки оплаты нет
        await expect(page.getByTestId('subscription-pay-button')).not.toBeVisible()
      }
      if (success) {
        // Подзаголовок и строка с датой — на экране успеха.
        await expect(page.getByTestId('subscription-success-subtitle')).toBeVisible()
        await expect(page.getByTestId('subscription-success-date')).toBeVisible()
      }
      if (support) {
        // Подсказка про поддержку — тихая ссылка под состоянием.
        await expect(page.getByTestId('subscription-support-hint')).toBeVisible()
      }
    } finally {
      await context.close()
    }
  })
}

/*
 * Кнопка «Оформить Pro» в вебе действительно уводит на страницу оплаты.
 * Ответ POST /api/payments/yookassa/create подменяется моком, проверяется
 * фактический переход в текущей вкладке: без него экран оставался в
 * «Открываем оплату…» и оплата не открывалась.
 *
 * Проверка идёт без ?demo=1: демо-перехват отвечает на create честным 503
 * (yookassa_disabled), поэтому настоящий путь оплаты проверяется на моке
 * ответа, как в остальных сценариях возврата. Пользователь — не гость
 * (у гостя кнопка ведёт во вход через Telegram), поэтому вход задаётся тем
 * же способом, что и в помощнике openWeb, но с email.
 */
test('веб: кнопка «Оформить Pro» уводит на страницу оплаты', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    viewport: VIEWPORT,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })
  try {
    const confirmationUrl = 'https://yoomoney.ru/api-pages/v2/checkout/pay-ui-001'
    await context.addInitScript(user => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem('mentalix_web_user', JSON.stringify(user))
      localStorage.setItem('mx-onboarded-v2', '1')
      localStorage.setItem('mx-app-lock-enabled', '0')
    }, { ...TEST_USER, email: 'pay-ui@example.invalid' })
    await mockApi(context)
    // Ответ create подменяем: настоящий платёж в проверке не создаётся.
    await context.route('**/api/payments/yookassa/create', route =>
      route.fulfill(json({ confirmation_url: confirmationUrl }))
    )
    await context.route('https://yoomoney.ru/**', route =>
      route.fulfill({ contentType: 'text/html', body: '<h1>ЮKassa</h1>' })
    )

    const page = await context.newPage()
    await page.goto('/')
    await expect(page.getByTestId('today-profile-button')).toBeVisible()

    await page.getByTestId('today-profile-button').click()
    await page.getByTestId('profile-screen').getByText('Подписка').click()
    await expect(page.getByTestId('profile-screen-subscription')).toBeVisible()

    const payButton = page.getByTestId('subscription-pay-button')
    await expect(payButton).toBeVisible()
    await payButton.click()

    await page.waitForURL('https://yoomoney.ru/**', { timeout: 15_000 })
    expect(page.url()).toBe(confirmationUrl)
  } finally {
    await context.close()
  }
})

/*
 * Возврат с ЮKassa: ЮKassa отправляет пользователя на ?payment=return.
 * Приложение открывает экран подписки, само читает GET /api/subscription и
 * убирает служебный параметр из адреса. Сам возврат оплатой не считается:
 * has_pro=true → «Оплата прошла», иначе «Оплата обрабатывается» + кнопка.
 */
const RETURN_CASES = [
  { hasPro: false, title: 'Оплата обрабатывается', buttonId: 'subscription-check-payment' },
  { hasPro: true, title: 'pro активен.', buttonId: 'subscription-success-continue' },
]

for (const { hasPro, title, buttonId } of RETURN_CASES) {
  test(`возврат с ЮKassa (?payment=return) — has_pro=${hasPro}`, async ({ browser, baseURL }) => {
    const { context, page } = await openWeb(browser, baseURL, VIEWPORT)
    try {
      // Свежий ответ /api/subscription — единственный источник истины.
      await context.route('**/api/subscription**', route =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            hasPro
              ? {
                  tier: 'pro',
                  has_pro: true,
                  expires_at: '2026-11-15T00:00:00Z',
                  days_left: 30,
                }
              : { tier: 'base', has_pro: false }
          ),
        })
      )

      await page.goto('/?payment=return')

      if (hasPro) {
        // Полноэкранный экран успеха.
        await expect(page.getByTestId('subscription-success-title')).toBeVisible()
      } else {
        await expect(page.getByTestId('profile-screen-subscription')).toBeVisible()
      }
      await expect(page.getByText(title)).toBeVisible()
      if (buttonId) {
        await expect(page.getByTestId(buttonId)).toBeVisible()
      }
      // Служебный параметр возврата убран из адресной строки.
      expect(new URL(page.url()).searchParams.has('payment')).toBe(false)
    } finally {
      await context.close()
    }
  })
}

/*
 * Экран успеха после оплаты: показывается один раз, «Продолжить» уходит,
 * повторное открытие «Подписки» — обычное состояние «Pro активен» без
 * закрытого замка (открытый замок вместо закрытого).
 *
 * Мок: возврат с ЮKassa (?payment=return) + has_pro=true → экран успеха.
 * Нажатие «Продолжить» → возврат в профиль. Повторное открытие подписки —
 * обычный экран «Pro активен» (замок открыт, не закрыт).
 */
test('экран успеха: «Продолжить» уходит, повторное открытие — Pro без замка', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: VIEWPORT,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })
  try {
    await context.addInitScript(user => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem('mentalix_web_user', JSON.stringify(user))
      localStorage.setItem('mx-onboarded-v2', '1')
      localStorage.setItem('mx-app-lock-enabled', '0')
    }, { ...TEST_USER, email: 'pay-success@example.invalid' })
    await mockApi(context)

    // Имитируем начатую оплату (sessionStorage) и возврат с has_pro=true.
    await context.addInitScript(() => {
      sessionStorage.setItem('mx-yookassa-payment-started', String(Date.now()))
    })
    await context.route('**/api/subscription**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tier: 'pro',
          has_pro: true,
          expires_at: '2026-11-15T00:00:00Z',
          days_left: 30,
        }),
      })
    )

    const page = await context.newPage()
    await page.goto('/?payment=return')

    // 1. Показан полноэкранный экран успеха.
    await expect(page.getByTestId('subscription-success-title')).toBeVisible()
    await expect(page.getByText('pro активен.')).toBeVisible()
    await expect(page.getByTestId('subscription-success-subtitle')).toBeVisible()
    await expect(page.getByTestId('subscription-success-date')).toBeVisible()
    await expect(page.getByTestId('subscription-success-continue')).toBeVisible()
    // Кнопки оплаты на экране успеха нет.
    await expect(page.getByTestId('subscription-pay-button')).not.toBeVisible()

    // 2. «Продолжить» уходит с экрана успеха — возврат в профиль.
    await page.getByTestId('subscription-success-continue').click()
    await expect(page.getByTestId('profile-screen')).toBeVisible()

    // 3. Повторное открытие «Подписки» — обычное состояние «Pro активен»,
    //    без экрана успеха и без закрытого замка.
    await page.getByTestId('profile-screen').getByText('Подписка').click()
    await expect(page.getByTestId('profile-screen-subscription')).toBeVisible()
    await expect(page.getByText('Pro активен')).toBeVisible()
    // Экрана успеха больше нет.
    await expect(page.getByTestId('subscription-success-title')).not.toBeVisible()
    await expect(page.getByTestId('subscription-success-continue')).not.toBeVisible()
  } finally {
    await context.close()
  }
})

/*
 * Кнопка «Оформить Pro» в карточке «Прогресс» — тот же путь ЮKassa:
 * ведёт на экран подписки с кнопкой оплаты.
 */
test('карточка «Прогресс»: «Оформить Pro» ведёт в тот же путь ЮKassa', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: VIEWPORT,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })
  try {
    const page = await context.newPage()
    /*
     * ?proStatus=pro — существующий dev-параметр (src/screens/pro/ProAnalyticsEntry.jsx):
     * в демо пользователь non-Pro, и в «Прогрессе» теперь показывается витрина
     * (progress-pro-showcase), а не карточка Pro. Кнопка «Оформить Pro» живёт
     * в карточке Pro, поэтому статус Pro задаётся тем же способом, что в
     * ux:pro-states / ux:pro-failure-states.
     */
    await page.goto('/?demo=1&frame=0&proStatus=pro')
    await page.getByRole('button', { name: 'Прогресс' }).click()
    await expect(page.getByTestId('progress-pro-card')).toBeVisible()

    await page.getByTestId('pro-card-buy-pro').click()

    await expect(page.getByTestId('profile-screen-subscription')).toBeVisible()
    await expect(page.getByTestId('subscription-pay-button')).toBeVisible()
  } finally {
    await context.close()
  }
})

/*
 * Гость в вебе: оплата начинается со входа через Telegram и сама возвращается
 * к оплате — второго нажатия нет.
 *
 * Экран гостя не упоминает email (вход по email выключен в прод-конфигурации
 * набора), а кнопка «Войти через Telegram» открывает существующий экран входа
 * WebAuthScreen с Telegram Login — тот же флоу, что и по кнопке доната.
 *
 * Саму авторизацию в Telegram автоматизировать нельзя: она происходит на
 * стороне Telegram и требует боевого домена бота — это ручной gate. Поэтому
 * виджет подменяем и вызываем тот же window.onTelegramAuth, которым настоящий
 * виджет отвечает приложению; вход отвечает так же, как реальный
 * POST /api/auth/telegram/login — аккаунт есть, email нет.
 */
test('гость в вебе: вход через Telegram возвращает к оплате без второго нажатия', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: VIEWPORT,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })
  try {
    const guest = { id: 900002, first_name: 'Гость', is_guest: true, email: null }
    await context.addInitScript(user => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem('mentalix_web_user', JSON.stringify(user))
      localStorage.setItem('mx-onboarded-v2', '1')
      localStorage.setItem('mx-app-lock-enabled', '0')
    }, guest)
    await mockApi(context)

    // Вошедший через Telegram: аккаунт есть, email нет.
    const signedIn = { id: 900619, first_name: 'Гость', is_guest: false, email: null }
    await context.route('**/api/auth/telegram/login', route =>
      route.fulfill(json({ ok: true, user: signedIn }))
    )
    // Виджет Telegram подменяем: настоящая авторизация — ручной gate.
    await context.route('https://telegram.org/js/telegram-widget.js*', route =>
      route.fulfill({
        contentType: 'application/javascript',
        body: 'window.__answerTelegramLogin = () => window.onTelegramAuth({ id: 900619, first_name: "Гость", auth_date: 1, hash: "test-hash" })',
      })
    )

    const confirmationUrl = 'https://yoomoney.ru/api-pages/v2/checkout/guest-telegram'
    let createRequests = 0
    await context.route('**/api/payments/yookassa/create', route => {
      createRequests += 1
      return route.fulfill(json({ confirmation_url: confirmationUrl }))
    })
    await context.route('https://yoomoney.ru/**', route =>
      route.fulfill({ contentType: 'text/html', body: '<h1>ЮKassa</h1>' })
    )

    const page = await context.newPage()
    await page.goto('/')
    await expect(page.getByTestId('today-profile-button')).toBeVisible()
    await page.getByTestId('today-profile-button').click()
    await page.getByTestId('profile-screen').getByText('Подписка').click()
    await expect(page.getByTestId('profile-screen-subscription')).toBeVisible()

    // 1. Экран гостя: про email — ни слова, вход предлагается через Telegram.
    await expect(page.getByText('Войди через Telegram, чтобы оформить Pro')).toBeVisible()
    await expect(
      page.getByText('Так подписка привяжется к твоему аккаунту, а записи не потеряются.')
    ).toBeVisible()
    await expect(page.getByTestId('profile-screen-subscription').getByText(/email/i)).toHaveCount(0)

    const payButton = page.getByTestId('subscription-pay-button')
    await expect(payButton).toHaveText('Войти через Telegram')

    // 2. Кнопка открывает существующий экран входа; Telegram — основной способ.
    await payButton.click()
    await expect(page.getByTestId('web-auth-guest-button')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Войти через Telegram' })).toBeVisible()

    // 3. Telegram ответил — приложение само возвращается на экран подписки
    // и само начинает оплату: ни одного дополнительного нажатия.
    await page.evaluate(() => window.__answerTelegramLogin())

    await expect(page.getByTestId('profile-screen-subscription')).toBeVisible()
    await page.waitForURL('https://yoomoney.ru/**', { timeout: 15_000 })
    expect(page.url()).toBe(confirmationUrl)
    expect(createRequests).toBe(1)
  } finally {
    await context.close()
  }
})
