import { expect, test } from '@playwright/test'
import {
  HERO_JOURNEY_TRIALS,
  HERO_JOURNEY_CHAPTERS,
  HERO_JOURNEY_FINALE,
} from '../../src/data/heroJourney.js'

const DEMO_PROGRESS_KEY = 'mx-hero-journey-progress:900001'
const DEMO_DRAFT_KEY = 'mx-hero-journey-draft:900001:uncertainty'

// Один целевой сценарий: обрезка применяется только на завершении,
// первые два шага главы I проверяются в обеих Telegram-рамках.
// Финал (в демо его нет — тексты только с сервера) — отдельным сценарием ниже.
test('Завершение: кадр под Telegram, без большого зазора над Продолжить', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
    /* Шаг 4 главы I оставлен непройденным: с полностью закрытой главой
       «Продолжить» уводит на паузу между главами, а не на карту. */
    const ids = [
      'uncertainty',
      'temporality',
      'choice',
      'body',
      'phone',
      'autopilot',
      'digital-avatar',
      'comparison',
      'mirror',
      'loneliness',
      'relationships',
      'lost-supports',
      'age-crises',
      'meaning',
      'self-assembly',
    ]
    localStorage.setItem(
      'mx-hero-journey-progress:900001',
      JSON.stringify({
        completed: Object.fromEntries(
          ids.map((id, i) => [id, new Date(Date.now() - (ids.length - i) * 86400000).toISOString()])
        ),
        signs: {},
        reflections: {},
        actions: {},
      })
    )
  })

  for (const device of [
    { name: 'standard', width: 393, height: 852 },
    { name: 'max', width: 440, height: 956 },
  ]) {
    await page.setViewportSize({ width: device.width, height: device.height })
    await page.goto(`/?demo=1&tab=library&action=hero_journey&device=${device.name}`)
    await expect(page.getByTestId('hero-journey-map')).toBeVisible()

    for (const id of ['uncertainty', 'temporality']) {
      await page.getByTestId(`hero-step-${id}`).click()
      await expect(page.getByTestId('hero-step-start')).toBeVisible()
      const intro = page.locator('.mx-hj-step-intro .mx-hj-hero')
      await expect(intro).not.toHaveClass(/mx-hj-hero--cropped/)
      const introTop = await intro.evaluate(el => el.getBoundingClientRect().top)

      await page.getByTestId('hero-step-start').click()
      await page.getByTestId('hero-write-input').fill('Проверка завершения шага')
      await page.getByTestId('hero-write-next').click()
      await page.getByTestId('hero-action-input').fill('Одно проверочное действие')
      await page.getByTestId('hero-action-next').click()
      await expect(page.getByTestId('hero-complete-map')).toBeVisible()
      const hero = page.locator('.mx-hj-step-complete .mx-hj-hero')
      await expect(hero).toHaveClass(/mx-hj-hero--cropped/)
      await expect
        .poll(() => hero.locator('img').evaluate(img => img.complete && img.naturalWidth > 0))
        .toBe(true)

      const layout = await hero.evaluate(el => {
        const image = el.querySelector('img')
        const controls = document.querySelector('.mx-demo-telegram-chrome__controls')
        const content = document.querySelector('.mx-hj-complete')
        const button = document.querySelector('[data-testid="hero-complete-map"]')
        const column = el.closest('.mx-hj-step-complete')
        const frame = document.querySelector('[data-mentalix-demo-frame]')
        const rect = el.getBoundingClientRect()
        const imageRect = image.getBoundingClientRect()
        return {
          top: rect.top,
          belowControls: rect.top >= controls.getBoundingClientRect().bottom,
          fullWidth: Math.abs(rect.width - frame.clientWidth) <= 2,
          gap: button.getBoundingClientRect().top - content.getBoundingClientRect().bottom,
          buttonInside:
            button.getBoundingClientRect().bottom <= frame.getBoundingClientRect().bottom,
          noOverflow: column.scrollHeight <= column.clientHeight + 1,
          cropApplied: imageRect.top < rect.top && Math.abs(imageRect.width - rect.width) <= 1,
        }
      })
      expect(Math.abs(layout.top - introTop)).toBeLessThanOrEqual(1)
      expect(layout.belowControls).toBe(true)
      expect(layout.fullWidth).toBe(true)
      expect(layout.gap).toBeGreaterThanOrEqual(0)
      expect(layout.gap).toBeLessThanOrEqual(48)
      expect(layout.buttonInside).toBe(true)
      expect(layout.noOverflow).toBe(true)
      expect(layout.cropApplied).toBe(true)
      await page.getByTestId('hero-complete-map').click()
      await expect(page.getByTestId(`hero-step-${id}`)).toHaveAttribute('data-state', 'done')
    }
  }
})

