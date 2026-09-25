import { expect, test } from '@playwright/test'

// fix/bottom-nav-overlap: на каждой вкладке после прокрутки до конца нижний край
// последнего элемента выше верхнего края нижней панели. Баг был на iPhone
// (WebKit), поэтому проверяем и Chromium, и WebKit на 393 и 440.

const baseURL = 'http://127.0.0.1:4173'
const TABS = ['Сегодня', 'Шаги', 'Диалог', 'Библиотека', 'Прогресс']
const VIEWPORTS = [
  { width: 393, height: 852 },
  { width: 440, height: 956 },
]

async function measure(page) {
  return page.evaluate(async () => {
    const root = document.querySelector('.mx-app-scroll-root')
    root.scrollTop = root.scrollHeight
    window.scrollTo(0, document.documentElement.scrollHeight)
    await new Promise(r => setTimeout(r, 400))
    root.scrollTop = root.scrollHeight
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

    const panel = document.querySelector('.mx-bottom-nav > div').getBoundingClientRect()
    const content = document.querySelector('.mx-scroll-content')
    const vw = window.innerWidth
    // Полноэкранные подложки/обёртки (фон «Диалога» и т.п.) — не «последний элемент»:
    // считаем только то, что ниже их — реальное содержимое.
    const maxH = window.innerHeight * 0.6
    const inFixed = el => {
      for (let n = el; n && n !== content; n = n.parentElement) {
        const pos = getComputedStyle(n).position
        if (pos === 'fixed' || pos === 'sticky') return true
      }
      return false
    }
    let bottom = -Infinity
    let last = ''
    for (const el of content.querySelectorAll('*')) {
      const r = el.getBoundingClientRect()
      if (r.width < 1 || r.height < 1 || r.height > maxH) continue
      if (r.right <= 0 || r.left >= vw) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || cs.opacity === '0') continue
      if (inFixed(el)) continue
      if (r.bottom > bottom) {
        bottom = r.bottom
        last = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '')
      }
    }
    return { lastBottom: bottom, panelTop: panel.top, last }
  })
}

for (const browserName of ['chromium', 'webkit']) {
  test.describe(`нижняя панель не закрывает конец вкладок (${browserName})`, () => {
    for (const viewport of VIEWPORTS) {
      test(`${viewport.width}: последний элемент выше панели на всех 5 вкладках`, async ({ playwright }) => {
        const browser = await playwright[browserName].launch()
        const context = await browser.newContext({
          baseURL,
          viewport,
          ...(browserName === 'webkit' ? {} : { isMobile: true }),
          hasTouch: true,
          colorScheme: 'dark',
          reducedMotion: 'reduce',
          serviceWorkers: 'block',
        })
        await context.route('**/api/**', route =>
          route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
        )
        const page = await context.newPage()
        await page.goto('/?demo=1')

        for (const label of TABS) {
          // При прокрутке демо-панель сворачивается в кружок — разворачиваем перед сменой вкладки.
          const expand = page.locator('.mx-bottom-nav button[aria-label="Открыть навигацию"]')
          if ((await page.locator('.mx-bottom-nav nav').getAttribute('aria-hidden')) === 'true') {
            await expand.click()
          }
          const button = page.locator(`.mx-bottom-nav nav button[aria-label="${label}"]`)
          await expect(button).toBeVisible({ timeout: 15_000 })
          await button.click()
          await expect(button).toHaveAttribute('aria-current', 'page')
          await page.waitForTimeout(600)

          const { lastBottom, panelTop, last } = await measure(page)
          expect(
            lastBottom,
            `${label} @ ${viewport.width}: последний элемент ${last} (${Math.round(lastBottom)}) заходит под панель (${Math.round(panelTop)})`,
          ).toBeLessThanOrEqual(panelTop)
        }

        await context.close()
        await browser.close()
      })
    }
  })
}
