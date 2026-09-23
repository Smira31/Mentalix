import test from 'node:test'
import assert from 'node:assert/strict'

import { pluralize, formatCount } from '../../src/lib/pluralize.js'

const dayForms = ['день', 'дня', 'дней']
const checkinForms = ['чек-ин', 'чек-ина', 'чек-инов']
const completedDayForms = ['завершённый день', 'завершённых дня', 'завершённых дней']
const entryForms = ['запись', 'записи', 'записей']
const minuteForms = ['минута', 'минуты', 'минут']

test('pluralize — 0 → много (дней)', () => {
  assert.equal(pluralize(0, dayForms), 'дней')
})

test('pluralize — 1 → один (день)', () => {
  assert.equal(pluralize(1, dayForms), 'день')
})

test('pluralize — 2 → несколько (дня)', () => {
  assert.equal(pluralize(2, dayForms), 'дня')
})

test('pluralize — 5 → много (дней)', () => {
  assert.equal(pluralize(5, dayForms), 'дней')
})

test('pluralize — 11 → много (дней)', () => {
  assert.equal(pluralize(11, dayForms), 'дней')
})

test('pluralize — 21 → один (день)', () => {
  assert.equal(pluralize(21, dayForms), 'день')
})

test('pluralize — 22 → несколько (дня)', () => {
  assert.equal(pluralize(22, dayForms), 'дня')
})

test('pluralize — 25 → много (дней)', () => {
  assert.equal(pluralize(25, dayForms), 'дней')
})

test('formatCount — завершённые дни на всех 8 числах', () => {
  assert.equal(formatCount(0, completedDayForms), '0 завершённых дней')
  assert.equal(formatCount(1, completedDayForms), '1 завершённый день')
  assert.equal(formatCount(2, completedDayForms), '2 завершённых дня')
  assert.equal(formatCount(5, completedDayForms), '5 завершённых дней')
  assert.equal(formatCount(11, completedDayForms), '11 завершённых дней')
  assert.equal(formatCount(21, completedDayForms), '21 завершённый день')
  assert.equal(formatCount(22, completedDayForms), '22 завершённых дня')
  assert.equal(formatCount(25, completedDayForms), '25 завершённых дней')
})

test('formatCount — чек-ины на всех 8 числах', () => {
  assert.equal(formatCount(0, checkinForms), '0 чек-инов')
  assert.equal(formatCount(1, checkinForms), '1 чек-ин')
  assert.equal(formatCount(2, checkinForms), '2 чек-ина')
  assert.equal(formatCount(5, checkinForms), '5 чек-инов')
  assert.equal(formatCount(11, checkinForms), '11 чек-инов')
  assert.equal(formatCount(21, checkinForms), '21 чек-ин')
  assert.equal(formatCount(22, checkinForms), '22 чек-ина')
  assert.equal(formatCount(25, checkinForms), '25 чек-инов')
})

test('formatCount — записи на всех 8 числах', () => {
  assert.equal(formatCount(0, entryForms), '0 записей')
  assert.equal(formatCount(1, entryForms), '1 запись')
  assert.equal(formatCount(2, entryForms), '2 записи')
  assert.equal(formatCount(5, entryForms), '5 записей')
  assert.equal(formatCount(11, entryForms), '11 записей')
  assert.equal(formatCount(21, entryForms), '21 запись')
  assert.equal(formatCount(22, entryForms), '22 записи')
  assert.equal(formatCount(25, entryForms), '25 записей')
})

test('formatCount — минуты на всех 8 числах', () => {
  assert.equal(formatCount(0, minuteForms), '0 минут')
  assert.equal(formatCount(1, minuteForms), '1 минута')
  assert.equal(formatCount(2, minuteForms), '2 минуты')
  assert.equal(formatCount(5, minuteForms), '5 минут')
  assert.equal(formatCount(11, minuteForms), '11 минут')
  assert.equal(formatCount(21, minuteForms), '21 минута')
  assert.equal(formatCount(22, minuteForms), '22 минуты')
  assert.equal(formatCount(25, minuteForms), '25 минут')
})
