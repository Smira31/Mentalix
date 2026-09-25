import { expect, test } from '@playwright/test'

/*
 * WebKit (Safari engine) тесты для двух проблем реального iPhone:
 * 1. «Сегодня» не прокручивается вверх-вниз (на «Шагах» прокрутка есть).
 * 2. Свайп «назад» от левого края не работает на вложенных экранах Библиотеки.
 *
 * Chromium не воспроизводит скролл-проблему (WebKit-only), но проверка
 * стека useBackButton работает в обоих движках.
 *
 * Запуск:
 *   npx playwright test --config=playwright.swipe.config.mjs --project=webkit-iphone-15-pro
 */

test.describe('WebKit iPhone: скролл «Сегодня»', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem('mx-onboarded-v2', '1')
      localStorage.setItem('mx-app-lock-enabled', '0')
    })
  })

  test('«Сегодня»: scrollHeight > clientHeight, программный скролл работает', async ({ page }) => {
    await page.goto('/?demo=1')

    await expect(page.locator('[data-testid="today-streak-chip"]')).toBeVisible({ timeout: 15_000 })

    // Ждём завершения анимации mx-stoic-screen-enter (420ms)
    await page.waitForTimeout(600)

    const measurements = await page.evaluate(() => {
      const scrollRoot = document.querySelector('.mx-app-scroll-root')
      if (!scrollRoot) return { error: 'scroll-root not found' }

      const screenShell = document.querySelector('.mx-screen-shell')
      const shellInfo = screenShell ? {
        scrollHeight: screenShell.scrollHeight,
        offsetHeight: screenShell.offsetHeight,
        overflow: getComputedStyle(screenShell).overflow,
        overflowY: getComputedStyle(screenShell).overflowY,
        transform: getComputedStyle(screenShell).transform,
        touchAction: getComputedStyle(screenShell).touchAction,
        position: getComputedStyle(screenShell).position,
      } : null

      return {
        root: {
          scrollHeight: scrollRoot.scrollHeight,
          clientHeight: scrollRoot.clientHeight,
          scrollTop: scrollRoot.scrollTop,
          overflowY: getComputedStyle(scrollRoot).overflowY,
          height: getComputedStyle(scrollRoot).height,
          touchAction: getComputedStyle(scrollRoot).touchAction,
        },
        shellInfo,
        htmlOverflow: getComputedStyle(document.documentElement).overflow,
        bodyOverflow: getComputedStyle(document.body).overflow,
        hasRealPhoneDemo: document.documentElement.classList.contains('mx-real-phone-demo'),
      }
    })

    console.log('TODAY measurements:', JSON.stringify(measurements, null, 2))

    expect(measurements.root.scrollHeight).toBeGreaterThan(measurements.root.clientHeight)

    // Ключевая проверка: transform не должен оставаться после анимации
    // (WebKit ломает тач-скролл при transform на дочернем элементе scroll-root)
    expect(measurements.shellInfo.transform).toBe('none')

    // Программный скролл работает
    await page.evaluate(() => {
      document.querySelector('.mx-app-scroll-root')?.scrollTo({ top: 300 })
    })
    const scrollTopAfter = await page.evaluate(() => {
      return document.querySelector('.mx-app-scroll-root')?.scrollTop ?? 0
    })
    expect(scrollTopAfter).toBeGreaterThan(200)
  })

  test('«Шаги» (Practices) — scrollHeight > clientHeight (контроль)', async ({ page }) => {
    await page.goto('/?demo=1&tab=practices')

    await expect(page.getByText('практики.')).toBeVisible({ timeout: 15_000 })

    const m = await page.evaluate(() => {
      const sr = document.querySelector('.mx-app-scroll-root')
      return {
        scrollHeight: sr.scrollHeight,
        clientHeight: sr.clientHeight,
        overflowY: getComputedStyle(sr).overflowY,
        touchAction: getComputedStyle(sr).touchAction,
      }
    })

    console.log('PRACTICES measurements:', JSON.stringify(m, null, 2))
    expect(m.scrollHeight).toBeGreaterThan(m.clientHeight)
  })
})

