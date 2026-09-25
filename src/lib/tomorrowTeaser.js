import { buildBadges } from './badges.js'

/*
 * H5 (engagement.md #851) — «Завтра тебя ждёт…»
 *
 * Чистая функция: по данным, уже доступным на экране завершения чек-ина,
 * возвращает одну-две строки тизера о завтрашнем дне.
 *
 * Приоритет:
 *  а) до следующего значка серии остался 1 день → «Завтра — N-й день подряд и новый значок»;
 *  б) есть активная аскеза/ритуал → «Завтра — день N из M аскезы «…»»;
 *  в) после утра → «Вечером — короткий разбор дня»; после вечера → «Утром — новый вопрос дня».
 *
 * Тон: спокойный, без давления, без восклицательных знаков.
 * Новых запросов к API не делает — только данные, переданные вызывающим.
 */

const PRACTICE_BADGE_GOAL = 7

function isCompletedCheckin(checkin) {
  return Boolean(
    checkin?.review_completed_at || checkin?.completed_at || checkin?.status === 'completed'
  )
}

function uniqueDayCount(checkins = []) {
  const days = new Set()
  for (const checkin of checkins) {
    const date =
      checkin?.date || checkin?.review_completed_at || checkin?.completed_at || checkin?.created_at
    if (date) days.add(String(date).slice(0, 10))
  }
  return days.size
}

function findUpcomingBadge(badges = []) {
  return badges.find(badge => !badge.done && badge.progress + 1 >= badge.goal)
}

function findActiveAsceza(ascezas = []) {
  return ascezas.find(
    asceza => asceza?.streak > 0 && asceza?.today_status === 'held' && asceza.streak < PRACTICE_BADGE_GOAL
  )
}

function findActiveRitual(rituals = []) {
  return rituals.find(
    ritual => ritual?.streak > 0 && ritual?.today_level && ritual.streak < PRACTICE_BADGE_GOAL
  )
}

export function buildTomorrowTeaser({
  streak = 0,
  checkins = [],
  rituals,
  ascezas,
  isEvening = false,
} = {}) {
  // ── (а) значок серии через 1 день ──
  const completed = checkins.filter(isCompletedCheckin)
  const daysActive = uniqueDayCount(checkins)
  const badges = buildBadges({
    stats: { days_active: daysActive },
    checkins: completed,
    rituals: rituals || [],
    ascezas: ascezas || [],
  })
  const upcoming = findUpcomingBadge(badges)
  if (upcoming && streak > 0) {
    return `Завтра — ${streak + 1}-й день подряд и новый значок`
  }

  // ── (б) активная аскеза или ритуал ──
  const asceza = findActiveAsceza(ascezas)
  if (asceza) {
    return `Завтра — день ${asceza.streak + 1} из ${PRACTICE_BADGE_GOAL} аскезы «${asceza.name}»`
  }

  const ritual = findActiveRitual(rituals)
  if (ritual) {
    return `Завтра — день ${ritual.streak + 1} из ${PRACTICE_BADGE_GOAL} ритуала «${ritual.name}»`
  }

  // ── (в) запасной вариант по времени дня ──
  return isEvening ? 'Утром — новый вопрос дня' : 'Вечером — короткий разбор дня'
}
