import { test, expect } from '@playwright/test'

/*
 * UX-смок Журнала: Шаги → Открыть журнал → intro «Начать без настройки» →
 * Поток (✕ = назад при пустом, ✓ = дальше при тексте) →
 * Вопрос (✕ = назад, ✓ = сохранить) → финал «день 1».
 *
 * Без настройки «Перечитай» пропускается — сразу «Поток».
 *
 * Второй тест: настройка с подэкранами «Картинка будущего» (1/3, 2/3, 3/3)
 * и проверка ✕ = назад на первом шаге.
 *
 * Данные берём из демо-режима (?demo=1). Поиск — по data-testid.
 */

test.use({ viewport: { width: 393, height: 852 } })

test('журнал: intro → пропуск настройки → поток → вопрос → финал день 1', async ({
  page,
}) => {
  await page.goto('/?demo=1&tab=practices')

  // Карточка журнала на «Шагах»
  await expect(page.getByTestId('journal-open-cta')).toBeVisible()
  await page.getByTestId('journal-open-cta').click()

  // ── Intro ──
  await expect(page.getByTestId('dj-intro-skip')).toBeVisible()
  await expect(page.getByTestId('dj-intro-setup')).toHaveText('Настроить — 2 минуты')
  // Пропускаем настройку
  await page.getByTestId('dj-intro-skip').click()

  // ── Поток (без настройки «Перечитай» пропускается) ──
  await expect(page.getByTestId('dj-stream-input')).toBeVisible()
  // «Перечитай» не показан
  await expect(page.locator('.mx-dj-review')).not.toBeVisible()
  // Поле пустое — серый placeholder
  const streamValue = await page.getByTestId('dj-stream-input').inputValue()
  expect(streamValue).toBe('')
  // Надпись «ПОТОК · …»
  await expect(page.locator('.mx-dj-stream__label')).toBeVisible()
  // Заголовок
  await expect(page.locator('.mx-dj-stream__title')).toHaveText('Выпиши всё из головы')
  // Полоса «страницы» видна вверху, под надписью
  await expect(page.locator('.mx-dj-stream__bar')).toBeVisible()

  // Поле пустое → кнопка ✕ (назад на intro)
  const streamBtn = page.getByTestId('dj-stream-next')
  await expect(streamBtn).not.toHaveClass(/mx-round-next-btn--skip/)
  await streamBtn.click()
  // Вернулись на intro
  await expect(page.getByTestId('dj-intro-skip')).toBeVisible()

  // Снова идём в поток
  await page.getByTestId('dj-intro-skip').click()
  await expect(page.getByTestId('dj-stream-input')).toBeVisible()

  // Вводим текст → кнопка ✓ (дальше). Проверяем на каждом нажатии (input event).
  await page.getByTestId('dj-stream-input').fill('Сижу дома, пью чай. Думаю о том, что нужно сделать сегодня.')
  // После ввода появляется ✓
  await streamBtn.click()

  // ── Один вопрос ──
  await expect(page.getByTestId('dj-question-input')).toBeVisible()
  await expect(page.locator('.mx-dj-question__text')).toBeVisible()
  // Надпись «Вопрос дня» над заголовком
  await expect(page.locator('.mx-dj-question__label')).toBeVisible()
  // Пустой ответ → ✕ (назад в поток)
  const questionBtn = page.getByTestId('dj-question-next')
  await expect(questionBtn).not.toHaveClass(/mx-round-next-btn--skip/)
  await questionBtn.click()
  await expect(page.getByTestId('dj-stream-input')).toBeVisible()

  // Возвращаемся к вопросу
  await streamBtn.click()
  await expect(page.getByTestId('dj-question-input')).toBeVisible()

  // Вводим ответ → ✓ (сохранить)
  await page.getByTestId('dj-question-input').fill('Я откладываю отдых, хотя знаю что он важен.')
  await questionBtn.click()

  // ── Финал ──
  await expect(page.locator('.mx-completion')).toBeVisible()
  await expect(page.locator('.mx-completion__title')).toContainText('сохранена')
  // Плашка «день 1»
  await expect(page.locator('.mx-completion__date-pill')).toContainText('день 1')
  // Кнопка «Сохранить и выйти»
  await expect(page.getByTestId('dj-complete-close')).toBeVisible()
  await expect(page.getByTestId('dj-complete-close')).toHaveText('Сохранить и выйти')
})

