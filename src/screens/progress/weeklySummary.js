/*
 * Чистая логика «Итога недели» для вкладки «История» (§5.5).
 *
 * Работает с уже загруженными данными (days из buildEntriesByDay),
 * без новых эндпоинтов и без ИИ. Все функции чистые — пригодны для
 * unit-тестов без React-окружения.
 */

const MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
  'июл', 'авг', 'сент', 'окт', 'ноя', 'дек',
]

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function isoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Понедельник недели, содержащей date (по локальному поясу устройства).
 */
function startOfWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

/**
 * ISO-номер недели (понедельник — первый день).
 */
function isoWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  return (
    1 +
    Math.round(
      ((d - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7
    )
  )
}

/**
 * Границы недели (Пн–Вс) для произвольной даты.
 * Возвращает { start: Date(пн), end: Date(вс) }.
 */
export function getWeekBounds(date) {
  const d = date instanceof Date ? date : new Date(date + 'T00:00:00')
  const start = startOfWeek(d)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

/**
 * Короткий диапазон недели: «28 сент – 4 окт».
 */
export function formatWeekRangeShort(start, end) {
  const s = start instanceof Date ? start : new Date(start + 'T00:00:00')
  const e = end instanceof Date ? end : new Date(end + 'T00:00:00')
  if (s.getMonth() === e.getMonth()) {
    return `${s.getDate()}–${e.getDate()} ${MONTHS_SHORT[e.getMonth()]}`
  }
  return `${s.getDate()} ${MONTHS_SHORT[s.getMonth()]} – ${e.getDate()} ${MONTHS_SHORT[e.getMonth()]}`
}

/**
 * Завершилась ли неделя (воскресенье прошло).
 */
export function isWeekComplete(weekEndDate, now = new Date()) {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const end = weekEndDate instanceof Date ? weekEndDate : new Date(weekEndDate + 'T00:00:00')
  end.setHours(0, 0, 0, 0)
  return end < today
}

/**
 * Сравнение средних: '↑' | '↓' | '=' | null
 */
function compareTrend(current, previous) {
  if (current == null || previous == null) return null
  const diff = current - previous
  if (Math.abs(diff) < 0.25) return '='
  return diff > 0 ? '↑' : '↓'
}

function average(values) {
  if (!values.length) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

function mostFrequent(items) {
  if (!items.length) return null
  const counts = {}
  for (const item of items) {
    counts[item] = (counts[item] || 0) + 1
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return sorted.length > 0 ? { name: sorted[0][0], count: sorted[0][1] } : null
}

/**
 * Вычисляет итог недели из дней истории.
 *
 * @param {Array} weekDays — дни ({date, entries, activity}) этой недели
 * @param {Array} prevWeekDays — дни предыдущей недели (для сравнения)
 * @param {Date} [now] — текущая дата
 * @returns {object|null} — сводка недели или null если < 2 активных дней
 */
export function computeWeekSummary(weekDays, prevWeekDays = [], _now = new Date()) {
  if (!weekDays || weekDays.length === 0) return null

  const activeDays = weekDays.filter(d => d.entries && d.entries.length > 0)
  if (activeDays.length < 2) return null

  const firstDate = new Date(weekDays[0].date + 'T00:00:00')
  const { start, end } = getWeekBounds(firstDate)

  // 7 кружков дней Пн–Вс
  const dayCircles = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const iso = isoDate(d)
    const dayObj = weekDays.find(wd => wd.date === iso)
    dayCircles.push({
      weekday: WEEKDAY_LABELS[i],
      date: iso,
      active: Boolean(dayObj && dayObj.entries && dayObj.entries.length > 0),
    })
  }

  // Сбор метрик
  const energyValues = []
  const moodValues = []
  const eveningEmotions = []
  const practiceEntries = []

  for (const day of weekDays) {
    for (const entry of day.entries) {
      if (entry.checkin) {
        if (entry.checkin.energy != null) energyValues.push(entry.checkin.energy)
        if (entry.checkin.mood != null) moodValues.push(entry.checkin.mood)
        if (entry.type === 'evening' && entry.checkin.emotion) {
          eveningEmotions.push(entry.checkin.emotion)
        }
      }
      if (entry.moodPractice) {
        if (entry.moodPractice.mood != null) moodValues.push(entry.moodPractice.mood)
        practiceEntries.push(entry.moodPractice)
      }
    }
  }

  // Предыдущая неделя — для сравнения
  const prevEnergyValues = []
  const prevMoodValues = []
  for (const day of prevWeekDays || []) {
    for (const entry of day.entries) {
      if (entry.checkin?.energy != null) prevEnergyValues.push(entry.checkin.energy)
      if (entry.checkin?.mood != null) prevMoodValues.push(entry.checkin.mood)
      if (entry.moodPractice?.mood != null) prevMoodValues.push(entry.moodPractice.mood)
    }
  }

  const energyAvg = average(energyValues)
  const moodAvg = average(moodValues)
  const prevEnergyAvg = average(prevEnergyValues)
  const prevMoodAvg = average(prevMoodValues)

  const topEveningEmotion = mostFrequent(eveningEmotions)
  const topPractice = mostFrequent(
    practiceEntries.map(mp => mp.emotion || mp.context || 'практика')
  )

  return {
    weekNumber: isoWeekNumber(start),
    startDate: isoDate(start),
    endDate: isoDate(end),
    rangeLabel: formatWeekRangeShort(start, end),
    dayCircles,
    activeDayCount: activeDays.length,
    energyAvg,
    moodAvg,
    prevEnergyAvg,
    prevMoodAvg,
    energyTrend: compareTrend(energyAvg, prevEnergyAvg),
    moodTrend: compareTrend(moodAvg, prevMoodAvg),
    topEveningEmotion,
    practiceCount: practiceEntries.length,
    topPractice,
  }
}

/**
 * Раскладывает дни истории по неделям и вставляет карточки «Итог недели».
 *
 * Список идёт от новых дней к старым. Итог недели N стоит НАД записями
 * понедельника следующей (более новой) недели, то есть перед днями этой
 * более новой недели. Итог появляется только после воскресенья недели N
 * (isWeekComplete); карточка — при ≥2 активных днях недели N.
 *
 * Итог самой новой недели не над чем разместить (более новой недели нет),
 * поэтому он показывается сверху, чтобы завершённая неделя не пропала.
 *
 * @param {Array} days — дни истории ({date, entries}); порядок не важен
 * @param {Date} [now] — текущая дата для проверки завершённости недели
 * @returns {Array} — [{type:'weekSummary'|'dayGroup', ...}]
 */
export function interleaveWeekSummaries(days, now = new Date()) {
  if (!days || days.length === 0) return []

  // Ключ недели — локальная дата понедельника. toISOString() сдвигал бы её
  // на UTC и уводил неделю в предыдущую (итог показывался для текущей недели).
  const weeksByStart = new Map()
  for (const day of days) {
    const { start } = getWeekBounds(day.date)
    const key = isoDate(start)
    if (!weeksByStart.has(key)) weeksByStart.set(key, [])
    weeksByStart.get(key).push(day)
  }

  const sortedWeekKeys = [...weeksByStart.keys()].sort((a, b) => (a < b ? 1 : -1))

  const summaryForWeek = (key, prevKey) => {
    const { end } = getWeekBounds(key)
    if (!isWeekComplete(end, now)) return null
    return computeWeekSummary(
      weeksByStart.get(key),
      prevKey ? weeksByStart.get(prevKey) : [],
      now
    )
  }

  const result = []

  // Итог самой новой недели не над чем разместить (более новой недели нет) —
  // показываем его сверху, чтобы завершённая неделя не пропала из ленты.
  const newestSummary = summaryForWeek(sortedWeekKeys[0], sortedWeekKeys[1])
  if (newestSummary) result.push({ type: 'weekSummary', summary: newestSummary })

  for (let i = 0; i < sortedWeekKeys.length; i++) {
    // Итог недели N стоит НАД понедельником следующей (более новой) недели:
    // перед днями этой недели вставляем итог предыдущей (более старой) недели.
    const olderKey = sortedWeekKeys[i + 1]
    if (olderKey) {
      const summary = summaryForWeek(olderKey, sortedWeekKeys[i + 2])
      if (summary) result.push({ type: 'weekSummary', summary })
    }
    for (const day of weeksByStart.get(sortedWeekKeys[i])) result.push({ type: 'dayGroup', day })
  }

  return result
}

/**
 * Число разных дней с записями (по датам), за всё переданное время.
 * Один день считается один раз, даже если записей в нём несколько.
 * @param {Array} checkins — записи с полем date (ISO-строка)
 * @returns {number}
 */
export function countActiveDays(checkins) {
  if (!Array.isArray(checkins)) return 0
  const dates = new Set()
  for (const c of checkins) {
    if (c?.date) dates.add(c.date)
  }
  return dates.size
}

/**
 * Число дней с первого дня в Mentalix до сейчас.
 */
export function daysSinceFirst(firstDateStr, now = new Date()) {
  if (!firstDateStr) return null
  const first = new Date(firstDateStr + 'T00:00:00')
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  first.setHours(0, 0, 0, 0)
  return Math.round((today - first) / 86400000) + 1
}

/**
 * Вехи дней для прогресс-бара аналитики.
 * «3 дня — первые выводы», «7 дней — итог недели», «30 дней — месяц в точках».
 * После 30 — не показывать.
 */
export const DAY_MILESTONES = Object.freeze([
  { days: 3, label: 'первые выводы' },
  { days: 7, label: 'итог недели' },
  { days: 30, label: 'месяц в точках' },
])

/**
 * Возвращает ближайшую невзятую веху дней или null.
 */
export function getNearestDayMilestone(totalDays) {
  if (totalDays == null || totalDays >= 30) return null
  for (const m of DAY_MILESTONES) {
    if (totalDays < m.days) {
      const percent = Math.min(100, Math.round((totalDays / m.days) * 100))
      return {
        goal: m.days,
        label: m.label,
        remaining: m.days - totalDays,
        percent,
        title: `${m.days} ${m.days === 30 ? 'дней' : m.days === 7 ? 'дней' : 'дня'} — ${m.label}`,
      }
    }
  }
  return null
}
