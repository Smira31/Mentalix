import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  formatDayLabel,
  formatEntryDateCaps,
  extractTime,
  buildEntriesByDay,
  entryListName,
  entryScreenTitle,
  ENTRY_TYPES,
  HISTORY_GRANULARITIES,
  groupDaysByWeek,
  groupDaysByMonth,
  groupDaysByYear,
  FILTER_GROUPS,
  getAvailableFilterTypes,
  filterDaysByTypes,
  getEntrySearchableText,
  searchEntries,
} from '../../src/screens/progress/progressHistoryUtils.js'

// ── Вкладка по умолчанию — «Аналитика» ──

test('Analytics: вкладка по умолчанию — «Аналитика»', () => {
  const source = readFileSync(
    new URL('../../src/screens/Analytics.jsx', import.meta.url),
    'utf8'
  )
  // sessionStorage-инициализация с дефолтом 'analytics'
  assert.match(source, /PROGRESS_SEGMENT_KEY/)
  assert.match(source, /sessionStorage\.getItem/)
  assert.match(source, /return 'analytics'/)
  // Сегмент содержит «Аналитика» и «История»
  assert.match(source, /Аналитика/)
  assert.match(source, /История/)
  // data-testid для вкладок
  assert.match(source, /progress-tab-analytics/)
  assert.match(source, /progress-tab-history/)
  // historyTrigger — внешний переключатель на «История»
  assert.match(source, /historyTrigger/)
})

// ── Переход «Все записи» → История (App.jsx) ──

test('App.jsx: onOpenHistory переключает на сегмент «История», а не на отдельную вкладку', () => {
  const source = readFileSync(
    new URL('../../src/App.jsx', import.meta.url),
    'utf8'
  )
  // onOpenHistory использует setProgressHistoryTrigger, а не setTab('history')
  assert.match(source, /setProgressHistoryTrigger/)
  // historyTrigger передаётся в Analytics
  assert.match(source, /historyTrigger=\{progressHistoryTrigger\}/)
  // 'history' больше не отдельная вкладка в validTabs
  assert.doesNotMatch(
    source,
    /validTabs\s*=\s*\[[^\]]*'history'[^\]]*\]/,
    'history не должен быть в validTabs'
  )
  // Нет отдельного блока рендера для tab === 'history'
  assert.doesNotMatch(
    source,
    /tab === 'history' && \(/,
    'не должно быть отдельного рендера для tab === "history"'
  )
})

// ── Группировка записей по дням ──

test('buildEntriesByDay: группирует записи по дням', () => {
  const checkins = [
    { date: '2026-09-25', mood: 4, note: 'Утро', created_at: '2026-09-25T08:30:00Z' },
    { date: '2026-09-24', review_completed_at: '2026-09-24T20:00:00Z' },
  ]
  const moodPractices = [
    { recorded_at: '2026-09-25T15:00:00Z', mood: 5, emotion: 'радость' },
  ]
  const journalEntries = [
    { date: '2026-09-24', phases: [{ key: 'newStep', label: 'Новый шаг', text: 'Текст' }] },
  ]

  const days = buildEntriesByDay(checkins, moodPractices, journalEntries, [])

  // Два дня
  assert.equal(days.length, 2)

  // 25 сентября — новее, идёт первым
  assert.equal(days[0].date, '2026-09-25')
  // Две записи: настроение (15:00) + утренний чек-ин (08:30) — новые сверху
  assert.equal(days[0].entries.length, 2)
  assert.equal(days[0].entries[0].type, ENTRY_TYPES.MOOD)
  assert.equal(days[0].entries[1].type, ENTRY_TYPES.MORNING)

  // 24 сентября — вторая группа
  assert.equal(days[1].date, '2026-09-24')
  // Две записи: вечерний разбор (20:00) + дневник (без времени — в конце)
  assert.equal(days[1].entries.length, 2)
  assert.equal(days[1].entries[0].type, ENTRY_TYPES.EVENING)
  assert.equal(days[1].entries[1].type, ENTRY_TYPES.JOURNAL)
})

