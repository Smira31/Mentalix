// «Профиль: надёжность»: откат настроек при ошибке сервера, очистка localStorage
// после удаления аккаунта, экспорт в чат Telegram. Демо-режим + мок Telegram WebApp.

import { expect, test } from '@playwright/test'

const DEMO_URL = '/?demo=1&tab=today&frame=0'
const NETWORK_KEY = 'mentalix:demo-network:v1'

async function openTelegramProfile(
  browser,
  baseURL,
  { confirmAnswer = true, telegram = true } = {}
) {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 402, height: 874 },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })
  if (telegram)
    await context.addInitScript(answer => {
      const noop = () => {}
      const button = { isVisible: false, show: noop, hide: noop, onClick: noop, offClick: noop }
      const webApp = {
        initData: 'query_id=reliability&user=%7B%22id%22%3A900001%7D',
        initDataUnsafe: { user: { id: 900001, first_name: 'Надёжность' } },
        version: '8.0',
        platform: 'ios',
        colorScheme: 'dark',
        isFullscreen: true,
        isVersionAtLeast: () => true,
        BackButton: button,
        MainButton: { ...button, setParams: noop, enable: noop, disable: noop },
        SecondaryButton: { ...button, setParams: noop },
        onEvent: noop,
        offEvent: noop,
        ready: noop,
        expand: noop,
        requestFullscreen: noop,
        lockOrientation: noop,
        disableVerticalSwipes: noop,
        HapticFeedback: { impactOccurred: noop, notificationOccurred: noop },
        showConfirm(message, callback) {
          window.__tgConfirms = [...(window.__tgConfirms || []), message]
          callback(answer)
        },
        openTelegramLink(url) {
          window.__tgLinks = [...(window.__tgLinks || []), url]
        },
        requestWriteAccess(callback) {
          callback(true)
        },
        openLink(url) {
          window.__tgOpened = [...(window.__tgOpened || []), url]
        },
      }
      // SDK подменяет window.Telegram.WebApp своим — фиксируем мок геттером.
      window.Telegram = { WebApp: webApp }
      Object.defineProperty(window.Telegram, 'WebApp', {
        configurable: true,
        get: () => webApp,
        set: noop,
      })
    }, confirmAnswer)
  const page = await context.newPage()
  await page.goto(DEMO_URL)
  await page.getByTestId('today-profile-button').click()
  await expect(page.getByTestId('profile-screen')).toBeVisible()
  return { context, page }
}

