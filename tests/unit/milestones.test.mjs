import test from 'node:test'
import assert from 'node:assert/strict'

import { buildBadges } from '../../src/lib/badges.js'
import { getNearestMilestones } from '../../src/lib/milestones.js'

// ── Помощники ──

function makeTheme({ currentDay = 1, totalDays = 7, title = 'Фокус', id = 1 } = {}) {
  return {
    id,
    title,
    is_current: true,
    current_day: currentDay,
    days: Array.from({ length: totalDays }, (_, i) => ({ day: i + 1, reflection: null })),
  }
}

// ── Порядок вех: значок → уровень серии → тема ──

test('приоритет: ближайший значок идёт первым', () => {
  const badges = buildBadges({ stats: { days_active: 5, total_checkins: 5, best_streak: 5 } })
  const milestones = getNearestMilestones({ badges, streak: 5, theme: makeTheme({ currentDay: 3 }) })
  assert.equal(milestones.length > 0, true)
  assert.equal(milestones[0].kind, 'badge')
})

test('уровень серии идёт вторым, если не дублирует серийный значок', () => {
  const badges = buildBadges({ stats: { days_active: 5, total_checkins: 5, best_streak: 5 } })
  const milestones = getNearestMilestones({ badges, streak: 5, theme: makeTheme({ currentDay: 3 }) })
  const streakMilestone = milestones.find(m => m.kind === 'streak')
  assert.ok(streakMilestone, 'должен быть уровень серии')
  assert.equal(streakMilestone.title, 'Неделя ровно')
  assert.equal(streakMilestone.remaining, 2)
})

test('тема недели идёт последней', () => {
  const badges = buildBadges({ stats: { days_active: 5, total_checkins: 5, best_streak: 5 } })
  const milestones = getNearestMilestones({ badges, streak: 5, theme: makeTheme({ currentDay: 3 }) })
  const themeMilestone = milestones.find(m => m.kind === 'theme')
  assert.ok(themeMilestone, 'должна быть тема недели')
  assert.equal(themeMilestone.remaining, 4)
})

test('всего не больше трёх вех', () => {
  const badges = buildBadges({ stats: { days_active: 5, total_checkins: 5, best_streak: 5 } })
  const milestones = getNearestMilestones({ badges, streak: 5, theme: makeTheme({ currentDay: 3 }) })
  assert.ok(milestones.length <= 3)
})

// ── Отсечка 30 дней ──

test('значок «Месяц пути» (30 дней) не показывается, если осталось > 30 дней', () => {
  // days_active = 0 → remaining = 30 (ровно граница, должен показать)
  // days_active = 0, но best_streak = 0 → ближайший значок first-step (1 чек-ин)
  // Проверим, что month-on-path не появляется, если осталось 31+
  const badges = buildBadges({ stats: { days_active: 0, total_checkins: 1, best_streak: 1 } })
  // first-step done (1 checkin), streak-two done (best 1... нет, 1 < 2)
  // nearest unearned: streak-two (remaining 1)
  const milestones = getNearestMilestones({ badges, streak: 1, theme: null })
  const monthMilestone = milestones.find(m => m.id === 'badge:month-on-path')
  assert.equal(monthMilestone, undefined, 'Месяц пути (remaining 30) не должен показываться, если ближе есть другие')
})

test('веха с остатком 31 день не показывается', () => {
  // Тема с 31 днём до конца — за пределами отсечки
  const badges = buildBadges({ stats: { days_active: 0, total_checkins: 0, best_streak: 0 } })
  const theme = makeTheme({ currentDay: 0, totalDays: 31, title: 'Длинная' })
  const milestones = getNearestMilestones({ badges, streak: 0, theme })
  const themeMilestone = milestones.find(m => m.kind === 'theme')
  assert.equal(themeMilestone, undefined, 'тема с 31 днём до конца не показывается')
})

test('веха с остатком ровно 30 дней показывается', () => {
  const theme = makeTheme({ currentDay: 0, totalDays: 30, title: 'Месячная' })
  const milestones = getNearestMilestones({ badges: [], streak: 100, theme })
  // streak=100 → все уровни серии достигнуты, нет streak milestone
  const themeMilestone = milestones.find(m => m.kind === 'theme')
  assert.ok(themeMilestone, 'тема с 30 днями до конца должна показываться')
  assert.equal(themeMilestone.remaining, 30)
})

