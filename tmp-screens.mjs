import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
const OUT = '/app/docs/previews'
const VIEWPORTS = [
  { w: 393, h: 852, label: '393' },
  { w: 440, h: 956, label: '440' },
]

const SCREENS = [
  { name: 'fix-practices', path: '/?demo=1&tab=practices', desc: 'Твои практики' },
  { name: 'fix-steps', path: '/?demo=1&tab=steps', desc: 'Шаги карточки' },
  { name: 'fix-library-recommended', path: '/?demo=1&tab=practices', desc: 'Библиотека Рекомендуем', action: 'library' },
  { name: 'fix-journal-intro', path: '/?demo=1&tab=journal', desc: 'Журнал начало', action: 'journal' },
]

const browser = await chromium.launch()

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
  
  for (const screen of SCREENS) {
    try {
      await page.goto(BASE + screen.path, { waitUntil: 'networkidle', timeout: 15000 })
      await page.waitForTimeout(1500)
      
      if (screen.action === 'library') {
        const settingsBtn = page.getByTestId('pinned-practices-manage')
        if (await settingsBtn.isVisible()) {
          await settingsBtn.click()
          await page.waitForTimeout(800)
          const libBtn = page.getByText('Добавить из библиотеки')
          if (await libBtn.isVisible()) {
            await libBtn.click()
            await page.waitForTimeout(1000)
          }
        }
      } else if (screen.action === 'journal') {
        const journalBtn = page.locator('[data-testid*="journal"], button:has-text("Дневник"), button:has-text("Журнал")').first()
        if (await journalBtn.isVisible()) {
          await journalBtn.click()
          await page.waitForTimeout(1500)
        }
      }
      
      const filename = `${OUT}/${screen.name}-${vp.label}.png`
      await page.screenshot({ path: filename, fullPage: false })
      console.log(`Saved: ${filename} (${screen.desc} @ ${vp.label})`)
    } catch (e) {
      console.log(`SKIP: ${screen.name}-${vp.label}: ${e.message.slice(0, 100)}`)
    }
  }
  await page.close()
}

await browser.close()
console.log('Done')
