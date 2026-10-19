import { expect, test } from '@playwright/test'

import { DIALOG_STARTER_CHIPS } from '../../src/data/prompts.js'

/*
 * Экран «Диалог» (вкладка Наставник): карусель ролей, блок «Продолжить
 * разговор», стартовые чипсы и чат. Всё на data-testid, без waitForTimeout.
 * Демо: ?demo=1 даёт 3 разговора разных ролей с историей.
 */

test.use({
  viewport: { width: 393, height: 852 },
  isMobile: true,
  hasTouch: true,
})

async function openDialog(page) {
  await page.goto('/?demo=1&tab=mentor')
  await expect(page.getByTestId('dialog-entry')).toBeVisible({ timeout: 15_000 })
}

/** Фокус стоит в поле сообщения (то, чем открывается клавиатура). */
function inputFocused(page) {
  return page.evaluate(
    () => document.activeElement === document.querySelector('[data-testid="mentor-input"]')
  )
}

/**
 * Окно отложенных повторов автофокуса (rAF + 120 мс): замер идёт внутри
 * страницы и служит доказательством ОТСУТСТВИЯ события, а не маскировкой
 * дефекта (тот же приём в tests/ux/keyboard-focus.spec.mjs).
 */
function watchFocusRecapture(page) {
  return page.evaluate(async () => {
    const field = document.querySelector('[data-testid="mentor-input"]')
    let captured = false
    for (let i = 0; i < 12; i += 1) {
      await new Promise(resolve => setTimeout(resolve, 40))
      if (document.activeElement === field) captured = true
    }
    return captured
  })
}

