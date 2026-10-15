import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

import { createEvidenceWriter, describeFrames } from './typography-evidence.mjs'

/*
 * MXL-TYPE-READABLE-001 — согласованная средняя читаемая шкала Mentalix.
 *
 * Целевые ФАКТИЧЕСКИЕ размеры (computed, не значения в CSS):
 *  - основной текст, чтение и ввод записей — 16px, межстрочный 1.4–1.7;
 *  - содержательные пояснения — 14px, вторичные подписи — 13px;
 *  - текст кнопок и выбранных плиток — 16px;
 *  - основной вопрос чек-ина, заголовки дневника и финалов — 24px, межстрочный 1.1–1.35.
 *
 * Область этапа — три поверхности: «Сегодня», утренний и вечерний чек-ин
 * (включая шаг фокуса, шаг эмоций и финал), DailyJournal (включая финал).
 * Остальные разделы сохраняют общий множитель --mx-type-scale: 0.86.
 *
 * Тест не только проверяет контракт, но и выгружает фактическую таблицу
 * размеров и снимки одинаковых состояний до/после в
 * qa-evidence/typography-readable/<phase>/.
 *
 * Фаза задаётся переменной MX_TYPE_PHASE=before|after (по умолчанию after).
 * В фазе before контракт НЕ проверяется: baseline собирается целиком, чтобы
 * сравнение «до/после» охватывало все состояния, а не обрывалось на первой
 * проверке. Значения baseline сравниваются с целями отчётом
 * scripts/typography-compare.mjs.
 *
 * Поиск элементов — по селекторам поверхностей и data-testid, без waitForTimeout.
 */

const PHASE = process.env.MX_TYPE_PHASE || 'after'
const OUT_DIR = path.join('qa-evidence', 'typography-readable', PHASE)
// Baseline: собираем evidence и не падаем на расхождениях — RED фиксируется сравнением.
const ASSERT = PHASE !== 'before'

const VIEWPORTS = [
  { name: '393x852', width: 393, height: 852 },
  { name: '360x640', width: 360, height: 640 },
]

/* Клавиатура: высота видимой области телефона с поднятой клавиатурой. */
const KEYBOARD_VIEWPORT = { width: 393, height: 420 }

const DEMO_TODAY = '/?demo=1&frame=0'
const DEMO_EVENING = '/?demo=1&frame=0&today_state=eveningPrimary&review_open=1'
const DEMO_COMPLETE_MORNING = '/?demo=1&frame=0&action=complete_morning'
const DEMO_COMPLETE_EVENING = '/?demo=1&frame=0&action=complete_evening'

/*
 * Поле записи чек-ина: в демо-разметке data-testid="checkin-text-input" стоит
 * на самом contenteditable, у вечернего разбора — свой класс на поле.
 */
const CHECKIN_INPUT_SELECTOR =
  '.mx-demo-checkin__editor [contenteditable], [data-testid="checkin-text-input"], .mx-checkin-evening-editor [contenteditable]'

/* Проверяемые роли: селектор → как читать измерение. */
const CHECKIN_ROLES = {
  question: { sel: '.mx-checkin-question h1, .mx-checkin-question h2', role: 'ask' },
  hint: { sel: '.mx-checkin-question__hint', role: 'note' },
  scaleLabel: { sel: '.mx-checkin-scale__label', role: 'caption' },
  chip: { sel: '.mx-checkin-chips button', role: 'action' },
  focusTile: { sel: '.mx-demo-checkin__focus-grid button span', role: 'action' },
  input: { sel: CHECKIN_INPUT_SELECTOR, role: 'read' },
  submit: { sel: '[data-testid="checkin-next"], [data-testid="checkin-complete"]', role: 'action' },
  /* Вечерний «Разбор дня»: свои заголовки, поле и шаг эмоций. */
  eveningQuestion: { sel: '.mx-checkin-question--evening-card > h2, .mx-checkin-question--emotion > h2', role: 'ask' },
  eveningHint: { sel: '.mx-checkin-question--evening-card .mx-checkin-question__hint', role: 'note' },
  eveningInput: { sel: '.mx-checkin-evening-editor [contenteditable]', role: 'read' },
  emotionTile: { sel: '.mx-emotion-grid__tile', role: 'action' },
  emotionPill: { sel: '.mx-emotion-pill', role: 'action' },
}

