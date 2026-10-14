import { expect, test } from '@playwright/test'

import { openDayCard } from './checkin-helpers.mjs'

/*
 * MXL-KEYBOARD-001 — контракт клавиатуры и автофокуса (браузерный уровень).
 *
 * Проверяем ровно то, что видно из страницы: `document.activeElement` после
 * пользовательского перехода. Это НЕ доказательство открытия клавиатуры на
 * реальном iPhone/Telegram — тот gate остаётся ручным (NOT RUN, см. отчёт).
 *
 * Категории (см. карту входов в docs/KEYBOARD_FOCUS.md):
 *  - чек-ин: текстовый шаг;
 *  - курс «Путь героя»: шаг записи;
 *  - чат с наставником: поле сообщения;
 *  - дневник: поток и вопрос дня + черновик + кнопка продолжения.
 *
 * Поиск — только по data-testid. Никаких waitForTimeout: ожидаем состояние
 * (`expect.poll`/`waitForFunction`), а окно наблюдения за повторным захватом
 * фокуса замеряется внутри страницы и служит доказательством ОТСУТСТВИЯ
 * события, а не маскировкой дефекта.
 */

const TODAY = '/?demo=1&frame=0'
const PRACTICES = '/?demo=1&tab=practices&frame=0'
const HERO_JOURNEY = '/?demo=1&tab=library&action=hero_journey&frame=0'
const MENTOR = '/?demo=1&tab=mentor&frame=0'

const VIEWPORT = { width: 393, height: 852 }

const CHECKIN_INPUT = '[data-testid="checkin-text-input"]'

/** Текущий фокус страницы в терминах теста. */
function readFocus(page) {
  return page.evaluate(() => {
    const el = document.activeElement
    if (!el || el === document.body) return { testId: null, tag: 'body', editable: false }
    const tag = el.tagName.toLowerCase()
    return {
      testId: el.getAttribute('data-testid'),
      tag,
      editable: tag === 'input' || tag === 'textarea' || el.isContentEditable === true,
    }
  })
}

/** Поле получило фокус само — без клика по нему. */
async function expectAutoFocus(page, testId) {
  await expect
    .poll(async () => (await readFocus(page)).testId, {
      timeout: 4_000,
      message: `автофокус: поле ${testId} должно получить фокус без нажатия`,
    })
    .toBe(testId)
}

/**
 * «Пользователь закрыл клавиатуру»: снимаем фокус и наблюдаем окно повторных
 * попыток хука (rAF + 120 мс). Фокус не должен вернуться сам.
 */
async function expectNoFocusRecapture(page, testId) {
  const samples = await page.evaluate(async sel => {
    const field = document.querySelector(sel)
    if (!field) return null
    document.activeElement?.blur?.()
    const out = []
    for (let i = 0; i < 12; i += 1) {
      await new Promise(resolve => setTimeout(resolve, 40))
      out.push(document.activeElement === field || field.contains(document.activeElement))
    }
    return out
  }, `[data-testid="${testId}"]`)

  expect(samples, `поле ${testId} не найдено`).not.toBeNull()
  expect(
    samples.some(Boolean),
    `поле ${testId} вернуло себе фокус после того, как пользователь его закрыл`
  ).toBe(false)
}

/** Кнопка действия доступна: видима, включена и целиком в видимой области. */
async function expectActionAvailable(page, testId) {
  const action = page.locator(`[data-testid="${testId}"]`)
  await expect(action).toBeVisible()
  await expect(action).toBeEnabled()
  const box = await action.boundingBox()
  expect(box, `${testId}: геометрия`).not.toBeNull()
  const viewport = page.viewportSize()
  expect(box.y, `${testId}: кнопка ушла за верх экрана`).toBeGreaterThanOrEqual(-1)
  expect(box.y + box.height, `${testId}: кнопка ушла за низ экрана`).toBeLessThanOrEqual(
    viewport.height + 1
  )
}

/**
 * Переход шага завершён. Пока идёт анимация смены шага, в DOM одновременно
 * живут два экрана шага (~330 мс): старый ещё не размонтирован, и его кнопки
 * остаются в разметке. Клик по такому «призраку» ничего не выбирает в новом
 * шаге, поэтому ждём состояние — в DOM остался один экран шага.
 */
async function waitForSingleStep(page) {
  await expect
    .poll(
      () =>
        page.evaluate(
          () => document.querySelectorAll('.mx-checkin-question, .mx-completion').length
        ),
      { timeout: 5_000, message: 'смена шага: в DOM должен остаться один экран шага' }
    )
    .toBe(1)
}

/** Нажать «Далее» и дождаться, что новый шаг действительно смонтирован. */
async function goToNextStep(page) {
  const next = page.locator('[data-testid="checkin-next"]')
  await expect(next).toBeEnabled()
  await next.click()
  await waitForSingleStep(page)
}

