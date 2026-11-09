// ISSUE #1166 — веб/PWA: при «Выйти» личные данные стираются с устройства.
//
// Сценарий: вошёл (на устройстве остались личные ключи) → «Выйти» → в
// хранилище нет личных ключей, отметка выхода и оформление устройства на
// месте → обновил страницу, по-прежнему экран входа → вошёл снова → данные
// снова приходят с сервера, а данные, жившие только на устройстве
// («Путь героя»), не возвращаются — окно выхода об этом предупреждает.
//
// Мок API — как в web-logout.spec.mjs (#1163): в dev-сборке web-адаптер
// восстанавливает пользователя из localStorage, поэтому состояние «вошёл»
// задаётся до первого рендера. Данные, которые приложение пишет на
// устройство во время работы, засеваются тем же init-скриптом: шаги
// «Пути героя» в тесте не проходятся, а их результат нужен до выхода.

import path from 'node:path'

import { expect, test } from '@playwright/test'

import { TEST_USER, json } from './profile-helpers.mjs'

const SHOTS = 'qa-evidence/logout-local-data'
const TEST_SESSION_TOKEN = 'session-for-logout-local-data-test'

// 12 чек-инов на сервере — отметка «знакомство пройдено» после входа
// восстанавливается из GET /api/profile (#1154), а не из localStorage.
const SERVER_PROFILE = { ...TEST_USER, total_checkins: 12 }

const HERO_WARNING = 'Прогресс «Пути героя» на этом устройстве не сохранится.'

const VIEWPORTS = [
  { name: '393x852', width: 393, height: 852 },
  { name: '360x640', width: 360, height: 640 },
]

// Личные ключи, которые приложение оставляет на устройстве: сессия, профиль,
// черновики, прогресс «Пути героя» и снимок дня.
function personalStorage(userId) {
  return {
    local: {
      mentalix_web_user: JSON.stringify(TEST_USER),
      mentalix_session_token: TEST_SESSION_TOKEN,
      'mx-onboarded-v2': '1',
      'mx-app-lock-enabled': '0',
      'mx-birthday': '1990-05-17',
      [`mx-journal-draft-v3:${userId}`]: JSON.stringify({ text: 'черновик записи' }),
      [`mx-hero-journey-progress:${userId}`]: JSON.stringify({
        completed: { uncertainty: '2026-11-01' },
        signs: {},
        reflections: {},
        actions: {},
      }),
    },
    session: {
      [`mentalix:today:snapshot:v1:${userId}`]: JSON.stringify({ data: { owner: 'me' } }),
    },
  }
}

async function mockApi(context) {
  await context.route('**/api/**', route => {
    const { pathname } = new URL(route.request().url())
    if (route.request().method() !== 'GET') return route.fulfill(json({ ok: true, user: TEST_USER }))
    if (pathname === '/api/profile') return route.fulfill(json(SERVER_PROFILE))
    if (pathname === '/api/profile/settings') return route.fulfill(json({ review_hour: 19 }))
    if (pathname === '/api/checkin/today') return route.fulfill(json(null))
    if (pathname === '/api/subscription') return route.fulfill(json({ tier: 'base' }))
    if (/\/api\/(rituals|ascezas|themes|articles|checkin\/history)$/.test(pathname)) {
      return route.fulfill(json([]))
    }
    return route.fulfill(json({}))
  })
}

async function openLoggedIn(browser, baseURL, viewport, { withHeroJourney = true } = {}) {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })
  const personal = personalStorage(TEST_USER.id)
  await context.addInitScript(
    ({ user, token, local, session, hero }) => {
      // Боевые хосты разрешают автозапуск гостя без сессии (src/lib/guestAuth.js).
      window.__MX_TEST_ALLOW_GUEST = true
      // Собственная отметка выхода остаётся после «Выйти» (#1166) — reload
      // не должен вернуть пользователя из засева.
      if (localStorage.getItem('mx-web-logged-out') === '1') return
      localStorage.clear()
      sessionStorage.clear()
      for (const [key, value] of Object.entries(local)) localStorage.setItem(key, value)
      for (const [key, value] of Object.entries(session)) sessionStorage.setItem(key, value)
      // Нейтральные настройки устройства — их выход не стирает.
      localStorage.setItem('mx-theme', 'dark')
      localStorage.setItem('mx-accent-color', 'ice')
      // Пустой прогресс «Пути героя» пишет сам хук при открытии карты:
      // предупреждения он не вызывает.
      if (!hero) {
        localStorage.setItem(
          `mx-hero-journey-progress:${user.id}`,
          JSON.stringify({ completed: {}, signs: {}, reflections: {}, actions: {} })
        )
      }
      void token
    },
    {
      user: TEST_USER,
      token: TEST_SESSION_TOKEN,
      local: personal.local,
      session: personal.session,
      hero: withHeroJourney,
    }
  )
  await mockApi(context)
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByTestId('today-profile-button')).toBeVisible()
  return { context, page }
}

