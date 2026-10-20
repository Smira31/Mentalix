import { expect, test } from '@playwright/test'

/*
 * Защита контента (#1112, этап 1):
 * - на шаге «Пути героя» тексты не выделяются (user-select: none),
 *   copy и контекстное меню заблокированы;
 * - поле «Запиши» внутри защищённого экрана принимает ввод и вставку;
 * - в журнале выделение и копирование работают как раньше.
 *
 * Водяной знак (#1112, этап 2):
 * - на шаге «Пути героя» и в статье Библиотеки — ровно один слой
 *   водяного знака (.mx-watermark-layer);
 * - на карте «Пути героя» и в журнале — ноль слоёв.
 *
 * Проверка блокировки — программная установка выделения и синтетические
 * события: user-select: none не даёт выделить текст мышью, а перехватчик
 * (src/lib/protectedText.js) обязан отменить событие, если выделение
 * всё же появилось (dispatchEvent возвращает false после preventDefault).
 */

test.use({ viewport: { width: 393, height: 852 } })

async function textGuards(page, selector) {
  return page.locator(selector).evaluate(el => {
    const style = getComputedStyle(el)
    const selection = document.getSelection()
    const range = document.createRange()
    range.selectNodeContents(el)
    selection.removeAllRanges()
    selection.addRange(range)
    const copyBlocked = !el.dispatchEvent(new Event('copy', { bubbles: true, cancelable: true }))
    const menuBlocked = !el.dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    )
    selection.removeAllRanges()
    return { userSelect: style.userSelect, copyBlocked, menuBlocked }
  })
}

test('«Путь героя»: тексты шага защищены, поле «Запиши» принимает ввод и вставку', async ({
  page,
}) => {
  await page.goto('/?demo=1&tab=library&action=hero_journey')
  await expect(page.getByTestId('hero-journey-map')).toBeVisible()

  // ── Вступление шага ──
  await page.getByTestId('hero-continue').click()
  await expect(page.getByTestId('hero-step-start')).toBeVisible()

  const intro = await textGuards(page, '.mx-hj-step-intro__text')
  expect(intro.userSelect).toBe('none')
  expect(intro.copyBlocked).toBe(true)
  expect(intro.menuBlocked).toBe(true)

  // ── Экран «Запиши»: подсказка защищена ──
  await page.getByTestId('hero-step-start').click()
  const input = page.getByTestId('hero-write-input')
  await expect(input).toBeVisible()

  const prompt = await textGuards(page, '.mx-hj-write')
  expect(prompt.userSelect).toBe('none')

  // ── Поле ввода внутри защищённого экрана: ввод работает ──
  const inputSelect = await input.evaluate(el => getComputedStyle(el).userSelect)
  expect(inputSelect).not.toBe('none')
  await input.fill('Проверка ввода')
  await expect(input).toContainText('Проверка ввода')

  // ── Вставка из буфера обмена работает ──
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await input.click()
  await page.evaluate(() => navigator.clipboard.writeText(' и вставка из буфера'))
  await page.keyboard.press('Control+v')
  await expect(input).toContainText('Проверка ввода')
  await expect(input).toContainText('и вставка из буфера')
})

test('журнал: выделение и копирование работают как раньше', async ({ page }) => {
  await page.goto('/?demo=1&tab=practices')
  await page.getByTestId('journal-open-cta').click()
  await page.getByTestId('dj-intro-skip').click()
  const input = page.getByTestId('dj-stream-input')
  await expect(input).toBeVisible()
  await input.fill('Моя запись в журнале')

  const journal = await textGuards(page, '[data-testid="dj-stream-input"]')
  expect(journal.userSelect).not.toBe('none')
  expect(journal.copyBlocked).toBe(false)
  expect(journal.menuBlocked).toBe(false)
})

test('Библиотека: текст статьи не выделяется и не копируется', async ({ page }) => {
  await page.goto('/?demo=1&tab=library')
  await page.getByTestId('library-article-tile').first().click()
  await expect(page.getByTestId('article-sheet')).toBeVisible()
  await page.getByTestId('article-sheet-read').click()
  await expect(page.getByTestId('article-reader')).toBeVisible()

  const article = await textGuards(page, '.mx-library-reader-text')
  expect(article.userSelect).toBe('none')
  expect(article.copyBlocked).toBe(true)
  expect(article.menuBlocked).toBe(true)
})

/*
 * Водяной знак (#1112, этап 2):
 * - на шаге «Пути героя» и в статье Библиотеки — ровно один слой;
 * - на карте «Пути героя» и в журнале — ноль.
 */

test('Водяной знак: ровно один слой на шаге «Пути героя»', async ({ page }) => {
  await page.goto('/?demo=1&tab=library&action=hero_journey')
  await expect(page.getByTestId('hero-journey-map')).toBeVisible()

  // На карте — ноль слоёв водяного знака
  const mapCount = await page.locator('.mx-watermark-layer').count()
  expect(mapCount).toBe(0)

  // Открываем шаг — ровно один слой
  await page.getByTestId('hero-continue').click()
  await expect(page.getByTestId('hero-step-start')).toBeVisible()

  const stepCount = await page.locator('.mx-watermark-layer').count()
  expect(stepCount).toBe(1)

  // Слой имеет непустой background-image (SVG-паттерн с текстом)
  const bg = await page.locator('.mx-watermark-layer').evaluate(el => {
    return getComputedStyle(el).backgroundImage
  })
  expect(bg).not.toBe('none')
  expect(bg).toContain('data:image/svg+xml')
})

test('Водяной знак: ровно один слой в статье Библиотеки', async ({ page }) => {
  await page.goto('/?demo=1&tab=library')
  await page.getByTestId('library-article-tile').first().click()
  await expect(page.getByTestId('article-sheet')).toBeVisible()
  await page.getByTestId('article-sheet-read').click()
  await expect(page.getByTestId('article-reader')).toBeVisible()

  const count = await page.locator('.mx-watermark-layer').count()
  expect(count).toBe(1)

  const bg = await page.locator('.mx-watermark-layer').evaluate(el => {
    return getComputedStyle(el).backgroundImage
  })
  expect(bg).not.toBe('none')
  expect(bg).toContain('data:image/svg+xml')
})

test('Водяной знак: ноль слоёв в журнале', async ({ page }) => {
  await page.goto('/?demo=1&tab=practices')
  await page.getByTestId('journal-open-cta').click()
  await page.getByTestId('dj-intro-skip').click()
  const input = page.getByTestId('dj-stream-input')
  await expect(input).toBeVisible()

  const count = await page.locator('.mx-watermark-layer').count()
  expect(count).toBe(0)
})
