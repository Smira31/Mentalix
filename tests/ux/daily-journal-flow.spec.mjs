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
  // Текст владельца (#1090) и закреплённые внизу действия
  await expect(page.locator('.mx-dj-intro__text')).toHaveText(
    'Каждый день 5 минут: перечитай, куда идёшь, выгрузи мысли и ответь на один вопрос.'
  )
  await expect(page.locator('.mx-dj-intro__art')).toBeVisible()
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
  // Кнопка «Готово» — запись уже сохранена до этого экрана
  await expect(page.getByTestId('dj-complete-close')).toBeVisible()
  await expect(page.getByTestId('dj-complete-close')).toHaveText('Готово')
  // Тихой кнопки «Пропустить» больше нет: оценка необязательна,
  // «Готово» выходит и без неё
  await expect(page.getByTestId('dj-complete-skip')).toHaveCount(0)
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

  // ── Шаг 2 — Каким я хочу быть (#1090) ──
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 2 из 5 · Каким я хочу быть')
  // Решение 19.10: префикс «Я — человек, который…» — один раз над списком
  await expect(page.getByTestId('dj-setup-identity-prefix')).toHaveText('Я — человек, который…')
  await expect(page.getByTestId('dj-setup-identity-prefix')).toHaveCount(1)
  await expect(page.getByTestId('dj-setup-reminder-0')).toHaveAttribute(
    'placeholder',
    'держит слово'
  )
  // Чип добавляет строку с префиксом; использованный чип скрыт
  await page.getByTestId('dj-setup-chip').filter({ hasText: 'делает главное первым' }).click()
  await expect(page.getByTestId('dj-setup-reminder-0')).toHaveValue('делает главное первым')
  await expect(page.getByTestId('dj-setup-chip').filter({ hasText: 'делает главное первым' })).toHaveCount(0)
  // Удаление строки возвращает чип
  await page.getByTestId('dj-setup-reminder-delete-0').click()
  await expect(page.getByTestId('dj-setup-reminder-0')).toHaveValue('')
  await expect(page.getByTestId('dj-setup-chip').filter({ hasText: 'делает главное первым' })).toHaveCount(1)
  // Снова берём чип и идём дальше
  await page.getByTestId('dj-setup-chip').filter({ hasText: 'делает главное первым' }).click()
  await page.getByTestId('dj-setup-next').click()

  // ── Шаг 3 — Картинка будущего · 1/3 ──
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 3 из 5 · Картинка будущего · 1/3')
  await expect(page.getByTestId('dj-setup-vision-scene')).toBeVisible()
  // Пусто → ✕ = назад на шаг 2
  await page.getByTestId('dj-setup-next').click()
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 2 из 5 · Каким я хочу быть')
  // Назад на шаг 3
  await page.getByTestId('dj-setup-next').click()
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 3 из 5 · Картинка будущего · 1/3')

  // 3.1: подсказка и пример владельца (#1090)
  await expect(page.getByTestId('dj-setup-vision-hint')).toHaveText(
    'Одна-две детали: что ты видишь и что чувствуешь.'
  )
  await expect(page.getByTestId('dj-setup-vision-scene')).toHaveAttribute(
    'placeholder',
    'Например: просыпаюсь без тревоги и сразу знаю, с чего начать день'
  )
  // Заполняем scene и дописываем чип-чувство через запятую
  await page.getByTestId('dj-setup-vision-scene').fill('Сижу у окна, работа сделана')
  await page.getByTestId('dj-setup-chip').filter({ hasText: 'спокойствие' }).click()
  await expect(page.getByTestId('dj-setup-vision-scene')).toHaveValue(
    'Сижу у окна, работа сделана, спокойствие'
  )
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
  // Дефолт нового пользователя — «Вечером 21:00» (#1090)
  await expect(page.getByTestId('dj-setup-reminder-Вечером')).toHaveClass(
    /mx-dj-reminder__tile--selected/
  )
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
  // Блок «КАКИМ Я ХОЧУ БЫТЬ»: строка с префиксом (#1090)
  await expect(page.getByTestId('dj-review-identity-item').first()).toHaveText(
    'Я — человек, который… делает главное первым'
  )
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
  await page.getByTestId('dj-setup-reminder-0').fill('делает главное первым')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-vision-scene').fill('Сижу у окна')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-vision-obstacle').fill('Усталость')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-vision-plan').fill('Перерыв')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-next').click()
  // Шаг 5 — Напоминание (дефолт нового пользователя «Вечером 21:00» → ✓)
  await page.getByTestId('dj-setup-next').click()

  // ── Перечитай — настройка заполнена ──
  await expect(page.locator('.mx-dj-review')).toBeVisible()
  await expect(page.getByTestId('dj-review-edit')).toBeVisible()

  // ── «Мои записи» — тихая ссылка под кнопкой «Начать запись» (#1090) ──
  const entriesLink = page.getByTestId('dj-review-entries')
  await expect(entriesLink).toHaveText('Мои записи')
  await entriesLink.click()
  await expect(page.getByTestId('dj-entries')).toBeVisible()
  await page.getByTestId('back-button').click()
  await expect(page.locator('.mx-dj-review')).toBeVisible()

  // ── Сброс требует подтверждения (#1090): «Отмена» не сбрасывает ──
  await expect(page.getByTestId('dj-review-reset')).toBeVisible()
  await page.getByTestId('dj-review-reset').click()
  await expect(page.getByTestId('dj-reset-confirm')).toBeVisible()
  await expect(page.locator('.mx-dj-confirm__title')).toHaveText('Сбросить настройку?')
  await expect(page.locator('.mx-dj-confirm__text')).toHaveText('Записи сохранятся.')
  await page.getByTestId('dj-reset-cancel').click()
  await expect(page.getByTestId('dj-reset-confirm')).toHaveCount(0)
  await expect(page.locator('.mx-dj-review')).toBeVisible()

  // ── Подтверждение сбрасывает настройку ──
  await page.getByTestId('dj-review-reset').click()
  await page.getByTestId('dj-reset-confirm').click()

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
  await page.getByTestId('dj-setup-reminder-0').fill('делает главное первым')
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

