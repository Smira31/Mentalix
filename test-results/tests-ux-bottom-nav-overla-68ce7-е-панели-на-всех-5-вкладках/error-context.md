# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/ux/bottom-nav-overlap.spec.mjs >> нижняя панель не закрывает конец вкладок (chromium) >> 393: последний элемент выше панели на всех 5 вкладках
- Location: tests/ux/bottom-nav-overlap.spec.mjs:57:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/?demo=1
Call log:
  - navigating to "http://127.0.0.1:4173/?demo=1", waiting until "load"

```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test'
  2   |
  3   | // fix/bottom-nav-overlap: на каждой вкладке после прокрутки до конца нижний край
  4   | // последнего элемента выше верхнего края нижней панели. Баг был на iPhone
  5   | // (WebKit), поэтому проверяем и Chromium, и WebKit на 393 и 440.
  6   |
  7   | const baseURL = 'http://127.0.0.1:4173'
  8   | const TABS = ['Сегодня', 'Шаги', 'Диалог', 'Библиотека', 'Прогресс']
  9   | const VIEWPORTS = [
  10  |   { width: 393, height: 852 },
  11  |   { width: 440, height: 956 },
  12  | ]
  13  |
  14  | async function measure(page) {
  15  |   return page.evaluate(async () => {
  16  |     const root = document.querySelector('.mx-app-scroll-root')
  17  |     root.scrollTop = root.scrollHeight
  18  |     window.scrollTo(0, document.documentElement.scrollHeight)
  19  |     await new Promise(r => setTimeout(r, 400))
  20  |     root.scrollTop = root.scrollHeight
  21  |     await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
  22  |
  23  |     const panel = document.querySelector('.mx-bottom-nav > div').getBoundingClientRect()
  24  |     const content = document.querySelector('.mx-scroll-content')
  25  |     const vw = window.innerWidth
  26  |     // Полноэкранные подложки/обёртки (фон «Диалога» и т.п.) — не «последний элемент»:
  27  |     // считаем только то, что ниже их — реальное содержимое.
  28  |     const maxH = window.innerHeight * 0.6
  29  |     const inFixed = el => {
  30  |       for (let n = el; n && n !== content; n = n.parentElement) {
  31  |         const pos = getComputedStyle(n).position
  32  |         if (pos === 'fixed' || pos === 'sticky') return true
  33  |       }
  34  |       return false
  35  |     }
  36  |     let bottom = -Infinity
  37  |     let last = ''
  38  |     for (const el of content.querySelectorAll('*')) {
  39  |       const r = el.getBoundingClientRect()
  40  |       if (r.width < 1 || r.height < 1 || r.height > maxH) continue
  41  |       if (r.right <= 0 || r.left >= vw) continue
  42  |       const cs = getComputedStyle(el)
  43  |       if (cs.visibility === 'hidden' || cs.opacity === '0') continue
  44  |       if (inFixed(el)) continue
  45  |       if (r.bottom > bottom) {
  46  |         bottom = r.bottom
  47  |         last = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '')
  48  |       }
  49  |     }
  50  |     return { lastBottom: bottom, panelTop: panel.top, last }
  51  |   })
  52  | }
  53  |
  54  | for (const browserName of ['chromium', 'webkit']) {
  55  |   test.describe(`нижняя панель не закрывает конец вкладок (${browserName})`, () => {
  56  |     for (const viewport of VIEWPORTS) {
  57  |       test(`${viewport.width}: последний элемент выше панели на всех 5 вкладках`, async ({ playwright }) => {
  58  |         const browser = await playwright[browserName].launch()
  59  |         const context = await browser.newContext({
  60  |           baseURL,
  61  |           viewport,
  62  |           ...(browserName === 'webkit' ? {} : { isMobile: true }),
  63  |           hasTouch: true,
  64  |           colorScheme: 'dark',
  65  |           reducedMotion: 'reduce',
  66  |           serviceWorkers: 'block',
  67  |         })
  68  |         await context.route('**/api/**', route =>
  69  |           route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  70  |         )
  71  |         const page = await context.newPage()
> 72  |         await page.goto('/?demo=1')
      |                    ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/?demo=1
  73  |
  74  |         for (const label of TABS) {
  75  |           // При прокрутке панель уезжает вниз — возвращаем прокрутив к верху.
  76  |           if ((await page.locator('.mx-bottom-nav nav').getAttribute('aria-hidden')) === 'true') {
  77  |             await page.evaluate(() => {
  78  |               const root = document.querySelector('.mx-app-scroll-root')
  79  |               if (root) {
  80  |                 root.scrollTop = 0
  81  |                 root.dispatchEvent(new Event('scroll', { bubbles: true }))
  82  |               }
  83  |             })
  84  |             await page.waitForTimeout(300)
  85  |           }
  86  |           const button = page.locator(`.mx-bottom-nav nav button[aria-label="${label}"]`)
  87  |           await expect(button).toBeVisible({ timeout: 15_000 })
  88  |           await button.click()
  89  |           await expect(button).toHaveAttribute('aria-current', 'page')
  90  |           await page.waitForTimeout(600)
  91  |
  92  |           const { lastBottom, panelTop, last } = await measure(page)
  93  |           expect(
  94  |             lastBottom,
  95  |             `${label} @ ${viewport.width}: последний элемент ${last} (${Math.round(lastBottom)}) заходит под панель (${Math.round(panelTop)})`,
  96  |           ).toBeLessThanOrEqual(panelTop)
  97  |         }
  98  |
  99  |         await context.close()
  100 |         await browser.close()
  101 |       })
  102 |     }
  103 |   })
  104 | }
  105 |
```
