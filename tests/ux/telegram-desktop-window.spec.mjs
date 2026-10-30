import { expect, test } from '@playwright/test'

/*
 * Окно на компьютере в Telegram (Timeweb-задача «окно на компьютере»).
 *
 * На компьютере (tdesktop, macos, weba, webk, unknown) Mini App должен вести
 * себя как обычное мини-приложение: только ready() + expand(), без
 * requestFullscreen и без собственной рамки-телефона — приложение занимает
 * окно Telegram. На iPhone/Android fullscreen запрашивается как раньше.
 *
 * Telegram SDK строит WebApp из hash-параметров запуска (tgWebAppData,
 * tgWebAppPlatform), поэтому сценарий открывается адресом с этим hash;
 * исходящие события перехватывает TelegramWebviewProxy.
 */

function telegramUrl(platform) {
  const initData = new URLSearchParams({
    query_id: 'AAH-tw-window',
    user: JSON.stringify({ id: 900001, first_name: 'Timeweb' }),
    auth_date: '1793000000',
    hash: 'test-hash',
  }).toString()

  const hash = new URLSearchParams({
    tgWebAppData: initData,
    tgWebAppVersion: '8.0',
    tgWebAppPlatform: platform,
  }).toString()

  return `/#${hash}`
}

async function openTelegram(browser, { platform, viewport, mobile = false }) {
  const context = await browser.newContext({
    viewport,
    isMobile: mobile,
    hasTouch: mobile,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })

  await context.addInitScript(() => {
    window.__tgPosts = []
    window.TelegramWebviewProxy = {
      postEvent(type) {
        window.__tgPosts.push(type)
      },
    }
    // Онбординг пройден: проверяем окно приложения, а не онбординг.
    localStorage.setItem('mx-onboarded-v2', '1')
  })

  const page = await context.newPage()
  await page.goto(telegramUrl(platform))
  await expect(page.locator('.mx-app-shell')).toBeVisible({ timeout: 20_000 })

  return { context, page }
}

test.describe('окно на компьютере в Telegram', () => {
  test('Telegram Desktop: без fullscreen и без собственной рамки, приложение занимает окно', async ({
    browser,
  }) => {
    const { context, page } = await openTelegram(browser, {
      platform: 'tdesktop',
      viewport: { width: 1280, height: 800 },
    })

    const posts = await page.evaluate(() => window.__tgPosts)
    expect(posts).toContain('web_app_expand')
    expect(posts).not.toContain('web_app_request_fullscreen')

    // Своя рамка-телефон в Telegram Desktop не рисуется.
    await expect(page.locator('.mx-preview-stage')).toHaveCount(0)

    // Приложение заполняет окно Telegram.
    const box = await page.locator('.mx-app-shell').boundingBox()
    expect(box.width).toBeGreaterThan(1270)
    expect(box.height).toBeGreaterThan(790)

    await context.close()
  })

  test('iPhone в Telegram: fullscreen по-прежнему запрашивается', async ({ browser }) => {
    const { context, page } = await openTelegram(browser, {
      platform: 'ios',
      viewport: { width: 393, height: 852 },
      mobile: true,
    })

    const posts = await page.evaluate(() => window.__tgPosts)
    expect(posts).toContain('web_app_expand')
    expect(posts).toContain('web_app_request_fullscreen')
    await expect(page.locator('.mx-preview-stage')).toHaveCount(0)

    await context.close()
  })
})