/** Дойти до текстового шага чек-ина, не касаясь поля. */
async function reachCheckinTextStep(page) {
  await waitForSingleStep(page)

  for (let step = 0; step < 14; step += 1) {
    if (await page.locator(CHECKIN_INPUT).count()) return
    if (await page.locator('.mx-completion').count()) {
      throw new Error('чек-ин дошёл до финала, не показав текстовый шаг')
    }

    const scale = page.locator('[data-testid="checkin-scale-option"]:not([aria-checked="true"])')
    if (await scale.count()) await scale.first().click()
    const focusTile = page.locator('[data-testid="checkin-day-focus-option"][aria-pressed="false"]')
    if (await focusTile.count()) await focusTile.first().click()
    const emotion = page.locator('[data-testid="checkin-emotion-pill"][aria-pressed="false"]')
    if (await emotion.count()) await emotion.first().click()

    await goToNextStep(page)
  }

  throw new Error('текстовый шаг чек-ина не найден')
}

/*
 * ── 1. Чек-ин: текстовый шаг после пользовательского перехода ──
 */
test('чек-ин: текстовый шаг забирает фокус и не возвращает его после закрытия', async ({
  page,
}) => {
  await page.setViewportSize(VIEWPORT)
  await page.goto(TODAY)
  await expect(page.getByTestId('today-card-morning')).toBeVisible()
  await openDayCard(page, 'morning')

  await reachCheckinTextStep(page)

  // Поле появилось из-за перехода на шаг — фокус пришёл сам.
  await expectAutoFocus(page, 'checkin-text-input')
  // Продолжение шага несёт сам редактор (`checkin-complete`), а не отдельная «Далее».
  await expectActionAvailable(page, 'checkin-complete')

  // Пользователь закрыл клавиатуру — поле не отбирает фокус обратно.
  await expectNoFocusRecapture(page, 'checkin-text-input')

  // Текст на месте после закрытия клавиатуры, продолжение доступно.
  // Продолжение текстового шага чек-ина — круглая стрелка самого редактора
  // (`checkin-complete`): отдельной `checkin-next` на этом шаге нет, поэтому
  // проверяем именно ту кнопку, которой редактор продолжает шаг.
  const note = 'Тест: спокойное утро и один короткий шаг.'
  await page.locator(CHECKIN_INPUT).fill(note)
  await expect(page.locator(CHECKIN_INPUT)).toContainText('спокойное утро')
  await expectActionAvailable(page, 'checkin-complete')

  // Продолжение действительно работает: последний утренний шаг ведёт к финалу.
  await page.locator('[data-testid="checkin-complete"]').click()
  await expect(page.locator('.mx-completion')).toBeVisible()
})

/*
 * ── 2. Курс «Путь героя»: шаг записи ──
 */
test('курс: поле шага записи получает фокус после «Начать шаг»', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  await page.goto(HERO_JOURNEY)

  // Первый шаг курса открывается по своему testid, а не «первой карточкой»:
  // набор доступных шагов зависит от прогресса профиля.
  const stepCard = page.getByTestId('hero-step-uncertainty')
  await expect(stepCard).toBeVisible()
  await stepCard.click()

  await expect(page.getByTestId('hero-step-start')).toBeVisible()
  await page.getByTestId('hero-step-start').click()

  await expect(page.getByTestId('hero-write-input')).toBeVisible()
  await expectAutoFocus(page, 'hero-write-input')
  await expectActionAvailable(page, 'hero-write-next')

  // Текст, набранный до закрытия клавиатуры, сохраняется, продолжение доступно.
  const entry = 'Тест: назову то, что пока не знаю.'
  await page.getByTestId('hero-write-input').fill(entry)
  await expect(page.getByTestId('hero-write-input')).toContainText('назову то, что')
  await expectNoFocusRecapture(page, 'hero-write-input')
  await expect(page.getByTestId('hero-write-input')).toContainText('назову то, что')
  await expectActionAvailable(page, 'hero-write-next')
})

/*
 * ── 3. Чат с наставником: поле сообщения ──
 */
test('чат наставника: поле сообщения получает фокус при входе в разговор', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  await page.goto(MENTOR)

  const start = page.locator('[data-testid^="mentor-start-"]').first()
  await expect(start).toBeVisible()
  await start.click()

  await expect(page.getByTestId('mentor-input')).toBeVisible()
  await expectAutoFocus(page, 'mentor-input')
})

/*
 * ── 4. Дневник: поток, вопрос дня, черновик и продолжение ──
 */