/*
 * Дневного замка больше нет (решение владельца): следующий шаг открывается
 * сразу после завершения предыдущего — в том числе первый шаг следующей главы.
 * Обязательным остаётся только порядок: без пройденного предыдущего шага
 * следующий закрыт. Демо-главы II–IV без текстов показаны отдельной карточкой.
 */
for (const width of [393, 789]) {
  test(`Следующий шаг открыт сразу, порядок обязателен (${width})`, async ({ page }) => {
    await page.setViewportSize({ width, height: 852 })
    await page.addInitScript(key => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(
        key,
        JSON.stringify({
          // Шаг 1 пройден сегодня: раньше это запирало шаг 2 до следующего дня.
          completed: { uncertainty: new Date().toISOString() },
          signs: {},
          reflections: {},
          actions: {},
        })
      )
    }, DEMO_PROGRESS_KEY)
    await page.goto('/?demo=1&tab=library')
    await page.getByTestId('library-hero').click()
    await expect(page.getByTestId('hero-journey-map')).toBeVisible()
    // Шаг 2 открыт сразу — ждать следующего дня больше не нужно.
    await expect(page.getByTestId('hero-step-temporality')).toHaveAttribute('data-state', 'open')
    await expect(page.getByTestId('hero-step-temporality')).toBeEnabled()
    // Порядок обязателен: шаг 3 без шага 2 закрыт.
    await expect(page.getByTestId('hero-step-choice')).toHaveAttribute('data-state', 'locked')
    await expect(page.getByTestId('hero-step-choice')).toBeDisabled()
    // Доступные шаги главы I раскрыты, главы II–IV в демо закрыты карточкой.
    await expect(page.locator('.mx-hj-chapter--demo-locked')).toHaveCount(3)
    await expect(page.locator('.mx-hj-chapter--demo-locked').first()).toContainText(
      'Полная версия — в Telegram'
    )
    await page.getByTestId('hero-continue').click()
    await expect(page.getByTestId('hero-step-start')).toBeVisible()
  })
}

/*
 * Пауза между главами: после последнего шага главы (4, 8, 12) «Продолжить»
 * открывает экран паузы, а не следующий шаг; у промежуточных шагов поведение
 * прежнее — сразу карта. В демо глава II идёт без текстов, поэтому «Всё равно
 * дальше» не показывается, а «Вернусь завтра» ведёт на карту.
 */
test('Пауза после главы I: шаг 4 ведёт на паузу, шаг 3 — сразу на карту', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 })
  await page.addInitScript(key => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem(
      key,
      JSON.stringify({
        completed: { uncertainty: '2026-10-01', temporality: '2026-10-02' },
        signs: {},
        reflections: {},
        actions: {},
      })
    )
  }, DEMO_PROGRESS_KEY)
  await page.goto('/?demo=1&tab=library&action=hero_journey')
  await expect(page.getByTestId('hero-journey-map')).toBeVisible()

  async function passStep(id, note) {
    await page.getByTestId(`hero-step-${id}`).click()
    await page.getByTestId('hero-step-start').click()
    await page.getByTestId('hero-write-input').fill(`Запись: ${note}`)
    await page.getByTestId('hero-write-next').click()
    await page.getByTestId('hero-action-input').fill(`Действие: ${note}`)
    await page.getByTestId('hero-action-next').click()
    await expect(page.getByTestId('hero-complete-map')).toBeVisible()
  }

  // Шаг 3 главу не закрывает: «Продолжить» возвращает на карту без паузы.
  await passStep('choice', 'шаг 3')
  await page.getByTestId('hero-complete-map').click()
  await expect(page.getByTestId('hero-journey-map')).toBeVisible()
  await expect(page.getByTestId('hero-pause')).toHaveCount(0)

  // Шаг 4 закрывает главу I: на завершении открыта глава II, «Продолжить» — пауза.
  await passStep('abundance', 'шаг 4')
  await expect(page.locator('.mx-hj-complete__next-chapter')).toContainText('Открыта глава II')
  await page.getByTestId('hero-complete-map').click()
  await expect(page.getByTestId('hero-pause')).toBeVisible()
  await expect(page.getByTestId('hero-pause')).toContainText('глава позади.')
  await expect(page.getByTestId('hero-pause-next')).toHaveCount(0)

  // «Вернусь завтра» — на карту, шаг 4 отмечен пройденным.
  await page.getByTestId('hero-pause-stay').click()
  await expect(page.getByTestId('hero-journey-map')).toBeVisible()
  await expect(page.getByTestId('hero-step-abundance')).toHaveAttribute('data-state', 'done')
})

