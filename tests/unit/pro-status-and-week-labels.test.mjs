import assert from 'node:assert/strict'
import test from 'node:test'

import { STATUS_LABELS, formatWeekRange } from '../../src/screens/pro/weekLabel.js'

/*
 * Консилиум по редизайну Pro-экранов: подписи статусов и формат недели.
 *  - «пропущено» → «не вышло» — нейтральный серый, без красного;
 *    «выполнено» и «ещё впереди» сохранены;
 *  - диапазон недели без слова «неделя»: в пределах одного месяца —
 *    «13–19 окт», переход через месяц — «28 окт – 3 ноя»;
 *  - метка строится только из распознанных ISO-дней: без даты начала
 *    недели подписи нет вовсе (никакого «NaN undefined»).
 */

test('подписи статусов плана: «не вышло» вместо «пропущено»', () => {
  assert.equal(STATUS_LABELS.done, 'выполнено')
  assert.equal(STATUS_LABELS.skipped, 'не вышло')
  assert.equal(STATUS_LABELS.planned, 'ещё впереди')
})

test('неделя в пределах одного месяца: «13–19 окт»', () => {
  assert.equal(formatWeekRange('2026-10-13', '2026-10-19'), '13–19 окт')
})

test('переход через месяц: «28 окт – 3 ноя»', () => {
  assert.equal(formatWeekRange('2026-10-28', '2026-11-03'), '28 окт – 3 ноя')
})

test('один день недели — без диапазона', () => {
  assert.equal(formatWeekRange('2026-10-13', '2026-10-13'), '13 окт')
  assert.equal(formatWeekRange('2026-10-13', undefined), '13 окт')
})

test('нераспознанные даты не строят метку недели', () => {
  assert.equal(formatWeekRange(undefined, '2026-10-19'), '')
  assert.equal(formatWeekRange('13.10.2026', '2026-10-19'), '')
})
