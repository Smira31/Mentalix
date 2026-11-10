import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

import { formatCount } from '../../src/lib/pluralize.js'

// ISSUE #1180 — тексты аудита P1 без решения владельца.
// Меняются только формулировки: логика, разметка и data-testid прежние.

const read = path => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')

const today = read('src/screens/Today.jsx')
const todayCards = read('src/lib/todayCardVisibility.js')
const journeySearch = read('src/screens/JourneySearch.jsx')
const streakRecovery = read('src/screens/StreakRecovery.jsx')
const onboarding = read('src/screens/Onboarding.jsx')

const PEOPLE_FORMS = ['человек', 'человека', 'человек']

test('«Сегодня»: счётчик склоняет «человек» по правилам русского языка', () => {
  assert.equal(formatCount(1, PEOPLE_FORMS), '1 человек')
  assert.equal(formatCount(2, PEOPLE_FORMS), '2 человека')
  assert.equal(formatCount(4, PEOPLE_FORMS), '4 человека')
  assert.equal(formatCount(5, PEOPLE_FORMS), '5 человек')
  assert.equal(formatCount(11, PEOPLE_FORMS), '11 человек')
  assert.equal(formatCount(14, PEOPLE_FORMS), '14 человек')
  assert.equal(formatCount(19, PEOPLE_FORMS), '19 человек')
})

test('«Сегодня»: строка до 20 — «Сегодня день отмечают N человек»', () => {
  assert.doesNotMatch(today, /Сегодня в пути вместе с тобой/)
  assert.match(today, /Сегодня день \$\{activeToday === 1 \? 'отмечает' : 'отмечают'\}/)
  assert.match(today, /formatCount\(/)
  assert.match(today, /\['человек', 'человека', 'человек'\]/)
  // Ветку «20 и больше» не трогали.
  assert.match(today, /Сегодня свой путь продолжили/)
})

test('Настройка «Пульс»: подпись без числа и без старой формулировки', () => {
  assert.doesNotMatch(todayCards, /Сегодня в пути вместе с тобой/)
  assert.match(todayCards, /subtitle: '«Сегодня день отмечают»'/)
})

test('Поиск по истории: заголовок без английского слова', () => {
  assert.doesNotMatch(journeySearch, /Поиск по Journey/)
  assert.match(journeySearch, /Поиск по истории/)
})

test('Восстановление серии: спокойная формулировка без восклицания', () => {
  assert.doesNotMatch(streakRecovery, /Серия прервалась/)
  assert.match(streakRecovery, /'Серия остановилась\. Вчерашний день можно вернуть\.'/)
  // Спасённая и истёкшая серия — прежние тексты.
  assert.match(streakRecovery, /Серия спасена/)
  assert.match(streakRecovery, /Вчерашний день уже нельзя вернуть/)
})

test('Онбординг: кнопка data-testid="onboarding-enter" называется «Начать»', () => {
  const enterButton = onboarding.match(/data-testid="onboarding-enter"[\s\S]{0,300}?<\/button>/)
  assert.ok(enterButton, 'кнопка onboarding-enter должна остаться')
  assert.match(enterButton[0], />\s*Начать\s*</)
  assert.doesNotMatch(enterButton[0], /Войти/)
})