test('черновик сохраняется с debounce и при выходе, восстанавливается, очищается после завершения', async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 852 })
  await page.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.goto('/?demo=1&tab=library&action=hero_journey')
  await page.getByTestId('hero-continue').click()
  await page.getByTestId('hero-step-start').click()
  await page.getByTestId('hero-write-input').fill('Черновик первого шага')
  await expect
    .poll(() =>
      page.evaluate(
        key => JSON.parse(localStorage.getItem(key) || '{}').reflection?.trim(),
        DEMO_DRAFT_KEY
      )
    )
    .toBe('Черновик первого шага')
  // Новая правка + немедленный уход до истечения debounce.
  await page.getByTestId('hero-write-input').fill('Последняя правка перед выходом')
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.getByTestId('hero-step-start')).toBeVisible()
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.getByTestId('hero-journey-map')).toBeVisible()
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.getByTestId('library-home')).toBeVisible()
  await page.getByTestId('library-hero').click()
  await page.getByTestId('hero-continue').click()
  await page.getByTestId('hero-step-start').click()
  await expect(page.getByTestId('hero-write-input')).toHaveText('Последняя правка перед выходом')
  await page.getByTestId('hero-write-next').click()
  await expect(page.getByTestId('hero-action-input')).toBeVisible()
  await page.getByTestId('hero-action-input').fill('Одно действие')
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.getByTestId('hero-write-input')).toBeVisible()
  await page.getByTestId('hero-write-next').click()
  await expect(page.getByTestId('hero-action-input')).toHaveText('Одно действие')
  await page.getByTestId('hero-action-next').click()
  await expect(page.getByTestId('hero-complete-map')).toBeVisible()
  expect(await page.evaluate(key => localStorage.getItem(key), DEMO_DRAFT_KEY)).toBeNull()
  const progress = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('mx-hero-journey-progress:900001'))
  )
  expect(progress.reflections.uncertainty).toBe('Последняя правка перед выходом')
  expect(progress.actions.uncertainty).toBe('Одно действие')
  await page.getByTestId('hero-complete-map').click()
  await expect(page.getByTestId('hero-step-uncertainty')).toHaveAttribute('data-state', 'done')
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.locator('.mx-library-course-progress')).toHaveText('Шаг 2 из 16')
})

test('Вступление шага 1 на 375×667 без скролла, кнопка «Начать шаг» видна', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  // frame=0: приложение на реальном viewport, как на телефоне.
  await page.goto('/?demo=1&tab=library&action=hero_journey&frame=0')
  await page.getByTestId('hero-continue').click()
  const column = page.locator('.mx-hj-step-intro')
  await expect(page.getByTestId('hero-step-start')).toBeVisible()
  await expect(column).toBeVisible()
  const overflow = await column.evaluate(el => el.scrollHeight - el.clientHeight)
  expect(overflow).toBeLessThanOrEqual(0)
  const box = await page.getByTestId('hero-step-start').boundingBox()
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.y + box.height).toBeLessThanOrEqual(667)
  // Кнопка прижата к низу колонки, а не висит под текстом.
  expect(667 - (box.y + box.height)).toBeLessThanOrEqual(24)
  // Картинка гибкая: 110–260 px по свободной высоте экрана.
  const hero = await page.locator('.mx-hj-step-intro .mx-hj-hero').boundingBox()
  expect(hero.height).toBeGreaterThanOrEqual(110)
  expect(hero.height).toBeLessThanOrEqual(260)
  // Шрифт текста вступления не ниже 15 px.
  const fontSize = await page
    .locator('.mx-hj-step-intro__desc')
    .first()
    .evaluate(el => parseFloat(getComputedStyle(el).fontSize))
  expect(fontSize).toBeGreaterThanOrEqual(15)
})