test('buildEntriesByDay: пустые данные → пустой массив', () => {
  assert.deepEqual(buildEntriesByDay([], [], [], []), [])
  assert.deepEqual(buildEntriesByDay(null, null, null, null), [])
})

test('buildEntriesByDay: чек-ин без review_completed_at не создаёт вечернюю запись', () => {
  const days = buildEntriesByDay(
    [{ date: '2026-09-25', mood: 4, note: 'Утро' }],
    [],
    [],
    []
  )
  assert.equal(days.length, 1)
  assert.equal(days[0].entries.length, 1)
  assert.equal(days[0].entries[0].type, ENTRY_TYPES.MORNING)
})

// ── Формат дат ──

test('formatDayLabel: «Сегодня» для текущего дня', () => {
  const today = new Date().toISOString().slice(0, 10)
  assert.equal(formatDayLabel(today), 'Сегодня')
})

test('formatDayLabel: «Вчера, 24 сент» для вчерашнего дня', () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const iso = yesterday.toISOString().slice(0, 10)
  const d = new Date(iso + 'T00:00:00')
  const monthShort = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сент', 'окт', 'ноя', 'дек']
  const expected = `Вчера, ${d.getDate()} ${monthShort[d.getMonth()]}`
  assert.equal(formatDayLabel(iso), expected)
})

test('formatDayLabel: «Пятница, 24 июл» для старого дня в текущем году', () => {
  // Используем фиксированную дату в текущем году
  const now = new Date()
  const currentYear = now.getFullYear()
  const iso = `${currentYear}-07-24`
  // 2025-07-24 — это четверг, 2026-07-24 — это пятница
  const d = new Date(iso + 'T00:00:00')
  const weekdays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
  const expected = `${weekdays[d.getDay()]}, 24 июл`
  assert.equal(formatDayLabel(iso), expected)
})

test('formatDayLabel: год добавляется только если не текущий', () => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const pastYear = currentYear - 1
  const iso = `${pastYear}-07-24`
  const label = formatDayLabel(iso)
  // Должен содержать прошлый год
  assert.match(label, new RegExp(String(pastYear)))
  // Текущий год не должен добавляться
  const currentYearIso = `${currentYear}-07-24`
  const currentYearLabel = formatDayLabel(currentYearIso)
  assert.doesNotMatch(currentYearLabel, new RegExp(` ${currentYear}$`))
})

// ── Вспомогательные функции ──

test('extractTime: извлекает HH:MM из ISO datetime', () => {
  assert.equal(extractTime('2026-09-25T20:46:00Z'), '20:46')
  assert.equal(extractTime('2026-09-25T08:30:00+03:00'), '08:30')
  assert.equal(extractTime('2026-09-25'), '')
  assert.equal(extractTime(''), '')
  assert.equal(extractTime(null), '')
})

test('entryListName: правильные названия для строки списка', () => {
  assert.equal(entryListName(ENTRY_TYPES.MORNING), 'Утренний чек-ин')
  assert.equal(entryListName(ENTRY_TYPES.EVENING), 'Вечерний разбор')
  assert.equal(entryListName(ENTRY_TYPES.MOOD), 'Настроение')
  assert.equal(entryListName(ENTRY_TYPES.JOURNAL), 'Дневник')
})

test('entryScreenTitle: заголовки экрана записи строчными с точкой', () => {
  assert.equal(entryScreenTitle(ENTRY_TYPES.MORNING), 'утро.')
  assert.equal(entryScreenTitle(ENTRY_TYPES.EVENING), 'вечер.')
  assert.equal(entryScreenTitle(ENTRY_TYPES.MOOD), 'настроение.')
  assert.equal(entryScreenTitle(ENTRY_TYPES.JOURNAL), 'дневник.')
})

test('formatEntryDateCaps: дата капителью для экрана записи', () => {
  const today = new Date().toISOString().slice(0, 10)
  assert.equal(formatEntryDateCaps(today, '08:30'), 'СЕГОДНЯ В 08:30')

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yIso = yesterday.toISOString().slice(0, 10)
  assert.equal(formatEntryDateCaps(yIso, '20:46'), 'ВЧЕРА В 20:46')
})

