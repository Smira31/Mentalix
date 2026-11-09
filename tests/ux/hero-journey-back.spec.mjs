import { expect, test, devices } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

import { advanceStoryToWrite, openStepWrite } from './hero-journey-helpers.mjs'

/*
 * #1165: вне Telegram с каждого экрана «Пути героя» и шага курса возвращает
 * видимая круглая «Назад» (ScreenBack) — тот же обработчик, что у системной
 * BackButton Telegram.
 *
 * Цепочка из задачи: практикум → карта → шаг → «Назад» → карта → «Назад» →
 * вкладка. Практикумы живут во вкладке «Библиотека» (соседняя с «Шагами»);
 * второй сценарий проходит те же возвраты по экранам шага курса — вводка,
 * запись, действие, завершение.
 *
 * Контекст — телефон с сенсорным экраном: на таком устройстве ?demo=1 рисует
 * веб/PWA без эмуляции шапки Telegram, то есть ровно то окружение, где своя
 * «Назад» обязана быть видимой. В Telegram ScreenBack не рисуется вовсе —
 * там системная кнопка.
 */
const EVIDENCE = 'qa-evidence/hero-back'
const VIEWPORTS = [
  { width: 393, height: 852 },
  { width: 360, height: 640 },
]

const STEP_ID = 'uncertainty'

async function openPhone(browser, baseURL, viewport) {
  const context = await browser.newContext({
    baseURL,
    ...devices['iPhone 15 Pro'],
    viewport,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })
  const page = await context.newPage()
  await page.goto('/?demo=1&frame=0')
  return { context, page }
}

async function capture(page, name) {
  const { width, height } = page.viewportSize()

  /* Кнопка — тот же круглый 43×43, что в CourseDetail, и стоит в свободной
     полосе над содержимым: текст экрана она не перекрывает. */
  const button = page.getByTestId('hero-back')
  const box = await button.boundingBox()
  expect(Math.round(box.width)).toBe(43)
  expect(Math.round(box.height)).toBe(43)
  const contentTop = await button.evaluate(el => {
    const column = el.closest('.mx-screen__content')
    return column.firstElementChild.getBoundingClientRect().top
  })
  expect(box.y + box.height).toBeLessThanOrEqual(contentTop)

  await mkdir(EVIDENCE, { recursive: true })
  await page.screenshot({ path: `${EVIDENCE}/${width}x${height}-${name}.png`, scale: 'css' })
}

/* Практикум открывается из вкладки: карточка «Путь героя» → карта курса. */
async function openCourseFromTab(page) {
  await page.getByRole('button', { name: 'Библиотека', exact: true }).click()
  await page.getByTestId('library-hero').click()
  await expect(page.getByTestId('hero-journey-map')).toBeVisible()
}

test('Веб: «Назад» с шага на карту и с карты во вкладку', async ({ browser, baseURL }) => {
  for (const viewport of VIEWPORTS) {
    const { context, page } = await openPhone(browser, baseURL, viewport)

    await openCourseFromTab(page)

    /* Карта курса: видимая «Назад» ведёт обратно во вкладку. */
    await expect(page.getByTestId('hero-back')).toBeVisible()
    await capture(page, 'map')

    /* Пролог «О практикуме»: «Назад» возвращает на карту. */
    await page.getByTestId('hero-about-open').click()
    await expect(page.getByTestId('hero-about-steps')).toBeVisible()
    await expect(page.getByTestId('hero-back')).toBeVisible()
    await capture(page, 'about')
    await page.getByTestId('hero-back').click()
    await expect(page.getByTestId('hero-journey-map')).toBeVisible()

    /* Шаг: вводка-сторис, «Назад» с листа 1 ведёт на карту. */
    await page.getByTestId(`hero-step-${STEP_ID}`).click()
    await expect(page.getByTestId('hero-story-page')).toBeVisible()
    await expect(page.getByTestId('hero-back')).toBeVisible()
    await capture(page, 'step-intro')

    await page.getByTestId('hero-back').click()
    await expect(page.getByTestId('hero-journey-map')).toBeVisible()

    await page.getByTestId('hero-back').click()
    await expect(page.getByTestId('library-home')).toBeVisible()

    await context.close()
  }
})