test('дневник: шаги записи забирают фокус, черновик сохраняется, «Далее» доступно', async ({
  page,
}) => {
  await page.setViewportSize(VIEWPORT)
  await page.goto(PRACTICES)
  await expect(page.getByTestId('journal-open-cta')).toBeVisible()
  await page.getByTestId('journal-open-cta').click()

  // Настройка нужна только на чистом профиле: заполняем шаги и идём к ревью.
  const intro = page.getByTestId('dj-intro-setup')
  if (await intro.count()) await intro.click()
  await expect(page.locator('.mx-dj-setup').first()).toBeVisible()

  for (let step = 0; step < 14; step += 1) {
    if (await page.locator('.mx-dj-review').count()) break
    const fields = page.locator('.mx-dj-setup__input, .mx-dj-setup__vision-field')
    const count = await fields.count()
    for (let k = 0; k < count; k += 1) {
      const field = fields.nth(k)
      if ((await field.inputValue().catch(() => null)) === '') {
        await field.fill('Тестовая цель настройки дневника')
      }
    }
    const off = page.getByTestId('dj-setup-reminder-off')
    if (await off.count()) await off.first().click()
    await page.getByTestId('dj-setup-next').click()
    await expect(page.locator('.mx-dj-review')).toBeVisible({ timeout: 6_000 }).catch(() => {})
  }

  await expect(page.locator('.mx-dj-review')).toBeVisible()
  await page.getByTestId('dj-review-next').click()

  // Шаг «поток»: поле получило фокус само.
  await expect(page.getByTestId('dj-stream-input')).toBeVisible()
  await expectAutoFocus(page, 'dj-stream-input')

  const streamText = 'Тест: короткая запись потока для проверки черновика и фокуса.'
  await page.getByTestId('dj-stream-input').fill(streamText)
  await expectActionAvailable(page, 'dj-stream-next')

  // Черновик записан локально (дебаунс 400 мс) — текст переживает уход с экрана.
  await expect
    .poll(
      async () =>
        page.evaluate(text => {
          const key = Object.keys(localStorage).find(k =>
            k.startsWith('mx-daily-journal-draft')
          )
          if (!key) return false
          try {
            return String(JSON.parse(localStorage.getItem(key)).streamText || '').includes(text)
          } catch {
            return false
          }
        }, streamText),
      { timeout: 5_000, message: 'черновик потока должен сохраниться локально' }
    )
    .toBe(true)

  await page.getByTestId('dj-stream-next').click()

  // Шаг «вопрос дня»: снова автофокус на новом шаге.
  await expect(page.getByTestId('dj-question-input')).toBeVisible()
  await expectAutoFocus(page, 'dj-question-input')
  await page.getByTestId('dj-question-input').fill('Один спокойный шаг важнее идеального плана.')
  await expectActionAvailable(page, 'dj-question-next')
  await expectNoFocusRecapture(page, 'dj-question-input')
})

/*
 * ── 5. Регрессия: отложенный повтор не возвращает фокус после ручного закрытия ──
 *
 * Воспроизведение исходного дефекта. Хук ставит фокус синхронно и повторяет
 * его в requestAnimationFrame и через 120 мс (чтобы клавиатура открылась на
 * iOS/Telegram WebView). Если пользователь закрывал клавиатуру сразу после
 * входа в шаг, отложенный повтор ставил фокус обратно — поле «отбирало»
 * клавиатуру.
 *
 * Здесь закрытие происходит сразу после автофокуса, но до отложенного повтора:
 * обработчик `focusin` снимает фокус на следующем кадре после того, как поле
 * его получило. Следующий кадр берётся намеренно — в dev-режиме StrictMode
 * прогоняет эффект монтирования дважды, поэтому синхронный blur в том же тике
 * приходится на повторную установку эффекта, а не на отложенный повтор.
 * На исправленном хуке blur отменяет повторы (фокус ровно один), на прежнем —
 * повтор возвращал фокус и счётчик становился больше единицы.
 */
test('регрессия: закрытие клавиатуры сразу после входа в шаг отменяет повторный захват', async ({
  page,
}) => {
  await page.setViewportSize(VIEWPORT)

  // Вооружаем страницу до монтирования поля: первый автофокус сразу закрывается.
  await page.addInitScript(() => {
    const state = { focusCount: 0 }
    window.__mxManualClose = state
    document.addEventListener('focusin', event => {
      const field = document.querySelector('[data-testid="mentor-input"]')
      if (!field || event.target !== field) return
      state.focusCount += 1
      if (state.focusCount === 1) {
        window.requestAnimationFrame(() => field.blur())
      }
    })
  })

  await page.goto(MENTOR)

  const start = page.locator('[data-testid^="mentor-start-"]').first()
  await expect(start).toBeVisible()
  await start.click()
  await expect(page.getByTestId('mentor-input')).toBeVisible()

  // Автофокус случился: поле получило фокус после клика, а не по касанию.
  await expect
    .poll(() => page.evaluate(() => window.__mxManualClose.focusCount), {
      timeout: 4_000,
      message: 'поле должно получить автофокус после входа в разговор',
    })
    .toBeGreaterThanOrEqual(1)

  // Окно отложенных повторов хука (rAF + 120 мс): фокус не возвращается сам.
  const frames = await page.evaluate(async () => {
    const field = document.querySelector('[data-testid="mentor-input"]')
    const out = []
    for (let i = 0; i < 14; i += 1) {
      await new Promise(resolve => setTimeout(resolve, 40))
      out.push(document.activeElement === field)
    }
    return out
  })

  expect(
    frames.some(Boolean),
    'поле вернуло себе фокус после того, как пользователь закрыл клавиатуру'
  ).toBe(false)
  expect(
    await page.evaluate(() => window.__mxManualClose.focusCount),
    'автофокус должен сработать ровно один раз на вход в шаг'
  ).toBe(1)
})
