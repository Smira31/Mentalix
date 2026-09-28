/*
 * ДАТА ПОЛУЧЕНИЯ ЗНАЧКА
 *
 * Главный значок шторки — последний полученный по дате. Каталог
 * значков хранит только факт (done) и прогресс, но не дату. Дату
 * получения восстанавливаем из тех же данных, что считают значки:
 * истории чек-инов, даты регистрации и записей дневника. Для
 * значков, дату которых определить нельзя (ритуалы, аскезы, 100
 * активных дней), earnedAt остаётся null — они не выигрывают
 * «последний полученный», но остаются в каталоге.
 */

function dayKey(value) {
  if (value == null) return null
  const s = String(value)
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null
  const pad = v => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function dayNumber(key) {
  const m = String(key).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return NaN
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86400000
}

function addDays(key, n) {
  const num = dayNumber(key)
  if (!Number.isFinite(num)) return null
  const d = new Date((num + n) * 86400000)
  const pad = v => String(v).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

function isCompletedCheckin(item) {
  return Boolean(
    item?.review_completed_at || item?.completed_at || item?.status === 'completed'
  )
}

/*
 * Уникальные календарные дни завершённых чек-инов, по возрастанию.
 */
function completedDayList(checkins = []) {
  const days = new Set()
  for (const item of checkins) {
    if (!item || !isCompletedCheckin(item)) continue
    const k = dayKey(item.date || item.review_completed_at || item.completed_at || item.created_at)
    if (k) days.add(k)
  }
  return [...days].sort()
}

/*
 * Даты, когда текущая серия (подряд по календарным дням) впервые
 * достигла каждой вехи. Используется для значков серии.
 */
function streakMilestoneDates(checkins = []) {
  const days = completedDayList(checkins)
  const milestones = {}
  let streak = 0
  let prev = null
  for (const d of days) {
    if (prev != null && dayNumber(d) - dayNumber(prev) === 1) streak += 1
    else streak = 1
    for (const goal of [2, 3, 5, 7, 30]) {
      if (streak === goal && !(goal in milestones)) milestones[goal] = d
    }
    prev = d
  }
  return milestones
}

/*
 * Добавляет каждому значку поле earnedAt (YYYY-MM-DD или null) —
 * дату получения для earned и null для незавершённых/неизвестных.
 */
export function enrichBadgesWithEarnedDate(badges, ctx = {}) {
  const { checkins = [], registrationDate = null, journalEntries = [] } = ctx
  const milestones = streakMilestoneDates(checkins)
  const days = completedDayList(checkins)
  const firstCheckinDate = days[0] || null
  const fifthCheckinDate = days[4] || null
  const firstJournalDate =
    journalEntries
      .filter(entry => entry?.status === 'final')
      .map(entry => dayKey(entry.date))
      .filter(Boolean)
      .sort()[0] || null
  const regKey = dayKey(registrationDate)

  const earnedAtFor = badge => {
    if (!badge?.done) return null
    switch (badge.id) {
      case 'first-step':
      case 'first_checkin':
        return firstCheckinDate
      case 'voice-heard':
        return fifthCheckinDate
      case 'streak-two':
        return milestones[2] || null
      case 'streak-three':
        return milestones[3] || null
      case 'streak-five':
        return milestones[5] || null
      case 'streak_7':
        return milestones[7] || null
      case 'streak_30':
        return milestones[30] || null
      case 'week-on-path':
        return regKey ? addDays(regKey, badge.goal - 1) : null
      case 'month-on-path':
        return regKey ? addDays(regKey, badge.goal - 1) : null
      case 'first_journal':
        return firstJournalDate
      default:
        return null
    }
  }

  return badges.map(badge => ({ ...badge, earnedAt: earnedAtFor(badge) }))
}

/*
 * Последний полученный значок: среди earned — максимальная earnedAt,
 * при равенстве — больше goal, затем позже в каталоге. Если earned
 * нет — null (вызывающий показывает следующий незавершённый).
 */
export function lastEarnedBadge(badges) {
  const earned = (badges || []).filter(badge => badge?.done)
  if (!earned.length) return null

  return earned
    .map((badge, index) => ({ badge, index }))
    .sort((a, z) => {
      const da = a.badge.earnedAt || ''
      const dz = z.badge.earnedAt || ''
      if (da !== dz) return dz.localeCompare(da)
      if (a.badge.goal !== z.badge.goal) return z.badge.goal - a.badge.goal
      return z.index - a.index
    })[0].badge
}