// ── Шаг 3: группировка (Дни / Недели / Месяцы / Годы) ──

test('HISTORY_GRANULARITIES: 4 варианта без «Умной»', () => {
  assert.equal(HISTORY_GRANULARITIES.length, 4)
  const ids = HISTORY_GRANULARITIES.map(g => g.id)
  assert.deepEqual(ids, ['day', 'week', 'month', 'year'])
  assert.ok(!ids.includes('smart'), '«Умная» не должна быть в списке')
})

test('groupDaysByWeek: группирует дни по неделям, недели по месяцам', () => {
  const today = new Date()
  const days = []
  // 3 дня: сегодня, вчера, 10 дней назад
  for (const offset of [0, 1, 10]) {
    const d = new Date(today)
    d.setDate(today.getDate() - offset)
    const iso = d.toISOString().slice(0, 10)
    days.push({ date: iso, entries: [{ type: ENTRY_TYPES.MORNING, date: iso, time: '08:00', checkin: { date: iso, mood: 4 } }] })
  }

  const groups = groupDaysByWeek(days)
  assert.ok(groups.length >= 1, 'должна быть хотя бы одна группа-месяц')

  // Каждая группа имеет monthLabel и cards
  for (const g of groups) {
    assert.ok(g.monthLabel, 'у группы должен быть monthLabel')
    assert.ok(Array.isArray(g.cards), 'cards должен быть массивом')
    for (const card of g.cards) {
      assert.ok(typeof card.weekNumber === 'number', 'у карточки должен быть weekNumber')
      assert.ok(card.rangeLabel, 'у карточки должен быть rangeLabel')
      assert.ok(card.startDate, 'у карточки должен быть startDate')
      assert.ok(card.endDate, 'у карточки должен быть endDate')
      assert.ok(Array.isArray(card.days), 'days должен быть массивом')
    }
  }

  // 10 дней назад — другая неделя, поэтому карточек минимум 2
  const allCards = groups.flatMap(g => g.cards)
  assert.ok(allCards.length >= 2, 'должно быть минимум 2 карточки недели')
})

test('groupDaysByMonth: группирует дни по месяцам, месяцы по годам', () => {
  const today = new Date()
  const days = []
  for (const offset of [0, 40]) {
    const d = new Date(today)
    d.setDate(today.getDate() - offset)
    const iso = d.toISOString().slice(0, 10)
    days.push({ date: iso, entries: [{ type: ENTRY_TYPES.MOOD, date: iso, time: '12:00', moodPractice: { mood: 3 } }] })
  }

  const groups = groupDaysByMonth(days)
  assert.ok(groups.length >= 1, 'должна быть хотя бы одна группа-год')

  for (const g of groups) {
    assert.ok(g.yearLabel, 'у группы должен быть yearLabel')
    for (const card of g.cards) {
      assert.ok(card.label, 'у карточки должен быть label (название месяца)')
      assert.ok(card.startDate && card.endDate)
      assert.ok(Array.isArray(card.days))
    }
  }

  // 40 дней назад — другой месяц, поэтому карточек минимум 2
  const allCards = groups.flatMap(g => g.cards)
  assert.ok(allCards.length >= 2, 'должно быть минимум 2 карточки месяца')
})

test('groupDaysByYear: группирует дни по годам', () => {
  const today = new Date()
  const pastYear = today.getFullYear() - 1
  const days = [
    { date: today.toISOString().slice(0, 10), entries: [{ type: ENTRY_TYPES.MORNING, date: today.toISOString().slice(0, 10), time: '08:00', checkin: { mood: 4 } }] },
    { date: `${pastYear}-06-15`, entries: [{ type: ENTRY_TYPES.JOURNAL, date: `${pastYear}-06-15`, time: '', journal: { phases: [] } }] },
  ]

  const groups = groupDaysByYear(days)
  assert.equal(groups.length, 2, 'должно быть 2 группы-года')

  // Новый год — первый
  assert.equal(groups[0].label, String(today.getFullYear()))
  assert.equal(groups[1].label, String(pastYear))
  assert.ok(groups[0].days.length === 1)
  assert.ok(groups[1].days.length === 1)
})