/* Финал чек-ина — общий компонент CheckInCompletion (утро, вечер, дневник). */
const COMPLETION_ROLES = {
  title: { sel: '.mx-completion__title', role: 'ask' },
  datePill: { sel: '.mx-completion__date-pill', role: 'caption' },
  question: { sel: '.mx-completion__feedback p', role: 'note' },
  choice: { sel: '.mx-completion__choices button', role: 'caption' },
  action: { sel: '.mx-completion-action button, .mx-completion-action .cta-pill', role: 'action' },
}

const JOURNAL_ROLES = {
  setupQuestion: { sel: '.mx-dj-setup__field-group .mx-journal-field__question', role: 'ask' },
  setupInput: { sel: '.mx-dj-setup__input', role: 'read' },
  reviewTitle: { sel: '.mx-dj-review__title', role: 'ask' },
  reviewItem: { sel: '.mx-dj-review__item', role: 'read' },
  reviewNote: { sel: '.mx-dj-review__reminder', role: 'note' },
  entriesBtn: { sel: '.mx-dj-review__entries-btn', role: 'action' },
  streamTitle: { sel: '.mx-dj-stream__title', role: 'ask' },
  streamHint: { sel: '.mx-dj-stream__hint', role: 'note' },
  streamField: { sel: '.mx-dj-stream__field', role: 'read' },
  questionText: { sel: '.mx-dj-question__text', role: 'ask' },
  questionField: { sel: '.mx-dj-question__field', role: 'read' },
  todayTitle: { sel: '.mx-dj-today__title', role: 'ask' },
  todayText: { sel: '.mx-dj-today__text', role: 'read' },
  todayAppend: { sel: '.mx-dj-today__append-btn', role: 'action' },
  todayPill: { sel: '.mx-dj-today__secondary-btn', role: 'action' },
  entriesItemStream: { sel: '.mx-dj-entries__item-stream', role: 'read' },
  entriesItemQuestion: { sel: '.mx-dj-entries__item-question', role: 'note' },
}

const TODAY_ROLES = {
  cardTitle: { sel: '.mx-today-day-card__title', role: 'keep' },
  cardStart: { sel: '.mx-today-day-card__start', role: 'keep' },
  quote: { sel: '.mx-today-affirmation-card .mx-type-card', role: 'keep' },
  practiceTitle: { sel: '.mx-pinned-practice-card__title', role: 'caption' },
  pulse: { sel: '.mx-today-pulse', role: 'caption' },
  weekDay: { sel: '.mx-type-weekday', role: 'keep' },
  metaLabel: { sel: '.mx-type-meta', role: 'caption' },
}

/* Фактическая таблица: все видимые элементы с собственным текстом. */
function readInventory(page) {
  return page.evaluate(() => {
    const rows = []
    for (const el of document.querySelectorAll('body *')) {
      const rect = el.getBoundingClientRect()
      if (!rect.width || !rect.height) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue
      const own = Array.from(el.childNodes)
        .filter(node => node.nodeType === 3)
        .map(node => node.textContent.trim())
        .join(' ')
        .trim()
      if (!own) continue
      rows.push({
        sel: `${el.tagName.toLowerCase()}${el.dataset?.testid ? `[${el.dataset.testid}]` : ''}.${(el.className || '').toString().split(' ').filter(Boolean).slice(0, 2).join('.')}`,
        text: own.slice(0, 64),
        size: Math.round(parseFloat(cs.fontSize) * 100) / 100,
        lh: cs.lineHeight === 'normal' ? null : Math.round((parseFloat(cs.lineHeight) / parseFloat(cs.fontSize)) * 100) / 100,
      })
    }
    return rows
  })
}

/* Геометрия: горизонтальный выход за вьюпорт. */
function readOverflow(page) {
  return page.evaluate(() => {
    const de = document.documentElement
    const limit = de.clientWidth + 2
    const offenders = []
    for (const el of document.querySelectorAll('body *')) {
      const rect = el.getBoundingClientRect()
      if (!rect.width || !rect.height) continue
      if (rect.right > limit || rect.left < -2) {
        const cs = getComputedStyle(el)
        if (cs.visibility === 'hidden' || cs.display === 'none') continue
        offenders.push({
          sel: `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ').filter(Boolean).slice(0, 2).join('.')}`,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
        })
      }
    }
    return {
      scrollWidth: de.scrollWidth,
      clientWidth: de.clientWidth,
      scrollHeight: de.scrollHeight,
      clientHeight: de.clientHeight,
      offenders: offenders.slice(0, 12),
    }
  })
}

