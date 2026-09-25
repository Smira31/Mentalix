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
    expect(scrollTopAfter).toBeGreaterThan(150)
  })

  test('«Сегодня» через 5 с: elementFromPoint — контент, скролл работает, нет невидимых слоёв', async ({ page }) => {
    await page.goto('/?demo=1')

    await expect(page.locator('[data-testid="today-streak-chip"]')).toBeVisible({ timeout: 15_000 })

    // Ждём 5 секунд: демо-данные, тултип серии, подсказки, значки
    await page.waitForTimeout(5000)

    const diagnostics = await page.evaluate(() => {
      const W = window.innerWidth
      const H = window.innerHeight

      // 1. elementFromPoint в 5 точках
      const points = [
        { name: 'center', x: W / 2, y: H / 2 },
        { name: 'quarter', x: W / 2, y: H / 4 },
        { name: 'three-quarter', x: W / 2, y: (H * 3) / 4 },
      ]
      const hits = points.map(p => {
        const el = document.elementFromPoint(p.x, p.y)
        // Поднимаемся до mx-screen-shell или mx-app-scroll-root
        let walker = el
        let belongsToToday = false
        while (walker) {
          const cls = walker.className?.toString?.() || ''
          if (cls.includes('mx-screen-shell') || cls.includes('mx-app-scroll-root')) {
            belongsToToday = true
            break
          }
          walker = walker.parentElement
        }
        return { point: p.name, belongsToToday, tag: el?.tagName?.toLowerCase() }
      })

      // 2. Программный скролл на 400px (или максимум)
      const root = document.querySelector('.mx-app-scroll-root')
      const maxScroll = root ? root.scrollHeight - root.clientHeight : 0
      const targetScroll = Math.min(400, maxScroll)
      root?.scrollTo({ top: targetScroll, behavior: 'instant' })
      const scrollTopAfter = root?.scrollTop ?? 0
      root?.scrollTo({ top: 0, behavior: 'instant' })

      // 3. Невидимые фиксированные/абсолютные слои ≥50% экрана
      const all = document.querySelectorAll('*')
      const invisibleOverlays = []
      for (const el of all) {
        const style = getComputedStyle(el)
        if (style.position !== 'fixed' && style.position !== 'absolute') continue
        const rect = el.getBoundingClientRect()
        if (rect.width < W * 0.5 || rect.height < H * 0.5) continue
        const isVisible = style.visibility !== 'hidden' &&
          style.display !== 'none' &&
          parseFloat(style.opacity) > 0
        const pointerEvents = style.pointerEvents
        // Невидимый слой с pointer-events ≠ none — баг
        if (!isVisible && pointerEvents !== 'none') {
          invisibleOverlays.push({
            tag: el.tagName?.toLowerCase(),
            cls: (el.className?.toString?.() || '').slice(0, 100),
            opacity: style.opacity,
            visibility: style.visibility,
            pointerEvents,
          })
        }
      }

      return {
        hits,
        scrollTest: { target: targetScroll, actual: scrollTopAfter, maxScroll },
        invisibleOverlays,
      }
    })

    console.log('5s diagnostics:', JSON.stringify(diagnostics, null, 2))

    // elementFromPoint во всех точках принадлежит контенту Today
    for (const hit of diagnostics.hits) {
      expect(hit.belongsToToday, `point ${hit.point} should belong to Today content`).toBe(true)
    }

    // Программный скролл работает
    expect(diagnostics.scrollTest.actual).toBeGreaterThan(0)

    // Нет невидимых слоёв ≥50% экрана с pointer-events ≠ none
    expect(diagnostics.invisibleOverlays).toEqual([])
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

  test('«Сегодня» с закрытыми подсказками: scrollHeight > clientHeight, последний блок выше навбара', async ({ page }) => {
    // Подсказки закрыты: тултип серии + подсказка о карточках
    await page.addInitScript(() => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem('mx-onboarded-v2', '1')
      localStorage.setItem('mx-app-lock-enabled', '0')
      localStorage.setItem('mx-today-cards-hint-dismissed', 'true')
      localStorage.setItem('mx-series-preferences:900001:tooltip-seen', '1')
      sessionStorage.setItem('mentalix:demo-scenario:v1', 'Неделя')
    })

    await page.goto('/?demo=1')

    await expect(page.locator('[data-testid="today-streak-chip"]')).toBeVisible({ timeout: 15_000 })

    // Подсказки не показаны
    await expect(page.locator('[data-testid="today-cards-hint"]')).not.toBeVisible()
    await expect(page.locator('.mx-today-series-tooltip')).not.toBeVisible()

    // Ждём завершения анимации входа
    await page.waitForTimeout(600)

    const measurements = await page.evaluate(() => {
      const root = document.querySelector('.mx-app-scroll-root')
      if (!root) return { error: 'scroll-root not found' }

      return {
        scrollHeight: root.scrollHeight,
        clientHeight: root.clientHeight,
        paddingBottom: getComputedStyle(root).paddingBottom,
      }
    })

    console.log('TODAY (hints dismissed) measurements:', JSON.stringify(measurements, null, 2))

    // scrollHeight > clientHeight — контент больше вьюпорта даже без подсказок
    expect(measurements.scrollHeight).toBeGreaterThan(measurements.clientHeight)

    // Прокрутка в конец
    await page.evaluate(() => {
      const root = document.querySelector('.mx-app-scroll-root')
      root?.scrollTo({ top: root.scrollHeight - root.clientHeight, behavior: 'instant' })
    })

    await page.waitForTimeout(300)

    // Последний блок контента полностью виден над нижним меню:
    // его нижний край (viewport-координаты) не должен заходить в padding-bottom
    const visibility = await page.evaluate(() => {
      const root = document.querySelector('.mx-app-scroll-root')
      if (!root) return { error: 'no scroll-root' }

      const shell = document.querySelector('.mx-screen-shell')
      if (!shell) return { error: 'no screen-shell' }

      let lastChild = null
      for (const child of shell.children) {
        const rect = child.getBoundingClientRect()
        if (rect.width > 0 || rect.height > 0) {
          lastChild = child
        }
      }

      if (!lastChild) return { error: 'no visible last child' }

      const rootRect = root.getBoundingClientRect()
      const lastRect = lastChild.getBoundingClientRect()
      const paddingBottom = parseFloat(getComputedStyle(root).paddingBottom)

      // Граница контента и padding в viewport-координатах:
      // rootRect.bottom — низ скролл-контейнера, paddingBottom — отступ под навбар
      const contentBottom = rootRect.bottom - paddingBottom

      return {
        lastBottom: lastRect.bottom,
        contentBottom,
        rootBottom: rootRect.bottom,
        rootTop: rootRect.top,
        paddingBottom,
        gap: contentBottom - lastRect.bottom,
        lastChildTag: lastChild.tagName?.toLowerCase(),
        lastChildCls: (lastChild.className?.toString?.() || '').slice(0, 80),
      }
    })

    console.log('Last block visibility:', JSON.stringify(visibility, null, 2))

    // Последний блок выше границы padding — не перекрыт навбаром
    // (допускаем субпиксельную погрешность 1px)
    expect(visibility.lastBottom).toBeLessThanOrEqual(visibility.contentBottom + 1)
    expect(visibility.gap).toBeGreaterThanOrEqual(-1)
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