test('журнал: настройка — 3 подэкрана картинки будущего, ✕ = назад', async ({
  page,
}) => {
  await page.goto('/?demo=1&tab=practices')

  await expect(page.getByTestId('journal-open-cta')).toBeVisible()
  await page.getByTestId('journal-open-cta').click()

  // ── Intro → «Настроить» ──
  await page.getByTestId('dj-intro-setup').click()

  // ── Шаг 1 — Цели (пусто → ✕ = назад на intro) ──
  await expect(page.getByTestId('dj-setup-next')).toBeVisible()
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 1 из 5 · Цели')
  await page.getByTestId('dj-setup-next').click()
  // Вернулись на intro
  await expect(page.getByTestId('dj-intro-skip')).toBeVisible()

  // Снова в настройку
  await page.getByTestId('dj-intro-setup').click()
  // Заполняем цель → ✓ дальше
  await page.getByTestId('dj-setup-goal-0').fill('Спокойствие')
  await page.getByTestId('dj-setup-next').click()

  // ── Шаг 2 — Кем я становлюсь ──
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 2 из 5 · Кем я становлюсь')
  await page.getByTestId('dj-setup-reminder-0').fill('Я делаю главное до обеда')
  await page.getByTestId('dj-setup-next').click()

  // ── Шаг 3 — Картинка будущего · 1/3 ──
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 3 из 5 · Картинка будущего · 1/3')
  await expect(page.getByTestId('dj-setup-vision-scene')).toBeVisible()
  // Пусто → ✕ = назад на шаг 2
  await page.getByTestId('dj-setup-next').click()
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 2 из 5 · Кем я становлюсь')
  // Назад на шаг 3
  await page.getByTestId('dj-setup-next').click()
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 3 из 5 · Картинка будущего · 1/3')

  // Заполняем scene → ✓ дальше
  await page.getByTestId('dj-setup-vision-scene').fill('Сижу у окна, работа сделана')
  await page.getByTestId('dj-setup-next').click()

  // ── 2/3 ──
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 3 из 5 · Картинка будущего · 2/3')
  await expect(page.getByTestId('dj-setup-vision-obstacle')).toBeVisible()
  await page.getByTestId('dj-setup-vision-obstacle').fill('Усталость')
  await page.getByTestId('dj-setup-next').click()

  // ── 3/3 ──
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 3 из 5 · Картинка будущего · 3/3')
  await expect(page.getByTestId('dj-setup-vision-plan')).toBeVisible()
  await page.getByTestId('dj-setup-vision-plan').fill('Сделаю перерыв')
  await page.getByTestId('dj-setup-next').click()

  // ── Шаг 4 — Мои вопросы (есть дефолт → ✓) ──
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 4 из 5 · Мои вопросы')
  await page.getByTestId('dj-setup-next').click()

  // ── Шаг 5 — Напоминание ──
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 5 из 5 · Напоминание')
  // Выбираем «Своё время» → плитка выделяется, появляется input
  await page.getByTestId('dj-setup-reminder-custom').click()
  await expect(page.getByTestId('dj-setup-reminder-time')).toBeVisible()
  // Вводим 07:30
  await page.getByTestId('dj-setup-reminder-time').fill('07:30')
  // Плитка показывает выбранное время
  await expect(page.getByTestId('dj-setup-reminder-custom')).toContainText('07:30')
  await page.getByTestId('dj-setup-next').click()

  // ── Перечитай (после настройки с данными) ──
  await expect(page.locator('.mx-dj-review')).toBeVisible()
  await expect(page.getByTestId('dj-review-edit')).toBeVisible()
  // Блок напоминания: «Каждый день в 07:30»
  await expect(page.locator('.mx-dj-review__reminder')).toHaveText('Каждый день в 07:30')
})

