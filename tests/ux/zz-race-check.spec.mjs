import { expect, test, devices } from '@playwright/test'

test('race: back pressed right after DOM shows profile root', async ({ browser }) => {
  const context = await browser.newContext({ ...devices['iPhone 15 Pro'], colorScheme: 'dark', reducedMotion: 'reduce', serviceWorkers: 'block' })
  const page = await context.newPage()
  const init = `(${function () {
    const listeners = new Map(); const backHandlers = new Set(); let calls = 0
    const emit = e => { for (const h of [...(listeners.get(e) || [])]) h({ isStateStable: true, isFullscreen: true }) }
    const notify = () => { calls++; emit('viewportChanged'); emit('safeAreaChanged'); emit('contentSafeAreaChanged') }
    const bb = { isVisible: false, show: notify, hide: notify, onClick: h => { backHandlers.add(h); notify() }, offClick: h => { backHandlers.delete(h); notify() } }
    const tg = { initData: 'query_id=loop-test&user=%7B%22id%22%3A900001%7D&hash=test', initDataUnsafe: { user: { id: 900001, first_name: 'Loop Test' } }, version: '8.0', platform: 'ios', colorScheme: 'dark', isFullscreen: true, isVersionAtLeast: () => true, viewportHeight: 844, viewportStableHeight: 844, BackButton: bb, MainButton: { show: notify, hide: notify, onClick: notify, offClick: notify, setParams: notify, setText: notify, enable: notify, disable: notify, showProgress: notify, hideProgress: notify }, HapticFeedback: { impactOccurred: notify, notificationOccurred: notify }, ready: notify, expand: notify, disableVerticalSwipes: notify, setHeaderColor: notify, setBackgroundColor: notify, setBottomBarColor: notify, requestFullscreen() { return Promise.resolve() }, onEvent(e, h) { const s = listeners.get(e) || new Set(); s.add(h); listeners.set(e, s) }, offEvent(e, h) { listeners.get(e)?.delete(h) }, lockOrientation: notify }
    window.__telegramLoopMock = { pressBack: () => [...backHandlers].at(-1)?.() }
  }.toString()})()`
  await page.addInitScript(init)
  await page.route('**/api/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
  await page.goto('/?demo=1', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('button', { name: 'Сегодня', exact: true })).toBeVisible({ timeout: 15000 })
  await page.getByTestId('today-profile-button').click()
  await expect(page.getByTestId('profile-screen')).toBeVisible()
  await page.getByTestId('profile-row-prefs').click()
  await expect(page.getByRole('heading', { name: 'настройки.' })).toBeVisible()

  // pressBack #1 — закрывает вложенный экран «настройки.»
  await page.evaluate(() => window.__telegramLoopMock.pressBack())
  // Ловим момент, когда корневой профиль уже в DOM (как expect в реальном тесте),
  // и сразу жмём второй системный «Назад».
  await page.waitForSelector('[data-testid="profile-screen"]', { state: 'attached' })
  await page.evaluate(() => window.__telegramLoopMock.pressBack())
  await page.waitForTimeout(400)

  const leftProfile = await page.evaluate(() => !document.querySelector('[data-testid="profile-screen"]'))
  console.log('LEFT PROFILE AFTER SECOND BACK:', leftProfile)
  expect(leftProfile, 'второй системный Назад должен закрыть профиль и вернуть на Сегодня').toBe(true)
})
