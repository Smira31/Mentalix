import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  formatDayLabel,
  formatDayList,
  formatWeekRange,
  isoDay,
} from '../../src/screens/pro/weekLabel.js'

/*
 * PRO-002b/c: недоступный и некорректный ответ API.
 *
 * Фактическая причина «неделя NaN undefined» без mock: GET /api/pro/report
 * отвечал не состоянием Pro (пустой массив), экран принимал любой ответ как
 * валидный и строил подпись недели из отсутствующих дат. Здесь закреплены оба
 * правила: метка строится только из распознанного ISO-дня, а состояние Pro из
 * ответа проверяется до форматирования.
 */

const reportViewSource = await readFile(
  new URL('../../src/screens/pro/ProReportView.jsx', import.meta.url),
  'utf8'
)
const planViewSource = await readFile(
  new URL('../../src/screens/pro/ProPlanView.jsx', import.meta.url),
  'utf8'
)
const progressViewSource = await readFile(
  new URL('../../src/screens/pro/ProProgressView.jsx', import.meta.url),
  'utf8'
)
const apiStateSource = await readFile(
  new URL('../../src/screens/pro/proApiState.js', import.meta.url),
  'utf8'
)

/* Даты, которых сервер может не прислать или прислать нераспознанными. */
const BAD_DATES = [
  undefined,
  null,
  '',
  'не дата',
  '2026-13-45',
  '2026-10-42',
  '12.10.2026',
  '2026-10-12T00:00:00',
  42,
  {},
]

test('нераспознанная дата не превращается в текст', () => {
  for (const value of BAD_DATES) {
    assert.equal(isoDay(value), '', `isoDay(${JSON.stringify(value)})`)
    assert.equal(formatDayLabel(value), '', `formatDayLabel(${JSON.stringify(value)})`)
    assert.equal(
      formatWeekRange(value, value),
      '',
      `formatWeekRange(${JSON.stringify(value)})`
    )
  }
})

test('отсутствующие даты не дают «неделя NaN undefined»', () => {
  // Форма дефекта, замеченного в превью без mock: обе даты не пришли.
  assert.notEqual(formatWeekRange(undefined, undefined), 'неделя NaN undefined')
  assert.equal(formatWeekRange(undefined, undefined), '')

  for (const [start, end] of [
    [undefined, undefined],
    [null, null],
    ['2026-13-45', '2026-13-49'],
    ['2026-10-12', '2026-13-45'],
  ]) {
    const label = formatWeekRange(start, end)
    assert.doesNotMatch(label, /NaN|undefined/, `${start} — ${end}: ${label}`)
  }
})

test('распознанные даты форматируются как прежде', () => {
  assert.equal(isoDay('2026-10-12'), '2026-10-12')
  assert.equal(formatDayLabel('2026-10-12'), '12 окт')
  // Формат консилиума: без слова «неделя», тире внутри одного месяца.
  assert.equal(formatWeekRange('2026-10-12', '2026-10-18'), '12–18 окт')
  assert.equal(formatWeekRange('2026-10-28', '2026-11-03'), '28 окт – 3 ноя')
  // Неделя из одного дня и отсутствующий конец диапазона — одна метка.
  assert.equal(formatWeekRange('2026-10-12', '2026-10-12'), '12 окт')
  assert.equal(formatWeekRange('2026-10-12', undefined), '12 окт')
})

test('список дней пропускает нераспознанные даты, а не печатает их', () => {
  assert.equal(
    formatDayList(['2026-10-12', undefined, '2026-13-45', '2026-10-18']),
    '12 окт, 18 окт'
  )
  assert.equal(formatDayList(null), '')
  assert.equal(formatDayList('2026-10-12'), '')
})

test('состояние Pro проверяется до форматирования на всех трёх экранах', () => {
  assert.match(apiStateSource, /export function proStatePayload/)
  assert.match(apiStateSource, /Array\.isArray\(data\)\) return null/)

  for (const [name, source] of [
    ['план', planViewSource],
    ['разбор', reportViewSource],
    ['прогресс', progressViewSource],
  ]) {
    assert.match(source, /proStatePayload\(data\)/, name)
    // Ответ без состояния — состояние ошибки с повтором, а не половина экрана.
    assert.match(source, /setLoadFailed\(true\)/, name)
    assert.doesNotMatch(source, /setStatus\(data\.status\)/, name)
  }
})

test('название недели строится только из распознанных дат', () => {
  // Разбор: week принимает лишь пару распознанных ISO-дней.
  assert.match(reportViewSource, /function weekRange\(payload\)/)
  assert.match(reportViewSource, /isoDay\(payload\.week_start\)/)
  assert.match(reportViewSource, /setWeek\(weekRange\(payload\)\)/)
  assert.match(reportViewSource, /data-testid="pro-report-week"/)

  // План: заголовок недели выводится только при непустой метке.
  assert.match(planViewSource, /const weekTitle = formatWeekRange\(/)
  assert.match(planViewSource, /plan && weekTitle &&/)
  assert.match(planViewSource, /data-testid="pro-plan-week"/)

  // Прогресс: без метки остаётся одна подпись «Неделя действий».
  assert.match(progressViewSource, /const weekTitle = formatWeekRange\(/)
  assert.match(progressViewSource, /Неделя действий\{weekTitle \?/)
})
