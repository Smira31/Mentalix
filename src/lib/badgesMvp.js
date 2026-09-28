import { isCompletedCheckin } from './series.js'

const badge = (id, title, locked, earned, done, progress, goal, progressLabel) => ({
  id,
  title,
  desc: done ? earned : locked,
  done,
  progress,
  goal,
  progressLabel,
})

/** Only the five MVP badges. Legacy badge calculation and streak fallbacks stay untouched. */
export function buildMvpBadges({
  checkins = [],
  totalCheckins = 0,
  journalEntries = [],
  completedSessions = [],
  canonicalStats,
} = {}) {
  // A saved morning CheckIn is a completed check-in even before the evening review.
  const hasCheckin =
    (Number.isSafeInteger(totalCheckins) && totalCheckins > 0) ||
    (Array.isArray(checkins) &&
      checkins.some(
        item =>
          isCompletedCheckin(item) ||
          (item && Number.isInteger(item.mood) && item.mood >= 1 && item.mood <= 5)
      ))
  const hasJournal =
    (Array.isArray(journalEntries) && journalEntries.some(item => item?.status === 'final')) ||
    (Array.isArray(completedSessions) &&
      completedSessions.some(item => item?.status === 'completed'))

  const badges = [
    badge(
      'first_checkin',
      'Первый чек-ин',
      'Появится после первого завершённого чек-ина.',
      'Первый чек-ин завершён.',
      hasCheckin,
      Number(hasCheckin),
      1
    ),
    badge(
      'first_journal',
      'Первая запись',
      'Появится после первой завершённой записи.',
      'Первая запись сохранена.',
      hasJournal,
      Number(hasJournal),
      1
    ),
  ]

  // Invalid/missing canonical payload is unknown, not zero; never derive these from legacy stats.
  if (!canonicalStats) return badges
  const { currentStreak, bestStreak, activeDays } = canonicalStats
  return [
    ...badges,
    badge(
      'streak_7',
      'Серия: 7 дней',
      'Пока серия меньше 7 дней.',
      '7 активных дней подряд.',
      bestStreak >= 7,
      Math.min(currentStreak, 7),
      7,
      `Дней подряд: ${Math.min(currentStreak, 7)} из 7`
    ),
    badge(
      'streak_30',
      '30 дней подряд',
      'Пока серия меньше 30 дней.',
      '30 активных дней подряд.',
      bestStreak >= 30,
      Math.min(currentStreak, 30),
      30,
      `Дней подряд: ${Math.min(currentStreak, 30)} из 30`
    ),
    badge(
      'active_days_100',
      '100 активных дней',
      'Появится после 100 активных дней.',
      '100 активных дней.',
      activeDays >= 100,
      Math.min(activeDays, 100),
      100,
      `Активных дней: ${Math.min(activeDays, 100)} из 100`
    ),
  ]
}
