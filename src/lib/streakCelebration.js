import { seriesDateKey } from './series.js'

/*
 * Экран серии после завершения чек-ина (по образцу Stoic «3-day streak.»).
 * Чистые функции: тексты, число светлых лепестков, ряд кружков-дней и
 * условие показа. Число серии приходит только из GET /api/streak.
 */

export const STREAK_PETALS = 5
/*
 * Ряд дней — до недели: длина ряда равна длине серии, не больше семи.
 * Дни до начала серии в ряд не попадают вовсе: их состояние неизвестно,
 * а ряд показывает серию, а не произвольный отрезок календаря.
 */
export const STREAK_DAYS_MAX = 7

const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

export function streakDaysWord(count) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'день'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня'
  return 'дней'
}

/*
 * Тексты экрана серии: счёт в заголовке и одно пояснение к иллюстрации.
 * Обещаний на будущее («привычка останется») нет — только факт и правило
 * чтения цветка; строка одна и та же при любом счёте, поэтому переход
 * между экранами не перестраивает заголовок.
 */
export function streakCelebrationCopy(count) {
  return {
    title: `Серия: ${count} ${streakDaysWord(count)}`,
    note: 'Один лепесток — один день. Пятый завершает круг.',
  }
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
 * Дни ряда: длина серии (не больше недели), состояние каждого дня — только по
 * записи этого дня. Сегодня — огонёк, день с записью в истории — галочка,
 * день без записи — 'unknown' (нейтральный кружок без значка).
 *
 * Контракт streak/checkins: неизвестную дату нельзя выдавать ни за
 * выполненную, ни за пропущенную. Серия мягкая — её день закрывает любая
 * завершённая активность, а история приходит только чек-инами; поэтому
 * отсутствие записи означает «неизвестно», а не «сделано» и не «пропущено».
 * Заморозку сюда тоже не подставляем: сервер сообщает только факт заморозки
 * недели, но не её дату (PROJECT_STATE.md, docs/TASK_INDEX.md), поэтому
 * приписать заморозку конкретному дню нельзя — раньше одиночная дыра в
 * истории помечалась как пропуск именно так.
 */
export function buildStreakDays({ streak, checkins = [], today }) {
  const count = Number.isSafeInteger(streak) ? streak : 0
  if (count < 1 || !today) return []

  const active = new Set(
    (Array.isArray(checkins) ? checkins : []).map(item => seriesDateKey(item)).filter(Boolean)
  )
  const span = Math.min(count, STREAK_DAYS_MAX)
  const days = []

  for (let offset = span - 1; offset >= 1; offset -= 1) {
    const key = shiftDay(today, -offset)
    days.push({ key, state: active.has(key) ? 'done' : 'unknown' })
  }
  days.push({ key: today, state: 'today' })

  return days.map(day => ({ ...day, label: weekdayLabel(day.key) }))
}

/* Текст шеринга серии из круглой кнопки в правом верхнем углу. */
export function streakShareText(count) {
  return `Серия ${count} ${streakDaysWord(count)} в Mentalix`
}

/*
 * Экран показывается, только если это завершение увеличило серию:
 * до сохранения сегодня активности не было, после — серия > 0.
 */
export function shouldCelebrateStreak(wasActiveToday, stats) {
  return wasActiveToday === false && Number.isSafeInteger(stats?.currentStreak) && stats.currentStreak > 0
}
