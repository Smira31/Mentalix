import { expect, test } from '@playwright/test'

const P0_VIEWPORTS = [
  { name: 'iPhone 16 Pro', width: 402, height: 874 },
  { name: 'iPhone 16 Pro Max', width: 430, height: 932 },
]

const DEMO_URL =
  process.env.MENTALIX_TELEGRAM_P0_URL ||
  'http://127.0.0.1:5173/?demo=1&toolbar=1&device=pro-max&tab=today'

async function openTelegramDemo(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: 'dark',
    reducedMotion: 'no-preference',
    serviceWorkers: 'block',
  })

  await context.addInitScript(() => {
    const handlers = new Set()
    const button = {
      isVisible: false,
      show() {
        this.isVisible = true
      },
      hide() {
        this.isVisible = false
      },
      onClick(handler) {
        handlers.add(handler)
      },
      offClick(handler) {
        handlers.delete(handler)
      },
    }

    window.__telegramBackClick = () => [...handlers].at(-1)?.()
    window.__telegramBackState = button
    const webApp = {
      initData: 'query_id=p0-test&user=%7B%22id%22%3A900001%7D',
      initDataUnsafe: { user: { id: 900001, first_name: 'P0' } },
      version: '8.0',
      platform: 'ios',
      colorScheme: 'dark',
      isFullscreen: true,
      BackButton: button,
      MainButton: {
        setParams() {},
        onClick() {},
        offClick() {},
        show() {},
        hide() {},
        enable() {},
        disable() {},
        showProgress() {},
        hideProgress() {},
      },
      SecondaryButton: {
        setParams() {},
        onClick() {},
        offClick() {},
        show() {},
        hide() {},
      },
      onEvent() {},
      offEvent() {},
      ready() {},
      expand() {},
      requestFullscreen() {},
      lockOrientation() {},
      disableVerticalSwipes() {},
      HapticFeedback: { impactOccurred() {}, notificationOccurred() {} },
    }

    window.Telegram = { WebApp: webApp }
    Object.defineProperty(window.Telegram, 'WebApp', {
      configurable: true,
      get() {
        return webApp
      },
      set() {},
    })
  })

  const page = await context.newPage()
  await page.goto(DEMO_URL, { waitUntil: 'networkidle' })
  await expect(page.getByRole('button', { name: 'Диалог' })).toBeVisible()
  return { context, page }
}

async function nativeBack(page) {
  await page.evaluate(() => window.__telegramBackClick?.())
}

async function openMentorConversation(page) {
  await page.getByRole('button', { name: 'Диалог' }).click()
  await expect(page.getByRole('heading', { name: /О чём хочешь/ })).toBeVisible()
  await page.getByTestId('mentor-persona-card').filter({ hasText: 'Наставник' }).click()
  await page.getByRole('button', { name: 'Начать разговор: Наставник' }).click()
  await expect(page.getByRole('heading', { name: 'Наставник' })).toBeVisible()
}

async function openSeries(page) {
  await page.getByRole('button', { name: /Мой путь/ }).click()
  await expect(page.locator('.mx-path-surface')).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Значки' })).toBeVisible()
}

for (const viewport of P0_VIEWPORTS) {
  test.describe(`Telegram P0 — ${viewport.name}`, () => {
    test('Mentor conversation → native BackButton returns to picker', async ({ browser }) => {
      const { context, page } = await openTelegramDemo(browser, viewport)
      await openMentorConversation(page)
      await expect.poll(() => page.evaluate(() => window.__telegramBackState.isVisible)).toBe(true)
      await nativeBack(page)
      await expect(page.getByRole('heading', { name: /О чём хочешь/ })).toBeVisible()
      await context.close()
    })

    test('Series → native BackButton returns to Today', async ({ browser }) => {
      const { context, page } = await openTelegramDemo(browser, viewport)
      await openSeries(page)
      await expect.poll(() => page.evaluate(() => window.__telegramBackState.isVisible)).toBe(true)
      await nativeBack(page)
      await expect(page.getByRole('button', { name: /Мой путь/ })).toBeVisible()
      await context.close()
    })

    test('native BackButton remains safe during Journal keyboard resize', async ({ browser }) => {
      const { context, page } = await openTelegramDemo(browser, viewport)
      await page.getByRole('button', { name: 'Шаги' }).click()
      await page.getByRole('button', { name: 'Открыть журнал' }).click()
      await page.getByRole('button', { name: 'Начать' }).click()

      const editor = page.locator('textarea').first()
      await editor.fill('P0 keyboard draft')
      await editor.focus()
      await page.setViewportSize({ width: viewport.width, height: Math.round(viewport.height * 0.58) })
      await page.waitForTimeout(120)

      const geometry = await page.evaluate(() => {
        const shell = document.querySelector('.mx-practice-flow')
        const dock = document.querySelector('.practice-writing-canvas__dock')
        return {
          shellBottom: shell?.getBoundingClientRect().bottom,
          dockBottom: dock?.getBoundingClientRect().bottom,
          viewportHeight: window.innerHeight,
          bodyOverflow: getComputedStyle(document.body).overflow,
          focused: document.activeElement === document.querySelector('textarea'),
        }
      })

      expect(geometry.shellBottom).toBeLessThanOrEqual(geometry.viewportHeight + 1)
      expect(geometry.dockBottom).toBeLessThanOrEqual(geometry.viewportHeight + 1)
      expect(geometry.bodyOverflow).toBe('hidden')
      expect(geometry.focused).toBe(true)
      await nativeBack(page)
      await context.close()
    })

    test('Profile → Settings → Today is reversible with native BackButton', async ({ browser }) => {
      const { context, page } = await openTelegramDemo(browser, viewport)
      await page.getByTestId('today-profile-button').click()
      await expect(page.getByTestId('profile-screen')).toBeVisible()
      await page.getByTestId('profile-row-prefs').click()
      await expect(page.getByRole('heading', { name: 'настройки.' })).toBeVisible()
      await nativeBack(page)
      await expect(page.getByRole('heading', { name: 'твой профиль.' })).toBeVisible()
      await nativeBack(page)
      await expect(page.getByRole('heading', { name: 'Сегодня' })).toBeVisible()
      await context.close()
    })

    test('user-scoped Journal keys do not cross-contaminate drafts', async ({ browser }) => {
      const { context, page } = await openTelegramDemo(browser, viewport)
      const result = await page.evaluate(() => {
        const store = value => ({
          version: 2,
          entries: {
            '2026-09-14': {
              date: '2026-09-14',
              version: 2,
              cycle: {
                idea: { text: value, status: 'draft', updatedAt: new Date().toISOString() },
                action: { text: '', status: 'draft', updatedAt: null },
                analysis: { text: '', status: 'draft', updatedAt: null },
                newStep: { text: '', status: 'draft', updatedAt: null },
              },
              freeWrites: [],
              updatedAt: new Date().toISOString(),
            },
          },
        })
        localStorage.setItem('mx-journal-v2:user:900001', JSON.stringify(store('user-a')))
        localStorage.setItem('mx-journal-v2:user:900002', JSON.stringify(store('user-b')))
        return {
          a: JSON.parse(localStorage.getItem('mx-journal-v2:user:900001')).entries['2026-09-14'].cycle.idea.text,
          b: JSON.parse(localStorage.getItem('mx-journal-v2:user:900002')).entries['2026-09-14'].cycle.idea.text,
          legacy: localStorage.getItem('mx-journal-v2'),
        }
      })

      expect(result.a).toBe('user-a')
      expect(result.b).toBe('user-b')
      expect(result.legacy).toBeNull()
      await context.close()
    })
  })
}