test('groupDaysByWeek: пустые данные → пустой массив', () => {
  assert.deepEqual(groupDaysByWeek([]), [])
})

test('groupDaysByMonth: пустые данные → пустой массив', () => {
  assert.deepEqual(groupDaysByMonth([]), [])
})

test('groupDaysByYear: пустые данные → пустой массив', () => {
  assert.deepEqual(groupDaysByYear([]), [])
})

// ── Шаг 3: фильтры ──

test('FILTER_GROUPS: группы «Чек-ины» и «Практики»', () => {
  assert.equal(FILTER_GROUPS.length, 2)
  assert.equal(FILTER_GROUPS[0].label, 'Чек-ины')
  assert.equal(FILTER_GROUPS[1].label, 'Практики')
  // Чек-ины: утренний, вечерний разбор
  const checkinTypes = FILTER_GROUPS[0].types.map(t => t.id)
  assert.ok(checkinTypes.includes(ENTRY_TYPES.MORNING))
  assert.ok(checkinTypes.includes(ENTRY_TYPES.EVENING))
  // Практики: настроение, дневник
  const practiceTypes = FILTER_GROUPS[1].types.map(t => t.id)
  assert.ok(practiceTypes.includes(ENTRY_TYPES.MOOD))
  assert.ok(practiceTypes.includes(ENTRY_TYPES.JOURNAL))
})

test('getAvailableFilterTypes: возвращает только существующие типы', () => {
  const today = new Date().toISOString().slice(0, 10)
  const days = [
    { date: today, entries: [
      { type: ENTRY_TYPES.MORNING, date: today, time: '08:00', checkin: { mood: 4 } },
      { type: ENTRY_TYPES.MOOD, date: today, time: '12:00', moodPractice: { mood: 3 } },
    ] },
  ]
  const types = getAvailableFilterTypes(days)
  assert.ok(types.has(ENTRY_TYPES.MORNING))
  assert.ok(types.has(ENTRY_TYPES.MOOD))
  assert.ok(!types.has(ENTRY_TYPES.EVENING))
  assert.ok(!types.has(ENTRY_TYPES.JOURNAL))
})

test('filterDaysByTypes: фильтрует записи по выбранным типам', () => {
  const today = new Date().toISOString().slice(0, 10)
  const days = [
    { date: today, entries: [
      { type: ENTRY_TYPES.MORNING, date: today, time: '08:00', checkin: { mood: 4 } },
      { type: ENTRY_TYPES.MOOD, date: today, time: '12:00', moodPractice: { mood: 3 } },
    ] },
  ]

  // Фильтр по утреннему чек-ину — остаётся только он
  const filtered = filterDaysByTypes(days, new Set([ENTRY_TYPES.MORNING]))
  assert.equal(filtered.length, 1)
  assert.equal(filtered[0].entries.length, 1)
  assert.equal(filtered[0].entries[0].type, ENTRY_TYPES.MORNING)

  // Без фильтра — все записи
  const noFilter = filterDaysByTypes(days, new Set())
  assert.equal(noFilter, days)

  // Фильтр по несуществующему типу — день удаляется
  const empty = filterDaysByTypes(days, new Set([ENTRY_TYPES.EVENING]))
  assert.equal(empty.length, 0)
})

// ── Шаг 3: поиск ──

test('getEntrySearchableText: извлекает текст из записи', () => {
  const entry = {
    type: ENTRY_TYPES.MORNING,
    checkin: { note: 'Сегодня хороший день', mood: 4, emotion: 'спокойствие' },
  }
  const text = getEntrySearchableText(entry)
  assert.ok(text.includes('сегодня хороший день'))
  assert.ok(text.includes('спокойствие'))
  assert.ok(text.includes('хорошо')) // moodWord(4) = 'хорошо'
})