/*
 * Шаги 5–16 и их тексты живут только на сервере, в демо текст есть у четырёх
 * шагов главы I. Проверяем все четыре: колонка без скролла, кнопка «Начать шаг»
 * видна целиком и прижата к низу, картинка не ниже минимума 76 px.
 */
const CHAPTER_I_IDS = ['uncertainty', 'temporality', 'choice', 'abundance']

for (const [width, height] of [
  [360, 640],
  [375, 667],
]) {
  test(`Вступление шага главы I на ${width}×${height}: без скролла, кнопка видна целиком`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height })
    await page.addInitScript(
      ({ key, value }) => {
        localStorage.clear()
        sessionStorage.clear()
        localStorage.setItem(key, value)
      },
      {
        // Demo-режим работает под пользователем 900001 и чистит чужие scope-ключи,
        // поэтому прогресс обязан лежать под этим ключом — иначе карточки заблокированы.
        key: 'mx-hero-journey-progress:900001',
        value: JSON.stringify({
          // Весь путь пройден: все главы раскрыты, любой шаг открыт по карточке.
          completed: Object.fromEntries(
            [
              'uncertainty',
              'temporality',
              'choice',
              'abundance',
              'body',
              'phone',
              'autopilot',
              'digital-avatar',
              'comparison',
              'mirror',
              'loneliness',
              'relationships',
              'lost-supports',
              'age-crises',
              'meaning',
              'self-assembly',
            ].map((id, i) => [id, new Date(Date.now() - (16 - i) * 86400000).toISOString()])
          ),
          signs: {},
          reflections: {},
          actions: {},
        }),
      }
    )
    // frame=0: приложение на реальном viewport, как на телефоне.
    await page.goto('/?demo=1&tab=library&action=hero_journey&frame=0')
    await page.getByTestId('hero-journey-map').waitFor({ state: 'visible' })

    for (const id of CHAPTER_I_IDS) {
      await page.getByTestId(`hero-step-${id}`).click()
      await page.getByTestId('hero-step-start').waitFor({ state: 'visible' })
      await page.waitForTimeout(100)

      const column = page.locator('.mx-hj-step-intro')
      const overflow = await column.evaluate(el => el.scrollHeight - el.clientHeight)
      expect(overflow).toBeLessThanOrEqual(0)
      const docOverflow = await page.evaluate(
        () => document.documentElement.scrollHeight - document.documentElement.clientHeight
      )
      expect(docOverflow).toBeLessThanOrEqual(0)

      const box = await page.getByTestId('hero-step-start').boundingBox()
      expect(box.y).toBeGreaterThanOrEqual(0)
      expect(box.y + box.height).toBeLessThanOrEqual(height)
      expect(height - (box.y + box.height)).toBeLessThanOrEqual(24)

      const hero = await page
        .locator('.mx-hj-step-intro .mx-hj-hero, .mx-hj-step-intro__image')
        .first()
        .boundingBox()
      expect(hero.height).toBeGreaterThanOrEqual(76)

      const fontSize = await page
        .locator('.mx-hj-step-intro__desc')
        .first()
        .evaluate(el => parseFloat(getComputedStyle(el).fontSize))
      expect(fontSize).toBeGreaterThanOrEqual(14.5)

      // Длинное вступление доскролливается внутри текстового блока:
      // последний абзац доступен выше кнопки, а не под ней.
      const lastDescBottom = await page
        .locator('.mx-hj-step-intro__text-scroll')
        .evaluate(el => {
          el.scrollTop = el.scrollHeight
          const descs = el.querySelectorAll('.mx-hj-step-intro__desc')
          return descs[descs.length - 1].getBoundingClientRect().bottom
        })
      expect(lastDescBottom).toBeLessThanOrEqual(box.y)

      await page.getByTestId('demo-chrome-back').click()
      await page.getByTestId('hero-journey-map').waitFor({ state: 'visible' })
    }
  })
}