test('журнал: сброс настройки → intro → поток без настройки', async ({ page }) => {
  await page.goto('/?demo=1&tab=practices')

  await expect(page.getByTestId('journal-open-cta')).toBeVisible()
  await page.getByTestId('journal-open-cta').click()

  // ── Настраиваем журнал ──
  await page.getByTestId('dj-intro-setup').click()
  await page.getByTestId('dj-setup-goal-0').fill('Спокойствие')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-reminder-0').fill('Я делаю главное до обеда')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-vision-scene').fill('Сижу у окна')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-vision-obstacle').fill('Усталость')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-vision-plan').fill('Перерыв')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-next').click()
  // Шаг 5 — Напоминание (дефолт «Не напоминать» → ✓)
  await page.getByTestId('dj-setup-next').click()

  // ── Перечитай — настройка заполнена ──
  await expect(page.locator('.mx-dj-review')).toBeVisible()
  await expect(page.getByTestId('dj-review-edit')).toBeVisible()

  // ── «Мои записи» — вторичная кнопка в потоке, а не мелкая ссылка ──
  const entriesButton = page.getByTestId('dj-review-entries')
  await expect(entriesButton).toHaveText('Мои записи')
  await expect(entriesButton).toHaveAttribute('class', /mx-pill-btn/)
  const entriesBox = await entriesButton.boundingBox()
  expect(entriesBox.height).toBeGreaterThanOrEqual(44)
  await entriesButton.click()
  await expect(page.getByTestId('dj-entries')).toBeVisible()
  await page.getByTestId('back-button').click()
  await expect(page.locator('.mx-dj-review')).toBeVisible()

  // ── Сбросить и начать заново ──
  await expect(page.getByTestId('dj-review-reset')).toBeVisible()
  page.on('dialog', d => d.accept())
  await page.getByTestId('dj-review-reset').click()

  // ── Открывается intro ──
  await expect(page.getByTestId('dj-intro-skip')).toBeVisible()
  await expect(page.getByTestId('dj-intro-setup')).toBeVisible()

  // ── «Начать без настройки» ведёт сразу в «Поток» ──
  await page.getByTestId('dj-intro-skip').click()
  await expect(page.getByTestId('dj-stream-input')).toBeVisible()
  // «Перечитай» не показан
  await expect(page.locator('.mx-dj-review')).not.toBeVisible()
})

test('журнал: повторный вход — запись сохранена, «Дописать» сохраняет текст целиком', async ({
  page,
}) => {
  await page.goto('/?demo=1&tab=practices')

  // ── Открываем журнал ──
  await expect(page.getByTestId('journal-open-cta')).toBeVisible()
  await page.getByTestId('journal-open-cta').click()

  // ── Пропускаем настройку ──
  await page.getByTestId('dj-intro-skip').click()

  // ── Поток: пишем текст ──
  await expect(page.getByTestId('dj-stream-input')).toBeVisible()
  await page.getByTestId('dj-stream-input').fill('Утренний текст записи.')
  await page.getByTestId('dj-stream-next').click()

  // ── Вопрос: отвечаем ──
  await expect(page.getByTestId('dj-question-input')).toBeVisible()
  await page.getByTestId('dj-question-input').fill('Утренний ответ.')
  await page.getByTestId('dj-question-next').click()

  // ── Финал → выходим ──
  await expect(page.locator('.mx-completion')).toBeVisible()
  await page.getByTestId('dj-complete-close').click()

  // ── Открываем журнал снова ──
  await expect(page.getByTestId('journal-open-cta')).toBeVisible()
  await page.getByTestId('journal-open-cta').click()

  // ── Экран «Сегодня»: запись сохранена ──
  await expect(page.getByTestId('dj-today')).toBeVisible()
  await expect(page.locator('.mx-dj-today__title')).toHaveText('Запись сохранена')
  // Виден утренний текст
  await expect(page.getByTestId('dj-today-stream')).toContainText('Утренний текст записи.')
  // Виден ответ на вопрос
  await expect(page.getByTestId('dj-today-question')).toContainText('Утренний ответ.')

  // ── «Дописать» ──
  await page.getByTestId('dj-today-append').click()

  // ── Поток: старый текст на месте ──
  await expect(page.getByTestId('dj-stream-input')).toBeVisible()
  const streamValue = await page.getByTestId('dj-stream-input').inputValue()
  expect(streamValue).toContain('Утренний текст записи.')
  // Дописываем новый текст
  await page.getByTestId('dj-stream-input').fill(streamValue + 'Вечерний текст записи.')
  await page.getByTestId('dj-stream-next').click()

  // ── Вопрос: старый ответ на месте ──
  await expect(page.getByTestId('dj-question-input')).toBeVisible()
  const answerValue = await page.getByTestId('dj-question-input').inputValue()
  expect(answerValue).toContain('Утренний ответ.')
  // Сохраняем
  await page.getByTestId('dj-question-next').click()

  // ── Финал → выходим ──
  await expect(page.locator('.mx-completion')).toBeVisible()
  await page.getByTestId('dj-complete-close').click()

  // ── Открываем снова — проверяем, что весь текст сохранён ──
  await expect(page.getByTestId('journal-open-cta')).toBeVisible()
  await page.getByTestId('journal-open-cta').click()

  await expect(page.getByTestId('dj-today')).toBeVisible()
  await expect(page.getByTestId('dj-today-stream')).toContainText('Утренний текст записи.')
  await expect(page.getByTestId('dj-today-stream')).toContainText('Вечерний текст записи.')
})

/* ── Экран «Запись сохранена»: три действия и геометрия ── */