test('searchEntries: находит записи по тексту', () => {
  const today = new Date().toISOString().slice(0, 10)
  const days = [
    { date: today, entries: [
      { type: ENTRY_TYPES.MORNING, date: today, time: '08:00', checkin: { note: 'Утро было продуктивным', mood: 4 } },
      { type: ENTRY_TYPES.MOOD, date: today, time: '12:00', moodPractice: { mood: 3, emotion: 'радость' } },
    ] },
  ]

  const results = searchEntries(days, 'продуктивным')
  assert.equal(results.length, 1)
  assert.equal(results[0].entries.length, 1)
  assert.equal(results[0].entries[0].type, ENTRY_TYPES.MORNING)

  const results2 = searchEntries(days, 'радость')
  assert.equal(results2.length, 1)
  assert.equal(results2[0].entries[0].type, ENTRY_TYPES.MOOD)
})

test('searchEntries: ничего не найдено → пустой массив', () => {
  const today = new Date().toISOString().slice(0, 10)
  const days = [
    { date: today, entries: [
      { type: ENTRY_TYPES.MORNING, date: today, time: '08:00', checkin: { note: 'Обычное утро', mood: 3 } },
    ] },
  ]

  const results = searchEntries(days, 'несуществующее слово')
  assert.equal(results.length, 0)

  // Пустой запрос → пустой массив
  assert.equal(searchEntries(days, '').length, 0)
  assert.equal(searchEntries(days, '   ').length, 0)
})

// ── Шаг 3: data-testid и localStorage в ProgressHistory ──

test('ProgressHistory: data-testid для кнопок действий', () => {
  const source = readFileSync(
    new URL('../../src/screens/progress/ProgressHistory.jsx', import.meta.url),
    'utf8'
  )
  assert.match(source, /data-testid="history-grouping-pill"/)
  assert.match(source, /data-testid="history-filter-btn"/)
  assert.match(source, /data-testid="history-search-btn"/)
  assert.match(source, /data-testid="history-grouping-menu"/)
})

test('ProgressHistory: localStorage для группировки и фильтра', () => {
  const source = readFileSync(
    new URL('../../src/screens/progress/ProgressHistory.jsx', import.meta.url),
    'utf8'
  )
  assert.match(source, /GRANULARITY_KEY/)
  assert.match(source, /FILTER_KEY/)
  assert.match(source, /localStorage\.getItem\(GRANULARITY_KEY\)/)
  assert.match(source, /localStorage\.getItem\(FILTER_KEY\)/)
  assert.match(source, /localStorage\.setItem\(GRANULARITY_KEY/)
  assert.match(source, /localStorage\.setItem\(FILTER_KEY/)
})

test('ProgressHistory: useBackButton для меню группировки', () => {
  const source = readFileSync(
    new URL('../../src/screens/progress/ProgressHistory.jsx', import.meta.url),
    'utf8'
  )
  assert.match(source, /useBackButton\(/)
  assert.match(source, /granularityMenuOpen\)/)
})

test('HistoryFilterSheet: useBackButton закрывает лист', () => {
  const source = readFileSync(
    new URL('../../src/screens/progress/HistoryFilterSheet.jsx', import.meta.url),
    'utf8'
  )
  assert.match(source, /useBackButton/)
  assert.match(source, /data-testid="history-filter-sheet"/)
  assert.match(source, /data-testid="history-filter-close"/)
})

test('HistorySearchSheet: useBackButton закрывает поиск', () => {
  const source = readFileSync(
    new URL('../../src/screens/progress/HistorySearchSheet.jsx', import.meta.url),
    'utf8'
  )
  assert.match(source, /useBackButton/)
  assert.match(source, /data-testid="history-search-sheet"/)
  assert.match(source, /data-testid="history-search-close"/)
  assert.match(source, /data-testid="history-search-input"/)
  // Пустое состояние «Что ищешь?»
  assert.match(source, /Что ищешь\?/)
  // Чипы-подсказки
  assert.match(source, /history-search-chip-/)
})
