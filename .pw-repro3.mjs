import { webkit, devices } from 'playwright'
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
const b = await webkit.launch()
const ctx = await b.newContext({ ...devices['iPhone 15 Pro'], colorScheme:'dark', serviceWorkers:'block' })
const pg = await ctx.newPage()
const errs = []
pg.on('console', m => { if (['error','warning'].includes(m.type())) errs.push(m.type()+': '+m.text().slice(0,400)) })
pg.on('pageerror', e => errs.push('PAGEERROR '+e.message.slice(0,300)))
await installTelegramMock(pg); await mockApi(pg)
await pg.goto((process.env.BASE||'http://127.0.0.1:3000/') + (process.argv[2]||''))
await pg.getByText('Мысль дня').first().waitFor({timeout: 30000})
const hang = (p)=>Promise.race([p, new Promise((_,j)=>setTimeout(()=>j(new Error('HUNG')),5000))])
console.log('calls before', await pg.evaluate(()=>window.__telegramLoopMock.getCalls()))
try {
await hang(pg.getByText('Мысль дня').first().click())
await new Promise(r=>setTimeout(r,4000))
console.log('calls after', await hang(pg.evaluate(()=>window.__telegramLoopMock.getCalls())))
await new Promise(r=>setTimeout(r,1000))
console.log('calls after+1s', await hang(pg.evaluate(()=>window.__telegramLoopMock.getCalls())))
console.log('surface', await hang(pg.locator('.mx-fullscreen-surface').count()))
console.log((await hang(pg.locator('body').innerText())).slice(0,200).replace(/\n+/g,' | '))
} catch(e) { console.log('ERR', e.message) }
console.log('ERRS', JSON.stringify(errs.slice(0,15), null, 1), errs.length)
await b.close(); process.exit(0)
