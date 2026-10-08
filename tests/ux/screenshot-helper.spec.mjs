import { expect, test } from '@playwright/test'

const TEST_USER = { id: 900001, first_name: 'UX', username: 'local_ux_check' }

function jsonResponse(body, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) }
}

test('screenshot guest error screen', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 393, height: 852 },
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
  await page.goto('/')
  // Wait for the web auth screen to appear
  await expect(page.getByRole('heading', { name: 'Вход по email' })).toBeVisible({ timeout: 15000 })
  // Click guest button to trigger error
  await page.getByTestId('web-auth-guest-button').click()
  // Wait for error message
  await expect(page.getByText('Не удалось войти как гость. Попробуй ещё раз.')).toBeVisible({ timeout: 5000 })
  await page.screenshot({ path: '/tmp/guest-error-screen-393x852.png', fullPage: false })
  await context.close()
})
