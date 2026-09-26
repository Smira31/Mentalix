# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/ux/profile-stoic.spec.mjs >> Профиль Stoic — 440 px >> кнопка профиля 43 px, 21 px справа от края фрейма, центр на линии огонька
- Location: tests/ux/profile-stoic.spec.mjs:11:5

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  1   | // Общие помощники UX-спеков профиля: демо-пользователь, моки API,
  2   | // открытие web- и Telegram-контекстов. Вынесены из profile-stoic.spec.mjs,
  3   | // чтобы спеки профиля переиспользовали одну и ту же среду.
  4   | 
  5   | import { expect } from '@playwright/test'
  6   | 
  7   | export const VIEWPORTS = [
  8   |   { name: '393', width: 393, height: 852 },
  9   |   { name: '440', width: 440, height: 956 },
  10  | ]
  11  | 
  12  | export const TEST_USER = { id: 900618, first_name: 'Профиль', username: 'profile_618' }
  13  | 
  14  | export function json(body, status = 200) {
  15  |   return { status, contentType: 'application/json', body: JSON.stringify(body) }
  16  | }
  17  | 
  18  | export async function mockApi(context) {
  19  |   await context.route('**/api/**', route => {
  20  |     const { pathname } = new URL(route.request().url())
  21  |     if (route.request().method() !== 'GET') return route.fulfill(json({ ok: true, user: TEST_USER }))
  22  |     if (pathname === '/api/profile') return route.fulfill(json(TEST_USER))
  23  |     if (pathname === '/api/profile/settings') return route.fulfill(json({ review_hour: 19 }))
  24  |     if (pathname === '/api/checkin/today') return route.fulfill(json(null))
  25  |     if (pathname === '/api/subscription') return route.fulfill(json({ tier: 'base' }))
  26  |     if (pathname === '/api/analytics/pulse') return route.fulfill(json({ active_today: 0 }))
  27  |     if (/\/api\/(rituals|ascezas|themes|articles|checkin\/history)$/.test(pathname)) {
  28  |       return route.fulfill(json([]))
  29  |     }
  30  |     return route.fulfill(json({}))
  31  |   })
  32  | }
  33  | 
  34  | export async function openWeb(browser, baseURL, viewport) {
  35  |   const context = await browser.newContext({
  36  |     baseURL,
  37  |     viewport: { width: viewport.width, height: viewport.height },
  38  |     colorScheme: 'dark',
  39  |     reducedMotion: 'reduce',
  40  |     serviceWorkers: 'block',
  41  |   })
  42  |   await context.addInitScript(user => {
  43  |     localStorage.clear()
  44  |     sessionStorage.clear()
  45  |     localStorage.setItem('mentalix_web_user', JSON.stringify(user))
  46  |     localStorage.setItem('mx-onboarded-v2', '1')
  47  |     localStorage.setItem('mx-app-lock-enabled', '0')
  48  |   }, TEST_USER)
  49  |   await mockApi(context)
  50  |   const page = await context.newPage()
> 51  |   await page.goto('/')
      |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  52  |   await expect(page.getByTestId('today-profile-button')).toBeVisible()
  53  |   return { context, page }
  54  | }
  55  | 
  56  | export async function openTelegram(browser, baseURL, viewport) {
  57  |   const context = await browser.newContext({
  58  |     baseURL,
  59  |     viewport: { width: viewport.width, height: viewport.height },
  60  |     colorScheme: 'dark',
  61  |     reducedMotion: 'reduce',
  62  |     serviceWorkers: 'block',
  63  |   })
  64  |   await context.addInitScript(user => {
  65  |     localStorage.clear()
  66  |     sessionStorage.clear()
  67  |     localStorage.setItem('mx-onboarded-v2', '1')
  68  |     localStorage.setItem('mx-app-lock-enabled', '0')
  69  |     const handlers = new Set()
  70  |     const noop = () => {}
  71  |     const backButton = {
  72  |       isVisible: false,
  73  |       show() {
  74  |         this.isVisible = true
  75  |       },
  76  |       hide() {
  77  |         this.isVisible = false
  78  |       },
  79  |       onClick: handler => handlers.add(handler),
  80  |       offClick: handler => handlers.delete(handler),
  81  |     }
  82  |     window.__telegramBackClick = () => [...handlers].at(-1)?.()
  83  |     const mainButton = {
  84  |       setParams: noop,
  85  |       onClick: noop,
  86  |       offClick: noop,
  87  |       show: noop,
  88  |       hide: noop,
  89  |       enable: noop,
  90  |       disable: noop,
  91  |       showProgress: noop,
  92  |       hideProgress: noop,
  93  |     }
  94  |     const webApp = {
  95  |       initData: `query_id=profile-618&user=${encodeURIComponent(JSON.stringify({ id: user.id }))}`,
  96  |       initDataUnsafe: { user },
  97  |       version: '8.0',
  98  |       platform: 'ios',
  99  |       colorScheme: 'dark',
  100 |       isFullscreen: true,
  101 |       isVersionAtLeast: ver => '8.0' >= ver,
  102 |       BackButton: backButton,
  103 |       MainButton: mainButton,
  104 |       SecondaryButton: mainButton,
  105 |       HapticFeedback: { impactOccurred: noop, notificationOccurred: noop, selectionChanged: noop },
  106 |       onEvent: noop,
  107 |       offEvent: noop,
  108 |       ready: noop,
  109 |       expand: noop,
  110 |       requestFullscreen: noop,
  111 |       lockVerticalSwipes: noop,
  112 |       setHeaderColor: noop,
  113 |       setBackgroundColor: noop,
  114 |       setBottomBarColor: noop,
  115 |     }
  116 |     window.Telegram = {}
  117 |     Object.defineProperty(window.Telegram, 'WebApp', {
  118 |       configurable: true,
  119 |       get: () => webApp,
  120 |       set: noop,
  121 |     })
  122 |   }, TEST_USER)
  123 |   await mockApi(context)
  124 |   const page = await context.newPage()
  125 |   await page.goto('/')
  126 |   await expect(page.getByTestId('today-profile-button')).toBeVisible()
  127 |   return { context, page }
  128 | }
  129 | 
  130 | export function centerY(box) {
  131 |   return box.y + box.height / 2
  132 | }
  133 | 
```