/* Измерение ролей на текущем экране. */
function readRoles(page, roles) {
  return page.evaluate(roleMap => {
    const result = {}
    for (const [name, def] of Object.entries(roleMap)) {
      const el = document.querySelector(def.sel)
      if (!el) {
        result[name] = null
        continue
      }
      const cs = getComputedStyle(el)
      const size = parseFloat(cs.fontSize)
      result[name] = {
        size: Math.round(size * 100) / 100,
        lh: cs.lineHeight === 'normal' ? null : Math.round((parseFloat(cs.lineHeight) / size) * 100) / 100,
        text: (el.textContent || '').trim().slice(0, 48),
        role: def.role,
      }
    }
    return result
  }, roles)
}

function assertRole(measure, name, expectedSize, lhRange) {
  const fact = measure[name]
  expect(fact, `роль ${name} не найдена`).not.toBeNull()
  expect(fact.size, `роль ${name} (${fact.text}): фактический размер`).toBeCloseTo(expectedSize, 1)
  if (lhRange) {
    expect(fact.lh, `роль ${name}: межстрочный интервал`).toBeGreaterThanOrEqual(lhRange[0])
    expect(fact.lh, `роль ${name}: межстрочный интервал`).toBeLessThanOrEqual(lhRange[1])
  }
}

function assertNoOverflow(overflow, label) {
  expect(
    overflow.scrollWidth,
    `${label}: горизонтальный выход (виновники: ${JSON.stringify(overflow.offenders)})`
  ).toBeLessThanOrEqual(overflow.clientWidth + 2)
}

/* ── Прохождение поверхностей ── */

async function surfaceState(page, roles) {
  const rolesRead = roles ? await readRoles(page, roles) : null

  return {
    roles: rolesRead,
    inventory: await readInventory(page),
    overflow: await readOverflow(page),
  }
}

async function walkToday(page, writer) {
  await page.goto(DEMO_TODAY)
  await expect(page.getByTestId('today-card-morning')).toBeVisible()
  const state = await surfaceState(page, TODAY_ROLES)
  await writer.capture(page, {
    name: '01-today.png',
    marker: '.mx-today-day-card__title',
    markerLabel: 'Сегодня: карточка дня',
  })

  return state
}

/*
 * Чек-ин: утренний (?demo=1, карточка утра) и вечерний (today_state=eveningPrimary).
 * Идём по шагам до экрана финала, снимая состояния шкалы, фокуса, эмоций,
 * редактора и финала — одинаковый набор в фазах before и after.
 */
