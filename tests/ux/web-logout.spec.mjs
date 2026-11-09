// ISSUE #1163 — веб/PWA: «Выйти из аккаунта» в настройках.
//
// Сценарий: вошёл → пункт в профиле → подтвердил → экран входа → обновил
// страницу → снова экран входа. Дополнительно: «Отмена» не выходит,
// в Telegram Mini App пункта нет.
//
// Мок API — как в профильных средах (#618): в dev-сборке web-адаптер
// восстанавливает пользователя из localStorage, поэтому состояние «вошёл»
// задаётся до первого рендера. Токен в тесте — фиктивный.

import path from 'node:path'

import { expect, test } from '@playwright/test'

import { TEST_USER, mockApi, openTelegram } from './profile-helpers.mjs'

const SHOTS = 'qa-evidence/web-logout'
const TEST_SESSION_TOKEN = 'session-for-logout-test'

const VIEWPORTS = [
  { name: '393x852', width: 393, height: 852 },
  { name: '360x640', width: 360, height: 640 },
]

async function openWebLoggedIn(browser, baseURL, viewport) {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })
  // addInitScript выполняется на каждой загрузке, включая reload. Метка
  // засева — собственная отметка приложения «человек вышел сам»
  // (`mx-web-logged-out`, #1163): после выхода она остаётся на устройстве
  // (#1166), поэтому reload не возвращает пользователя из сида — иначе
  // проверка «обновил → экран входа» была бы ложной.
  await context.addInitScript(
    ({ user, token }) => {
      // Боевые хосты разрешают автозапуск гостя при отсутствии сессии
      // (src/lib/guestAuth.js). На 127.0.0.1 он выключен, поэтому тест
      // включает тот же путь флагом — иначе «обновил → экран входа»
      // проверял бы не боевое поведение.
      window.__MX_TEST_ALLOW_GUEST = true
      if (localStorage.getItem('mx-web-logged-out') === '1') return
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem('mentalix_web_user', JSON.stringify(user))
      localStorage.setItem('mentalix_session_token', token)
      localStorage.setItem('mx-onboarded-v2', '1')
      localStorage.setItem('mx-app-lock-enabled', '0')
    },
    { user: TEST_USER, token: TEST_SESSION_TOKEN }
  )
  await mockApi(context)
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByTestId('today-profile-button')).toBeVisible()
  return { context, page }
}

for (const viewport of VIEWPORTS) {
  test.describe(`Выход из аккаунта в вебе — ${viewport.name}`, () => {
    test('вошёл → Выйти → подтвердил → экран входа → обновил → экран входа', async ({
      browser,
      baseURL,
    }) => {
      const { context, page } = await openWebLoggedIn(browser, baseURL, viewport)
      try {
        // 1. Профиль и пункт «Выйти из аккаунта» в группе «Аккаунт».
        await page.getByTestId('today-profile-button').click()
        await expect(page.getByTestId('profile-screen')).toBeVisible()
        const logoutRow = page.getByTestId('profile-row-logout')
        await expect(logoutRow).toBeVisible()
        await expect(logoutRow).toContainText('Выйти из аккаунта')
        await logoutRow.scrollIntoViewIfNeeded()
        await page.screenshot({ path: path.join(SHOTS, `${viewport.name}-settings.png`) })

        // 2. Подтверждение: существующее окно с «Выйти» и «Отмена».
        await logoutRow.click()
        const dialog = page.getByTestId('logout-confirm')
        await expect(dialog).toBeVisible()
        await expect(dialog.getByRole('heading', { name: 'Выйти из аккаунта?' })).toBeVisible()
        await expect(dialog.getByRole('button', { name: 'Выйти', exact: true })).toBeVisible()
        await expect(dialog.getByRole('button', { name: 'Отмена', exact: true })).toBeVisible()
        await page.screenshot({ path: path.join(SHOTS, `${viewport.name}-confirm.png`) })

        // 3. «Отмена» оставляет человека в профиле и сессию на месте.
        await dialog.getByRole('button', { name: 'Отмена', exact: true }).click()
        await expect(dialog).toBeHidden()
        await expect(page.getByTestId('profile-screen')).toBeVisible()
        expect(
          await page.evaluate(() => localStorage.getItem('mentalix_web_user'))
        ).not.toBeNull()

        // 4. «Выйти» — экран входа без перезагрузки, локальная сессия пуста.
        await logoutRow.click()
        await expect(dialog).toBeVisible()
        await dialog.getByRole('button', { name: 'Выйти', exact: true }).click()
        await expect(page.locator('#web-auth-title')).toBeVisible()
        await expect(page.getByTestId('web-auth-guest-button')).toBeVisible()
        const stored = await page.evaluate(() => ({
          user: localStorage.getItem('mentalix_web_user'),
          token: localStorage.getItem('mentalix_session_token'),
        }))
        expect(stored.user).toBeNull()
        expect(stored.token).toBeNull()

        // 5. После обновления страницы — по-прежнему экран входа.
        await page.reload()
        await expect(page.locator('#web-auth-title')).toBeVisible()
        await expect(page.getByTestId('today-profile-button')).toHaveCount(0)
        // Гость не создан автоматически: человек остался на экране входа.
        expect(await page.evaluate(() => localStorage.getItem('mentalix_web_user'))).toBeNull()
      } finally {
        await context.close()
      }
    })
  })
}

test('#1163: в Telegram Mini App пункта «Выйти из аккаунта» нет', async ({ browser, baseURL }) => {
  const { context, page } = await openTelegram(browser, baseURL, VIEWPORTS[0])
  try {
    await page.getByTestId('today-profile-button').click()
    await expect(page.getByTestId('profile-screen')).toBeVisible()
    await expect(page.getByTestId('profile-row-logout')).toHaveCount(0)
    await expect(page.getByText('Уведомления')).toBeVisible()
  } finally {
    await context.close()
  }
})
