import { chromium } from '@playwright/test'

function jsonResponse(body, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) }
}

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 393, height: 852 },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })
  await context.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await context.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/auth/guest') {
      return route.fulfill(jsonResponse({ error: 'unavailable' }, 503))
    }
    if (path === '/api/auth/session') {
      return route.fulfill(jsonResponse({ detail: 'unauthorized' }, 401))
    }
    return route.fulfill(jsonResponse({ error: 'not found' }, 404))
  })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:5173/')
  await page.getByRole('heading', { name: 'Вход по email' }).waitFor({ state: 'visible', timeout: 15000 })
  await page.getByTestId('web-auth-guest-button').click()
  await page.getByText('Не удалось войти как гость. Попробуй ещё раз.').waitFor({ state: 'visible', timeout: 5000 })
  await page.screenshot({ path: 'artifacts/guest-error-screen-393x852.png', fullPage: false })
  console.log('Screenshot saved to artifacts/guest-error-screen-393x852.png')
  await browser.close()
}

main().catch(err => { console.error(err); process.exit(1) })