/*
 * Сохраняем синтетическую запись (с настройкой, иначе «Перечитать» скрыта),
 * затем на экране «Запись сохранена» проверяем:
 * видимость и доступность трёх действий, области нажатия, геометрию на
 * 393×852 и 360×640, каждый переход с возвратом и отсутствие дублей записи.
 */

// Настройка журнала → синтетическая запись → экран «Запись сохранена».
async function openSavedScreen(page) {
  await page.getByTestId('dj-intro-setup').click()
  await page.getByTestId('dj-setup-goal-0').fill('Спокойствие')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-reminder-0').fill('Я делаю главное до обеда')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-vision-scene').fill('Сижу у окна')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-vision-obstacle').fill('Усталость')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-vision-plan').fill('Перерыв')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-next').click() // шаг 4 · Мои вопросы
  await page.getByTestId('dj-setup-next').click() // шаг 5 · Напоминание

  await expect(page.locator('.mx-dj-review')).toBeVisible()
  await page.getByTestId('dj-review-next').click()

  await page.getByTestId('dj-stream-input').fill('Синтетическая запись: утро.')
  await page.getByTestId('dj-stream-next').click()
  await expect(page.getByTestId('dj-question-input')).toBeVisible()
  await page.getByTestId('dj-question-input').fill('Синтетический ответ.')
  await page.getByTestId('dj-question-next').click()
  await expect(page.locator('.mx-completion')).toBeVisible()
  await page.getByTestId('dj-complete-close').click()

  await expect(page.getByTestId('journal-open-cta')).toBeVisible()
  await page.getByTestId('journal-open-cta').click()
  await expect(page.getByTestId('dj-today')).toBeVisible()
  await expect(page.locator('.mx-dj-today__title')).toHaveText('Запись сохранена')
}

// Геометрия трёх действий и футера относительно текущего экрана.
async function measureSavedFooter(page) {
  return page.evaluate(() => {
    const ids = ['dj-today-review', 'dj-today-entries', 'dj-today-append']
    const buttons = ids.map(id => {
      const el = document.querySelector(`[data-testid="${id}"]`)
      if (!el) return { id, missing: true }
      const r = el.getBoundingClientRect()
      return {
        id,
        top: r.top,
        bottom: r.bottom,
        left: r.left,
        right: r.right,
        width: r.width,
        height: r.height,
      }
    })
    const footerEl = document.querySelector('.mx-screen__footer')
    const footer = footerEl ? footerEl.getBoundingClientRect() : null
    const doc = document.documentElement
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      buttons,
      footer: footer ? { top: footer.top, bottom: footer.bottom } : null,
      horizontalOverflow: doc.scrollWidth - doc.clientWidth,
    }
  })
}

function assertFitsViewport(geometry, label) {
  const { viewport, buttons, footer, horizontalOverflow } = geometry
  expect(horizontalOverflow, `${label}: горизонтальная прокрутка`).toBeLessThanOrEqual(2)
  expect(footer, `${label}: футер не найден`).not.toBeNull()
  expect(footer.bottom, `${label}: футер выходит за низ экрана`).toBeLessThanOrEqual(
    viewport.height + 1
  )
  for (const b of buttons) {
    expect(b.missing, `${label}: ${b.id} отсутствует`).not.toBe(true)
    expect(b.height, `${label}: ${b.id} ниже 44px`).toBeGreaterThanOrEqual(44)
    expect(b.left, `${label}: ${b.id} выходит влево`).toBeGreaterThanOrEqual(0)
    expect(b.right, `${label}: ${b.id} выходит вправо`).toBeLessThanOrEqual(viewport.width + 1)
    expect(b.bottom, `${label}: ${b.id} ниже экрана`).toBeLessThanOrEqual(viewport.height + 1)
  }
  const [review, entries, append] = buttons
  // Вторичный ряд стоит выше основной кнопки и не перекрывает её.
  expect(review.bottom, `${label}: «Перечитать» перекрывает «Дописать»`).toBeLessThanOrEqual(
    append.top
  )
  expect(entries.bottom, `${label}: «Мои записи» перекрывает «Дописать»`).toBeLessThanOrEqual(
    append.top
  )
}

/*
 * setViewportSize меняет окно сразу, а поверхность <Screen> пересчитывает
 * высоту от visualViewport через ре-рендер подписки на resize. Замер,
 * сделанный сразу после resize, ловит прошлую геометрию (оболочка 852 px в
 * окне 640 px) и падает по футеру, хотя экран помещается целиком.
 * Ждём событиями, пока оболочка совпадёт с новым окном, — повторяемое
 * ожидание корректной геометрии вместо раннего замера и без фиксированного sleep.
 */