async function walkCheckIn(page, writer, { filePrefix, url, cardTestId, evening, onEditor }) {
  await page.goto(url)
  const card = page.getByTestId(cardTestId)
  await expect(card).toBeVisible()
  await card.click()

  const steps = []
  let questionStep = null
  let focusStep = null
  let emotionStep = null
  let editorStep = null
  let completion = null

  for (let i = 0; i < 14; i += 1) {
    if (await page.locator('.mx-completion').count()) break

    await expect(page.locator('.mx-demo-checkin__scene, .mx-checkin-question').first()).toBeVisible()
    const roles = await readRoles(page, CHECKIN_ROLES)
    const overflow = await readOverflow(page)
    steps.push({ index: i, roles, overflow, inventory: await readInventory(page) })

    if (!questionStep && (roles.question || roles.eveningQuestion)) {
      questionStep = roles
      await writer.capture(page, {
        name: `${filePrefix}-question.png`,
        marker: '.mx-checkin-question h1, .mx-checkin-question h2',
        markerLabel: 'чек-ин: вопрос шага',
      })
    }
    if (!focusStep && roles.focusTile) {
      focusStep = { ...roles, overflow }
      await writer.capture(page, {
        name: `${filePrefix}-focus.png`,
        marker: '[data-testid="checkin-day-focus-option"]',
        markerLabel: 'чек-ин: сетка «Главный фокус дня»',
      })
    }
    if (!emotionStep && (roles.emotionTile || roles.emotionPill)) {
      emotionStep = { ...roles, overflow }
      await writer.capture(page, {
        name: `${filePrefix}-emotion.png`,
        marker: '.mx-emotion-grid__tile, .mx-emotion-pill',
        markerLabel: 'чек-ин: шаг эмоций',
      })
    }

    // Шаг фокуса дня: выбираем плитку, чтобы проверить выбранное состояние.
    const focusTiles = page.locator('[data-testid="checkin-day-focus-option"]')
    if (await focusTiles.count()) {
      const first = focusTiles.first()
      if ((await first.getAttribute('aria-pressed')) !== 'true') {
        await first.click()
        await expect(first).toHaveAttribute('aria-pressed', 'true')
      }
    }

    // Шаг эмоций: выбираем первую доступную пилюлю.
    const emotionPills = page.locator('[data-testid="checkin-emotion-pill"]')
    if (await emotionPills.count()) {
      const first = emotionPills.first()
      if ((await first.getAttribute('aria-pressed')) !== 'true') await first.click()
    }

    const input = page.locator(CHECKIN_INPUT_SELECTOR)
    if (await input.count()) {
      if (!editorStep) {
        editorStep = { ...roles, overflow }
        await writer.capture(page, {
          name: `${filePrefix}-editor.png`,
          marker: CHECKIN_INPUT_SELECTOR,
          markerLabel: 'чек-ин: поле записи',
        })
        if (onEditor) await onEditor(page)
      }
      await input.first().fill('Тестовая запись: спокойный вечер, короткая прогулка и разговор.')
      const finish = page.locator('[data-testid="checkin-complete"]')
      if (await finish.isVisible().catch(() => false)) {
        await finish.click()
        continue
      }
    }

    // Шаг шкалы: сначала отвечаем. Пока ответа нет, круглая кнопка — «✕»
    // и закрыла бы чек-ин вместо перехода вперёд; «Далее» появляется после выбора.
    const scaleOption = page.locator('[data-testid="checkin-scale-option"][data-level="3"]')
    if (await scaleOption.count()) {
      if ((await scaleOption.first().getAttribute('aria-checked')) !== 'true') {
        await scaleOption.first().click()
      }
    }

    const next = page.locator('[data-testid="checkin-next"]')
    if (await next.isVisible().catch(() => false)) {
      if (await next.isEnabled()) {
        await next.click()
        continue
      }
    }
    break
  }

  // Финал: общий компонент CheckInCompletion.
  if (await page.locator('.mx-completion').count()) {
    await expect(page.locator('.mx-completion__title')).toBeVisible()
    completion = await surfaceState(page, COMPLETION_ROLES)
    await writer.capture(page, {
      name: `${filePrefix}-complete.png`,
      marker: '.mx-completion__title',
      markerLabel: 'чек-ин: финал',
    })
  }

  return { evening, steps, questionStep, focusStep, emotionStep, editorStep, completion }
}

/* Прямые превью финалов — одинаковое состояние в обеих фазах. */
async function walkCompletionPreview(page, writer, { filePrefix, url }) {
  await page.goto(url)
  await expect(page.locator('.mx-completion__title')).toBeVisible()
  const state = await surfaceState(page, COMPLETION_ROLES)
  await writer.capture(page, {
    name: `${filePrefix}.png`,
    marker: '.mx-completion__title',
    markerLabel: `превью финала (${filePrefix})`,
  })

  return state
}

