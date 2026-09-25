// ── Ближайшие вехи ──
//
// H11 «прогресс-бары к ближайшим вехам». Чистая функция: берёт уже
// построенные значки (buildBadges), текущую серию (streakTiers) и тему
// недели (api.themes) — отдаёт 2–3 ближайшие вехи с названием, остатком
// и процентом. Без нового API, без таймеров, без давления.
//
// Приоритет: ближайший не полученный значок → следующий уровень серии →
// конец темы недели. Вехи, до которых больше 30 дней, не показываем.

import { pluralize } from './pluralize.js'
import { nextTierForStreak } from './streakTiers.js'

const MAX_DAYS = 30
const DAY_FORMS = ['день', 'дня', 'дней']
const CHECKIN_FORMS = ['чек-ин', 'чек-ина', 'чек-инов']

// Значки, которые считаются в чек-инах, а не в днях.
const CHECKIN_BADGES = new Set(['first-step', 'voice-heard'])

function badgeIsDayBased(id) {
  return !CHECKIN_BADGES.has(id)
}

function buildBadgeMilestone(badge) {
  const remaining = Math.max(0, badge.goal - badge.progress)
  if (remaining <= 0 || remaining > MAX_DAYS) return null
  const forms = badgeIsDayBased(badge.id) ? DAY_FORMS : CHECKIN_FORMS
  const percent =
    badge.goal > 0 ? Math.min(100, Math.round((badge.progress / badge.goal) * 100)) : 0
  return {
    id: `badge:${badge.id}`,
    kind: 'badge',
    title: badge.title,
    remaining,
    unit: pluralize(remaining, forms),
    percent,
    label: `Ещё ${remaining} ${pluralize(remaining, forms)} до значка «${badge.title}»`,
  }
}

function buildStreakMilestone(currentStreak) {
  const next = nextTierForStreak(currentStreak)
  if (!next) return null
  const remaining = next.min - currentStreak
  if (remaining <= 0 || remaining > MAX_DAYS) return null
  const percent =
    next.min > 0 ? Math.min(100, Math.round((currentStreak / next.min) * 100)) : 0
  return {
    id: `streak:${next.min}`,
    kind: 'streak',
    title: next.name,
    remaining,
    unit: pluralize(remaining, DAY_FORMS),
    percent,
    label: `Ещё ${remaining} ${pluralize(remaining, DAY_FORMS)} до «${next.name}»`,
  }
}

function buildThemeMilestone(theme) {
  if (!theme || !Array.isArray(theme.days) || theme.days.length === 0) return null
  const totalDays = theme.days.length
  const currentDay = Math.max(0, Number(theme.current_day) || 0)
  const remaining = totalDays - currentDay
  if (remaining <= 0 || remaining > MAX_DAYS) return null
  const percent =
    totalDays > 0 ? Math.min(100, Math.round((currentDay / totalDays) * 100)) : 0
  const title = theme.title || 'темы недели'
  return {
    id: `theme:${theme.id || 'current'}`,
    kind: 'theme',
    title,
    remaining,
    unit: pluralize(remaining, DAY_FORMS),
    percent,
    label: `Ещё ${remaining} ${pluralize(remaining, DAY_FORMS)} до конца темы «${title}»`,
  }
}

/**
 * @param {object} opts
 * @param {Array}  opts.badges  — результат buildBadges (с progress/goal/done)
 * @param {number} [opts.streak] — текущая серия (currentStreak)
 * @param {object} [opts.theme]  — текущая тема недели ({ id, title, days, current_day })
 * @returns {Array<{id,kind,title,remaining,unit,percent,label}>} 0–3 вех
 */
export function getNearestMilestones({ badges = [], streak = 0, theme = null } = {}) {
  const milestones = []
  const dayRemainingUsed = new Set()

  function tryAdd(milestone, isDayBased) {
    if (!milestone) return false
    if (isDayBased) {
      if (dayRemainingUsed.has(milestone.remaining)) return false
      dayRemainingUsed.add(milestone.remaining)
    }
    milestones.push(milestone)
    return true
  }

  // 1. Ближайший не полученный значок (с наименьшим остатком).
  const unearned = badges.filter(b => !b.done).slice()
  unearned.sort((a, b) => a.goal - a.progress - (b.goal - b.progress))
  for (const badge of unearned) {
    if (tryAdd(buildBadgeMilestone(badge), badgeIsDayBased(badge.id))) break
  }

  // 2. Следующий уровень серии.
  tryAdd(buildStreakMilestone(streak), true)

  // 3. Конец темы недели.
  tryAdd(buildThemeMilestone(theme), true)

  return milestones.slice(0, 3)
}