async function waitForSurfaceSettled(page) {
  await page.waitForFunction(() => {
    const shell = document.querySelector('[data-testid="mx-screen-shell"]')
    if (!shell) return false
    const rect = shell.getBoundingClientRect()
    const near = (actual, expected) => Math.abs(actual - expected) <= 1
    return (
      near(rect.width, window.innerWidth) &&
      near(rect.height, window.innerHeight) &&
      near(rect.bottom, window.innerHeight)
    )
  })
}

test('журнал: «Запись сохранена» — три действия, переходы и отсутствие дублей', async ({ page }) => {
  await page.goto('/?demo=1&tab=practices')

  await expect(page.getByTestId('journal-open-cta')).toBeVisible()
  await page.getByTestId('journal-open-cta').click()
  await openSavedScreen(page)

  // ── Три действия: видимы, доступны, с подписями ──
  const reviewBtn = page.getByTestId('dj-today-review')
  const entriesBtn = page.getByTestId('dj-today-entries')
  const appendBtn = page.getByTestId('dj-today-append')

  await expect(reviewBtn).toBeVisible()
  await expect(reviewBtn).toBeEnabled()
  await expect(reviewBtn).toHaveAccessibleName('Перечитать')
  await expect(entriesBtn).toBeVisible()
  await expect(entriesBtn).toBeEnabled()
  await expect(entriesBtn).toHaveAccessibleName('Мои записи')
  await expect(appendBtn).toBeVisible()
  await expect(appendBtn).toBeEnabled()
  await expect(appendBtn).toHaveAccessibleName('Дописать')

  // Вторичные — кнопки дизайн-системы, основное действие — cta-пилюля
  await expect(reviewBtn).toHaveAttribute('class', /mx-pill-btn/)
  await expect(entriesBtn).toHaveAttribute('class', /mx-pill-btn/)
  await expect(appendBtn).toHaveAttribute('class', /cta-pill/)

  // ── Геометрия: 393×852 и 360×640 ──
  assertFitsViewport(await measureSavedFooter(page), '393×852')
  await page.setViewportSize({ width: 360, height: 640 })
  await waitForSurfaceSettled(page)
  await expect(page.getByTestId('dj-today')).toBeVisible()
  assertFitsViewport(await measureSavedFooter(page), '360×640')
  await page.setViewportSize({ width: 393, height: 852 })
  await waitForSurfaceSettled(page)
  await expect(page.getByTestId('dj-today')).toBeVisible()

  // ── «Перечитать» → «Вспомни, куда идёшь» → назад ──
  await reviewBtn.click()
  await expect(page.locator('.mx-dj-review')).toBeVisible()
  await expect(page.locator('.mx-dj-review__title')).toHaveText('Вспомни, куда идёшь')
  await page.getByTestId('back-button').click()
  await expect(page.getByTestId('dj-today')).toBeVisible()

  // ── «Мои записи» → список записей → назад ──
  await entriesBtn.click()
  await expect(page.getByTestId('dj-entries')).toBeVisible()
  await page.getByTestId('back-button').click()
  await expect(page.getByTestId('dj-today')).toBeVisible()

  // ── «Дописать» → продолжение той же записи ──
  await appendBtn.click()
  await expect(page.getByTestId('dj-stream-input')).toBeVisible()
  const streamValue = await page.getByTestId('dj-stream-input').inputValue()
  expect(streamValue).toContain('Синтетическая запись: утро.')
  await page.getByTestId('dj-stream-input').fill(`${streamValue}Вечерняя дописка.`)
  await page.getByTestId('dj-stream-next').click()
  await expect(page.getByTestId('dj-question-input')).toBeVisible()
  await page.getByTestId('dj-question-next').click()
  await expect(page.locator('.mx-completion')).toBeVisible()
  await page.getByTestId('dj-complete-close').click()

  // ── Запись сохранена целиком и не продублирована ──
  await expect(page.getByTestId('journal-open-cta')).toBeVisible()
  await page.getByTestId('journal-open-cta').click()
  await expect(page.getByTestId('dj-today')).toBeVisible()
  await expect(page.getByTestId('dj-today-stream')).toContainText('Синтетическая запись: утро.')
  await expect(page.getByTestId('dj-today-stream')).toContainText('Вечерняя дописка.')

  await page.getByTestId('dj-today-entries').click()
  await expect(page.getByTestId('dj-entries')).toBeVisible()
  await expect(page.locator('.mx-dj-entries__item')).toHaveCount(1)
})