// Геометрия «Готово» и тихих ссылок относительно текущего экрана.
async function measureSavedFooter(page) {
  return page.evaluate(() => {
    const doneEl = document.querySelector('[data-testid="dj-today-done"]')
    const linkIds = ['dj-today-append', 'dj-today-review', 'dj-today-entries']
    const done = doneEl ? doneEl.getBoundingClientRect() : null
    const links = linkIds.map(id => {
      const el = document.querySelector(`[data-testid="${id}"]`)
      if (!el) return { id, missing: true }
      const r = el.getBoundingClientRect()
      return { id, top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height }
    })
    const footerEl = document.querySelector('.mx-screen__footer')
    const footer = footerEl ? footerEl.getBoundingClientRect() : null
    const doc = document.documentElement
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      done: done ? { top: done.top, bottom: done.bottom, height: done.height } : null,
      links,
      footer: footer ? { top: footer.top, bottom: footer.bottom } : null,
      horizontalOverflow: doc.scrollWidth - doc.clientWidth,
      verticalOverflow: doc.scrollHeight - doc.clientHeight,
    }
  })
}

function assertFitsViewport(geometry, label) {
  const { viewport, done, links, footer, horizontalOverflow, verticalOverflow } = geometry
  expect(horizontalOverflow, `${label}: горизонтальная прокрутка`).toBeLessThanOrEqual(2)
  expect(footer, `${label}: футер не найден`).not.toBeNull()
  expect(footer.bottom, `${label}: футер выходит за низ экрана`).toBeLessThanOrEqual(
    viewport.height + 1
  )
  // «Готово» — основная белая кнопка
  expect(done, `${label}: «Готово» не найдена`).not.toBeNull()
  expect(done.height, `${label}: «Готово» ниже 44px`).toBeGreaterThanOrEqual(44)
  expect(done.bottom, `${label}: «Готово» ниже экрана`).toBeLessThanOrEqual(viewport.height + 1)
  for (const l of links) {
    if (l.missing) continue
    expect(l.bottom, `${label}: ${l.id} ниже экрана`).toBeLessThanOrEqual(viewport.height + 1)
    // Тихие ссылки стоят ниже «Готово»
    expect(l.top, `${label}: ${l.id} выше «Готово»`).toBeGreaterThanOrEqual(done.bottom - 1)
  }
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

/*
 * Решение 19.10: «Запись сохранена» — одна белая «Готово» (закрывает экран),
 * под ней тихие ссылки в строку «Дописать · Перечитать · Мои записи».
 * Без скролла на 375×667.
 */
test('журнал: «Запись сохранена» — «Готово» и тихие ссылки, переходы, без дублей', async ({ page }) => {
  await page.goto('/?demo=1&tab=practices')

  await expect(page.getByTestId('journal-open-cta')).toBeVisible()
  await page.getByTestId('journal-open-cta').click()
  await openSavedScreen(page)

  // ── Одна белая «Готово» ──
  const doneBtn = page.getByTestId('dj-today-done')
  await expect(doneBtn).toBeVisible()
  await expect(doneBtn).toBeEnabled()
  await expect(doneBtn).toHaveText('Готово')
  await expect(doneBtn).toHaveAttribute('class', /cta-pill/)

  // ── Тихие ссылки в строку под «Готово» ──
  const appendLink = page.getByTestId('dj-today-append')
  const reviewLink = page.getByTestId('dj-today-review')
  const entriesLink = page.getByTestId('dj-today-entries')
  await expect(appendLink).toBeVisible()
  await expect(appendLink).toHaveAccessibleName('Дописать')
  await expect(reviewLink).toBeVisible()
  await expect(reviewLink).toHaveAccessibleName('Перечитать')
  await expect(entriesLink).toBeVisible()
  await expect(entriesLink).toHaveAccessibleName('Мои записи')

  // ── Геометрия: 393×852 и 375×667 — без скролла ──
  assertFitsViewport(await measureSavedFooter(page), '393×852')
  await page.setViewportSize({ width: 375, height: 667 })
  await waitForSurfaceSettled(page)
  await expect(page.getByTestId('dj-today')).toBeVisible()
  assertFitsViewport(await measureSavedFooter(page), '375×667')
  await page.setViewportSize({ width: 393, height: 852 })
  await waitForSurfaceSettled(page)
  await expect(page.getByTestId('dj-today')).toBeVisible()

  // ── «Готово» закрывает экран (как «Назад») ──
  await doneBtn.click()
  await expect(page.getByTestId('journal-open-cta')).toBeVisible()

  // Открываем снова для проверки переходов
  await page.getByTestId('journal-open-cta').click()
  await expect(page.getByTestId('dj-today')).toBeVisible()

  // ── «Перечитать» → «Вспомни, куда идёшь» → назад ──
  await reviewLink.click()
  await expect(page.locator('.mx-dj-review')).toBeVisible()
  await expect(page.locator('.mx-dj-review__title')).toHaveText('Вспомни, куда идёшь')
  await page.getByTestId('back-button').click()
  await expect(page.getByTestId('dj-today')).toBeVisible()

  // ── «Мои записи» → список записей → назад ──
  await entriesLink.click()
  await expect(page.getByTestId('dj-entries')).toBeVisible()
  await page.getByTestId('back-button').click()
  await expect(page.getByTestId('dj-today')).toBeVisible()

  // ── «Дописать» → продолжение той же записи ──
  await appendLink.click()
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

/* ── #1090: чипы, «+ Добавить», итоговый экран, подтверждение сброса ── */

// Быстрый проход настройки до шага 2 (нужна непустая цель, чтобы шаг 2
// открылся; шаг 2 сам заполняется тестом).
async function openSetupStep2(page) {
  await page.goto('/?demo=1&tab=practices')
  await expect(page.getByTestId('journal-open-cta')).toBeVisible()
  await page.getByTestId('journal-open-cta').click()
  await page.getByTestId('dj-intro-setup').click()
  await page.getByTestId('dj-setup-goal-0').fill('Высыпаться')
  await page.getByTestId('dj-setup-next').click()
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 2 из 5 · Каким я хочу быть')
}

// Быстрый проход настройки до шага 4 «Мои вопросы»: дефолтные вопросы
// демо уже заполнены, шаг проверяется как есть.
async function openSetupStep4(page) {
  await page.goto('/?demo=1&tab=practices')
  await expect(page.getByTestId('journal-open-cta')).toBeVisible()
  await page.getByTestId('journal-open-cta').click()
  await page.getByTestId('dj-intro-setup').click()
  await page.getByTestId('dj-setup-goal-0').fill('Высыпаться')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-reminder-0').fill('держит слово')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-vision-scene').fill('Просыпаюсь без тревоги')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-vision-obstacle').fill('Усталость')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-vision-plan').fill('Делаю минимум')
  await page.getByTestId('dj-setup-next').click()
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 4 из 5 · Мои вопросы')
}

test('журнал: «+ Добавить» — новая пустая строка, примеры не повторяются по кругу', async ({
  page,
}) => {
  await openSetupStep2(page)

  // Заполняем первую строку — появляется «+ Добавить»
  await page.getByTestId('dj-setup-reminder-0').fill('держит слово')
  const addButton = page.getByTestId('dj-setup-add')
  await expect(addButton).toBeVisible()
  await addButton.click()

  // Новая строка пустая, с одной подсказкой — без циклических примеров
  await expect(page.getByTestId('dj-setup-reminder-1')).toHaveValue('')
  await expect(page.getByTestId('dj-setup-reminder-1')).toHaveAttribute(
    'placeholder',
    'держит слово'
  )
  // Решение 19.10: префикс один над списком — у второй строки его нет
  await expect(page.getByTestId('dj-setup-identity-prefix')).toHaveCount(1)
  // У пустой строки нет крестика
  await expect(page.getByTestId('dj-setup-reminder-delete-1')).toHaveCount(0)
  // У заполненной — есть
  await expect(page.getByTestId('dj-setup-reminder-delete-0')).toBeVisible()

  // Пока есть пустая строка, «+ Добавить» не дублирует строки
  await expect(addButton).toHaveCount(0)
})

/*
 * Решение 19.10: для новой настройки — 1 вопрос по умолчанию, остальные
 * готовые вопросы видны сразу чипами. Тап добавляет вопрос и прячет чип,
 * удаление возвращает чип, максимум 7. При 1 вопросе — тихая строка-подсказка.
 * «+ Добавить вопрос» — для своего вопроса.
 */
test('журнал: шаг 4 — чипы готовых вопросов видны сразу, дефолт 1 вопрос', async ({
  page,
}) => {
  await openSetupStep4(page)

  // Дефолт новой настройки — 1 вопрос
  await expect(page.getByTestId('dj-setup-prompt-0')).toHaveValue(
    'Что я откладываю, хотя знаю, что это важно?'
  )
  await expect(page.getByTestId('dj-setup-prompt-1')).toHaveCount(0)

  // При 1 вопросе — тихая строка-подсказка
  await expect(page.getByTestId('dj-setup-prompts-hint')).toHaveText(
    'Один вопрос — каждый день он же. Добавь ещё 2–3, и они пойдут по кругу'
  )

  // Готовые вопросы видны сразу чипами (4 чипа)
  const chips = page.getByTestId('dj-setup-chip')
  await expect(chips).toHaveCount(4)
  await expect(page.getByTestId('dj-setup-chips')).toBeVisible()

  // «+ Добавить вопрос» — для своего вопроса
  await expect(page.getByTestId('dj-setup-add-prompt')).toBeVisible()

  // Тап по чипу добавляет вопрос и прячет чип
  const chipText = 'Какой один шаг сделает завтра чуть легче?'
  await chips.filter({ hasText: chipText }).click()
  await expect(page.getByTestId('dj-setup-prompt-1')).toHaveValue(chipText)
  await expect(chips.filter({ hasText: chipText })).toHaveCount(0)
  await expect(chips).toHaveCount(3)
  // Подсказка исчезла (2 вопроса)
  await expect(page.getByTestId('dj-setup-prompts-hint')).toHaveCount(0)

  // Удаление вопроса возвращает чип
  await page.getByTestId('dj-setup-prompt-delete-1').click()
  await expect(page.getByTestId('dj-setup-prompt-1')).toHaveCount(0)
  await expect(chips.filter({ hasText: chipText })).toHaveCount(1)
  await expect(chips).toHaveCount(4)
  // Подсказка вернулась (1 вопрос)
  await expect(page.getByTestId('dj-setup-prompts-hint')).toBeVisible()

  // «+ Добавить вопрос» — добавляет пустую строку для своего вопроса
  await page.getByTestId('dj-setup-add-prompt').click()
  await expect(page.getByTestId('dj-setup-prompt-1')).toHaveValue('')
  await expect(page.getByTestId('dj-setup-prompt-1')).toHaveAttribute(
    'placeholder',
    'Вопрос 2'
  )
  // Пока есть пустая строка, кнопка не дублирует
  await expect(page.getByTestId('dj-setup-add-prompt')).toHaveCount(0)
  await page.getByTestId('dj-setup-prompt-1').fill('Свой вопрос')
  await expect(page.getByTestId('dj-setup-add-prompt')).toBeVisible()

  // Максимум 7 вопросов: заполняем чипами до 7, «+ Добавить вопрос» исчезает
  await chips.filter({ hasText: chipText }).click()
  const chip2 = 'Что сегодня забрало больше всего сил — и что их вернуло?'
  await chips.filter({ hasText: chip2 }).click()
  const chip3 = 'За что я могу себя сегодня похвалить, даже за мелочь?'
  await chips.filter({ hasText: chip3 }).click()
  const chip4 = 'Что меня сегодня задело — и что за этим стоит?'
  await chips.filter({ hasText: chip4 }).click()
  await page.getByTestId('dj-setup-add-prompt').click()
  await page.getByTestId('dj-setup-prompt-6').fill('Седьмой вопрос')
  await expect(page.getByTestId('dj-setup-add-prompt')).toHaveCount(0)
  await expect(page.getByTestId('dj-setup-prompt-7')).toHaveCount(0)
})

test('журнал: итоговый экран — одна кнопка «Начать запись» без скролла на 375×667', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/?demo=1&tab=practices')

  await expect(page.getByTestId('journal-open-cta')).toBeVisible()
  await page.getByTestId('journal-open-cta').click()
  await page.getByTestId('dj-intro-setup').click()
  await page.getByTestId('dj-setup-goal-0').fill('Высыпаться')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-reminder-0').fill('держит слово')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-vision-scene').fill('Просыпаюсь без тревоги')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-vision-obstacle').fill('Усталость')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-vision-plan').fill('Делаю минимум')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-next').click() // шаг 4 · Мои вопросы
  await page.getByTestId('dj-setup-next').click() // шаг 5 · Напоминание (дефолт)

  // ── Итоговый экран ──
  await expect(page.locator('.mx-dj-review')).toBeVisible()
  await waitForSurfaceSettled(page)

  // Одна закреплённая белая кнопка «Начать запись», круглая ✓ убрана
  const startBtn = page.getByTestId('dj-review-next')
  await expect(startBtn).toBeVisible()
  await expect(startBtn).toHaveText('Начать запись')
  await expect(page.locator('.mx-dj-review .mx-round-next-btn')).toHaveCount(0)
  await expect(page.locator('.mx-round-next-btn')).toHaveCount(0)

  // Кнопка целиком в кадре 375×667 — главное действие без скролла
  const box = await startBtn.boundingBox()
  expect(box.height).toBeGreaterThanOrEqual(44)
  expect(box.y + box.height).toBeLessThanOrEqual(667)

  // Тихие ссылки под кнопкой: «Мои записи» и «Изменить настройку»
  await expect(page.getByTestId('dj-review-entries')).toBeVisible()
  await expect(page.getByTestId('dj-review-edit')).toBeVisible()
  const linksBox = await page.getByTestId('dj-review-entries').boundingBox()
  expect(linksBox.y).toBeGreaterThanOrEqual(box.y + box.height)

  // Кнопка ведёт в «Поток»
  await startBtn.click()
  await expect(page.getByTestId('dj-stream-input')).toBeVisible()
})

