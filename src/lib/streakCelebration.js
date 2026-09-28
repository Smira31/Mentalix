import { seriesDateKey } from './series.js'

/*
 * Экран серии после завершения чек-ина (по образцу Stoic «3-day streak.»).
 * Чистые функции: тексты, число светлых лепестков, ряд кружков-дней и
 * условие показа. Число серии приходит только из GET /api/streak.
 */

export const STREAK_PETALS = 5
export const STREAK_DAYS_MAX = 7

const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

export function streakDaysWord(count) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'день'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня'
  return 'дней'
}

export function streakCelebrationCopy(count) {
  const title = `Серия ${count} ${streakDaysWord(count)}.`
  if (count === 1) return { title, body: 'Первый шаг сделан. Путь начинается здесь!' }
  if (count === 2) return { title, body: 'Два дня подряд. Ты набираешь ход!' }
  if (count === 3) return { title, body: 'Три дня подряд. Привычка крепнет!' }
  return { title, body: 'Так держать. Ты строишь привычку, которая останется!' }
}

/* Светлые лепестки — дни серии в текущем круге из пяти: 1 → 1, 5 → 5, 6 → 1. */
export function litStreakPetals(count) {
  if (!Number.isSafeInteger(count) || count < 1) return 0
  return ((count - 1) % STREAK_PETALS) + 1
}

function shiftDay(key, amount) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + amount)).toISOString().slice(0, 10)
}

function weekdayLabel(key) {
  const [year, month, day] = key.split('-').map(Number)
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
}

/*
 * Кружки последних дней серии (не больше семи): сегодня — огонёк,
 * прошлые — галочка. Пропуск (кружок без значка) показываем, только
 * если сервер сообщил об использованной заморозке мягкой серии и
 * по истории видно одиночный пропуск между активными днями.
 */
export function buildStreakDays({ streak, checkins = [], freezeUsed = false, today }) {
  const count = Math.min(Number.isSafeInteger(streak) ? streak : 0, STREAK_DAYS_MAX)
  if (count < 1 || !today) return []

  const active = new Set(
    (Array.isArray(checkins) ? checkins : []).map(item => seriesDateKey(item)).filter(Boolean)
  )
  const days = [{ key: today, state: 'today' }]
  let remaining = count - 1
  let gapAvailable = freezeUsed
  let cursor = today

  while (remaining > 0 && days.length < STREAK_DAYS_MAX) {
    cursor = shiftDay(cursor, -1)
    if (gapAvailable && !active.has(cursor) && active.has(shiftDay(cursor, -1))) {
      days.push({ key: cursor, state: 'gap' })
      gapAvailable = false
      continue
    }
    days.push({ key: cursor, state: 'done' })
    remaining -= 1
  }

  return days.reverse().map(day => ({ ...day, label: weekdayLabel(day.key) }))
}

/*
 * Экран показывается, только если это завершение увеличило серию:
 * до сохранения сегодня активности не было, после — серия > 0.
 */
export function shouldCelebrateStreak(wasActiveToday, stats) {
  return wasActiveToday === false && Number.isSafeInteger(stats?.currentStreak) && stats.currentStreak > 0
}