async function walkJournal(page, writer) {
  const stages = {}
  await page.goto('/?demo=1&tab=practices&frame=0')
  await expect(page.getByTestId('journal-open-cta')).toBeVisible()
  await page.getByTestId('journal-open-cta').click()

  // Настройка: первый шаг (вопрос + пояснение + поля ввода)
  await expect(page.getByTestId('dj-intro-setup')).toBeVisible()
  await page.getByTestId('dj-intro-setup').click()
  await expect(page.locator('.mx-dj-setup').first()).toBeVisible()
  stages.setup = await surfaceState(page, JOURNAL_ROLES)
  await writer.capture(page, {
    name: '12-journal-setup.png',
    marker: '.mx-dj-setup__field-group .mx-journal-field__question',
    markerLabel: 'дневник: вопрос шага настройки',
  })

  // Проходим настройку целиком, чтобы появился экран «Вспомни, куда идёшь».
  // Шаг считается пройденным, когда заполнено хотя бы одно поле шага: до этого
  // круглая кнопка — «назад», а не «далее».
  // Читаем метку шага одним evaluate: locator.textContent() у отсутствующего
  // селектора ждёт элемент до таймаута, из-за чего expect.poll не успевал
  // ни разу выполниться. Здесь ожидания нет — только текущее состояние DOM.
  const stepLabel = () =>
    page.evaluate(() => {
      const read = sel => document.querySelector(sel)?.textContent || ''
      return (
        read('.mx-dj-setup__step-label') +
        read('[data-testid="dj-setup-vision-label"]') +
        read('[data-testid="dj-setup-reminder-label"]')
      )
    })

  for (let i = 0; i < 14; i += 1) {
    if (await page.locator('.mx-dj-review').count()) break
    const fields = page.locator('.mx-dj-setup__input, .mx-dj-setup__vision-field')
    const count = await fields.count()
    for (let k = 0; k < count; k += 1) {
      const field = fields.nth(k)
      if ((await field.inputValue().catch(() => null)) === '') {
        await field.fill('Тестовая цель настройки дневника')
      }
    }
    const tile = page.getByTestId('dj-setup-reminder-off')
    if (await tile.count()) await tile.first().click()
    const before = await stepLabel()
    const next = page.getByTestId('dj-setup-next')
    const buttonLabel = await next.getAttribute('aria-label')
    await next.click()
    try {
      await expect.poll(stepLabel, { timeout: 6_000 }).not.toBe(before)
      console.log(`[dj-setup] шаг ${i}: «${before}» → кнопка «${buttonLabel}»`)
    } catch {
      console.log(
        `[dj-setup] нет прогресса на шаге ${i}: «${before}», кнопка «${buttonLabel}», полей ${count}`
      )
      break
    }
  }

  await expect(page.locator('.mx-dj-review')).toBeVisible()
  stages.review = await surfaceState(page, JOURNAL_ROLES)
  await writer.capture(page, {
    name: '13-journal-review.png',
    marker: '.mx-dj-review__title',
    markerLabel: 'дневник: «Вспомни, куда идёшь»',
  })

  // Ввод: поток
  await expect(page.getByTestId('dj-review-next')).toBeVisible()
  await page.getByTestId('dj-review-next').click()
  await expect(page.getByTestId('dj-stream-input')).toBeVisible()
  stages.stream = await surfaceState(page, JOURNAL_ROLES)
  await writer.capture(page, {
    name: '14-journal-stream.png',
    marker: '.mx-dj-stream__title',
    markerLabel: 'дневник: шаг «поток»',
  })

  // Вопрос дня
  await page.getByTestId('dj-stream-input').fill('Сижу дома, пью чай. Думаю о том, что нужно сделать сегодня.')
  await page.getByTestId('dj-stream-next').click()
  await expect(page.getByTestId('dj-question-input')).toBeVisible()
  stages.question = await surfaceState(page, JOURNAL_ROLES)
  await writer.capture(page, {
    name: '15-journal-question.png',
    marker: '.mx-dj-question__text',
    markerLabel: 'дневник: вопрос дня',
  })

  // Сохранение: после ответа на вопрос дня штатный переход ведёт на экран
  // завершения. Возвращаемся на вкладку практик и открываем журнал заново —
  // запись за сегодня уже есть, поэтому журнал открывается на «Сегодня».
  await page.getByTestId('dj-question-input').fill('Один спокойный шаг важнее идеального плана.')
  await page.getByTestId('dj-question-next').click()
  await expect(page.getByTestId('dj-complete-close')).toBeVisible()
  stages.complete = await surfaceState(page, COMPLETION_ROLES)
  await writer.capture(page, {
    name: '16-journal-complete.png',
    marker: '.mx-completion__title',
    markerLabel: 'дневник: финал записи',
  })
  await page.getByTestId('dj-complete-close').click()
  await expect(page.getByTestId('journal-open-cta')).toBeVisible()
  await page.getByTestId('journal-open-cta').click()

  // Сохранённая запись («сегодня»)
  await expect(page.getByTestId('dj-today')).toBeVisible()
  stages.today = await surfaceState(page, JOURNAL_ROLES)
  await writer.capture(page, {
    name: '17-journal-today.png',
    marker: '.mx-dj-today__title',
    markerLabel: 'дневник: «Запись сохранена»',
  })

  // «Мои записи»
  await page.getByTestId('dj-today-entries').click()
  await expect(page.getByTestId('dj-entries')).toBeVisible()
  // Признак этого экрана — загруженный список. Пока идёт загрузка, на экране
  // есть лишь подпись «МОИ ЗАПИСИ» и слово «Загрузка…». Это ожидание
  // состояния, а не задержка: снимается то, что должно быть видно.
  await expect(page.locator('.mx-dj-entries__item').first()).toBeVisible()
  stages.entries = await surfaceState(page, JOURNAL_ROLES)
  await writer.capture(page, {
    name: '18-journal-entries.png',
    marker: '.mx-dj-entries__item-stream',
    markerLabel: 'дневник: «мои записи»',
  })

  return stages
}

