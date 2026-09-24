import { expect, test } from '@playwright/test'

// #618 — профиль и настройки по эталону Stoic (DESIGN_SYSTEM.md §5.4).
// Проверяем на 393 и 440 px: кнопка профиля, экран профиля, строки, карточки,
// отсутствие своих ✕/назад в Telegram.

const VIEWPORTS = [
  { name: '393', width: 393, height: 852 },
  { name: '440', width: 440, height: 956 },
]

const TEST_USER = { id: 900618, first_name: 'Профиль', username: 'profile_618' }

function json(body, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) }
}

async function mockApi(context) {
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

async function openWeb(browser, baseURL, viewport) {
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

async function openTelegram(browser, baseURL, viewport) {
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
      lockOrientation: noop,
      disableVerticalSwipes: noop,
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

function centerY(box) {
  return box.y + box.height / 2
}

for (const viewport of VIEWPORTS) {
  test.describe(`Профиль Stoic — ${viewport.name} px`, () => {
    test('кнопка профиля 56 px, 14 px справа, центр на линии огонька', async ({
      browser,
      baseURL,
    }) => {
      const { context, page } = await openWeb(browser, baseURL, viewport)
      try {
        const button = await page.getByTestId('today-profile-button').boundingBox()
        const chip = await page.getByTestId('today-streak-chip').boundingBox()
        expect(Math.round(button.width)).toBe(56)
        expect(Math.round(button.height)).toBe(56)
        expect(Math.abs(viewport.width - (button.x + button.width) - 14)).toBeLessThanOrEqual(1)
        expect(Math.abs(centerY(button) - centerY(chip))).toBeLessThanOrEqual(2)
      } finally {
        await context.close()
      }
    })

    test('экран профиля открывается и закрывается; строки 50 px, поля карточек 16 px', async ({
      browser,
      baseURL,
    }) => {
      const { context, page } = await openWeb(browser, baseURL, viewport)
      try {
        await page.getByTestId('today-profile-button').click()
        await expect(page.getByTestId('profile-screen')).toBeVisible()
        await expect(page.getByRole('heading', { name: 'твой профиль.' })).toBeVisible()

        const row = await page.getByTestId('profile-row-checkins').boundingBox()
        expect(Math.round(row.height)).toBe(50)
        const card = await page.getByTestId('profile-card-setup').boundingBox()
        expect(Math.round(card.x)).toBe(16)
        expect(Math.round(viewport.width - (card.x + card.width))).toBe(16)

        // Под-экран и возврат.
        await page.getByTestId('profile-row-prefs').click()
        await expect(page.getByRole('heading', { name: 'настройки.' })).toBeVisible()
        const back = page.getByTestId('profile-close-button')
        const backBox = await back.boundingBox()
        expect(Math.round(backBox.width)).toBe(44)
        expect(Math.round(backBox.x)).toBe(20)
        await back.click()
        await expect(page.getByRole('heading', { name: 'твой профиль.' })).toBeVisible()

        // Закрытие профиля — круглая кнопка web.
        await page.getByTestId('profile-close-button').click()
        await expect(page.getByTestId('profile-screen')).toHaveCount(0)
        await expect(page.getByTestId('today-profile-button')).toBeVisible()
      } finally {
        await context.close()
      }
    })

    test('в Telegram своих ✕/назад нет — работает нативная «Назад»', async ({
      browser,
      baseURL,
    }) => {
      const { context, page } = await openTelegram(browser, baseURL, viewport)
      try {
        await page.getByTestId('today-profile-button').click()
        await expect(page.getByTestId('profile-screen')).toBeVisible()
        await expect(page.getByTestId('profile-close-button')).toHaveCount(0)

        await page.getByTestId('profile-row-about').click()
        await expect(page.getByRole('heading', { name: 'о тебе.' })).toBeVisible()
        await expect(page.getByTestId('profile-close-button')).toHaveCount(0)

        await page.evaluate(() => window.__telegramBackClick())
        await expect(page.getByRole('heading', { name: 'твой профиль.' })).toBeVisible()
        await page.evaluate(() => window.__telegramBackClick())
        await expect(page.getByTestId('profile-screen')).toHaveCount(0)
        await expect(page.getByTestId('today-profile-button')).toBeVisible()
      } finally {
        await context.close()
      }
    })
  })
}