// ── Новичок (пустое состояние) ──

test('новичок: одна ближайшая веха — «Первый шаг», 1 чек-ин', () => {
  const badges = buildBadges({ stats: { days_active: 0, total_checkins: 0, best_streak: 0 } })
  const milestones = getNearestMilestones({ badges, streak: 0, theme: null })
  assert.ok(milestones.length >= 1, 'должна быть хотя бы одна веха')
  assert.equal(milestones[0].id, 'badge:first-step')
  assert.equal(milestones[0].remaining, 1)
  assert.equal(milestones[0].label, 'Ещё 1 чек-ин до значка «Первый шаг»')
})

test('новичок с темой: показывает «Первый шаг» + уровень серии + тему', () => {
  const badges = buildBadges({ stats: { days_active: 0, total_checkins: 0, best_streak: 0 } })
  const milestones = getNearestMilestones({ badges, streak: 0, theme: makeTheme({ currentDay: 1 }) })
  assert.equal(milestones[0].id, 'badge:first-step')
  assert.equal(milestones[0].remaining, 1)
  // streak=0 → next tier "Держится" (min 3), remaining 3
  const streakM = milestones.find(m => m.kind === 'streak')
  assert.ok(streakM)
  assert.equal(streakM.remaining, 3)
  // theme: 7-1=6
  const themeM = milestones.find(m => m.kind === 'theme')
  assert.ok(themeM)
  assert.equal(themeM.remaining, 6)
})

// ── Дедупликация: серийный значок и уровень серии с одной целью ──

test('уровень серии «Держится» (min 3) пропускается, если есть неполученный значок «Три дня подряд» (goal 3)', () => {
  // best_streak=2, current_streak=2
  // streak-three badge: not done (2<3), remaining 1
  // next tier: "Держится" (min 3), remaining 1 — должен быть пропущен
  const badges = buildBadges({ stats: { days_active: 2, total_checkins: 2, best_streak: 2 } })
  const milestones = getNearestMilestones({ badges, streak: 2, theme: null })
  const streakMilestone = milestones.find(m => m.kind === 'streak')
  assert.equal(streakMilestone, undefined, 'уровень серии не должен дублировать серийный значок')
  assert.equal(milestones[0].id, 'badge:streak-three')
})

// ── Нет данных — не пустой блок для новичка ──

test('нет значков, нет темы, серия 0 — всё равно есть веха (уровень серии)', () => {
  const milestones = getNearestMilestones({ badges: [], streak: 0, theme: null })
  assert.ok(milestones.length >= 1)
  assert.equal(milestones[0].kind, 'streak')
  assert.equal(milestones[0].remaining, 3)
})

// ── Процент считается правильно ──

test('процент значка: 5 из 7 → 71%', () => {
  const badges = buildBadges({ stats: { days_active: 5, total_checkins: 5, best_streak: 5 } })
  const milestones = getNearestMilestones({ badges, streak: 5, theme: null })
  const weekMilestone = milestones.find(m => m.id === 'badge:week-on-path')
  assert.ok(weekMilestone)
  assert.equal(weekMilestone.percent, 71)
})

test('процент темы: 3 из 7 → 43%', () => {
  const theme = makeTheme({ currentDay: 3, totalDays: 7 })
  const milestones = getNearestMilestones({ badges: [], streak: 100, theme })
  const themeM = milestones.find(m => m.kind === 'theme')
  assert.ok(themeM)
  assert.equal(themeM.percent, 43)
})

// ── Все значки получены ──

test('все значки получены — значок не показывается, но серия и тема могут', () => {
  const badges = buildBadges({ stats: { days_active: 100, total_checkins: 100, best_streak: 100 } })
  const milestones = getNearestMilestones({ badges, streak: 5, theme: makeTheme({ currentDay: 3 }) })
  const badgeM = milestones.find(m => m.kind === 'badge')
  assert.equal(badgeM, undefined, 'все значки получены — нет badge milestone')
  const streakM = milestones.find(m => m.kind === 'streak')
  assert.ok(streakM, 'уровень серии всё ещё показывается')
})