/* ── Контракт ── */

function assertCheckIn(surface, label) {
  const question = surface.questionStep
  expect(question, `${label}: главный вопрос не найден`).not.toBeNull()
  assertRole(question, question.eveningQuestion ? 'eveningQuestion' : 'question', 24, [1.1, 1.35])
  if (question.eveningQuestion && question.eveningHint) {
    assertRole(question, 'eveningHint', 14)
  } else if (question.hint) {
    assertRole(question, 'hint', 14)
  }
  if (question.scaleLabel) {
    expect(question.scaleLabel.size, `${label}: подпись шкалы`).toBeGreaterThanOrEqual(13)
  }
  if (question.chip) assertRole(question, 'chip', 16)

  if (surface.evening) {
    // Вечерний «Разбор дня» идёт через шаг эмоций, сетки фокуса дня в нём нет.
    expect(surface.emotionStep, `${label}: шаг эмоций не найден`).not.toBeNull()
    if (surface.emotionStep.emotionTile) assertRole(surface.emotionStep, 'emotionTile', 16)
    else assertRole(surface.emotionStep, 'emotionPill', 16)
  } else {
    expect(surface.focusStep, `${label}: шаг «Главный фокус дня» не найден`).not.toBeNull()
    assertRole(surface.focusStep, 'focusTile', 16)
  }

  const editor = surface.editorStep
  expect(editor, `${label}: поле ввода записи не найдено`).not.toBeNull()
  assertRole(editor, editor.eveningInput ? 'eveningInput' : 'input', 16, [1.4, 1.7])
  assertNoOverflow(editor.overflow, `${label}: поле ввода`)

  for (const [name, stage] of Object.entries(surface.steps)) {
    assertNoOverflow(stage.overflow, `${label}: шаг ${name}`)
  }
}

function assertCompletion(completion, label) {
  expect(completion, `${label}: экран финала не найден`).not.toBeNull()
  const roles = completion.roles
  assertRole(roles, 'title', 24, [1.1, 1.4])
  if (roles.datePill) assertRole(roles, 'datePill', 13)
  if (roles.question) assertRole(roles, 'question', 14)
  if (roles.choice) assertRole(roles, 'choice', 13)
  if (roles.action) assertRole(roles, 'action', 16)
  assertNoOverflow(completion.overflow, `${label}: финал`)
}

function assertJournal(stages, label) {
  assertRole(stages.setup.roles, 'setupQuestion', 24, [1.15, 1.35])
  assertRole(stages.setup.roles, 'setupInput', 16)
  assertRole(stages.review.roles, 'reviewTitle', 24, [1.15, 1.35])
  assertRole(stages.review.roles, 'reviewItem', 16)
  if (stages.review.roles.reviewNote) assertRole(stages.review.roles, 'reviewNote', 14)
  if (stages.review.roles.entriesBtn) assertRole(stages.review.roles, 'entriesBtn', 16)
  if (stages.stream.roles.streamHint) assertRole(stages.stream.roles, 'streamHint', 14)
  assertRole(stages.stream.roles, 'streamTitle', 24, [1.15, 1.35])
  assertRole(stages.stream.roles, 'streamField', 16, [1.45, 1.7])
  assertRole(stages.question.roles, 'questionText', 24, [1.15, 1.35])
  assertRole(stages.question.roles, 'questionField', 16)
  assertRole(stages.today.roles, 'todayTitle', 24, [1.15, 1.35])
  assertRole(stages.today.roles, 'todayText', 16, [1.45, 1.7])
  if (stages.today.roles.todayPill) assertRole(stages.today.roles, 'todayPill', 16)
  if (stages.entries.roles.entriesItemStream) assertRole(stages.entries.roles, 'entriesItemStream', 16)

  for (const [name, stage] of Object.entries(stages)) {
    assertNoOverflow(stage.overflow, `${label}: ${name}`)
  }
}