test('Шаг пройден на 375×667: «Продолжить» видна целиком, без скролла', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.goto('/?demo=1&tab=library&action=hero_journey&frame=0')
  await page.getByTestId('hero-continue').click()
  await page.getByTestId('hero-step-start').click()
  await page.getByTestId('hero-write-input').fill('Запись первого шага')
  await page.getByTestId('hero-write-next').click()
  await page.getByTestId('hero-action-input').fill('Одно действие')
  await page.getByTestId('hero-action-next').click()
  await expect(page.getByTestId('hero-complete-map')).toBeVisible()

  // «Твоя опора»: ответ из «Одно действие» показан под итогом.
  const support = page.locator('.mx-hj-complete__support')
  await expect(support).toBeVisible()
  await expect(support).toContainText('Одно действие')

  const column = page.locator('.mx-hj-step-complete')
  // Скролла нет: ни в колонке, ни в документе.
  const overflow = await column.evaluate(el => el.scrollHeight - el.clientHeight)
  expect(overflow).toBeLessThanOrEqual(0)
  const docOverflow = await page.evaluate(
    () => document.documentElement.scrollHeight - document.documentElement.clientHeight
  )
  expect(docOverflow).toBeLessThanOrEqual(0)

  // Кнопка «Продолжить» целиком в области видимости.
  const box = await page.getByTestId('hero-complete-map').boundingBox()
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.y + box.height).toBeLessThanOrEqual(667)
  // Кнопка прижата к низу колонки.
  expect(667 - (box.y + box.height)).toBeLessThanOrEqual(24)

  // Картинка гибкая: 110–300 px, текст идёт сразу под ней.
  const hero = await page.locator('.mx-hj-step-complete .mx-hj-hero').boundingBox()
  expect(hero.height).toBeGreaterThanOrEqual(110)
  expect(hero.height).toBeLessThanOrEqual(300)

  // Итог обычным начертанием, не мельче 14 px.
  const phrase = await page.locator('.mx-hj-complete__phrase').evaluate(el => {
    const s = getComputedStyle(el)
    return { weight: s.fontWeight, size: parseFloat(s.fontSize) }
  })
  expect(phrase.weight).toBe('400')
  expect(phrase.size).toBeGreaterThanOrEqual(14)

  await page.getByTestId('hero-complete-map').click()
  await expect(page.getByTestId('hero-step-uncertainty')).toHaveAttribute('data-state', 'done')
})

test('Кнопка на «Запиши»: крестик при пустом поле, шеврон после ввода', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 })
  await page.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.goto('/?demo=1&tab=library&action=hero_journey&frame=0')
  await page.getByTestId('hero-continue').click()
  await page.getByTestId('hero-step-start').click()

  // Пока поле пустое — белая круглая кнопка с крестиком «×».
  const submit = page.getByTestId('hero-write-next')
  await expect(submit).toBeVisible()
  await expect(submit.locator('svg')).toHaveClass(/lucide-x/)
  await expect(submit).toHaveAttribute('aria-label', 'Закрыть')
  // Пустое поле: нажатие закрывает шаг сразу, без подтверждения.
  await submit.click()
  await expect(page.getByTestId('hero-journey-map')).toBeVisible()

  // После ввода символа — в той же кнопке шеврон «›», нажатие идёт дальше.
  await page.getByTestId('hero-continue').click()
  await page.getByTestId('hero-step-start').click()
  await page.getByTestId('hero-write-input').fill('а')
  await expect(submit.locator('svg')).toHaveClass(/lucide-chevron-right/)
  await expect(submit).toHaveAttribute('aria-label', 'Дальше')
  await submit.click()
  await expect(page.getByTestId('hero-action-input')).toBeVisible()
})

test('Назад проходит по подэкранам шага: запись и действие', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 })
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem(
      'mx-hero-journey-progress:900001',
      JSON.stringify({
        completed: { uncertainty: '2026-10-01', temporality: '2026-10-02', choice: '2026-10-03' },
        signs: {},
        reflections: {},
        actions: {},
      })
    )
  })
  await page.goto('/?demo=1&tab=library&action=hero_journey')
  await page.getByTestId('hero-continue').click()
  await page.getByTestId('hero-step-start').click()
  await expect(page.getByTestId('hero-write-input')).toBeVisible()
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.getByTestId('hero-step-start')).toBeVisible()
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.getByTestId('hero-journey-map')).toBeVisible()
})

test('Библиотека показывает реальное число завершённых шагов', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem(
      'mx-hero-journey-progress:900001',
      JSON.stringify({
        completed: { uncertainty: '2026-10-01', temporality: '2026-10-02', choice: '2026-10-03' },
        signs: {},
        reflections: {},
        actions: {},
      })
    )
  })
  await page.goto('/?demo=1&tab=library')
  await expect(page.locator('.mx-library-course-progress')).toHaveText('Шаг 4 из 16')
})

