// ── Ближайшие вехи ──
//
// H11 «прогресс-бары к ближайшим вехам». Чистая функция: берёт уже
// построенные значки (buildBadges), текущую серию (streakTiers) и тему
// недели (api.themes) — отдаёт 2–3 ближайшие вехи с названием, остатком
// и процентом. Без нового API, без таймеров, без давления.
//
// Приоритет: ближайший не полученный значок → следующий уровень серии →
// конец темы недели. Вехи, до которых больше 30 дней, не показываем.
//
// Дедупликация: уровень серии пропускается, если его порог совпадает с
// целью неполученного серийного значка (streak-two/three/five) — это
// единственный реальный повтор. Тема недели — отдельное понятие, не
// дедуплицируется.

import { pluralize } from './pluralize.js'
import { nextTierForStreak } from './streakTiers.js'

const MAX_DAYS = 30
const DAY_FORMS = ['день', 'дня', 'дней']
const CHECKIN_FORMS = ['чек-ин', 'чек-ина', 'чек-инов']

// Значки, которые считаются в чек-инах, а не в днях.
const CHECKIN_BADGES = new Set(['first-step', 'voice-heard'])

// Серийные значки — их цель может совпасть с порогом уровня серии.
const STREAK_BADGE_IDS = new Set(['streak-two', 'streak-three', 'streak-five'])

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
    targetMin: next.min,
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

  // 1. Ближайший не полученный значок (с наименьшим остатком).
  const unearned = badges.filter(b => !b.done).slice()
  unearned.sort((a, b) => a.goal - a.progress - (b.goal - b.progress))
  for (const badge of unearned) {
    const m = buildBadgeMilestone(badge)
    if (m) {
      milestones.push(m)
      break
    }
  }

  // 2. Следующий уровень серии — пропускаем, если порог совпадает с
  //    целью выбранного серийного значка (streak-two/three/five).
  //    Дедуплицируем только против показанного значка, а не всех
  //    неполученных: если ближайший значок — first-step, уровень
  //    серии «Держится» несёт отдельную информацию.
  const streakM = buildStreakMilestone(streak)
  if (streakM) {
    const selectedBadge = milestones.find(m => m.kind === 'badge')
    const dupWithSelected =
      selectedBadge &&
      STREAK_BADGE_IDS.has(selectedBadge.id.replace('badge:', '')) &&
      selectedBadge.remaining === streakM.remaining
    if (!dupWithSelected) {
      milestones.push(streakM)
    }
  }

  // 3. Конец темы недели.
  const themeM = buildThemeMilestone(theme)
  if (themeM) {
    milestones.push(themeM)
  }

  return milestones.slice(0, 3)
}
