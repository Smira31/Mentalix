import assert from 'node:assert/strict'
import test from 'node:test'

import {
  computeWeekSummary,
  getWeekBounds,
  isWeekComplete,
  formatWeekRangeShort,
  daysSinceFirst,
  getNearestDayMilestone,
  DAY_MILESTONES,
} from '../../src/screens/progress/weeklySummary.js'
import { pickWeekPhrase } from '../../src/screens/progress/weeklySummaryPhrases.js'

// ── Помощники ──

function makeDay(date, entries = []) {
  return { date, entries, activity: null }
}

function makeCheckinEntry(checkin, type = 'morning') {
  return {
    type: type === 'evening' ? 'evening' : 'morning',
    date: checkin.date,
    time: '08:30',
    checkin,
  }
}

function makeMoodEntry(mp) {
  return { type: 'mood', date: mp.recorded_at?.slice(0, 10) || mp.date, time: '12:00', moodPractice: mp }
}

// ── Пустая неделя ──

test('пустая неделя — возвращает null', () => {
  const result = computeWeekSummary([], [], new Date('2026-10-05T12:00:00'))
  assert.equal(result, null)
})

test('неделя с 0 активных дней — null', () => {
  const days = [makeDay('2026-09-28', [])]
  const result = computeWeekSummary(days, [], new Date('2026-10-05T12:00:00'))
  assert.equal(result, null)
})

// ── 1 день — карточки нет ──

test('неделя с 1 активным днём — null (нужно ≥2)', () => {
  const days = [
    makeDay('2026-09-28', [
      makeCheckinEntry({ date: '2026-09-28', mood: 3, energy: 3, emotion: 'ровно' }),
    ]),
  ]
  const result = computeWeekSummary(days, [], new Date('2026-10-05T12:00:00'))
  assert.equal(result, null)
})

// ── 2+ дня — есть ──

test('неделя с 2 активными днями — есть сводка', () => {
  const days = [
    makeDay('2026-09-28', [
      makeCheckinEntry({ date: '2026-09-28', mood: 3, energy: 3, emotion: 'ровно' }),
    ]),
    makeDay('2026-09-30', [
      makeCheckinEntry({ date: '2026-09-30', mood: 4, energy: 4, emotion: 'бодро' }),
    ]),
  ]
  const result = computeWeekSummary(days, [], new Date('2026-10-05T12:00:00'))
  assert.ok(result, 'должна быть сводка')
  assert.equal(result.activeDayCount, 2)
  assert.equal(result.weekNumber, 40)
  assert.equal(result.startDate, '2026-09-28')
  assert.equal(result.endDate, '2026-10-04')
  assert.equal(result.rangeLabel, '28 сент – 4 окт')
  assert.equal(result.dayCircles.length, 7)
  // Пн и Ср активны
  assert.equal(result.dayCircles[0].active, true)
  assert.equal(result.dayCircles[2].active, true)
  assert.equal(result.dayCircles[1].active, false)
})

test('энергия и настроение: среднее за неделю', () => {
  const days = [
    makeDay('2026-09-28', [
      makeCheckinEntry({ date: '2026-09-28', mood: 3, energy: 2 }),
    ]),
    makeDay('2026-09-29', [
      makeCheckinEntry({ date: '2026-09-29', mood: 4, energy: 4 }),
    ]),
  ]
  const result = computeWeekSummary(days, [], new Date('2026-10-05T12:00:00'))
  assert.equal(result.energyAvg, 3)
  assert.equal(result.moodAvg, 3.5)
})

test('сравнение с прошлой неделей: ↑', () => {
  const prevDays = [
    makeDay('2026-09-21', [
      makeCheckinEntry({ date: '2026-09-21', mood: 2, energy: 2 }),
    ]),
    makeDay('2026-09-22', [
      makeCheckinEntry({ date: '2026-09-22', mood: 2, energy: 2 }),
    ]),
  ]
  const days = [
    makeDay('2026-09-28', [
      makeCheckinEntry({ date: '2026-09-28', mood: 4, energy: 4 }),
    ]),
    makeDay('2026-09-29', [
      makeCheckinEntry({ date: '2026-09-29', mood: 4, energy: 4 }),
    ]),
  ]
  const result = computeWeekSummary(days, prevDays, new Date('2026-10-05T12:00:00'))
  assert.equal(result.energyTrend, '↑')
  assert.equal(result.moodTrend, '↑')
})

