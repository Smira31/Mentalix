import { expect, test } from '@playwright/test'

// tabbar-lower-collapse: нижний бар сжимается в круглую кнопку при скролле вниз
// на ВСЕХ пяти вкладках (раньше «Шаги» были исключением), раскрывается при
// скролле вверх и по тапу, наверху страницы всегда раскрыт.
//
// Скроллим настоящий scroll-root: установка scrollTop порождает штатное
// событие scroll на том же элементе, который слушает панель. Отдельный тест
// проверяет, что до scroll-root доходит и жест колесом.

const BASE_URL = 'http://127.0.0.1:5173'
const TABS = ['Сегодня', 'Шаги', 'Диалог', 'Библиотека', 'Прогресс']
const VIEWPORTS = [
  { width: 393, height: 852 },
  { width: 360, height: 640 },
]

const COLLAPSED = /mx-nav-collapsed/

async function openDemo(page) {
  await page.goto('/?demo=1')
  await expect(page.getByTestId('app-scroll-root')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('button', { name: 'Сегодня', exact: true })).toBeVisible({
    timeout: 20_000,
  })
}

/**
 * Демо-экраны могут быть короче вьюпорта. Запас высоты добавляем стилем
 * (::after у прокручиваемого содержимого), а не узлом в DOM: React
 * перерисовывает дерево вкладки и вставленный узел может исчезнуть.
 */
async function ensureScrollable(page) {
  await page.addStyleTag({
    content:
      '.mx-app-scroll-root .mx-scroll-content::after { content: ""; display: block; height: 900px; }',
  })
}

function scrollTop(page) {
  return page.getByTestId('app-scroll-root').evaluate(root => Math.round(root.scrollTop))
}

/**
 * Прокрутка scroll-root с проверкой, что контейнер реально сдвинулся.
 * Позиция выставляется в каждой попытке: пока вкладка догружается, высота
 * содержимого ещё растёт и контейнер не принимает нужное значение сразу.
 */
async function scrollTo(page, value) {
  await expect
    .poll(
      async () => {
        await page
          .getByTestId('app-scroll-root')
          .evaluate((root, next) => {
            root.scrollTop = next
          }, value)
        return scrollTop(page)
      },
      { message: `scroll-top ${value}` },
    )
    .toBe(value)
}

async function scrollToTop(page) {
  await scrollTo(page, 0)
  await expect(page.locator('html')).not.toHaveClass(COLLAPSED)
}

async function newPage(playwright, engine, viewport) {
  const browser = await playwright[engine].launch()
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport,
    hasTouch: true,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })
  await context.route('**/api/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  const page = await context.newPage()
  return { browser, context, page }
}

for (const engine of ['webkit', 'chromium']) {
  test.describe(`нижний бар сжимается на всех вкладках (${engine})`, () => {
    for (const viewport of VIEWPORTS) {
      test(`${viewport.width}×${viewport.height}`, async ({ playwright }) => {
        const { browser, context, page } = await newPage(playwright, engine, viewport)
        await openDemo(page)
        await ensureScrollable(page)

        for (const label of TABS) {
          const tabButton = page.getByRole('button', { name: label, exact: true })
          await tabButton.click()
          await expect(tabButton).toHaveAttribute('aria-current', 'page')
          await scrollToTop(page)

          // 1. Небольшой скролл (< 96px) бар не сжимает.
          await scrollTo(page, 60)
          await expect(
            page.locator('html'),
            `${label}: 60px вниз — бар ещё раскрыт`,
          ).not.toHaveClass(COLLAPSED)
          await scrollToTop(page)

          // 2. Скролл вниз → круглая кнопка.
          await scrollTo(page, 300)
          await expect(
            page.locator('html'),
            `${label}: бар должен сжаться при скролле вниз`,
          ).toHaveClass(COLLAPSED)
          await expect(page.locator('.mx-bottom-nav nav')).toHaveAttribute('aria-hidden', 'true')

          // 3. Скролл вверх → бар раскрыт.
          await scrollTo(page, 180)
          await expect(
            page.locator('html'),
            `${label}: бар должен раскрыться при скролле вверх`,
          ).not.toHaveClass(COLLAPSED)

          // 4. Сжали снова и раскрыли тапом по круглой кнопке.
          await scrollTo(page, 480)
          await expect(page.locator('html')).toHaveClass(COLLAPSED)
          await page.getByRole('button', { name: `Открыть навигацию: ${label}` }).tap()
          await expect(
            page.locator('html'),
            `${label}: тап по кнопке раскрывает бар`,
          ).not.toHaveClass(COLLAPSED)
          await expect(page.locator('.mx-bottom-nav nav')).toHaveAttribute('aria-hidden', 'false')

          // После раскрытия бар остаётся раскрытым наверху вкладки.
          await scrollToTop(page)
        }

        await context.close()
        await browser.close()
      })
    }

    test(`жест колесом доходит до scroll-root («Сегодня») (${engine})`, async ({ playwright }) => {
      const { browser, context, page } = await newPage(playwright, engine, VIEWPORTS[0])
      await openDemo(page)
      await ensureScrollable(page)

      const box = await page.getByTestId('app-scroll-root').boundingBox()
      await page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 300))
      // Повтор жеста: на только что открытой вкладке первый wheel может прийти
      // раньше, чем App закончил восстановление позиции скролла.
      await expect
        .poll(
          async () => {
            await page.mouse.wheel(0, 300)
            return scrollTop(page)
          },
          { message: 'жест колесом вниз' },
        )
        .toBeGreaterThan(0)

      await expect(page.locator('html')).toHaveClass(COLLAPSED)

      await context.close()
      await browser.close()
    })

    test(`геометрия: бар опущен, но не ближе 6px к краю (${engine})`, async ({ playwright }) => {
      const { browser, context, page } = await newPage(playwright, engine, VIEWPORTS[0])
      await openDemo(page)

      const metrics = await page.evaluate(() => {
        const nav = document.querySelector('.mx-bottom-nav')
        const pill = document.querySelector('.mx-bottom-nav > div')
        const content = document.querySelector('.mx-app-scroll-root .mx-scroll-content')
        return {
          edgeGap: window.innerHeight - pill.getBoundingClientRect().bottom,
          pillHeight: pill.getBoundingClientRect().height,
          contentPadding: parseFloat(getComputedStyle(content).paddingBottom),
          navBottom: getComputedStyle(nav).bottom,
        }
      })

      // safe-area в браузере Playwright равна 0: сдвиг -4px упирается в нижнюю
      // границу 6px, поэтому бар стоит ровно на 6px от края (было 8px).
      expect(
        metrics.edgeGap,
        `нижний край пилюли не ближе 6px к краю экрана (bottom: ${metrics.navBottom})`,
      ).toBeGreaterThanOrEqual(6)
      expect(
        metrics.edgeGap,
        `бар опущен до нижней границы, а не выше (bottom: ${metrics.navBottom})`,
      ).toBeLessThanOrEqual(7)
      expect(
        metrics.contentPadding,
        'последний контент не должен уходить под бар',
      ).toBeGreaterThanOrEqual(metrics.pillHeight + 6)

      await context.close()
      await browser.close()
    })
  })
}
