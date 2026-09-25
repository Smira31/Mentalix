import { expect, test, devices } from '@playwright/test'

const modes = [
  { label: 'обычный Telegram', suffix: '' },
  { label: 'Telegram с ?demo=1', suffix: '?demo=1' },
]

function installTelegramMock(page) {
  return page.addInitScript(() => {
    const listeners = new Map()
    const backHandlers = new Set()
    let calls = 0
    let viewportHeight = 844
    let viewportStableHeight = 844

    const emit = eventName => {
      for (const handler of [...(listeners.get(eventName) || [])]) {
        handler({ isStateStable: true, isFullscreen: true })
      }
    }
    const notifyViewport = () => {
      calls += 1
      emit('viewportChanged')
      emit('safeAreaChanged')
      emit('contentSafeAreaChanged')
    }
    const mockButton = {
      isVisible: false,
      show() {
        this.isVisible = true
        notifyViewport()
      },
      hide() {
        this.isVisible = false
        notifyViewport()
      },
      onClick(handler) {
        backHandlers.add(handler)
        notifyViewport()
      },
      offClick(handler) {
        backHandlers.delete(handler)
        notifyViewport()
      },
    }
    const telegram = {
      initData:
        'query_id=loop-test&user=%7B%22id%22%3A900001%2C%22first_name%22%3A%22Loop%20Test%22%7D&hash=test',
      initDataUnsafe: { user: { id: 900001, first_name: 'Loop Test', username: 'loop_test' } },
      version: '8.0',
      platform: 'ios',
      colorScheme: 'dark',
      isFullscreen: true,
      isVersionAtLeast: ver => '8.0' >= ver,
      get viewportHeight() {
        return viewportHeight
      },
      set viewportHeight(value) {
        viewportHeight = value
        notifyViewport()
      },
      get viewportStableHeight() {
        return viewportStableHeight
      },
      set viewportStableHeight(value) {
        viewportStableHeight = value
        notifyViewport()
      },
      safeAreaInset: { top: 0, right: 0, bottom: 0, left: 0 },
      contentSafeAreaInset: { top: 0, right: 0, bottom: 0, left: 0 },
      BackButton: mockButton,
      MainButton: {
        setParams: notifyViewport,
        setText: notifyViewport,
        onClick: notifyViewport,
        offClick: notifyViewport,
        show: notifyViewport,
        hide: notifyViewport,
        enable: notifyViewport,
        disable: notifyViewport,
        showProgress: notifyViewport,
        hideProgress: notifyViewport,
      },
      SecondaryButton: {
        setParams: notifyViewport,
        onClick: notifyViewport,
        offClick: notifyViewport,
        show: notifyViewport,
        hide: notifyViewport,
        enable: notifyViewport,
        disable: notifyViewport,
      },
      SettingsButton: {
        onClick: notifyViewport,
        offClick: notifyViewport,
        show: notifyViewport,
        hide: notifyViewport,
      },
      HapticFeedback: { impactOccurred: notifyViewport, notificationOccurred: notifyViewport },
      ready: notifyViewport,
      expand: notifyViewport,
      disableVerticalSwipes: notifyViewport,
      setHeaderColor: notifyViewport,
      setBackgroundColor: notifyViewport,
      setBottomBarColor: notifyViewport,
      requestFullscreen() {
        notifyViewport()
        return Promise.resolve()
      },
      onEvent(eventName, handler) {
        const handlers = listeners.get(eventName) || new Set()
        handlers.add(handler)
        listeners.set(eventName, handlers)
      },
      offEvent(eventName, handler) {
        listeners.get(eventName)?.delete(handler)
      },
      lockOrientation: notifyViewport,
    }

    window.__telegramLoopMock = {
      getCalls: () => calls,
      pressBack: () => [...backHandlers].at(-1)?.(),
      changeHeight: value => {
        viewportHeight = value
        viewportStableHeight = value
        notifyViewport()
        window.visualViewport?.dispatchEvent(new Event('resize'))
      },
    }
    window.Telegram = {}
    Object.defineProperty(window.Telegram, 'WebApp', {
      configurable: true,
      get: () => telegram,
      set: () => {},
    })
    localStorage.setItem('mx-onboarded-v2', '1')
    localStorage.setItem('mx-app-lock-enabled', '0')
  })
}