test('сравнение с прошлой неделей: =', () => {
  const prevDays = [
    makeDay('2026-09-21', [
      makeCheckinEntry({ date: '2026-09-21', mood: 3, energy: 3 }),
    ]),
    makeDay('2026-09-22', [
      makeCheckinEntry({ date: '2026-09-22', mood: 3, energy: 3 }),
    ]),
  ]
  const days = [
    makeDay('2026-09-28', [
      makeCheckinEntry({ date: '2026-09-28', mood: 3, energy: 3 }),
    ]),
    makeDay('2026-09-29', [
      makeCheckinEntry({ date: '2026-09-29', mood: 3, energy: 3 }),
    ]),
  ]
  const result = computeWeekSummary(days, prevDays, new Date('2026-10-05T12:00:00'))
  assert.equal(result.energyTrend, '=')
  assert.equal(result.moodTrend, '=')
})

test('самая частая эмоция вечерних разборов', () => {
  const days = [
    makeDay('2026-09-28', [
      makeCheckinEntry({ date: '2026-09-28', mood: 3, energy: 3, emotion: 'спокойствие', review_completed_at: '2026-09-28T20:00:00Z' }, 'evening'),
    ]),
    makeDay('2026-09-29', [
      makeCheckinEntry({ date: '2026-09-29', mood: 3, energy: 3, emotion: 'спокойствие', review_completed_at: '2026-09-29T20:00:00Z' }, 'evening'),
    ]),
    makeDay('2026-09-30', [
      makeCheckinEntry({ date: '2026-09-30', mood: 3, energy: 3, emotion: 'усталость', review_completed_at: '2026-09-30T20:00:00Z' }, 'evening'),
    ]),
  ]
  const result = computeWeekSummary(days, [], new Date('2026-10-05T12:00:00'))
  assert.ok(result.topEveningEmotion)
  assert.equal(result.topEveningEmotion.name, 'спокойствие')
  assert.equal(result.topEveningEmotion.count, 2)
})

test('практики: количество и самая частая', () => {
  const days = [
    makeDay('2026-09-28', [
      makeMoodEntry({ recorded_at: '2026-09-28T12:00:00', mood: 4, emotion: 'бодро', context: 'work' }),
    ]),
    makeDay('2026-09-29', [
      makeMoodEntry({ recorded_at: '2026-09-29T12:00:00', mood: 3, emotion: 'бодро', context: 'home' }),
    ]),
  ]
  const result = computeWeekSummary(days, [], new Date('2026-10-05T12:00:00'))
  assert.equal(result.practiceCount, 2)
  assert.ok(result.topPractice)
  assert.equal(result.topPractice.name, 'бодро')
})

// ── Смена пояса на границе недели ──

test('смена пояса: неделя считается по локальному времени', () => {
  // Понедельник 28 сент 2026 — начало недели
  const { start, end } = getWeekBounds('2026-09-30')
  assert.equal(start.toISOString().slice(0, 10), '2026-09-28')
  assert.equal(end.toISOString().slice(0, 10), '2026-10-04')
})

test('isWeekComplete: воскресенье прошло → true', () => {
  assert.equal(isWeekComplete('2026-10-04', new Date('2026-10-05T12:00:00')), true)
})

test('isWeekComplete: воскресенье сегодня → false', () => {
  assert.equal(isWeekComplete('2026-10-04', new Date('2026-10-04T12:00:00')), false)
})

test('isWeekComplete: суббота сегодня → false', () => {
  assert.equal(isWeekComplete('2026-10-04', new Date('2026-10-03T12:00:00')), false)
})

// ── Выбор фразы-шаблона ──

test('фраза: данных мало — «неделя только набирает форму»', () => {
  const summary = { activeDayCount: 1 }
  const phrase = pickWeekPhrase(summary)
  assert.equal(phrase, 'Неделя только набирает форму — отметь ещё пару дней')
})

test('фраза: null — «неделя только набирает форму»', () => {
  const phrase = pickWeekPhrase(null)
  assert.equal(phrase, 'Неделя только набирает форму — отметь ещё пару дней')
})