test('журнал: сброс настройки только через подтверждение', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/?demo=1&tab=practices')

  await expect(page.getByTestId('journal-open-cta')).toBeVisible()
  await page.getByTestId('journal-open-cta').click()
  await page.getByTestId('dj-intro-setup').click()
  await page.getByTestId('dj-setup-goal-0').fill('Высыпаться')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-reminder-0').fill('держит слово')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-vision-scene').fill('Просыпаюсь без тревоги')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-vision-obstacle').fill('Усталость')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-vision-plan').fill('Делаю минимум')
  await page.getByTestId('dj-setup-next').click()
  await page.getByTestId('dj-setup-next').click() // шаг 4
  await page.getByTestId('dj-setup-next').click() // шаг 5

  await expect(page.locator('.mx-dj-review')).toBeVisible()

  // Клик по «Сбросить и начать заново» сам ничего не сбрасывает
  await page.getByTestId('dj-review-reset').click()
  await expect(page.getByTestId('dj-reset-confirm')).toBeVisible()
  await expect(page.locator('.mx-dj-review__title')).toBeVisible()

  // Фон диалога (кнопка «Отмена» на подложке) закрывает без сброса
  await page.getByTestId('dj-reset-cancel-backdrop').click()
  await expect(page.getByTestId('dj-reset-confirm')).toHaveCount(0)
  await expect(page.locator('.mx-dj-review')).toBeVisible()

  // Подтверждение «Сбросить» — настройка сброшена, записи не тронуты
  await page.getByTestId('dj-review-reset').click()
  await page.getByTestId('dj-reset-confirm').click()
  await expect(page.getByTestId('dj-intro-setup')).toBeVisible()
})