function assertToday(surface, label) {
  const roles = surface.roles
  expect(roles.cardTitle, `${label}: заголовок карточки дня не найден`).not.toBeNull()
  // «Сегодня» не увеличивает все заголовки до 24px — они остаются близкими к текущим.
  expect(roles.cardTitle.size, `${label}: заголовок карточки дня не должен вырасти до 24px`).toBeLessThanOrEqual(22)
  expect(roles.cardTitle.size).toBeGreaterThanOrEqual(16)
  if (roles.pulse) {
    expect(roles.pulse.size, `${label}: мелкая содержательная подпись`).toBeGreaterThanOrEqual(13)
  }
  if (roles.practiceTitle) {
    expect(roles.practiceTitle.size, `${label}: подпись плитки практики`).toBeGreaterThanOrEqual(13)
  }
  if (roles.metaLabel) {
    expect(roles.metaLabel.size, `${label}: вторичная подпись mx-type-meta`).toBeGreaterThanOrEqual(13)
  }
  assertNoOverflow(surface.overflow, `${label}: Сегодня`)
}

/* ── Тесты ── */

for (const vp of VIEWPORTS) {
  test(`читаемая шкала: измерения и контракт на ${vp.name}`, async ({ page }) => {
    fs.mkdirSync(OUT_DIR, { recursive: true })
    // Снимки каждого вьюпорта — в своей папке: общий каталог перезаписывал
    // кадры 393x852 кадрами 360x640, и evidence не совпадал со своей подписью.
    const writer = createEvidenceWriter({ dir: path.join(OUT_DIR, vp.name) })
    await page.setViewportSize({ width: vp.width, height: vp.height })

    const report = {
      phase: PHASE,
      assert: ASSERT,
      viewport: vp,
      today: null,
      checkinMorning: null,
      checkinEvening: null,
      completeMorning: null,
      completeEvening: null,
      journal: null,
    }
    const persist = () =>
      fs.writeFileSync(
        path.join(OUT_DIR, `measure-${vp.name}.json`),
        JSON.stringify(report, null, 2)
      )

    report.today = await walkToday(page, writer)
    persist()

    report.checkinMorning = await walkCheckIn(page, writer, {
      filePrefix: '02-morning',
      url: DEMO_TODAY,
      cardTestId: 'today-card-morning',
      evening: false,
    })
    persist()

    report.checkinEvening = await walkCheckIn(page, writer, {
      filePrefix: '03-evening',
      url: DEMO_EVENING,
      cardTestId: 'today-card-evening',
      evening: true,
    })
    persist()

    report.completeMorning = await walkCompletionPreview(page, writer, {
      filePrefix: '04-complete-morning',
      url: DEMO_COMPLETE_MORNING,
    })
    persist()

    report.completeEvening = await walkCompletionPreview(page, writer, {
      filePrefix: '05-complete-evening',
      url: DEMO_COMPLETE_EVENING,
    })
    persist()

    report.journal = await walkJournal(page, writer)
    persist()

    // Снятые кадры — часть доказательства: печатаем их хеши, чтобы совпадение
    // двух состояний было видно в логе, а не только в падении проверки.
    console.log(`снято кадров ${vp.name}: ${writer.frames.length}`)
    console.log(describeFrames(writer))

    if (!ASSERT) return

    assertToday(report.today, vp.name)
    assertCheckIn(report.checkinMorning, `${vp.name}: утренний чек-ин`)
    assertCheckIn(report.checkinEvening, `${vp.name}: вечерний чек-ин`)
    assertCompletion(report.checkinMorning.completion, `${vp.name}: финал утреннего чек-ина`)
    assertCompletion(report.checkinEvening.completion, `${vp.name}: финал вечернего чек-ина`)
    assertCompletion(report.completeMorning, `${vp.name}: превью финала утра`)
    assertCompletion(report.completeEvening, `${vp.name}: превью финала вечера`)
    assertJournal(report.journal, vp.name)
  })
}

