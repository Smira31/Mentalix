import assert from 'node:assert/strict'
import { test } from 'node:test'

import { weekDayCircles } from '../../src/lib/practiceWeekGrid.js'

/*
 * Сетка недели всегда заканчивается сегодняшним днём: кружки заполняются
 * до «сегодня» включительно. Четверг (index 3) — контрольный случай из
 * бага: «воскресенье подсвечено, а сегодня четверг».
 */

test('в четверг серия из 7 дней заполняет Пн–Чт, а не до воскресенья', () => {
  assert.deepEqual(weekDayCircles(7, 3), { filled: 4, firstFilled: 0 })
})

test('короткая серия заполняет дни, оканчиваясь сегодняшним', () => {
  // Четверг, серия 3 → Вт–Чт.
  assert.deepEqual(weekDayCircles(3, 3), { filled: 3, firstFilled: 1 })
  // Четверг, серия 1 → только Чт.
  assert.deepEqual(weekDayCircles(1, 3), { filled: 1, firstFilled: 3 })
})

test('нулевая серия не заполняет ни одного кружка', () => {
  assert.deepEqual(weekDayCircles(0, 3), { filled: 0, firstFilled: 4 })
  assert.deepEqual(weekDayCircles(0, 0), { filled: 0, firstFilled: 1 })
})

test('серия не длиннее прошедших дней недели: в понедельник максимум один день', () => {
  assert.deepEqual(weekDayCircles(30, 0), { filled: 1, firstFilled: 0 })
  assert.deepEqual(weekDayCircles(21, 6), { filled: 7, firstFilled: 0 })
})

test('отрицательная серия трактуется как ноль', () => {
  assert.deepEqual(weekDayCircles(-2, 3), { filled: 0, firstFilled: 4 })
})