test('Веб: «Назад» на экранах шага курса — запись, действие, завершение', async ({
  browser,
  baseURL,
}) => {
  for (const viewport of VIEWPORTS) {
    const { context, page } = await openPhone(browser, baseURL, viewport)

    await openCourseFromTab(page)
    await page.getByTestId(`hero-step-${STEP_ID}`).click()
    await advanceStoryToWrite(page)

    /* Запись: «Назад» возвращает на вводку шага, набранный текст остаётся. */
    await expect(page.getByTestId('hero-back')).toBeVisible()
    await capture(page, 'write')
    await page.getByTestId('hero-back').click()
    await expect(page.getByTestId('hero-story-page')).toBeVisible()

    await advanceStoryToWrite(page)
    await page.getByTestId('hero-write-input').fill('Проверка кнопки «Назад»')
    await page.getByTestId('hero-write-next').click()

    /* Одно действие: «Назад» возвращает на запись. */
    await expect(page.getByTestId('hero-action-input')).toBeVisible()
    await expect(page.getByTestId('hero-back')).toBeVisible()
    await capture(page, 'action')
    await page.getByTestId('hero-back').click()
    await expect(page.getByTestId('hero-write-input')).toHaveText('Проверка кнопки «Назад»')

    await page.getByTestId('hero-write-next').click()
    await page.getByTestId('hero-action-input').fill('Одно проверочное действие')
    await page.getByTestId('hero-action-next').click()

    /* Шаг пройден: «Назад» возвращает на «Одно действие». */
    await expect(page.getByTestId('hero-complete-map')).toBeVisible()
    await expect(page.getByTestId('hero-back')).toBeVisible()
    await capture(page, 'complete')
    await page.getByTestId('hero-back').click()
    await expect(page.getByTestId('hero-action-input')).toHaveText('Одно проверочное действие')

    /* Возврат на карту остаётся прежним — кнопкой «Продолжить». */
    await page.getByTestId('hero-action-next').click()
    await page.getByTestId('hero-complete-map').click()
    await expect(page.getByTestId('hero-journey-map')).toBeVisible()

    await context.close()
  }
})

test('Эмуляция Telegram: своей «Назад» не видно, работает системная', async ({ page }) => {
  /* ?demo=1 на компьютере рисует эмуляцию шапки Telegram: как на устройстве,
     своя кнопка уступает место системной, а её тап вызывает тот же обработчик. */
  await page.goto('/?demo=1&frame=0')
  await page.getByRole('button', { name: 'Библиотека', exact: true }).click()
  await page.getByTestId('library-hero').click()
  await expect(page.getByTestId('hero-journey-map')).toBeVisible()

  const ownButton = await page.getByTestId('hero-back').evaluate(el => {
    const style = getComputedStyle(el)
    return { opacity: style.opacity, width: style.width, height: style.height }
  })
  expect(ownButton.opacity).toBe('0')
  expect(parseFloat(ownButton.width)).toBeLessThan(5)

  await page
    .locator('.mx-demo-telegram-chrome')
    .getByRole('button', { name: 'Назад' })
    .click()
  await expect(page.getByTestId('library-home')).toBeVisible()
})

test('Веб: «Назад» на паузе между главами', async ({ browser, baseURL }) => {
  for (const viewport of VIEWPORTS) {
    const { context, page } = await openPhone(browser, baseURL, viewport)

    /* Первые три шага главы пройдены: четвёртый завершает главу и ведёт на паузу. */
    await page.addInitScript(() => {
      const day = offset => new Date(Date.now() - offset * 86400000).toISOString()
      localStorage.setItem(
        'mx-hero-journey-progress:900001',
        JSON.stringify({
          completed: {
            uncertainty: day(3),
            temporality: day(2),
            choice: day(1),
          },
          signs: {},
          reflections: {},
          actions: {},
        })
      )
    })
    await page.goto('/?demo=1&frame=0')

    await openCourseFromTab(page)
    await page.getByTestId('hero-step-abundance').click()
    await openStepWrite(page)
    await page.getByTestId('hero-write-input').fill('Последний шаг главы')
    await page.getByTestId('hero-write-next').click()
    await page.getByTestId('hero-action-input').fill('Одно действие главы')
    await page.getByTestId('hero-action-next').click()
    await page.getByTestId('hero-complete-map').click()

    /* Пауза между главами: «Назад» возвращает на карту курса. */
    await expect(page.getByTestId('hero-pause')).toBeVisible()
    await expect(page.getByTestId('hero-back')).toBeVisible()
    await capture(page, 'pause')
    await page.getByTestId('hero-back').click()
    await expect(page.getByTestId('hero-journey-map')).toBeVisible()

    await context.close()
  }
})