/*
 * Финал идёт только с сервера (в демо его нет): проверяем, что его текст берётся
 * из ответа API, а кадр картинки — из локальной структуры (mergeFinaleWithLocal),
 * и что после последнего шага паузы нет: сразу карта.
 */
test('Финал с сервера: свой кадр картинки и без паузы после последнего шага', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 })
  const userId = 900991
  await page.addInitScript(
    ({ user, key, completed }) => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem('mentalix_web_user', JSON.stringify(user))
      localStorage.setItem('mx-onboarded-v2', '1')
      localStorage.setItem(
        key,
        JSON.stringify({ completed, signs: {}, reflections: {}, actions: {} })
      )
    },
    {
      user: { id: userId, first_name: 'Тест' },
      key: `mx-hero-journey-progress:${userId}`,
      completed: Object.fromEntries(
        HERO_JOURNEY_TRIALS.map(trial => [trial.id, '2026-10-01T12:00:00Z'])
      ),
    }
  )
  // Сервер отдаёт тексты; картинки и кадры остаются во фронтенде.
  await page.route('**/api/**', route =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  )
  await page.route('**/api/content/hero-journey', route =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        course: {
          title: 'Путь героя',
          subtitle: '16 шагов · 4 главы',
          description: '16 шагов о том, как не прожить жизнь на автопилоте.',
        },
        prologue: null,
        chapters: HERO_JOURNEY_CHAPTERS,
        trials: HERO_JOURNEY_TRIALS.map(trial => ({
          id: trial.id,
          number: trial.number,
          title: `Шаг ${trial.number}`,
          subtitle: 'Проверочный подзаголовок',
        })),
        finale: {
          ...HERO_JOURNEY_FINALE,
          title: 'Возвращение домой',
          subtitle: 'Финал практикума',
          intro: 'Первый абзац финала.\n\nВторой абзац финала.',
          writePrompt: 'Что забираешь с собой?',
          actionPrompt: 'Одно действие после практикума',
          doneTitle: 'Путь пройден',
          doneSummary: 'Шестнадцать шагов остались позади.',
        },
      }),
    })
  )

  await page.goto('/?tab=library')
  await page.getByTestId('library-hero').click()
  await expect(page.getByTestId('hero-journey-map')).toBeVisible()
  await page.getByTestId('hero-step-return').click()
  // Заголовок вступления — из ответа сервера, а не из бандла.
  await expect(page.getByTestId('hero-step-start')).toBeVisible()
  await expect(page.locator('.mx-hj-step-intro__label')).toHaveText('Финал · Возвращение домой')
  await page.getByTestId('hero-step-start').click()
  await page.getByTestId('hero-write-input').fill('Проверка финала')
  await page.getByTestId('hero-write-next').click()
  await page.getByTestId('hero-action-input').fill('Одно действие финала')
  await page.getByTestId('hero-action-next').click()
  await expect(page.getByTestId('hero-complete-map')).toBeVisible()

  // Кадр финала приходит из локальной структуры: картинка загружена, обрезка применена.
  const hero = page.locator('.mx-hj-step-complete .mx-hj-hero')
  await expect(hero).toHaveClass(/mx-hj-hero--cropped/)
  const layout = await hero.evaluate(el => {
    const image = el.querySelector('img')
    const rect = el.getBoundingClientRect()
    const imageRect = image.getBoundingClientRect()
    const button = document
      .querySelector('[data-testid="hero-complete-map"]')
      .getBoundingClientRect()
    return {
      loaded: image.complete && image.naturalWidth > 0,
      cropApplied: imageRect.top < rect.top && Math.abs(imageRect.width - rect.width) <= 1,
      buttonVisible: button.top >= 0 && button.bottom <= window.innerHeight,
    }
  })
  expect(layout.loaded).toBe(true)
  expect(layout.cropApplied).toBe(true)
  expect(layout.buttonVisible).toBe(true)

  // После последнего шага паузы нет: сразу карта, финал отмечен пройденным.
  await page.getByTestId('hero-complete-map').click()
  await expect(page.getByTestId('hero-journey-map')).toBeVisible()
  await expect(page.getByTestId('hero-pause')).toHaveCount(0)
  await expect(page.getByTestId('hero-step-return')).toHaveAttribute('data-state', 'done')
})
