import { expect, test } from '@playwright/test'

/*
 * Этап 0 «Голос»: скрытый экран «Лаборатория: голос».
 *
 * Проверяется то, что можно проверить без микрофона:
 *  1. скрытый вход — 7 быстрых нажатий по номеру версии в Профиле;
 *  2. без MediaRecorder экран показывает сообщение и не падает;
 *  3. без getUserMedia экран показывает сообщение и не падает.
 *
 * Реальная запись (getUserMedia → MediaRecorder → <audio>) — NOT RUN:
 * в CI нет микрофона, а iPhone/Android/Desktop в Telegram — ручной gate.
 *
 * Демо-режим (?demo=1) даёт пользователя без backend. Поиск — только
 * data-testid, без ожиданий по таймеру.
 */

const DEMO_URL = '/?demo=1&tab=today&frame=0'
const SHOTS = 'qa-evidence/voice-lab'

const VIEWPORTS = [
  { name: '393x852', width: 393, height: 852 },
  { name: '360x640', width: 360, height: 640 },
]

async function createContext(browser, viewport, mediaInit = '') {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })

  await context.addInitScript(init => {
    localStorage.setItem('mx-onboarded-v2', '1')
    localStorage.setItem('mx-app-lock-enabled', '0')
    if (init === 'no-recorder') {
      Object.defineProperty(window, 'MediaRecorder', {
        value: undefined,
        configurable: true,
        writable: true,
      })
    }
    if (init === 'no-getusermedia') {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        configurable: true,
      })
    }
  }, mediaInit)

  return context
}

async function openProfileVersion(page) {
  await expect(page.getByTestId('today-profile-button')).toBeVisible({ timeout: 15_000 })
  await page.getByTestId('today-profile-button').click()
  await expect(page.getByTestId('profile-screen')).toBeVisible()

  const version = page.getByTestId('profile-version')
  await version.scrollIntoViewIfNeeded()
  await expect(version).toBeVisible()
  return version
}

async function openVoiceLab(page) {
  await openProfileVersion(page)
  for (let tap = 0; tap < 7; tap += 1) {
    await page.getByTestId('profile-version').click()
  }
  await expect(page.getByTestId('voice-lab-screen')).toBeVisible()
}

for (const viewport of VIEWPORTS) {
  test(`скрытый вход: 7 нажатий по версии открывают лабораторию (${viewport.name})`, async ({
    browser,
  }) => {
    const context = await createContext(browser, viewport)
    const page = await context.newPage()
    await page.goto(DEMO_URL)

    const version = await openProfileVersion(page)

    // Шесть нажатий ещё ничего не открывают.
    for (let tap = 0; tap < 6; tap += 1) {
      await version.click()
    }
    await expect(page.getByTestId('voice-lab-screen')).toHaveCount(0)

    await page.getByTestId('profile-version').click()
    await expect(page.getByTestId('voice-lab-screen')).toBeVisible()
    await expect(page.getByTestId('voice-lab-status')).toBeVisible()

    // Экран помещается по ширине: ни горизонтальной прокрутки, ни вылезших узлов.
    const layout = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="voice-lab-screen"]')
      const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth
      const outside = [...root.querySelectorAll('*')].filter(
        node => node.getBoundingClientRect().right > window.innerWidth + 1
      ).length
      return { overflow, outside }
    })
    expect(layout.overflow).toBeLessThanOrEqual(0)
    expect(layout.outside).toBe(0)

    await page.screenshot({
      path: `${SHOTS}/${viewport.name}-voice-lab.png`,
      animations: 'disabled',
    })

    // «Назад» возвращает в профиль, экран закрывается.
    await page.getByTestId('voice-lab-back').click()
    await expect(page.getByTestId('voice-lab-screen')).toHaveCount(0)
    await expect(page.getByTestId('profile-screen')).toBeVisible()

    await context.close()
  })
}

test('без MediaRecorder: экран показывает сообщение и не падает', async ({ browser }) => {
  const context = await createContext(browser, VIEWPORTS[0], 'no-recorder')
  const page = await context.newPage()
  await page.goto(DEMO_URL)

  await openVoiceLab(page)

  await expect(page.getByTestId('voice-lab-unsupported')).toContainText('MediaRecorder')
  await expect(page.getByTestId('voice-lab-media-recorder')).toHaveText('нет')

  // Повторная попытка не роняет экран: ошибка понятна, экран на месте.
  await page.getByTestId('voice-lab-record').click()
  await expect(page.getByTestId('voice-lab-error')).toContainText('MediaRecorder')
  await expect(page.getByTestId('voice-lab-screen')).toBeVisible()

  await page.screenshot({
    path: `${SHOTS}/393x852-voice-lab-unsupported.png`,
    animations: 'disabled',
  })

  await context.close()
})

test('без getUserMedia: экран показывает сообщение и не падает', async ({ browser }) => {
  const context = await createContext(browser, VIEWPORTS[1], 'no-getusermedia')
  const page = await context.newPage()
  await page.goto(DEMO_URL)

  await openVoiceLab(page)

  await expect(page.getByTestId('voice-lab-unsupported')).toContainText('getUserMedia')
  await expect(page.getByTestId('voice-lab-getusermedia')).toHaveText('нет')

  await page.getByTestId('voice-lab-record').click()
  await expect(page.getByTestId('voice-lab-error')).toContainText('getUserMedia')
  await expect(page.getByTestId('voice-lab-screen')).toBeVisible()

  await context.close()
})