async function mockApi(page) {
  await page.route('**/api/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    let body = { ok: true }
    if (request.method() === 'GET') {
      if (url.pathname === '/api/profile')
        body = { id: 900001, first_name: 'Loop Test', username: 'loop_test' }
      else if (url.pathname === '/api/profile/settings') body = { review_hour: 24 }
      else if (url.pathname === '/api/quotes/today') body = { text: 'Один спокойный шаг.' }
      else if (url.pathname === '/api/checkin/today') body = null
      else if (url.pathname === '/api/checkin/history')
        body = [
          {
            id: 900101,
            date: '2026-09-24',
            mood: 3,
            energy: 3,
            review_completed_at: '2026-09-24T18:00:00.000Z',
          },
          {
            id: 900102,
            date: '2026-09-23',
            mood: 3,
            energy: 2,
            review_completed_at: '2026-09-23T18:00:00.000Z',
          },
        ]
      else if (url.pathname === '/api/analytics/pulse') body = { active_today: 3 }
      else if (url.pathname === '/api/mentalix/consent') body = { context_consent: false }
      else if (url.pathname === '/api/mentalix/messages') body = []
      else if (url.pathname === '/api/themes/701') body = { id: 701, title: 'Неделя', days: [] }
      else body = []
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

async function assertNoUpdateDepth(errors, label) {
  const matches = errors.filter(message =>
    /Maximum update depth|Minified React error #185|#185/i.test(message)
  )
  expect(matches, `${label}: ${matches.join('\n')}`).toEqual([])
}

for (const mode of modes) {
  test(`не зацикливается Telegram WebApp при обходе экранов — ${mode.label}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...devices['iPhone 15 Pro'],
      colorScheme: 'dark',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    })
    const page = await context.newPage()
    const runtimeErrors = []
    page.on('console', message => {
      if (message.type() === 'error') runtimeErrors.push(message.text())
    })
    page.on('pageerror', error => runtimeErrors.push(`${error.message}\n${error.stack || ''}`))
    await installTelegramMock(page)
    await mockApi(page)

    try {
      await page.goto(`/${mode.suffix}`, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('button', { name: 'Сегодня', exact: true })).toBeVisible({
        timeout: 15_000,
      })
      await assertNoUpdateDepth(runtimeErrors, 'после загрузки')

      // Подсказки по одной: сначала о серии, после её закрытия — о карточках.
      const cardsHint = page.getByTestId('today-cards-hint')
      const dismissSeriesTip = page.getByRole('button', { name: 'Закрыть подсказку о серии' })
      await expect(dismissSeriesTip).toBeVisible()
      await expect(cardsHint).toBeHidden()
      await dismissSeriesTip.click()
      await expect(dismissSeriesTip).toBeHidden()

      const dismissHint = cardsHint.getByRole('button', { name: 'Закрыть подсказку', exact: true })
      await expect(cardsHint).toBeVisible()
      await dismissHint.click()
      await expect(cardsHint).toBeHidden()
      await assertNoUpdateDepth(runtimeErrors, 'после открытия и закрытия подсказок')

      await page.getByTestId('today-streak-chip').click()
      await expect(page.locator('.mx-path-surface')).toBeVisible()
      await page.evaluate(() => window.__telegramLoopMock.pressBack())
      await expect(page.getByRole('button', { name: 'Сегодня', exact: true })).toBeVisible()
      await assertNoUpdateDepth(runtimeErrors, 'после открытия и закрытия шторки пути')

      const scrollAndCheck = async label => {
        await page.evaluate(() => {
          const root = document.querySelector('.mx-app-scroll-root')
          if (root) root.scrollTo({ top: root.scrollHeight, behavior: 'instant' })
        })
        await page.waitForTimeout(80)
        await assertNoUpdateDepth(runtimeErrors, `после прокрутки ${label}`)
      }

      await scrollAndCheck('Сегодня')
      const profile = page.getByTestId('today-profile-button')
      if (await profile.isVisible().catch(() => false)) {
        await profile.click()
        await expect(page.getByTestId('profile-screen')).toBeVisible()
        await scrollAndCheck('Профиль')
        const preferences = page.getByTestId('profile-row-prefs')
        if (await preferences.isVisible().catch(() => false)) {
          await preferences.click()
          await expect(page.getByRole('heading', { name: 'настройки.' })).toBeVisible()
          await scrollAndCheck('Настройки')
          await page.evaluate(() => window.__telegramLoopMock.pressBack())
          await expect(page.getByTestId('profile-screen')).toBeVisible()
        }
        await page.evaluate(() => window.__telegramLoopMock.pressBack())
        await expect(page.getByRole('button', { name: 'Сегодня', exact: true })).toBeVisible()
      }

      for (const tab of ['Шаги', 'Диалог', 'Библиотека', 'Прогресс', 'Сегодня']) {
        await page.evaluate(() => {
          const root = document.querySelector('.mx-app-scroll-root')
          if (root) root.scrollTo({ top: 0, behavior: 'instant' })
        })
        await page.waitForTimeout(80)
        const navButton = page.getByRole('button', { name: tab, exact: true })
        await navButton.click()
        await page.waitForTimeout(100)
        await scrollAndCheck(tab)
        await assertNoUpdateDepth(runtimeErrors, `на экране ${tab}`)
      }

      await page.evaluate(() => {
        const webApp = window.Telegram.WebApp
        webApp.viewportHeight = 720
        webApp.viewportStableHeight = 720
        window.__telegramLoopMock.changeHeight(720)
      })
      await page.waitForTimeout(80)
      await assertNoUpdateDepth(runtimeErrors, 'после изменения высоты viewport')

      expect(await page.evaluate(() => window.__telegramLoopMock.getCalls())).toBeGreaterThan(0)
    } finally {
      await context.close()
    }
  })
}
