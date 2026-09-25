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

/* ============================================================
   ГРУППИРОВКА (§5.5, шаг 3)
   Дни / Недели / Месяцы / Годы
   ============================================================ */

export const HISTORY_GRANULARITIES = Object.freeze([
  { id: 'day', label: 'Дни' },
  { id: 'week', label: 'Недели' },
  { id: 'month', label: 'Месяцы' },
  { id: 'year', label: 'Годы' },
])

// Полные названия месяцев в именительном падеже — для заголовков и карточек
const MONTHS_FULL = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

// Названия месяцев в родительном падеже — для диапазонов «21–27 сентября»
const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

/**
 * ISO-номер недели (понедельник — первый день).
 */
function isoWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  return 1 + Math.round(((d - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
}

/**
 * Понедельник недели, содержащей date.
 */
function startOfWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

function isoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Группирует дни по неделям, недели — по месяцам (§5.5).
 * Возвращает [{ monthLabel, cards: [{ weekNumber, rangeLabel, startDate, endDate, days }] }]
 */
export function groupDaysByWeek(days) {
  const groups = []
  const byWeek = {}

  for (const day of days) {
    const d = new Date(day.date + 'T00:00:00')
    const ws = startOfWeek(d)
    const we = new Date(ws)
    we.setDate(ws.getDate() + 6)
    const key = isoDate(ws)
    if (!byWeek[key]) {
      byWeek[key] = {
        weekNumber: isoWeekNumber(ws),
        rangeLabel: formatWeekRange(ws, we),
        startDate: isoDate(ws),
        endDate: isoDate(we),
        days: [],
        _monthKey: `${ws.getFullYear()}-${ws.getMonth()}`,
        _monthLabel: MONTHS_FULL[ws.getMonth()],
      }
    }
    byWeek[key].days.push(day)
  }

  const sorted = Object.values(byWeek).sort((a, b) => (a.startDate < b.startDate ? 1 : -1))

  // Группируем недели по месяцам
  for (const week of sorted) {
    let group = groups.find(g => g.monthLabel === week._monthLabel)
    if (!group) {
      group = { monthLabel: week._monthLabel, cards: [] }
      groups.push(group)
    }
    group.cards.push({
      weekNumber: week.weekNumber,
      rangeLabel: week.rangeLabel,
      startDate: week.startDate,
      endDate: week.endDate,
      days: week.days,
    })
  }

  return groups
}

function formatWeekRange(start, end) {
  const sameMonth = start.getMonth() === end.getMonth()
  if (sameMonth) {
    return `${start.getDate()}–${end.getDate()} ${MONTHS_GENITIVE[end.getMonth()]}`
  }
  return `${start.getDate()} ${MONTHS_GENITIVE[start.getMonth()]} – ${end.getDate()} ${MONTHS_GENITIVE[end.getMonth()]}`
}

/**
 * Группирует дни по месяцам, месяцы — по годам (§5.5).
 * Возвращает [{ yearLabel, cards: [{ label, startDate, endDate, days }] }]
 */
export function groupDaysByMonth(days) {
  const groups = []
  const byMonth = {}

  for (const day of days) {
    const d = new Date(day.date + 'T00:00:00')
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!byMonth[key]) {
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      byMonth[key] = {
        label: `${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`,
        startDate: isoDate(start),
        endDate: isoDate(end),
        days: [],
        _yearLabel: String(d.getFullYear()),
      }
    }
    byMonth[key].days.push(day)
  }

  const sorted = Object.values(byMonth).sort((a, b) => (a.startDate < b.startDate ? 1 : -1))

  for (const month of sorted) {
    let group = groups.find(g => g.yearLabel === month._yearLabel)
    if (!group) {
      group = { yearLabel: month._yearLabel, cards: [] }
      groups.push(group)
    }
    group.cards.push({
      label: month.label,
      startDate: month.startDate,
      endDate: month.endDate,
      days: month.days,
    })
  }

  return groups
}

/**
 * Группирует дни по годам (§5.5).
 * Возвращает [{ label, startDate, endDate, days }]
 */
export function groupDaysByYear(days) {
  const byYear = {}

  for (const day of days) {
    const d = new Date(day.date + 'T00:00:00')
    const key = String(d.getFullYear())
    if (!byYear[key]) {
      byYear[key] = {
        label: key,
        startDate: `${key}-01-01`,
        endDate: `${key}-12-31`,
        days: [],
      }
    }
    byYear[key].days.push(day)
  }

  return Object.values(byYear).sort((a, b) => (a.startDate < b.startDate ? 1 : -1))
}

/* ============================================================
   ФИЛЬТРЫ (§5.5, шаг 3)
   ============================================================ */

export const FILTER_GROUPS = Object.freeze([
  {
    label: 'Чек-ины',
    types: [
      { id: ENTRY_TYPES.MORNING, label: 'Утренний чек-ин' },
      { id: ENTRY_TYPES.EVENING, label: 'Вечерний разбор' },
    ],
  },
  {
    label: 'Практики',
    types: [
      { id: ENTRY_TYPES.MOOD, label: 'Настроение' },
      { id: ENTRY_TYPES.JOURNAL, label: 'Дневник' },
    ],
  },
])

/**
 * Возвращает множество типов записей, которые реально есть в данных.
 */
export function getAvailableFilterTypes(days) {
  const types = new Set()
  for (const day of days) {
    for (const entry of day.entries) {
      types.add(entry.type)
    }
  }
  return types
}

/**
 * Фильтрует дни по выбранным типам записей.
 * Если types пуст/null — возвращает дни без изменений.
 * Дни без записей выбранного типа удаляются.
 */
export function filterDaysByTypes(days, types) {
  if (!types || types.size === 0) return days
  return days
    .map(day => ({
      ...day,
      entries: day.entries.filter(e => types.has(e.type)),
    }))
    .filter(day => day.entries.length > 0)
}

/* ============================================================
   ПОИСК (§5.5, шаг 3)
   ============================================================ */

const MOOD_WORDS_SEARCH = ['тяжко', 'так себе', 'нормально', 'хорошо', 'отлично']

/**
 * Извлекает весь searchable-текст записи (для клиентского поиска).
 */
export function getEntrySearchableText(entry) {
  const parts = []
  const c = entry.checkin
  if (c) {
    if (c.note) parts.push(c.note)
    if (c.lessons) parts.push(c.lessons)
    if (c.wins) parts.push(...(c.wins || []))
    if (c.emotion) parts.push(c.emotion)
    if (c.mood != null) parts.push(MOOD_WORDS_SEARCH[(c.mood || 3) - 1])
  }
  const mp = entry.moodPractice
  if (mp) {
    if (mp.note) parts.push(mp.note)
    if (mp.emotion) parts.push(mp.emotion)
    if (mp.mood != null) parts.push(MOOD_WORDS_SEARCH[(mp.mood || 3) - 1])
  }
  const j = entry.journal
  if (j?.phases) {
    for (const phase of j.phases) {
      if (phase.text) parts.push(phase.text)
      if (phase.label) parts.push(phase.label)
    }
  }
  return parts.join(' ').toLowerCase()
}

/**
 * Ищет записи по тексту на клиенте.
 * Возвращает дни с записями, содержащими query (без учёта регистра).
 */
export function searchEntries(days, query) {
  if (!query || !query.trim()) return []
  const q = query.trim().toLowerCase()
  return days
    .map(day => ({
      ...day,
      entries: day.entries.filter(e => getEntrySearchableText(e).includes(q)),
    }))
    .filter(day => day.entries.length > 0)
}
