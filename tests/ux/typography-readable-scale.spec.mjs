import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

/*
 * MXL-TYPE-READABLE-001 — согласованная средняя читаемая шкала Mentalix.
 *
 * Целевые ФАКТИЧЕСКИЕ размеры (computed, не значения в CSS):
 *  - основной текст, чтение и ввод записей — 16px, межстрочный 1.5–1.6;
 *  - содержательные пояснения — 14px, вторичные подписи — 13px;
 *  - текст кнопок — 16px;
 *  - основной вопрос чек-ина и заголовки дневника — 24px, межстрочный 1.2–1.3.
 *
 * Первый этап — три реальные поверхности: «Сегодня», утренний/вечерний чек-ин,
 * DailyJournal. Остальные разделы в этом этапе размеров не меняют.
 *
 * Тест не только проверяет контракт, но и выгружает фактическую таблицу
 * размеров и снимки до/после в qa-evidence/typography-readable/<phase>/.
 * Фаза задаётся переменной MX_TYPE_PHASE=before|after (по умолчанию after).
 *
 * Поиск элементов — по селекторам поверхностей и data-testid, без waitForTimeout.
 */

const PHASE = process.env.MX_TYPE_PHASE || 'after'
const OUT_DIR = path.join('qa-evidence', 'typography-readable', PHASE)

const VIEWPORTS = [
  { name: '393x852', width: 393, height: 852 },
  { name: '360x640', width: 360, height: 640 },
]

