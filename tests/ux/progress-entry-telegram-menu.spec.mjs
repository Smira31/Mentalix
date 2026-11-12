import { readFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { expect, test } from '@playwright/test'

/*
 * Экран записи «Истории» (Прогресс → История → «Утренний чек-ин») в Telegram
 * fullscreen.
 *
 * Дефект на main 0acd14c: в Telegram ScreenBack не рендерится (навигация —
 * системной кнопкой), поэтому кнопка меню «Действия с записью» становилась
 * первым элементом .mx-progress-entry__top-row и уезжала влево, а сам экран
 * начинался сразу под safe-area — под полосой кнопок Telegram
 * (TG_CONTROLS_HEIGHT). На iPhone кнопка меню лежала под «Назад» и не
 * нажималась.
 *
 * Здесь проверяется критерий приёмки 1 на 393×852 и 360×640: полоса кнопок
 * Telegram (56 px от края safe-area) ничем не перекрыта, кнопка меню стоит
 * справа, elementFromPoint в её центре — сама кнопка, меню открывается и
 * пункты «Пройти заново» / «Удалить» видны. Критерий 2 (веб без Telegram)
 * проверяется вторым тестом: круглая «назад» слева, меню справа, лишнего
 * отступа нет.
 *
 * Платформа Telegram включается так же, как в ai-consent-ui.spec.mjs —
 * TelegramWebviewProxy, — а fullscreen подтверждается тем же событием, которое
 * присылает настоящий клиент (fullscreen_changed). Без события общий store
 * снимает pessimistic default по таймауту, как в Telegram без fullscreen.
 *
 * Высота полосы берётся из единственного источника — TG_CONTROLS_HEIGHT в
 * src/lib/fullscreenSurface.js; своего числа в тесте нет.
 *
 * Запуск в web-контейнере:
 *   npx playwright test --config=playwright.journal-history.config.mjs progress-entry-telegram-menu.spec.mjs
 */

const TG_CONTROLS_HEIGHT = Number(
  readFileSync(new URL('../../src/lib/fullscreenSurface.js', import.meta.url), 'utf8').match(
    /export const TG_CONTROLS_HEIGHT = (\d+)/
  )[1]
)

const VIEWPORTS = [
  { name: '393x852', width: 393, height: 852 },
  { name: '360x640', width: 360, height: 640 },
]

const SHOTS = path.resolve('qa-evidence/progress-entry-menu')

/*
 * today_state=dayInProgress: в демо появляется чек-ин на сегодня, поэтому у
 * записи «Утренний чек-ин» доступны и «Пройти заново», и «Удалить». Сами
 * пункты тест только открывает — никаких действий с записью не выполняется.
 */
const DEMO_URL = '/?demo=1&today_state=dayInProgress'

/*
 * Настоящий клиент Telegram всегда передаёт launch data в hash. Из неё SDK
 * собирает WebApp.initData, а ScreenBack по непустому initData прячет
 * собственную круглую «назад» (навигация — системной кнопкой). Без этого
 * хеша эмуляция оставляла «назад» в потоке, и дефект с уехавшим влево меню
 * не воспроизводился.
 */
const REAL_TG_HASH = '#tgWebAppData=query_id%3DAAHtest%26user%3D%7B%22id%22%3A1%7D'

async function meetApp(browser, viewport, { telegram }) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })

  await context.addInitScript(telegram => {
    if (telegram) {
      // Платформа Telegram без настоящего клиента: platform.name === 'telegram'.
      window.TelegramWebviewProxy = { postEvent() {} }
    }
    localStorage.setItem('mx-onboarded-v2', '1')
    localStorage.setItem('mx-app-lock-enabled', '0')
  }, telegram)

  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))

  await page.goto(telegram ? `${DEMO_URL}${REAL_TG_HASH}` : DEMO_URL)

  return { context, page, errors }
}

/** Telegram fullscreen: то же событие, что присылает настоящий клиент. */
async function confirmTelegramFullscreen(page) {
  await page.evaluate(() => {
    window.Telegram.WebView.receiveEvent('fullscreen_changed', { is_fullscreen: true })
  })
  await expect(page.locator('.mx-app-shell--fullscreen')).toHaveCount(1)
}

