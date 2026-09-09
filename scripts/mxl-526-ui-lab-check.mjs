import { chromium } from 'playwright'

const baseUrl = process.env.MXL_UI_LAB_BASE_URL || 'http://127.0.0.1:5174'
const browser = await chromium.launch({ headless: true })
const viewports = [
  { width: 390, height: 844 },
  { width: 375, height: 812 },
  { width: 320, height: 568 },
]

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport })
    await page.goto(`${baseUrl}/?ui_lab=library`, { waitUntil: 'networkidle' })

    const device = page.locator('.mx-library-lab__device')
    const rail = page.locator('.mx-library-lab__rail')
    const workshops = page.getByRole('button', { name: 'Практикумы, скоро' })

    if (!(await device.isVisible())) throw new Error(`${viewport.width}: device is not visible`)
    if ((await page.locator('.mx-library-lab__feature-card').count()) !== 3) {
      throw new Error(`${viewport.width}: expected three featured materials`)
    }
    if (!(await workshops.isDisabled())) throw new Error(`${viewport.width}: workshops must be disabled`)

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    if (overflow) throw new Error(`${viewport.width}: page has horizontal overflow`)

    const railScroll = await rail.evaluate(element => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }))
    if (railScroll.scrollWidth <= railScroll.clientWidth) {
      throw new Error(`${viewport.width}: featured rail is not horizontally scrollable`)
    }

    if (viewport.width === 390) {
      const scroll = page.locator('.mx-library-lab__scroll')
      await page.getByRole('button', { name: 'Открыть Статьи' }).click()
      await page.getByRole('heading', { name: 'Статьи.' }).waitFor()
      const top = await scroll.evaluate(element => element.scrollTop)
      if (top !== 0) throw new Error(`detail did not reset scroll: ${top}`)

      await page.getByRole('button', { name: 'Назад' }).click()
      for (const label of ['Загрузка', 'Ошибка', 'Пусто', 'Web', 'Готово']) {
        await page.getByRole('button', { name: label, exact: true }).click()
      }
      await page.getByRole('button', { name: 'Открыть поиск' }).click()
      await page.getByRole('textbox', { name: 'Найти материал' }).fill('несуществующий материал')
      await page.getByText('Ничего не найдено').waitFor()
    }

    console.log(`PASS ${viewport.width}x${viewport.height}`)
    await page.close()
  }
} finally {
  await browser.close()
}