async function openProfile(page) {
  await page.getByTestId('today-profile-button').click()
  await expect(page.getByTestId('profile-screen')).toBeVisible()
}

async function openLogoutDialog(page) {
  const logoutRow = page.getByTestId('profile-row-logout')
  await expect(logoutRow).toBeVisible()
  await logoutRow.scrollIntoViewIfNeeded()
  await logoutRow.click()
  const dialog = page.getByTestId('logout-confirm')
  await expect(dialog).toBeVisible()
  return dialog
}

for (const viewport of VIEWPORTS) {
  test.describe(`Выход стирает личные данные — ${viewport.name}`, () => {
    test('вошёл → записал → вышел → хранилище чисто → вошёл → данные с сервера', async ({
      browser,
      baseURL,
    }) => {
      const { context, page } = await openLoggedIn(browser, baseURL, viewport, {
        withHeroJourney: true,
      })
      try {
        const personal = personalStorage(TEST_USER.id)

        // 1. Окно выхода предупреждает о данных, которые есть только на устройстве.
        await openProfile(page)
        let dialog = await openLogoutDialog(page)
        await expect(dialog.getByText(HERO_WARNING)).toBeVisible()
        await page.screenshot({
          path: path.join(SHOTS, `${viewport.name}-confirm-warning.png`),
        })

        // 2. «Отмена» ничего не стирает.
        await dialog.getByRole('button', { name: 'Отмена', exact: true }).click()
        await expect(dialog).toBeHidden()
        expect(await page.evaluate(() => localStorage.getItem('mx-birthday'))).not.toBeNull()

        // 3. «Выйти» — экран входа и личных ключей на устройстве нет.
        dialog = await openLogoutDialog(page)
        await dialog.getByRole('button', { name: 'Выйти', exact: true }).click()
        await expect(page.locator('#web-auth-title')).toBeVisible()

        const afterLogout = await page.evaluate(() => ({
          local: { ...localStorage },
          session: { ...sessionStorage },
        }))
        for (const key of Object.keys(personal.local)) {
          expect(afterLogout.local[key], `личный ключ остался: ${key}`).toBeUndefined()
        }
        for (const key of Object.keys(personal.session)) {
          expect(afterLogout.session[key], `личный ключ остался: ${key}`).toBeUndefined()
        }
        // Отметка выхода и оформление устройства — остаются.
        expect(afterLogout.local['mx-web-logged-out']).toBe('1')
        expect(afterLogout.local['mx-theme']).toBe('dark')
        expect(afterLogout.local['mx-accent-color']).toBe('ice')

        // 4. После обновления страницы — по-прежнему экран входа.
        await page.reload()
        await expect(page.locator('#web-auth-title')).toBeVisible()
        await expect(page.getByTestId('today-profile-button')).toHaveCount(0)

        // 5. Вход тем же путём, что Telegram Login виджета: данные приложения
        // возвращаются с сервера, «Путь героя» — нет (о нём и было предупреждение).
        await page.evaluate(user => window.onTelegramAuth(user), TEST_USER)
        await expect(page.getByTestId('today-profile-button')).toBeVisible()

        const afterLogin = await page.evaluate(() => ({
          user: localStorage.getItem('mentalix_web_user'),
          onboarded: localStorage.getItem('mx-onboarded-v2'),
          hero: localStorage.getItem('mx-hero-journey-progress:900618'),
          loggedOut: localStorage.getItem('mx-web-logged-out'),
        }))
        expect(afterLogin.user).not.toBeNull()
        // Флаг знакомства вернул сервер (GET /api/profile: total_checkins > 0).
        expect(afterLogin.onboarded).toBe('1')
        expect(afterLogin.loggedOut).toBeNull()
        expect(afterLogin.hero).toBeNull()
      } finally {
        await context.close()
      }
    })
  })

  test.describe(`Окно выхода без данных «Пути героя» — ${viewport.name}`, () => {
    test('предупреждения нет, если прогресса на устройстве нет', async ({ browser, baseURL }) => {
      const { context, page } = await openLoggedIn(browser, baseURL, viewport, {
        withHeroJourney: false,
      })
      try {
        await openProfile(page)
        const dialog = await openLogoutDialog(page)
        await expect(dialog.getByText(HERO_WARNING)).toHaveCount(0)
        await page.screenshot({ path: path.join(SHOTS, `${viewport.name}-confirm.png`) })
      } finally {
        await context.close()
      }
    })
  })
}