/*
 * Поле записи при открытой клавиатуре: на телефоне клавиатура поднимает
 * visual viewport. Настоящую клавиатуру Playwright не эмулирует, поэтому
 * состояние проверяется уменьшением высоты вьюпорта при сфокусированном поле:
 * поле, кнопка отправки и текст должны остаться в видимой области без обрезки.
 */
test('читаемая шкала: поле записи при открытой клавиатуре', async ({ page }) => {
  // Кадры клавиатурного прогона — в своей папке: раньше они писались в корень
  // фазы рядом с кадрами вьюпортов и смешивались с ними.
  const keyboardDir = path.join(OUT_DIR, 'keyboard')
  const writer = createEvidenceWriter({ dir: keyboardDir })
  fs.mkdirSync(keyboardDir, { recursive: true })
  await page.setViewportSize({ width: 393, height: 852 })

  const keyboard = { viewport: KEYBOARD_VIEWPORT, field: null, submit: null }

  await walkCheckIn(page, writer, {
    filePrefix: '06-keyboard',
    url: DEMO_TODAY,
    cardTestId: 'today-card-morning',
    evening: false,
    onEditor: async editorPage => {
      const field = editorPage.locator(CHECKIN_INPUT_SELECTOR).first()
      await field.click()
      await editorPage.setViewportSize(KEYBOARD_VIEWPORT)
      const box = await field.boundingBox()
      const submit = editorPage.locator('[data-testid="checkin-complete"]').first()
      const submitBox = (await submit.count()) ? await submit.boundingBox() : null
      const styles = await field.evaluate(el => {
        const cs = getComputedStyle(el)

        return {
          size: Math.round(parseFloat(cs.fontSize) * 100) / 100,
          lh: cs.lineHeight === 'normal' ? null : Math.round((parseFloat(cs.lineHeight) / parseFloat(cs.fontSize)) * 100) / 100,
        }
      })
      const focused = await field.evaluate(el => el.contains(document.activeElement) || document.activeElement === el)
      const overflow = await readOverflow(editorPage)
      keyboard.field = { box, focused, ...styles, viewportHeight: KEYBOARD_VIEWPORT.height }
      keyboard.submit = submitBox
      keyboard.overflow = overflow
      await writer.capture(editorPage, {
        name: `07-keyboard-${KEYBOARD_VIEWPORT.width}x${KEYBOARD_VIEWPORT.height}.png`,
        marker: CHECKIN_INPUT_SELECTOR,
        markerLabel: 'чек-ин: поле записи при уменьшенной высоте вьюпорта',
      })
      await editorPage.setViewportSize({ width: 393, height: 852 })
    },
  })

  fs.writeFileSync(path.join(OUT_DIR, 'keyboard.json'), JSON.stringify(keyboard, null, 2))

  if (!ASSERT) return

  expect(keyboard.field, 'поле записи не найдено').not.toBeNull()
  expect(keyboard.field.size, 'поле записи: размер при открытой клавиатуре').toBeCloseTo(16, 1)
  expect(keyboard.field.box, 'поле записи: геометрия').not.toBeNull()
  // Поле целиком остаётся в видимой области и не обрезано сверху/снизу.
  expect(keyboard.field.box.y, 'верх поля не должен уходить за экран').toBeGreaterThanOrEqual(-1)
  expect(
    keyboard.field.box.y + keyboard.field.box.height,
    'низ поля не должен уходить за видимую область'
  ).toBeLessThanOrEqual(KEYBOARD_VIEWPORT.height + 1)
  expect(keyboard.submit, 'кнопка завершения не найдена').not.toBeNull()
  expect(keyboard.submit.width, 'кнопка завершения: доступная ширина').toBeGreaterThanOrEqual(44)
  expect(keyboard.submit.height, 'кнопка завершения: доступная высота').toBeGreaterThanOrEqual(44)
  assertNoOverflow(keyboard.overflow, 'поле записи при открытой клавиатуре')
})