/** Прогресс → История → первая запись «Утренний чек-ин» (за сегодня). */
async function openTodayMorningEntry(page) {
  await expect(page.getByRole('button', { name: 'Прогресс', exact: true })).toBeVisible({
    timeout: 15_000,
  })
  await page.getByRole('button', { name: 'Прогресс', exact: true }).click()
  await page.getByTestId('progress-tab-history').click()
  await expect(page.getByTestId('progress-tab-history')).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByTestId('progress-history-list')).toBeVisible()

  await page
    .locator('[data-testid="progress-history-row"]')
    .filter({ hasText: 'Утренний чек-ин' })
    .first()
    .click()

  await expect(page.getByTestId('progress-entry-screen')).toBeVisible()
  // Запись именно за сегодня: у неё в меню есть и «Пройти заново», и «Удалить».
  await expect(page.getByTestId('progress-entry-date')).toContainText('СЕГОДНЯ')
}

/*
 * Геометрия экрана записи одним замером: край safe-area (через пробный
 * элемент, потому что --app-safe-top — это max(...) из нескольких источников),
 * прямоугольники элементов экрана и точка попадания в центре кнопки меню.
 */
async function measureEntry(page) {
  return page.evaluate(() => {
    const entry = document.querySelector('[data-testid="progress-entry-screen"]')
    const probe = document.createElement('div')
    probe.style.cssText =
      'position:absolute;top:0;left:0;width:0;height:0;padding-top:var(--app-safe-top)'
    document.body.appendChild(probe)
    const safeAreaTop = parseFloat(getComputedStyle(probe).paddingTop) || 0
    probe.remove()

    const entryRect = entry.getBoundingClientRect()
    const rect = element => {
      const box = element.getBoundingClientRect()
      return {
        label: element.getAttribute('data-testid') || element.className || element.tagName,
        top: box.top,
        left: box.left,
        right: box.right,
        width: box.width,
        height: box.height,
      }
    }

    const items = []
    for (const element of entry.querySelectorAll('*')) {
      const box = element.getBoundingClientRect()
      if (box.width <= 0 || box.height <= 0) continue
      // Полноэкранный фон самого экрана — это поверхность, а не элемент,
      // который может оказаться под кнопками Telegram.
      if (box.height >= entryRect.height * 0.9) continue
      items.push(rect(element))
    }

    const menuButton = entry.querySelector('[data-testid="progress-entry-menu-button"]')
    const menuBox = menuButton.getBoundingClientRect()
    const hit = document.elementFromPoint(menuBox.x + menuBox.width / 2, menuBox.y + menuBox.height / 2)

    return {
      safeAreaTop,
      paddingTop: parseFloat(getComputedStyle(entry).paddingTop) || 0,
      entry: { left: entryRect.left, right: entryRect.right, width: entryRect.width },
      items,
      menuButton: rect(menuButton),
      menuHits:
        menuButton === hit || menuButton.contains(hit)
          ? 'menu-button'
          : hit?.getAttribute?.('data-testid') || hit?.className || hit?.tagName || null,
      backButton: entry.querySelector('[data-testid="back-button"]')
        ? rect(entry.querySelector('[data-testid="back-button"]'))
        : null,
    }
  })
}

/** Все элементы экрана, попавшие в полосу кнопок Telegram. */
function bandOffenders(measurement) {
  const bandBottom = measurement.safeAreaTop + TG_CONTROLS_HEIGHT
  return measurement.items
    .filter(item => item.top < bandBottom - 0.5)
    .map(item => `${item.label} (top ${Math.round(item.top)} < ${Math.round(bandBottom)})`)
}

test.beforeAll(async () => {
  await mkdir(SHOTS, { recursive: true })
})

