import { chromium } from 'playwright'

const baseUrl = process.env.MXL_UI_LAB_BASE_URL || 'http://127.0.0.1:4174'
const sizes = [
  { width: 320, height: 568 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
]
const browser = await chromium.launch({ headless: true })

async function open(page, query = '') {
  await page.goto(`${baseUrl}/?ui_lab=library-programs&review=1${query}`, { waitUntil: 'networkidle' })
}

try {
  for (const viewport of sizes) {
    const page = await browser.newPage({ viewport })
    await open(page)
    if (await page.locator('.mx-ui-lab__header').count()) throw new Error(`${viewport.width}: UI Lab header is visible in review mode`)
    if (await page.locator('.mx-library-programs__device').evaluate(element => getComputedStyle(element).borderWidth !== '0px')) throw new Error(`${viewport.width}: review device frame is visible`)
    if (!(await page.getByRole('heading', { name: 'Программы', exact: true }).isVisible())) throw new Error(`${viewport.width}: Programs heading missing`)
    const featured = page.locator('.mx-library-programs__featured')
    if (!(await featured.isVisible())) throw new Error(`${viewport.width}: featured programme card missing`)
    if (await page.getByText('790 ₽', { exact: false }).count()) throw new Error(`${viewport.width}: price should be hidden on landing card`)
    const navigationLabels = await page.locator('.mx-library-programs__bottom span').allTextContents()
    if (navigationLabels.join(' · ') !== 'Сегодня · Шаги · Диалог · Библиотека · Прогресс') throw new Error(`${viewport.width}: bottom navigation labels changed`)
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error(`${viewport.width}: page horizontal overflow`)
    const smallTargets = await page.evaluate(() => [...document.querySelectorAll('button')].filter(button => { const rect = button.getBoundingClientRect(); return rect.width < 44 || rect.height < 44 }).length)
    if (smallTargets) throw new Error(`${viewport.width}: ${smallTargets} tap targets below 44px`)
    if (viewport.width === 320) {
      const overlap = await page.evaluate(() => {
        const card = document.querySelector('.mx-library-programs__featured').getBoundingClientRect()
        const nav = document.querySelector('.mx-library-programs__bottom').getBoundingClientRect()
        return { cardBottom: card.bottom, navTop: nav.top }
      })
      if (overlap.cardBottom > overlap.navTop) throw new Error('320: featured card overlaps bottom navigation')
    }
    await featured.click()
    if (!(await page.getByText('Полная программа · 790 ₽', { exact: true }).isVisible())) throw new Error(`${viewport.width}: price missing in detail`)
    await page.close()
    console.log(`PASS landing/detail ${viewport.width}x${viewport.height}`)
  }

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await open(page, '&state=completed')
  await page.evaluate(() => document.querySelector('.mx-library-programs__scroll').scrollTo(0, 0))
  if (!(await page.getByRole('button', { name: /Программа завершена/ }).isVisible())) throw new Error('completed state is not visible at scroll position 0')
  if (!(await page.getByText('Итоговая рефлексия доступна', { exact: true }).isVisible())) throw new Error('completed reflection affordance missing')
  if ((await page.evaluate(() => document.querySelector('.mx-library-programs__scroll').scrollTop)) !== 0) throw new Error('completed screenshot scroll position is not 0')
  await page.evaluate(() => {
    const scroll = document.querySelector('.mx-library-programs__scroll')
    scroll.scrollTo(0, scroll.scrollHeight)
  })
  const bottomOverlap = await page.evaluate(() => {
    const content = document.querySelector('.mx-library-programs__journal-row').getBoundingClientRect()
    const nav = document.querySelector('.mx-library-programs__bottom').getBoundingClientRect()
    return content.bottom > nav.top
  })
  if (bottomOverlap) throw new Error('390: bottom content overlaps navigation at scroll end')
  await open(page, '&state=ready')
  await open(page, '&screen=free-day')
  await page.getByText('День 1 из 7 · бесплатно').waitFor()
  if (!(await page.getByText('В этой демонстрации ответ не сохраняется.', { exact: true }).isVisible())) throw new Error('free-day demo copy missing')
  await page.getByRole('button', { name: 'Сохранить и вернуться к программе' }).click()
  await open(page, '&screen=fake-door')
  const submit = page.getByRole('button', { name: 'Отправить ответ' })
  if (!(await submit.isDisabled())) throw new Error('fake-door submit should be disabled before selection')
  await page.getByRole('button', { name: 'Собрать спокойный план' }).click()
  if ((await page.getByRole('button', { name: 'Собрать спокойный план' }).getAttribute('aria-pressed')) !== 'true') throw new Error('fake-door selection missing')
  if (await submit.isDisabled()) throw new Error('fake-door submit should be enabled after selection')
  await page.getByRole('button', { name: 'Отправить ответ' }).click()
  await page.getByRole('heading', { name: 'Спасибо — теперь понятнее, чего ты ждёшь от программы' }).waitFor()
  if (!(await page.getByText('Это демонстрация сценария. Ответ пока никуда не отправляется.', { exact: true }).isVisible())) throw new Error('fake-door confirmation demo copy missing')
  await page.getByRole('button', { name: 'Вернуться в Библиотеку' }).click()
  await page.getByRole('button', { name: 'Как начать с одного шага' }).click()
  if (!(await page.getByText('Прочитано', { exact: false }).isVisible())) throw new Error('article read state missing')
  await page.close()
  console.log('PASS states 390x844')
} finally {
  await browser.close()
}