test('фраза: частая вечерняя эмоция', () => {
  const summary = {
    activeDayCount: 3,
    topEveningEmotion: { name: 'спокойствие', count: 2 },
    energyTrend: null,
    moodTrend: null,
    topPractice: null,
    practiceCount: 0,
    energyAvg: null,
    moodAvg: null,
    prevEnergyAvg: null,
    prevMoodAvg: null,
  }
  const phrase = pickWeekPhrase(summary)
  assert.equal(phrase, 'Чаще всего вечером ты отмечал «спокойствие»')
})

test('фраза: энергия выше чем на прошлой неделе', () => {
  const summary = {
    activeDayCount: 3,
    topEveningEmotion: null,
    energyTrend: '↑',
    prevEnergyAvg: 2.5,
    energyAvg: 3.5,
    moodTrend: null,
    topPractice: null,
    practiceCount: 0,
    moodAvg: null,
    prevMoodAvg: null,
  }
  const phrase = pickWeekPhrase(summary)
  assert.equal(phrase, 'Энергия была выше, чем на прошлой неделе')
})

test('фраза: настроение держалось ровно', () => {
  const summary = {
    activeDayCount: 3,
    topEveningEmotion: null,
    energyTrend: null,
    moodTrend: '=',
    moodAvg: 3.5,
    prevMoodAvg: 3.5,
    topPractice: null,
    practiceCount: 0,
    energyAvg: null,
    prevEnergyAvg: null,
  }
  const phrase = pickWeekPhrase(summary)
  assert.equal(phrase, 'Настроение держалось ровно всю неделю')
})

test('фраза: много активных дней', () => {
  const summary = {
    activeDayCount: 6,
    topEveningEmotion: null,
    energyTrend: null,
    moodTrend: null,
    topPractice: null,
    practiceCount: 0,
    energyAvg: null,
    moodAvg: null,
    prevEnergyAvg: null,
    prevMoodAvg: null,
  }
  const phrase = pickWeekPhrase(summary)
  assert.equal(phrase, 'Почти каждый день ты возвращался к себе — это устойчиво')
})

test('фраза: данных достаточно, но ни один шаблон не сработал — fallback', () => {
  const summary = {
    activeDayCount: 2,
    topEveningEmotion: null,
    energyTrend: null,
    moodTrend: null,
    topPractice: null,
    practiceCount: 0,
    energyAvg: null,
    moodAvg: null,
    prevEnergyAvg: null,
    prevMoodAvg: null,
  }
  const phrase = pickWeekPhrase(summary)
  assert.equal(phrase, 'Неделя только набирает форму — отметь ещё пару дней')
})

// ── daysSinceFirst ──

test('daysSinceFirst: первый день сегодня → 1', () => {
  const today = new Date('2026-10-08T12:00:00')
  assert.equal(daysSinceFirst('2026-10-08', today), 1)
})

test('daysSinceFirst: 5 дней назад → 6', () => {
  const today = new Date('2026-10-08T12:00:00')
  assert.equal(daysSinceFirst('2026-10-03', today), 6)
})

test('daysSinceFirst: null → null', () => {
  assert.equal(daysSinceFirst(null), null)
})

// ── Вехи дней ──

test('веха: 0 дней → ближайшая «3 дня — первые выводы»', () => {
  const m = getNearestDayMilestone(0)
  assert.ok(m)
  assert.equal(m.goal, 3)
  assert.equal(m.percent, 0)
  assert.equal(m.title, '3 дня — первые выводы')
})

test('веха: 2 дня → ближайшая «3 дня»', () => {
  const m = getNearestDayMilestone(2)
  assert.ok(m)
  assert.equal(m.goal, 3)
  assert.equal(m.remaining, 1)
  assert.equal(m.percent, 67)
})

test('веха: 5 дней → ближайшая «7 дней — итог недели»', () => {
  const m = getNearestDayMilestone(5)
  assert.ok(m)
  assert.equal(m.goal, 7)
  assert.equal(m.remaining, 2)
})

test('веха: 29 дней → ближайшая «30 дней — месяц в точках»', () => {
  const m = getNearestDayMilestone(29)
  assert.ok(m)
  assert.equal(m.goal, 30)
  assert.equal(m.remaining, 1)
})

test('веха: 30 дней → null (не показывать)', () => {
  const m = getNearestDayMilestone(30)
  assert.equal(m, null)
})

test('веха: 100 дней → null', () => {
  const m = getNearestDayMilestone(100)
  assert.equal(m, null)
})