/* Проверяемые роли: селектор → как читать измерение. */
const CHECKIN_ROLES = {
  question: { sel: '.mx-checkin-question h1, .mx-checkin-question h2', role: 'ask' },
  hint: { sel: '.mx-checkin-question__hint', role: 'note' },
  scaleLabel: { sel: '.mx-checkin-scale__label', role: 'caption' },
  chip: { sel: '.mx-checkin-chips button', role: 'action' },
  input: { sel: '.mx-demo-checkin__editor [contenteditable], [data-testid="checkin-text-input"] [contenteditable]', role: 'read' },
  submit: { sel: '[data-testid="checkin-next"], [data-testid="checkin-complete"]', role: 'action' },
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

async function walkToday(page) {
  await page.goto('/?demo=1&frame=0')
  await expect(page.getByTestId('today-card-morning')).toBeVisible()
  return {
    roles: await readRoles(page, TODAY_ROLES),
    inventory: await readInventory(page),
    overflow: await readOverflow(page),
  }
}

async function walkCheckIn(page) {
  await page.goto('/?demo=1&frame=0')
  await expect(page.getByTestId('today-card-morning')).toBeVisible()
  await page.getByTestId('today-card-morning').click()

  const steps = []
  let questionStep = null
  let editorStep = null

  for (let i = 0; i < 10; i += 1) {
    await expect(page.locator('.mx-demo-checkin__scene, .mx-checkin-question').first()).toBeVisible()
    const roles = await readRoles(page, CHECKIN_ROLES)
    const overflow = await readOverflow(page)
    steps.push({ index: i, roles, overflow, inventory: await readInventory(page) })
    if (!questionStep && roles.question) questionStep = roles
    // Шаг редактора хранит и роли, и геометрию: assertCheckIn проверяет
    // на нём не только размер поля, но и горизонтальный выход.
    if (!editorStep && roles.input) editorStep = { ...roles, overflow }

    const input = page.locator('.mx-demo-checkin__editor [contenteditable]')
    if (await input.count()) {
      await input.first().fill('Тестовая запись: спокойный вечер, короткая прогулка и разговор.')
      const finish = page.locator('[data-testid="checkin-complete"]')
      if (await finish.isVisible().catch(() => false)) {
        await finish.click()
        break
      }
    }

    const next = page.locator('[data-testid="checkin-next"]')
    if (await next.isVisible().catch(() => false)) {
      if (await next.isEnabled()) {
        await next.click()
        continue
      }
      const option = page.locator('[data-testid="checkin-scale-option"][data-level="3"]')
      if (await option.count()) {
        await option.first().click()
        continue
      }
    }
    break
  }

  return { steps, questionStep, editorStep }
}

async function walkJournal(page) {
  const stages = {}
  await page.goto('/?demo=1&tab=practices&frame=0')
  await expect(page.getByTestId('journal-open-cta')).toBeVisible()
  await page.getByTestId('journal-open-cta').click()

  // Настройка: первый шаг (вопрос + пояснение + поля ввода)
  await expect(page.getByTestId('dj-intro-setup')).toBeVisible()
  await page.getByTestId('dj-intro-setup').click()
  await expect(page.locator('.mx-dj-setup').first()).toBeVisible()
  stages.setup = {
    roles: await readRoles(page, JOURNAL_ROLES),
    inventory: await readInventory(page),
    overflow: await readOverflow(page),
  }

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
  stages.review = {
    roles: await readRoles(page, JOURNAL_ROLES),
    inventory: await readInventory(page),
    overflow: await readOverflow(page),
  }

  // Ввод: поток
  await expect(page.getByTestId('dj-review-next')).toBeVisible()
  await page.getByTestId('dj-review-next').click()
  await expect(page.getByTestId('dj-stream-input')).toBeVisible()
  stages.stream = {
    roles: await readRoles(page, JOURNAL_ROLES),
    inventory: await readInventory(page),
    overflow: await readOverflow(page),
  }

  // Вопрос дня
  await page.getByTestId('dj-stream-input').fill('Сижу дома, пью чай. Думаю о том, что нужно сделать сегодня.')
  await page.getByTestId('dj-stream-next').click()
  await expect(page.getByTestId('dj-question-input')).toBeVisible()
  stages.question = {
    roles: await readRoles(page, JOURNAL_ROLES),
    inventory: await readInventory(page),
    overflow: await readOverflow(page),
  }

  // Сохранение: после ответа на вопрос дня штатный переход ведёт на экран
  // завершения. Возвращаемся на вкладку практик и открываем журнал заново —
  // запись за сегодня уже есть, поэтому журнал открывается на «Сегодня».
  await page.getByTestId('dj-question-input').fill('Один спокойный шаг важнее идеального плана.')
  await page.getByTestId('dj-question-next').click()
  await expect(page.getByTestId('dj-complete-close')).toBeVisible()
  await page.getByTestId('dj-complete-close').click()
  await expect(page.getByTestId('journal-open-cta')).toBeVisible()
  await page.getByTestId('journal-open-cta').click()

  // Сохранённая запись («сегодня»)
  await expect(page.getByTestId('dj-today')).toBeVisible()
  stages.today = {
    roles: await readRoles(page, JOURNAL_ROLES),
    inventory: await readInventory(page),
    overflow: await readOverflow(page),
  }

  // «Мои записи»
  await page.getByTestId('dj-today-entries').click()
  await expect(page.getByTestId('dj-entries')).toBeVisible()
  stages.entries = {
    roles: await readRoles(page, JOURNAL_ROLES),
    inventory: await readInventory(page),
    overflow: await readOverflow(page),
  }

  return stages
}

/* ── Контракт ── */

function assertCheckIn(surface, label) {
  const question = surface.questionStep
  expect(question, `${label}: главный вопрос не найден`).not.toBeNull()
  assertRole(question, 'question', 24, [1.1, 1.35])
  if (question.hint) assertRole(question, 'hint', 14)
  if (question.scaleLabel) {
    expect(question.scaleLabel.size, `${label}: подпись шкалы`).toBeGreaterThanOrEqual(13)
  }
  if (question.chip) assertRole(question, 'chip', 16)

  const editor = surface.editorStep
  expect(editor, `${label}: поле ввода записи не найдено`).not.toBeNull()
  assertRole(editor, 'input', 16, [1.4, 1.7])
  assertNoOverflow(editor.overflow, `${label}: поле ввода`)
}

function assertJournal(stages, label) {
  assertRole(stages.setup.roles, 'setupQuestion', 24, [1.15, 1.35])
  assertRole(stages.setup.roles, 'setupInput', 16)
  assertRole(stages.review.roles, 'reviewTitle', 24, [1.15, 1.35])
  assertRole(stages.review.roles, 'reviewItem', 16)
  if (stages.review.roles.reviewNote) assertRole(stages.review.roles, 'reviewNote', 14)
  if (stages.stream.roles.streamHint) assertRole(stages.stream.roles, 'streamHint', 14)
  assertRole(stages.stream.roles, 'streamTitle', 24, [1.15, 1.35])
  assertRole(stages.stream.roles, 'streamField', 16, [1.45, 1.7])
  assertRole(stages.question.roles, 'questionText', 24, [1.15, 1.35])
  assertRole(stages.question.roles, 'questionField', 16)
  assertRole(stages.today.roles, 'todayTitle', 24, [1.15, 1.35])
  assertRole(stages.today.roles, 'todayText', 16, [1.45, 1.7])
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
    await page.setViewportSize({ width: vp.width, height: vp.height })

    const report = { phase: PHASE, viewport: vp, today: null, checkin: null, journal: null }
    const persist = () =>
      fs.writeFileSync(
        path.join(OUT_DIR, `measure-${vp.name}.json`),
        JSON.stringify(report, null, 2)
      )

    const today = await walkToday(page)
    report.today = today
    persist()
    await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}-01-today.png`) })

    const checkin = await walkCheckIn(page)
    report.checkin = checkin
    persist()
    await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}-02-checkin.png`) })

    const journal = await walkJournal(page)
    report.journal = journal
    persist()
    await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}-03-journal.png`) })

    assertToday(today, vp.name)
    assertCheckIn(checkin, vp.name)
    assertJournal(journal, vp.name)
  })
}
