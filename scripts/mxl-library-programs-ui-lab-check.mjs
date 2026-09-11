import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const baseUrl = process.env.MXL_UI_LAB_BASE_URL || 'http://127.0.0.1:4174'
const sizes = [
  { width: 320, height: 568 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
]
const screenshotDir = process.env.MXL_UI_LAB_SCREENSHOT_DIR
const forbidden = /Открыть поиск|Статьи.*книж|Практики для размышления|Прояснить выбор.*4 вопроса, чтобы принять решение(?!.*Направленные записи)|Платная программа|Demo-концепт|цена уточняется|первый день бесплатно|790 ₽|Полная программа|Получить программу|Бесплатные статьи|Без оплаты|бесплатно|fake-door|0 из 3/i

async function open(page, query = '') {
  await page.goto(`${baseUrl}/?ui_lab=library-programs&review=1${query}`, { waitUntil: 'networkidle' })
}

function currentUrl(page) {
  return new URL(page.url())
}

async function assertUrl(page, screen = 'landing', values = {}) {
  const url = currentUrl(page)
  if (page.url().includes('[object')) throw new Error('URL contains [object Object]')
  if (url.searchParams.get('ui_lab') !== 'library-programs' || url.searchParams.get('review') !== '1') throw new Error(`unexpected UI Lab URL: ${page.url()}`)
  const actualScreen = url.searchParams.get('screen') || 'landing'
  if (actualScreen !== screen) throw new Error(`expected screen ${screen}, got ${actualScreen}`)
  Object.entries(values).forEach(([key, value]) => {
    if (url.searchParams.get(key) !== String(value)) throw new Error(`expected ${key}=${value}, got ${url.searchParams.get(key)}`)
  })
  if (screen === 'landing' && [...url.searchParams.keys()].some(key => ['screen', 'program', 'article', 'template', 'stage', 'step'].includes(key))) throw new Error(`landing URL retains state: ${page.url()}`)
}

async function assertNoOverflow(page, label) {
  if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error(`${label}: horizontal overflow`)
}

async function assertTargets(page, label) {
  const small = await page.evaluate(() => [...document.querySelectorAll('button, textarea')].filter(element => {
    const rect = element.getBoundingClientRect()
    return rect.width < 44 || rect.height < 44
  }).length)
  if (small) throw new Error(`${label}: ${small} interactive targets below 44px`)
}

async function assertLanding(page, width) {
  await assertUrl(page)
  if (await page.locator('.mx-ui-lab__header').count()) throw new Error(`${width}: UI Lab header visible in review mode`)
  if ((await page.locator('.mx-library-programs__bottom').count()) !== 1) throw new Error(`${width}: landing bottom navigation missing`)
  const text = await page.locator('.mx-library-programs__landing').innerText()
  if (!text.includes('Направленные записи')) throw new Error(`${width}: guided journal entry missing`)
  if (text.includes('Практики для размышления') || text.includes('Прояснить выбор\n4 вопроса')) throw new Error(`${width}: obsolete journal surface remains`)
  if (await page.getByRole('button', { name: 'Открыть поиск' }).count()) throw new Error(`${width}: search remains`)
  if (await page.locator('.mx-library-programs__section-title svg').count()) throw new Error(`${width}: decorative article icon remains`)
  if (forbidden.test(text)) throw new Error(`${width}: forbidden copy is visible`)
  await assertNoOverflow(page, width)
  await assertTargets(page, width)
  const rail = await page.locator('.mx-library-programs__program-rail').boundingBox()
  const card = await page.locator('.mx-library-programs__small-program').first().boundingBox()
  if (!rail || !card || card.x + card.width >= rail.x + rail.width) throw new Error(`${width}: next program card is not visibly peeking`)
  const guided = await page.locator('.mx-library-programs__guided-entry').boundingBox()
  if (!guided || guided.height < 44) throw new Error(`${width}: guided entry tap target is too small`)
}

async function saveScreenshot(page, name) {
  if (!screenshotDir) return
  await mkdir(screenshotDir, { recursive: true })
  await page.screenshot({ path: `${screenshotDir}/${name}.png`, fullPage: true })
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  try {
    for (const viewport of sizes) {
      const context = await browser.newContext({ viewport })
      const page = await context.newPage()
      await open(page)
      await assertLanding(page, viewport.width)
      await saveScreenshot(page, `${viewport.width}x${viewport.height}-landing`)
      await page.locator('.mx-library-programs__guided-entry').click()
      await assertUrl(page, 'catalog')
      if (!(await page.getByRole('heading', { name: 'Направленные записи', exact: true }).isVisible())) throw new Error(`${viewport.width}: guided catalog missing`)
      await saveScreenshot(page, `${viewport.width}x${viewport.height}-guided-catalog`)
      await page.getByRole('button', { name: /Прояснить выбор/ }).click()
      await assertUrl(page, 'journal', { template: 'clarify-choice', stage: 'intro', step: 0 })
      await page.getByRole('button', { name: 'Начать' }).click()
      await assertUrl(page, 'journal', { stage: 'writing', step: 0 })
      if (!(await page.getByRole('button', { name: 'Продолжить' }).isDisabled())) throw new Error(`${viewport.width}: empty Continue is enabled`)
      await page.locator('textarea').fill('Ситуация, которую я хочу решить.')
      await saveScreenshot(page, `${viewport.width}x${viewport.height}-guided-question-1`)
      if (viewport.width === 390) {
        await page.getByRole('button', { name: 'Продолжить' }).click()
        await assertUrl(page, 'journal', { stage: 'writing', step: 1 })
        await page.locator('textarea').fill('Я точно знаю этот факт.')
        await saveScreenshot(page, '390x844-guided-question-2-filled')
        await page.reload({ waitUntil: 'networkidle' })
        await assertUrl(page, 'journal', { stage: 'writing', step: 1 })
        if ((await page.locator('textarea').inputValue()) !== 'Я точно знаю этот факт.') throw new Error('draft was not restored after reload')
      }
      const flowBack = page.locator('.mx-library-programs__flow-header button[aria-label="Назад"]')
      if (!(await flowBack.count())) throw new Error(`${viewport.width}: journal Back button missing`)
      await flowBack.first().click()
      if (viewport.width === 390) {
        await assertUrl(page, 'journal', { stage: 'writing', step: 0 })
        if (!(await flowBack.count())) throw new Error(`${viewport.width}: journal Back button missing at first step`)
        await flowBack.first().click()
      }
      await assertUrl(page, 'catalog')
      await page.getByRole('button', { name: 'Вернуться в библиотеку' }).click()
      await assertUrl(page)
      await context.close()
      console.log(`PASS landing/catalog/journal/back ${viewport.width}x${viewport.height}`)
    }

    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    await open(page)
    await page.locator('.mx-library-programs__guided-entry').click()
    await page.getByRole('button', { name: /Прояснить выбор/ }).click()
    await page.getByRole('button', { name: 'Начать' }).click()
    const answers = ['Решение о следующем шаге.', 'Факт, который я знаю точно.', 'Для меня важна ясность.', 'Сделать один звонок.']
    for (let index = 0; index < answers.length; index += 1) {
      await page.locator('textarea').fill(answers[index])
      if (index < answers.length - 1) await page.getByRole('button', { name: 'Продолжить' }).click()
      else await page.getByRole('button', { name: 'Проверить ответы' }).click()
    }
    await assertUrl(page, 'review', { template: 'clarify-choice' })
    if ((await page.locator('.mx-library-programs__answer-list section').count()) !== 4) throw new Error('review does not show four answers')
    await saveScreenshot(page, '390x844-guided-review')
    await page.getByRole('button', { name: 'Сохранить запись' }).click()
    await assertUrl(page, 'completion', { template: 'clarify-choice' })
    if (!(await page.getByRole('heading', { name: 'Запись сохранена', exact: true }).isVisible())) throw new Error('completion missing')
    await saveScreenshot(page, '390x844-guided-completion')
    await page.getByRole('button', { name: 'Вернуться в библиотеку' }).click()
    await assertUrl(page)
    await page.locator('.mx-library-programs__guided-entry').click()
    await assertUrl(page, 'catalog')
    if (!(await page.getByText(/Завершено/).isVisible())) throw new Error('completed catalog state missing')
    await assertNoOverflow(page, 'guided flow')
    await assertTargets(page, 'guided flow')
    await page.getByRole('button', { name: 'Вернуться в библиотеку' }).click()
    await assertUrl(page)
    await page.locator('.mx-library-programs__article').filter({ hasText: 'Как начать с одного шага' }).click()
    await assertUrl(page, 'article', { article: 'one-step' })
    if (!(await page.getByRole('heading', { name: 'Как начать с одного шага', exact: true }).isVisible())) throw new Error('article reader regressed')
    await page.getByRole('button', { name: '← Библиотека' }).click()
    await assertUrl(page)
    await context.close()
    console.log('PASS review/save/completion/completed-state/article-reader')
  } finally {
    await browser.close()
  }
}

run().catch(error => {
  console.error(error)
  process.exitCode = 1
})
