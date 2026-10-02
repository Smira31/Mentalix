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
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 1 из 4 · Цели')
  await page.getByTestId('dj-setup-next').click()
  // Вернулись на intro
  await expect(page.getByTestId('dj-intro-skip')).toBeVisible()

  // Снова в настройку
  await page.getByTestId('dj-intro-setup').click()
  // Заполняем цель → ✓ дальше
  await page.getByTestId('dj-setup-goal-0').fill('Спокойствие')
  await page.getByTestId('dj-setup-next').click()

  // ── Шаг 2 — Кем я становлюсь ──
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 2 из 4 · Кем я становлюсь')
  await page.getByTestId('dj-setup-reminder-0').fill('Я делаю главное до обеда')
  await page.getByTestId('dj-setup-next').click()

  // ── Шаг 3 — Картинка будущего · 1/3 ──
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 3 из 4 · Картинка будущего · 1/3')
  await expect(page.getByTestId('dj-setup-vision-scene')).toBeVisible()
  // Пусто → ✕ = назад на шаг 2
  await page.getByTestId('dj-setup-next').click()
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 2 из 4 · Кем я становлюсь')
  // Назад на шаг 3
  await page.getByTestId('dj-setup-next').click()
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 3 из 4 · Картинка будущего · 1/3')

  // Заполняем scene → ✓ дальше
  await page.getByTestId('dj-setup-vision-scene').fill('Сижу у окна, работа сделана')
  await page.getByTestId('dj-setup-next').click()

  // ── 2/3 ──
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 3 из 4 · Картинка будущего · 2/3')
  await expect(page.getByTestId('dj-setup-vision-obstacle')).toBeVisible()
  await page.getByTestId('dj-setup-vision-obstacle').fill('Усталость')
  await page.getByTestId('dj-setup-next').click()

  // ── 3/3 ──
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 3 из 4 · Картинка будущего · 3/3')
  await expect(page.getByTestId('dj-setup-vision-plan')).toBeVisible()
  await page.getByTestId('dj-setup-vision-plan').fill('Сделаю перерыв')
  await page.getByTestId('dj-setup-next').click()

  // ── Шаг 4 — Мои вопросы (есть дефолт → ✓) ──
  await expect(page.locator('.mx-dj-setup__step-label')).toHaveText('Шаг 4 из 4 · Мои вопросы')
  await page.getByTestId('dj-setup-next').click()

  // ── Перечитай (после настройки с данными) ──
  await expect(page.locator('.mx-dj-review')).toBeVisible()
  await expect(page.getByTestId('dj-review-edit')).toBeVisible()
})
