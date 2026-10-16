import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * PRO-002b/c: внутренний дизайн экрана разбора.
 *
 * Контракты, которые не считываются со скриншота:
 *  - направление на следующую неделю — главный блок сверху; достижения видны
 *    сразу; трудности, закономерности и остальные подробности — раскрываемые
 *    секции; вопросы для размышления — отдельный спокойный блок;
 *  - основное действие — существующий переход к плану недели;
 *  - экран до создания объясняет назначение разбора и имеет одну основную
 *    кнопку существующего действия;
 *  - данные, даты, источники и предупреждения сохранены: подробности можно
 *    свернуть, но не потерять;
 *  - состояния согласия, загрузки, отказа, пустоты и кризиса сохранены;
 *  - типографика — токены читаемой шкалы, без пиксельных размеров в разметке.
 */

const viewSource = await readFile(
  new URL('../../src/screens/pro/ProReportView.jsx', import.meta.url),
  'utf8'
)
const cssSource = await readFile(
  new URL('../../src/screens/pro/ProReport.css', import.meta.url),
  'utf8'
)
const detailsSource = await readFile(
  new URL('../../src/screens/pro/ProDetails.jsx', import.meta.url),
  'utf8'
)
/* Текстовые стили экранов Pro общие — вынесены из ProReport.css в proText.css. */
const textCssSource = await readFile(
  new URL('../../src/screens/pro/proText.css', import.meta.url),
  'utf8'
)

test('направление — главный блок сверху, достижения видны сразу', () => {
  assert.match(viewSource, /data-testid="pro-report-direction"/)
  assert.match(viewSource, /Направление на неделю/)
  // Достижения — обычная секция, не раскрываемая: видны сразу.
  assert.match(viewSource, /<section data-testid="pro-report-achievements">/)

  const direction = viewSource.indexOf('pro-report-direction')
  const achievements = viewSource.indexOf('pro-report-achievements')
  assert.ok(direction > -1 && achievements > direction, 'направление выше достижений')
})

test('подробности разбора раскрываются, но не теряются', () => {
  assert.match(detailsSource, /<details/)
  assert.match(detailsSource, /<summary/)
  assert.match(detailsSource, /mx-pro-details__body/)

  assert.match(viewSource, /<ProDetails title="Темы" testId="pro-details-themes">/)
  assert.match(viewSource, /<ProDetails title="Трудности" testId="pro-details-difficulties">/)
  assert.match(viewSource, /<ProDetails title="Наблюдения" testId="pro-details-patterns">/)

  // Содержимое подробностей по-прежнему рендерится — сворачивается, не исчезает.
  assert.match(viewSource, /<ReportList items=\{report\.difficulties\} \/>/)
  assert.match(viewSource, /<PatternList items=\{report\.patterns\} \/>/)
})

test('содержание разбора сохранено целиком', () => {
  for (const field of ['focus_next_week', 'themes', 'difficulties', 'achievements', 'patterns', 'reflection_questions']) {
    assert.match(viewSource, new RegExp(`report\\.${field}`), `поле разбора: ${field}`)
  }
  assert.match(viewSource, /report\.sources/)
  assert.match(viewSource, /report\.disclaimer/)
  assert.match(viewSource, /formatDayList/)

  // Вопросы — отдельный блок со своим заголовком.
  assert.match(viewSource, /data-testid="pro-report-questions"/)
  assert.match(viewSource, /Вопросы для размышления/)
})

test('основное действие — существующий переход к плану недели', () => {
  assert.match(viewSource, /Перейти к плану недели/)
  assert.match(viewSource, /testId="pro-open-plan"/)
  assert.match(viewSource, /onClick=\{onOpenPlan\}/)
})

test('экран до создания объясняет назначение и имеет одну основную кнопку', () => {
  assert.match(viewSource, /data-testid="pro-report-intro"/)
  assert.match(viewSource, /предлагает направление на следующую неделю/)
  assert.match(viewSource, /testId="pro-generate-report"/)

  const start = viewSource.indexOf('pro-report-intro')
  const intro = viewSource.slice(start, start + 1500)
  assert.equal((intro.match(/<PillButton/g) || []).length, 1, 'одна основная кнопка')
})

test('состояния доступа, загрузки, отказа, пустоты и кризиса сохранены', () => {
  assert.match(viewSource, /ProConsentCard/)
  assert.match(viewSource, /proStatePayload/)
  assert.match(viewSource, /blocked && <ProStateCard/)
  assert.match(viewSource, /Не удалось загрузить состояние разбора\./)
  assert.match(viewSource, /pro-insufficient-state/)
  assert.match(viewSource, /crisisReply/)
  assert.match(viewSource, /Загружаем…/)
})

test('типографика Pro — токены читаемой шкалы, без пиксельных размеров', () => {
  // Текстовые стили .mx-pro-* — один источник: proText.css с токенами
  // читаемой шкалы; в геометрии экрана они не дублируются.
  assert.match(textCssSource, /--mx-read-read/)
  assert.match(textCssSource, /--mx-read-note/)
  assert.match(textCssSource, /--mx-read-caption/)
  assert.doesNotMatch(viewSource, /text-\[\d+px\]/)
})
