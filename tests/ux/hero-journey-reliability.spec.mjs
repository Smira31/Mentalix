import { expect, test } from '@playwright/test'

const USER = { id: 900991, first_name: 'Тест' }
const PROGRESS_KEY = `mx-hero-journey-progress:${USER.id}`
const DEMO_DRAFT_KEY = 'mx-hero-journey-draft:900001:uncertainty'

for (const width of [393, 789]) {
  test(`Продолжить не обходит блокировку следующего дня (${width})`, async ({ page }) => {
    await page.setViewportSize({ width, height: 852 })
    await page.addInitScript(
      ({ user, key }) => {
        localStorage.clear()
        localStorage.setItem('mentalix_web_user', JSON.stringify(user))
        localStorage.setItem('mx-onboarded-v2', '1')
        localStorage.setItem(
          key,
          JSON.stringify({
            completed: { uncertainty: new Date().toISOString() },
            signs: {},
            reflections: {},
            actions: {},
          })
        )
      },
      { user: USER, key: PROGRESS_KEY }
    )
    await page.route('**/api/**', route =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    )
    await page.goto('/?tab=library')
    await page.getByTestId('library-hero').click()
    await expect(page.getByTestId('hero-step-temporality')).toHaveAttribute('data-state', 'locked')
    await page.getByTestId('hero-continue').click()
    await expect(page.getByTestId('hero-journey-map')).toBeVisible()
    await expect(page.getByTestId('hero-step-start')).toHaveCount(0)
    await expect(page.getByTestId('hero-step-temporality')).toBeDisabled()
  })
}

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
 * Самый длинный текст вступления — 447 px на 360×640 (по замерам: uncertainty,
 * digital-avatar, mirror, relationships, age-crises; шаг 5 body — 405 px).
 * Проверяем longest-группу и шаг 5: колонка без скролла, кнопка «Начать шаг»
 * видна целиком и прижата к низу, картинка не ниже минимума 76 px.
 */
const LONGEST_TEXT_IDS = ['uncertainty', 'age-crises', 'body']

for (const [width, height] of [
  [360, 640],
  [375, 667],
]) {
  test(`Вступление длинного шага на ${width}×${height}: без скролла, кнопка видна целиком`, async ({
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
        key: PROGRESS_KEY,
        value: JSON.stringify({
          // Весь путь пройден: все главы раскрыты, любой шаг открыт по карточке.
          completed: Object.fromEntries(
            [
              'uncertainty',
              'temporality',
              'choice',
              'abundance',
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

    for (const id of LONGEST_TEXT_IDS) {
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