for (const viewport of VIEWPORTS) {
  test(`Telegram fullscreen ${viewport.name}: меню записи не под кнопками Telegram`, async ({
    browser,
  }) => {
    const { context, page, errors } = await meetApp(browser, viewport, { telegram: true })
    await confirmTelegramFullscreen(page)
    await openTodayMorningEntry(page)

    // Как на устройстве: собственная «назад» скрыта, навигация — системной
    // кнопкой Telegram.
    await expect(page.getByTestId('progress-entry-screen').getByTestId('back-button')).toHaveCount(
      0
    )

    await page.screenshot({ path: path.join(SHOTS, `tg-${viewport.name}-entry.png`) })

    // Замер с закрытым меню: оверлей меню иначе перехватывает попадание в
    // центр кнопки.
    const measurement = await measureEntry(page)

    // Меню открывается, пункты на месте.
    await page.getByTestId('progress-entry-menu-button').click()
    await expect(page.getByTestId('progress-entry-menu')).toBeVisible()
    await expect(page.getByTestId('progress-entry-menu')).toContainText('Пройти заново')
    await expect(page.getByTestId('progress-entry-menu')).toContainText('Удалить')
    await page.screenshot({ path: path.join(SHOTS, `tg-${viewport.name}-menu.png`) })
    const menuBox = await page.getByTestId('progress-entry-menu').boundingBox()

    // Тот же отступ у листа «AI и эта запись»: он открывается поверх экрана
    // записи и не начинается под системными кнопками Telegram.
    await page.getByRole('menuitem', { name: 'AI и эта запись' }).click()
    await expect(page.getByTestId('progress-ai-sheet')).toBeVisible()
    await page.screenshot({ path: path.join(SHOTS, `tg-${viewport.name}-ai-sheet.png`) })
    const sheet = await page.evaluate(() => {
      const sheet = document.querySelector('[data-testid="progress-ai-sheet"]')
      const close = document.querySelector('[data-testid="progress-ai-sheet-close"]')
      return {
        paddingTop: parseFloat(getComputedStyle(sheet).paddingTop) || 0,
        closeTop: close.getBoundingClientRect().top,
      }
    })
    await page.getByTestId('progress-ai-sheet-close').click()
    await expect(page.getByTestId('progress-ai-sheet')).toHaveCount(0)

    // ── Проверки (после кадров: «до» тоже должно быть видно) ──

    // Ни один элемент экрана не заходит в полосу кнопок Telegram.
    expect(
      bandOffenders(measurement),
      'элементы экрана записи пересекаются с полосой кнопок Telegram'
    ).toEqual([])
    expect(measurement.paddingTop).toBeGreaterThanOrEqual(
      measurement.safeAreaTop + TG_CONTROLS_HEIGHT
    )

    // Кнопка меню — справа и нажимается: в её центре она сама. Собственной
    // «назад» в потоке нет, поэтому right задаёт именно margin-left: auto.
    expect(measurement.backButton).toBeNull()
    expect(measurement.menuButton.left).toBeGreaterThan(
      measurement.entry.left + measurement.entry.width / 2
    )
    expect(measurement.menuHits).toBe('menu-button')

    // Меню остается ниже полосы кнопок Telegram и на экране.
    expect(menuBox.y).toBeGreaterThanOrEqual(measurement.safeAreaTop + TG_CONTROLS_HEIGHT - 0.5)
    expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(viewport.height)

    expect(sheet.paddingTop).toBeGreaterThanOrEqual(measurement.safeAreaTop + TG_CONTROLS_HEIGHT)
    expect(sheet.closeTop).toBeGreaterThanOrEqual(
      measurement.safeAreaTop + TG_CONTROLS_HEIGHT - 0.5
    )

    // Fullscreen подтверждён событием, а не таймаутом: состояние не откатится.
    await expect(page.locator('.mx-app-shell--fullscreen')).toHaveCount(1)

    expect(errors).toEqual([])
    await context.close()
  })
}

test('веб без Telegram: «назад» слева, меню справа, лишнего отступа нет', async ({ browser }) => {
  for (const viewport of VIEWPORTS) {
    const { context, page, errors } = await meetApp(browser, viewport, { telegram: false })

    /*
     * Плашка демо-панели (`demo-panel-badge`, position: fixed, z-index 9999)
     * висит в правом верхнем углу окна и на телефонной ширине закрывает как
     * раз кнопку меню. Это инструмент превью, а не интерфейс приложения:
     * в вебе без Telegram платформы её в продукте нет. Скрываем её, чтобы
     * нажать настоящую кнопку меню, а не плашку.
     */
    await page.addStyleTag({ content: '[data-testid="demo-panel-badge"] { display: none !important }' })

    await openTodayMorningEntry(page)

    const measurement = await measureEntry(page)

    await page.screenshot({ path: path.join(SHOTS, `web-${viewport.name}-entry.png`) })

    // Собственная круглая «назад» в потоке и слева, меню справа.
    expect(measurement.backButton, 'в вебе есть своя кнопка «назад»').not.toBeNull()
    expect(measurement.backButton.left).toBeLessThan(
      measurement.entry.left + measurement.entry.width / 2
    )
    expect(measurement.menuButton.left).toBeGreaterThan(
      measurement.entry.left + measurement.entry.width / 2
    )
    // Полосы кнопок Telegram в вебе нет — отступ как в main: safe-area + 8.
    expect(measurement.paddingTop).toBeCloseTo(measurement.safeAreaTop + 8, 1)

    await page.getByTestId('progress-entry-menu-button').click()
    await expect(page.getByTestId('progress-entry-menu')).toBeVisible()
    await expect(page.getByTestId('progress-entry-menu')).toContainText('Удалить')
    await page.screenshot({ path: path.join(SHOTS, `web-${viewport.name}-menu.png`) })

    expect(measurement.menuHits).toBe('menu-button')
    expect(errors).toEqual([])
    await context.close()
  }
})