test('напоминание при ошибке сервера откатывается к прежнему значению', async ({
  browser,
  baseURL,
}) => {
  const { context, page } = await openTelegramProfile(browser, baseURL)
  await page.getByTestId('profile-row-notifications').click()

  await page.getByRole('switch', { name: 'Напоминания в Telegram' }).click()
  const times = page.getByRole('group', { name: 'Время напоминания' })
  await expect(times).toBeVisible()
  await times.getByRole('button', { name: /Утро/ }).click()
  await expect(times.getByRole('button', { name: /Утро/ })).toHaveAttribute('aria-pressed', 'true')

  await page.evaluate(key => sessionStorage.setItem(key, 'Ошибка сервера'), NETWORK_KEY)
  await times.getByRole('button', { name: /Ночь/ }).click()

  await expect(page.getByText('Не удалось сохранить. Попробуй ещё раз')).toBeVisible()
  await expect(times.getByRole('button', { name: /Утро/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(times.getByRole('button', { name: /Ночь/ })).toHaveAttribute('aria-pressed', 'false')

  // Выключение при ошибке тоже откатывается: переключатель остаётся включённым.
  await page.getByRole('switch', { name: 'Напоминания в Telegram' }).click()
  await expect(page.getByRole('switch', { name: 'Напоминания в Telegram' })).toHaveAttribute(
    'aria-checked',
    'true'
  )
  await context.close()
})

test('удаление аккаунта чистит localStorage и показывает экран «данные удалены»', async ({
  browser,
  baseURL,
}) => {
  const { context, page } = await openTelegramProfile(browser, baseURL)
  const seeded = {
    'mx-birthday': '05-17',
    'mx-wtp-answers': '{"a":1}',
    mentalix_guest_merge_token: 'token',
    'mx-today-drafts:900001': '{"x":1}',
    'mx-checkin-draft:900001': '{"y":1}',
    'mx-theme': 'light',
    'mx-accent': 'azure',
    'mx-app-lock-enabled': '1',
  }
  await page.evaluate(entries => {
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
  }, seeded)

  await page.getByTestId('profile-row-data').click()
  await page.getByRole('button', { name: /Удалить аккаунт и данные/ }).click()

  await expect(page.getByRole('heading', { name: 'данные удалены.' })).toBeVisible()
  await expect(page.getByText(/только.*чек-ин/i)).toHaveCount(0)
  expect(await page.evaluate(() => window.__tgConfirms.length)).toBe(2)

  const left = await page.evaluate(
    keys => keys.filter(k => localStorage.getItem(k) !== null),
    Object.keys(seeded)
  )
  expect(left).toEqual([])
  await context.close()
})

test('экспорт в Telegram-режиме показывает «Отправили файл в чат» и открывает чат', async ({
  browser,
  baseURL,
}) => {
  const { context, page } = await openTelegramProfile(browser, baseURL)
  await page.getByTestId('profile-row-data').click()

  const row = page.getByTestId('profile-row-export')
  await row.click()
  await expect(page.getByText('Отправили файл в чат с Mentalix')).toBeVisible()

  await page.getByTestId('profile-export-open-chat').click()
  expect(await page.evaluate(() => window.__tgLinks)).toEqual(['https://t.me/Mentalix_club_bot'])

  // 4-я отправка за день: сервер отвечает 429.
  await row.click()
  await row.click()
  await expect(page.getByText('Отправили файл в чат с Mentalix')).toBeVisible()
  await row.click()
  await expect(page.getByText('Можно 3 раза в день, попробуй завтра')).toBeVisible()
  await context.close()
})

test('экспорт в Telegram: ошибки контракта и путь запроса', async ({ browser, baseURL }) => {
  const cases = [
    ['bot_blocked', 'Разблокируй бота Mentalix и попробуй снова'],
    ['identity_required', 'Не получилось отправить. Попробуй ещё раз'],
    ['telegram_send_failed', 'Не получилось отправить. Попробуй ещё раз'],
    ['user_not_found', 'Не получилось отправить. Попробуй ещё раз'],
  ]
  for (const [mock, message] of cases) {
    const { context, page } = await openTelegramProfile(browser, baseURL)
    await page.evaluate(m => history.replaceState(null, '', `/?demo=1&export_mock=${m}`), mock)
    await page.getByTestId('profile-row-data').click()
    await page.getByTestId('profile-row-export').click()
    await expect(page.getByText(message)).toBeVisible()
    await expect(page.getByTestId('profile-export-open-chat')).toHaveCount(0)
    await context.close()
  }
})

test('экспорт в вебе не вызывает send-to-telegram', async ({ browser, baseURL }) => {
  const { context, page } = await openTelegramProfile(browser, baseURL, { telegram: false })
  const calls = []
  page.on('request', r => r.url().includes('send-to-telegram') && calls.push(r.url()))
  await page.getByTestId('profile-row-data').click()
  expect(calls).toEqual([])
  await context.close()
})

test('«Назад» демо-шапки работает на подэкранах профиля', async ({ browser, baseURL }) => {
  const { context, page } = await openTelegramProfile(browser, baseURL, { telegram: false })
  await page.getByTestId('profile-row-data').click()
  await page.getByRole('button', { name: /Политика и данные/ }).click()
  await expect(page.getByTestId('profile-screen-privacy')).toBeVisible()
  // «Назад» демо-шапки Telegram (первая кнопка вне экрана профиля).
  await page.getByRole('button', { name: 'Назад', exact: true }).first().click()
  await expect(page.getByTestId('profile-sub-data')).toBeVisible()
  await context.close()
})
