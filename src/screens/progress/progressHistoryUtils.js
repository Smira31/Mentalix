/**
 * Чистые утилиты для вкладки «История» экрана «Прогресс» (§5.5).
 *
 * Форматирование дат и группировка записей по дням — извлечены как
 * отдельные функции, чтобы их можно было покрыть unit-тестами без
 * React-окружения.
 */

const WEEKDAYS = [
  'Воскресенье',
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
]

// Короткие названия месяцев — как в эталоне Stoic (§5.5): «сент», «июл».
const MONTHS_SHORT = [
  'янв',
  'фев',
  'мар',
  'апр',
  'мая',
  'июн',
  'июл',
  'авг',
  'сент',
  'окт',
  'ноя',
  'дек',
]

/**
 * Сравнивает две даты (ISO-строки YYYY-MM-DD) по календарным дням.
 * Возвращает 0 (тот же день), 1 (вчера — на день раньше), N > 0 (N дней назад).
 */
function dayDiff(isoDate, now) {
  const d = new Date(isoDate + 'T00:00:00')
  const today = now ? new Date(now + 'T00:00:00') : new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((today - d) / 86400000)
}

/**
 * Подпись группы дня для списка истории (§5.5).
 *
 * - Сегодня → «Сегодня»
 * - Вчера → «Вчера, 24 сент»
 * - В этом году → «Пятница, 24 июл»
 * - В другом году → «Пятница, 24 июл 2025»
 */
export function formatDayLabel(isoDate, now) {
  const diff = dayDiff(isoDate, now)
  if (diff === 0) return 'Сегодня'
  if (diff === 1) return `Вчера, ${formatDayMonth(isoDate)}`
  return formatFullDate(isoDate, now)
}

function formatDayMonth(isoDate) {
  const d = new Date(isoDate + 'T00:00:00')
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

function formatFullDate(isoDate, now) {
  const d = new Date(isoDate + 'T00:00:00')
  const today = now ? new Date(now + 'T00:00:00') : new Date()
  const weekday = WEEKDAYS[d.getDay()]
  const dayMonth = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
  if (d.getFullYear() === today.getFullYear()) {
    return `${weekday}, ${dayMonth}`
  }
  return `${weekday}, ${dayMonth} ${d.getFullYear()}`
}

/**
 * Дата экрана записи капителью (§5.5): «ВЧЕРА В 20:46», «СЕГОДНЯ В 08:30».
 * Для старых дат — полный день капителью + время.
 */
export function formatEntryDateCaps(isoDate, time, now) {
  const diff = dayDiff(isoDate, now)
  const timePart = time ? ` В ${time}` : ''
  if (diff === 0) return `СЕГОДНЯ${timePart}`.toUpperCase()
  if (diff === 1) return `ВЧЕРА${timePart}`.toUpperCase()
  const label = formatFullDate(isoDate, now)
  return `${label}${timePart}`.toUpperCase()
}

/**
 * Извлекает время «HH:MM» из ISO-строки datetime.
 * Возвращает '' если строка не содержит времени.
 */
export function extractTime(isoString) {
  if (!isoString || typeof isoString !== 'string') return ''
  // ISO datetime: «2026-09-25T20:46:00Z» или «2026-09-25T20:46:00+03:00»
  const match = isoString.match(/T(\d{2}):(\d{2})/)
  if (!match) return ''
  return `${match[1]}:${match[2]}`
}

/**
 * Тип записи и название для строки списка (§5.5).
 * «Утренний чек-ин», «Вечерний разбор», «Настроение», «Дневник».
 */
export const ENTRY_TYPES = {
  MORNING: 'morning',
  EVENING: 'evening',
  MOOD: 'mood',
  JOURNAL: 'journal',
}

export function entryListName(type) {
  switch (type) {
    case ENTRY_TYPES.MORNING:
      return 'Утренний чек-ин'
    case ENTRY_TYPES.EVENING:
      return 'Вечерний разбор'
    case ENTRY_TYPES.MOOD:
      return 'Настроение'
    case ENTRY_TYPES.JOURNAL:
      return 'Дневник'
    default:
      return 'Запись'
  }
}

/**
 * Заголовок экрана записи строчными с точкой (§5.5): «утро.», «вечер.», «настроение.».
 */
export function entryScreenTitle(type) {
  switch (type) {
    case ENTRY_TYPES.MORNING:
      return 'утро.'
    case ENTRY_TYPES.EVENING:
      return 'вечер.'
    case ENTRY_TYPES.MOOD:
      return 'настроение.'
    case ENTRY_TYPES.JOURNAL:
      return 'дневник.'
    default:
      return 'запись.'
  }
}

/**
 * Строит записи из сырых данных и группирует их по дням.
 *
 * @param {Array} checkins — записи чек-инов (date, mood, note, lessons, wins, review_completed_at, ...)
 * @param {Array} moodPractices — записи практики «Настроение» (recorded_at, mood, emotion, ...)
 * @param {Array} journalEntries — локальные журнальные записи (date, phases, ...)
 * @param {Array} activity — ежедневная активность ритуалов/аскез (date, count, breaks)
 * @returns {Array<{date: string, entries: Array}>} — дни, отсортированные от новых к старым
 */
export function buildEntriesByDay(checkins, moodPractices, journalEntries, activity) {
  const byDate = {}

  function ensureDay(date) {
    if (!byDate[date]) byDate[date] = { date, entries: [], activity: null }
    return byDate[date]
  }

  // Чек-ины: утренний чек-ин + вечерний разбор
  for (const c of checkins || []) {
    if (!c?.date) continue
    const day = ensureDay(c.date)
    // Утренний чек-ин — если есть mood/note/energy (любое поле утра)
    const hasMorning = c.mood != null || c.note || c.energy != null
    if (hasMorning) {
      day.entries.push({
        type: ENTRY_TYPES.MORNING,
        date: c.date,
        time: extractTime(c.created_at || c.updated_at),
        checkin: c,
      })
    }
    // Вечерний разбор — если review_completed_at
    if (c.review_completed_at) {
      day.entries.push({
        type: ENTRY_TYPES.EVENING,
        date: c.date,
        time: extractTime(c.review_completed_at),
        checkin: c,
      })
    }
  }

  // Практики «Настроение»
  for (const mp of moodPractices || []) {
    const date = mp && (mp.recorded_at || mp.date || '').slice(0, 10)
    if (!date) continue
    const day = ensureDay(date)
    day.entries.push({
      type: ENTRY_TYPES.MOOD,
      date,
      time: extractTime(mp.recorded_at),
      moodPractice: mp,
    })
  }

  // Локальный журнал
  for (const entry of journalEntries || []) {
    if (!entry?.date) continue
    const day = ensureDay(entry.date)
    day.entries.push({
      type: ENTRY_TYPES.JOURNAL,
      date: entry.date,
      time: '',
      journal: entry,
    })
  }

  // Активность ритуалов/аскез — метаданные дня, не отдельная запись
  for (const d of activity || []) {
    if (!d?.date) continue
    const day = ensureDay(d.date)
    day.activity = d
  }

  // Сортируем записи внутри дня по времени (пустое время — в конец)
  for (const day of Object.values(byDate)) {
    day.entries.sort((a, b) => {
      if (!a.time && !b.time) return 0
      if (!a.time) return 1
      if (!b.time) return -1
      return b.time.localeCompare(a.time) // новые сверху
    })
  }

  return Object.values(byDate).sort((a, b) => (a.date < b.date ? 1 : -1))
}