test.describe('WebKit iPhone: back-action на вложенных экранах', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem('mx-onboarded-v2', '1')
      localStorage.setItem('mx-app-lock-enabled', '0')
    })
  })

  /*
   * Проверяем через window.__mxGetCurrentBackAction (debug-экспорт из
   * telegram.hooks.js), что back-action зарегистрирован в стеке
   * useBackButton, и что его вызов возвращает на предыдущий экран.
   * Playwright WebKit не поддерживает симуляцию touch-событий,
   * поэтому проверяем регистрация и вызов back-action напрямую.
   */
  async function hasBackAction(page) {
    return page.evaluate(() => {
      const action = window.__mxGetCurrentBackAction?.()
      return { hasAction: Boolean(action) }
    })
  }

  async function callBackAction(page) {
    return page.evaluate(() => {
      const action = window.__mxGetCurrentBackAction?.()
      if (!action) return { hasAction: false }
      action()
      return { hasAction: true }
    })
  }

  test('Библиотека → каталог программ: back-action зарегистрирован и возвращает в корень', async ({ page }) => {
    await page.goto('/?demo=1&tab=library')

    await expect(page.getByText('библиотека.')).toBeVisible({ timeout: 15_000 })

    // На корне библиотеки нет back-action
    const before = await hasBackAction(page)
    expect(before.hasAction).toBe(false)

    // Открываем каталог программ
    await page.getByRole('button', { name: 'Смотреть' }).first().click()
    await expect(page.getByText('программы.')).toBeVisible({ timeout: 5_000 })

    // На под-экране back-action зарегистрирован
    await page.waitForTimeout(500)
    const after = await hasBackAction(page)
    expect(after.hasAction).toBe(true)

    // Вызываем back-action
    await callBackAction(page)

    // Должны вернуться в корень библиотеки
    await expect(page.getByText('библиотека.')).toBeVisible({ timeout: 5_000 })
  })

  test('Библиотека → каталог статей → читалка: двухуровневый back', async ({ page }) => {
    await page.goto('/?demo=1&tab=library')

    await expect(page.getByText('библиотека.')).toBeVisible({ timeout: 15_000 })

    // Открываем каталог статей
    const readButton = page.getByRole('button', { name: 'Читать' })
    await expect(readButton).toBeVisible()
    await readButton.click()
    await expect(page.getByText('статьи.')).toBeVisible({ timeout: 5_000 })

    // Back-action зарегистрирован (каталог статей → корень)
    await page.waitForTimeout(500)
    const level1 = await hasBackAction(page)
    expect(level1.hasAction).toBe(true)

    // Открываем первую статью
    const articleCard = page.locator('.mx-library-v2__catalog-card').first()
    await expect(articleCard).toBeVisible()
    await articleCard.click()

    const articleTitle = page.locator('.mx-library-v2__reader h1').first()
    await expect(articleTitle).toBeVisible({ timeout: 5_000 })

    // Back-action зарегистрирован (читалка → каталог статей)
    await page.waitForTimeout(500)
    const level2 = await hasBackAction(page)
    expect(level2.hasAction).toBe(true)

    // Вызываем back: читалка → каталог статей
    await callBackAction(page)
    await expect(page.getByText('статьи.')).toBeVisible({ timeout: 5_000 })

    // Вызываем back снова: каталог статей → корень библиотеки
    await callBackAction(page)
    await expect(page.getByText('библиотека.')).toBeVisible({ timeout: 5_000 })
  })

  test('Профиль → под-экран «Чек-ины»: back-action возвращает в корень', async ({ page }) => {
    await page.goto('/?demo=1')

    await expect(page.locator('[data-testid="today-streak-chip"]')).toBeVisible({ timeout: 15_000 })

    // Открываем профиль
    await page.locator('[data-testid="today-profile-button"]').click()
    await expect(page.locator('[data-testid="profile-screen"]')).toBeVisible({ timeout: 5_000 })

    // В корне профиля back-action зарегистрирован (ProfilePage → закрыть)
    await page.waitForTimeout(500)
    const root = await hasBackAction(page)
    expect(root.hasAction).toBe(true)

    // Открываем под-экран "Чек-ины"
    await page.locator('[data-testid="profile-row-checkins"]').click()
    await expect(page.locator('[data-testid="profile-sub-checkins"]')).toBeVisible({ timeout: 5_000 })

    // Back-action зарегистрирован (под-экран → корень профиля)
    await page.waitForTimeout(500)
    const sub = await hasBackAction(page)
    expect(sub.hasAction).toBe(true)

    // Вызываем back
    await callBackAction(page)

    // Должны вернуться в корень профиля
    await expect(page.locator('[data-testid="profile-screen"]')).toBeVisible({ timeout: 5_000 })
  })
})
