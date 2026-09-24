// Общие помощники UX-спеков профиля: демо-пользователь, моки API,
// открытие web- и Telegram-контекстов. Вынесены из profile-stoic.spec.mjs,
// чтобы спеки профиля переиспользовали одну и ту же среду.

import { expect } from '@playwright/test'

export const VIEWPORTS = [
  { name: '393', width: 393, height: 852 },
  { name: '440', width: 440, height: 956 },
]

export const TEST_USER = { id: 900618, first_name: 'Профиль', username: 'profile_618' }

export function json(body, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) }
}

export async function mockApi(context) {
  await context.route('**/api/**', route => {
    const { pathname } = new URL(route.request().url())
    if (route.request().method() !== 'GET') return route.fulfill(json({ ok: true, user: TEST_USER }))
    if (pathname === '/api/profile') return route.fulfill(json(TEST_USER))
    if (pathname === '/api/profile/settings') return route.fulfill(json({ review_hour: 19 }))
    if (pathname === '/api/checkin/today') return route.fulfill(json(null))
    if (pathname === '/api/subscription') return route.fulfill(json({ tier: 'base' }))
    if (pathname === '/api/analytics/pulse') return route.fulfill(json({ active_today: 0 }))
    if (/\/api\/(rituals|ascezas|themes|articles|checkin\/history)$/.test(pathname)) {
      return route.fulfill(json([]))
    }
    return route.fulfill(json({}))
  })
}

export async function openWeb(browser, baseURL, viewport) {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })
  await context.addInitScript(user => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('mentalix_web_user', JSON.stringify(user))
    localStorage.setItem('mx-onboarded-v2', '1')
    localStorage.setItem('mx-app-lock-enabled', '0')
  }, TEST_USER)
  await mockApi(context)
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByTestId('today-profile-button')).toBeVisible()
  return { context, page }
}

export async function openTelegram(browser, baseURL, viewport) {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })
  await context.addInitScript(user => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('mx-onboarded-v2', '1')
    localStorage.setItem('mx-app-lock-enabled', '0')
    const handlers = new Set()
    const noop = () => {}
    const backButton = {
      isVisible: false,
      show() {
        this.isVisible = true
      },
      hide() {
        this.isVisible = false
      },
      onClick: handler => handlers.add(handler),
      offClick: handler => handlers.delete(handler),
    }
    window.__telegramBackClick = () => [...handlers].at(-1)?.()
    const mainButton = {
      setParams: noop,
      onClick: noop,
      offClick: noop,
      show: noop,
      hide: noop,
      enable: noop,
      disable: noop,
      showProgress: noop,
      hideProgress: noop,
    }
    const webApp = {
      initData: `query_id=profile-618&user=${encodeURIComponent(JSON.stringify({ id: user.id }))}`,
      initDataUnsafe: { user },
      version: '8.0',
      platform: 'ios',
      colorScheme: 'dark',
      isFullscreen: true,
      BackButton: backButton,
      MainButton: mainButton,
      SecondaryButton: mainButton,
      HapticFeedback: { impactOccurred: noop, notificationOccurred: noop, selectionChanged: noop },
      onEvent: noop,
      offEvent: noop,
      ready: noop,
      expand: noop,
      requestFullscreen: noop,
      lockVerticalSwipes: noop,
      setHeaderColor: noop,
      setBackgroundColor: noop,
      setBottomBarColor: noop,
    }
    window.Telegram = {}
    Object.defineProperty(window.Telegram, 'WebApp', {
      configurable: true,
      get: () => webApp,
      set: noop,
    })
  }, TEST_USER)
  await mockApi(context)
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByTestId('today-profile-button')).toBeVisible()
  return { context, page }
}

export function centerY(box) {
  return box.y + box.height / 2
}