test.describe('Диалог — экран выбора роли', () => {
  test('страница «Диалога» листается целиком', async ({ page }) => {
    await openDialog(page)

    const scrollRoot = page.getByTestId('app-scroll-root')
    const metrics = await scrollRoot.evaluate(el => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }))
    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight)

    await page.mouse.move(196, 140)
    await page.mouse.wheel(0, 900)

    await expect.poll(() => scrollRoot.evaluate(el => el.scrollTop)).toBeGreaterThan(0)
  })

  test('четыре карточки, последняя — Даймон', async ({ page }) => {
    await openDialog(page)

    const cards = page.getByTestId('mentor-persona-card')
    await expect(cards).toHaveCount(4)
    await expect(cards.nth(0)).toContainText('Наставник')
    await expect(cards.nth(1)).toContainText('Спутник')
    await expect(cards.nth(2)).toContainText('Наблюдатель')
    await expect(cards.nth(3)).toContainText('Даймон')

    await expect(cards.nth(1)).toContainText('Выслушает, когда нужно выговориться.')
    await expect(cards.nth(3)).toContainText('Брось кубик и узнай, где ты сейчас.')
  })

  test('«Начать» у Спутника открывает пустой чат', async ({ page }) => {
    await openDialog(page)

    await page.getByTestId('mentor-start-mayak').click()

    await expect(page.getByTestId('mentor-input')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Спутник' })).toBeVisible()
    await expect(page.getByTestId('chat-message-assistant')).toHaveCount(0)
    await expect(page.getByTestId('chat-message-user')).toHaveCount(0)
  })

  test('стартовый чипс открывает чат с длинным текстом в поле, но без отправки', async ({ page }) => {
    await openDialog(page)

    const chip = page.getByTestId('dialog-starter-chip').first()
    await expect(chip).toBeVisible()
    // Надпись чипса — короткая (2–3 слова), а в поле уходит прежний стартер роли.
    const chipLabel = (await chip.innerText()).trim()
    expect(chipLabel.length).toBeGreaterThan(0)
    expect(chipLabel.split(/\s+/).length).toBeLessThanOrEqual(4)
    // MXL-DIALOG-CHIPS-002: у чипса закреплён свой фиксированный длинный
    // стартер (не дневная ротация pickByDay), он и уходит в поле ввода.
    const expectedDraft = DIALOG_STARTER_CHIPS[0].starter

    await chip.click()

    const input = page.getByTestId('mentor-input')
    await expect(input).toBeVisible()
    await expect(input).toHaveValue(expectedDraft)
    await expect(page.getByTestId('chat-message-user')).toHaveCount(0)
    await expect(page.getByTestId('chat-message-assistant')).toHaveCount(0)
  })

  test('чипсы встают облаком в 2–3 ряда и не переносят текст', async ({ page }) => {
    await openDialog(page)

    const chips = page.getByTestId('dialog-starter-chip')
    await expect(chips).toHaveCount(5)

    const metrics = await chips.evaluateAll(elements =>
      elements.map(element => ({
        row: Math.round(element.getBoundingClientRect().top),
        overflow: element.scrollWidth - element.clientWidth,
      }))
    )

    const rows = new Set(metrics.map(item => item.row)).size
    expect(rows, 'Чипсы должны вставать в 2–3 ряда').toBeGreaterThanOrEqual(2)
    expect(rows, 'Чипсы должны вставать в 2–3 ряда').toBeLessThanOrEqual(3)
    for (const item of metrics) {
      expect(item.overflow, 'Ни один чипс не переносит текст').toBeLessThanOrEqual(0)
    }
  })

  test('«Продолжить разговор» в демо открывает разговор с историей', async ({ page }) => {
    await openDialog(page)

    const block = page.getByTestId('continue-conversation-block')
    await expect(block).toBeVisible()

    const rows = page.getByTestId('continue-conversation-row')
    await expect(rows).toHaveCount(3)
    await expect(rows.first()).toContainText('Спутник')
    await expect(rows.first()).toContainText('вчера')

    await rows.first().click()

    await expect(page.getByTestId('mentor-input')).toBeVisible()
    await expect(page.getByTestId('chat-message-assistant').first()).toBeVisible()
  })

  test('«Новый разговор» очищает чат', async ({ page }) => {
    await openDialog(page)

    await page.getByTestId('continue-conversation-row').first().click()
    await expect(page.getByTestId('chat-message-assistant').first()).toBeVisible()

    await page.getByTestId('conversation-new-pill').click()

    await expect(page.getByTestId('chat-message-assistant')).toHaveCount(0)
    await expect(page.getByTestId('chat-message-user')).toHaveCount(0)
  })

  test('над ответами нет метки имени роли — только пузырь', async ({ page }) => {
    await openDialog(page)

    await page.getByTestId('continue-conversation-row').first().click()

    const assistantRow = page.getByTestId('chat-message-assistant').first()
    await expect(assistantRow).toBeVisible()
    await expect(assistantRow.locator(':scope > *').first()).toHaveAttribute(
      'data-testid',
      'chat-message-bubble'
    )
  })

  /*
   * MXL-QA-038: пока чат пуст, содержимое умещается — у списка сообщений нет
   * своей прокрутки, и экран не листается без необходимости. Длинная история —
   * отдельный сценарий ниже.
   */
  test('пустой чат не прокручивается без необходимости', async ({ page }) => {
    await openDialog(page)

    await page.getByTestId('mentor-start-mayak').click()

    await expect(page.getByTestId('mentor-input')).toBeVisible()
    await expect(page.getByText('Напиши первым — Спутник ответит.')).toBeVisible()

    const metrics = await page.locator('.mx-conversation-scroll').evaluate(el => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      scrollTop: el.scrollTop,
    }))

    expect(
      metrics.scrollHeight,
      'пустой чат не должен прокручиваться без необходимости'
    ).toBeLessThanOrEqual(metrics.clientHeight + 1)
    expect(metrics.scrollTop, 'пустой чат не должен быть прокручен').toBe(0)

    // Содержимое пустого чата видно целиком: подпись роли и поле ввода.
    await expect(page.getByText('Напиши первым — Спутник ответит.')).toBeInViewport()
    await expect(page.getByTestId('mentor-input')).toBeInViewport()
  })

  /*
   * MXL-DIALOG-HERO-STABLE-001: место под иллюстрацию шапки «Диалога» занято до
   * загрузки PNG, поэтому пустой диалог открывается на месте и не дёргается.
   * Раньше картинка была нулевой высоты и, загрузившись, сдвигала весь экран
   * вниз. PNG отдаётся с задержкой: сначала меряется место под ещё не загруженную
   * иллюстрацию, затем — после загрузки; позиция и высота обязаны совпасть, а
   * страница остаться непрокрученной.
   */
  test('пустой диалог: иллюстрация не меняет позицию после загрузки, страница не прокручена', async ({
    page,
  }) => {
    let releaseImage
    const imageHeld = new Promise(resolve => {
      releaseImage = resolve
    })
    // Держим именно картинку: запрос модуля того же PNG (import в dev-сервере
    // Vite) отпускаем сразу, иначе не доедет ленивая вкладка «Диалог».
    await page.route(/dialog-hero-reference/, async route => {
      if (route.request().resourceType() !== 'image') {
        await route.continue()
        return
      }

      await imageHeld
      await route.continue()
    })

    await page.goto('/?demo=1&tab=mentor', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('dialog-entry')).toBeVisible({ timeout: 15_000 })

    const measure = () =>
      page.evaluate(() => {
        const hero = document.querySelector('.mx-dialog-hero-reference')
        const track = document.querySelector('[data-testid="mentor-persona-track"]')
        const root = document.querySelector('[data-testid="app-scroll-root"]')
        return {
          heroTop: hero.getBoundingClientRect().top,
          heroHeight: hero.getBoundingClientRect().height,
          trackTop: track.getBoundingClientRect().top,
          loaded: hero.complete && hero.naturalWidth > 0,
          scrollTop: root.scrollTop,
        }
      })

    const before = await measure()
    expect(
      before.loaded,
      'картинка шапки ещё не загружена — замер идёт по занятому месту'
    ).toBe(false)
    expect(before.heroHeight, 'место под иллюстрацию занято до загрузки PNG').toBeGreaterThan(0)
    expect(before.scrollTop, '«Диалог» открывается без прокрутки').toBe(0)

    releaseImage()

    await expect
      .poll(() => measure().then(metrics => metrics.loaded), { message: 'иллюстрация загрузилась' })
      .toBe(true)

    const after = await measure()
    expect(after.heroTop, 'иллюстрация не сдвинулась после загрузки').toBeCloseTo(before.heroTop, 1)
    expect(after.heroHeight, 'высота иллюстрации не изменилась после загрузки').toBeCloseTo(
      before.heroHeight,
      1
    )
    expect(after.trackTop, 'карусель ролей не сдвинулась после загрузки').toBeCloseTo(
      before.trackTop,
      1
    )
    expect(after.scrollTop, 'загрузка иллюстрации не прокрутила страницу').toBe(0)
  })

  /*
   * MXL-QA-038: длинная история прокручивается, и последняя реплика остаётся
   * на виду. История набирается отправкой: демо-разговоры короткие и в экран
   * помещаются.
   */
  test('длинная история прокручивается, последняя реплика видна', async ({ page }) => {
    await openDialog(page)

    await page.getByTestId('mentor-start-mayak').click()

    const input = page.getByTestId('mentor-input')
    await expect(input).toBeVisible()

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const before = await page.getByTestId('chat-message-assistant').count()

      await input.fill(
        `${attempt}. Тест: ${'Спокойно разбираю то, что накопилось за день. '.repeat(6)}`
      )
      await page.getByTestId('mentor-composer-action').click()

      await expect
        .poll(() => page.getByTestId('chat-message-assistant').count(), {
          message: 'ответ на отправленное сообщение',
        })
        .toBeGreaterThan(before)
    }

    const scroll = page.locator('.mx-conversation-scroll')
    const metrics = await scroll.evaluate(el => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }))
    expect(metrics.scrollHeight, 'длинная история должна прокручиваться').toBeGreaterThan(
      metrics.clientHeight
    )

    // Последняя реплика наставника — в видимой части экрана.
    await expect(page.getByTestId('chat-message-assistant').last()).toBeInViewport()
  })

  /*
   * MXL-QA-039: клавиатуру можно закрыть самому — тапом вне поля ввода.
   * Фокус после этого не возвращается: ни отложенным повтором автофокуса, ни
   * отправкой (она возвращает клавиатуру только тому, кто в поле писал).
   */
  test('тап вне поля закрывает клавиатуру, и фокус не возвращается сам', async ({ page }) => {
    await openDialog(page)

    await page.getByTestId('mentor-start-mayak').click()

    const input = page.getByTestId('mentor-input')
    await expect(input).toBeVisible()
    await expect
      .poll(() => inputFocused(page), {
        timeout: 4_000,
        message: 'вход в разговор: поле получает фокус само',
      })
      .toBe(true)

    // Тап по чату вне composer'а — явное закрытие клавиатуры.
    await page.locator('.mx-conversation-scroll').click({ position: { x: 24, y: 24 } })
    await expect.poll(() => inputFocused(page), { message: 'тап вне поля снимает фокус' }).toBe(false)
    expect(await watchFocusRecapture(page), 'поле вернуло себе фокус само').toBe(false)

    // Текст набран и клавиатура закрыта человеком: отправка её не возвращает,
    // а сообщение всё равно уходит и получает ответ.
    await input.fill('Тест: сам закрыл клавиатуру.')
    await page.locator('.mx-conversation-scroll').click({ position: { x: 24, y: 24 } })
    await expect.poll(() => inputFocused(page), { message: 'клавиатура закрыта перед отправкой' }).toBe(
      false
    )

    await page.getByTestId('mentor-composer-action').click()

    await expect(page.getByTestId('chat-message-user').last()).toContainText('сам закрыл клавиатуру')
    await expect(page.getByTestId('chat-message-assistant').last()).toBeVisible()
    expect(
      await inputFocused(page),
      'отправка вернула фокус в поле, которое человек закрыл сам'
    ).toBe(false)
  })
})
