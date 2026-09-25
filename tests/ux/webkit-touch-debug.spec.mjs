import { expect, test } from '@playwright/test'

test('debug: page.mouse touch events on mobile webkit', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('mx-onboarded-v2', '1')
    localStorage.setItem('mx-app-lock-enabled', '0')
  })
  
  await page.goto('/?demo=1&tab=library')
  await expect(page.getByText('библиотека.')).toBeVisible({ timeout: 15_000 })
  
  // Open programs catalog
  await page.getByRole('button', { name: 'Смотреть' }).first().click()
  await expect(page.getByText('программы.')).toBeVisible({ timeout: 5_000 })
  
  // Add temporary touch listener to log events
  await page.evaluate(() => {
    window.__touchLog = []
    const root = document.querySelector('[data-mentalix-app-root]')
    if (!root) { window.__touchLog.push('no app root'); return }
    
    ;['touchstart', 'touchmove', 'touchend'].forEach(type => {
      root.addEventListener(type, (e) => {
        const touch = e.touches[0] || e.changedTouches[0]
        window.__touchLog.push({
          type,
          clientX: touch?.clientX,
          clientY: touch?.clientY,
          hasCurrentTarget: Boolean(e.currentTarget),
        })
      }, { passive: false })
    })
    
    // Also check if getCurrentBackAction is accessible
    window.__touchLog.push({ note: 'listeners added' })
  })
  
  // Try page.mouse swipe from left edge
  const box = await page.locator('.mx-app-scroll-root').boundingBox()
  const startX = 0
  const startY = box.y + box.height / 2
  const distance = box.width * 0.5
  
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  for (let i = 1; i <= 12; i++) {
    const x = startX + (distance * i) / 12
    await page.mouse.move(x, startY)
  }
  await page.mouse.up()
  
  await page.waitForTimeout(1000)
  
  const log = await page.evaluate(() => window.__touchLog)
  console.log('TOUCH LOG:', JSON.stringify(log))
})
