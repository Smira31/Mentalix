/**
 * Хранилище «Мысли дня» — обёртка над freeWrites в journalStorage.
 *
 * Новых серверных таблиц нет: мысль дня сохраняется как свободная запись
 * (freeWrite) с kind='мысль' и quoteKey — ключ цитаты дня, к которой
 * она написана. Источник данных — тот же localStorage, что у дневника.
 */

import {
  saveJournalFreeWrite,
  deleteJournalFreeWrite,
  readAllJournalFreeWrites,
  readJournalEntry,
  todayKey,
} from './journalStorage.js'

const THOUGHT_KIND = 'мысль'
const SAVED_KIND = 'сохранено'

/**
 * Сохраняет мысль дня для указанной даты.
 * Если мысль за этот день уже есть — обновляет её.
 */
function saveDailyThought({ date = todayKey(), text, quoteKey, userId }) {
  const existing = readDailyThought(date, userId)
  return saveJournalFreeWrite({
    date,
    id: existing?.id,
    text,
    status: 'final',
    kind: THOUGHT_KIND,
    quoteKey,
    userId,
  })
}

/**
 * Читает мысль дня для указанной даты (или null, если её нет).
 */
function readDailyThought(date = todayKey(), userId) {
  const entry = readJournalEntry(date, userId)
  return entry.freeWrites.find(w => w.kind === THOUGHT_KIND) || null
}

/**
 * Читает все мысли дня пользователя, отсортированные по дате убыванию.
 */
function readAllDailyThoughts(userId) {
  return readAllJournalFreeWrites(userId, THOUGHT_KIND)
}

/**
 * Удаляет мысль дня по id и дате.
 */
function removeDailyThought({ date, id, userId }) {
  return deleteJournalFreeWrite({ date, id, userId })
}

/**
 * Сохраняет цитату дня как закладку (kind='сохранено').
 */
function saveSavedQuote({ date = todayKey(), text, quoteKey, userId }) {
  const entry = readJournalEntry(date, userId)
  const existing = entry.freeWrites.find(w => w.kind === SAVED_KIND && w.quoteKey === quoteKey)
  if (existing) return entry // уже сохранено — не дублируем
  return saveJournalFreeWrite({
    date,
    text,
    status: 'final',
    kind: SAVED_KIND,
    quoteKey,
    userId,
  })
}

/**
 * Читает все сохранённые цитаты пользователя.
 */
function readAllSavedQuotes(userId) {
  return readAllJournalFreeWrites(userId, SAVED_KIND)
}

/**
 * Читает все элементы «Мысли дня» — и свои мысли, и сохранённые цитаты.
 * Отсортировано по дате убыванию.
 */
function readAllDailyItems(userId) {
  const thoughts = readAllDailyThoughts(userId)
  const saved = readAllSavedQuotes(userId)
  return [...thoughts, ...saved].sort((a, b) => (a.date < b.date ? 1 : -1))
}

/**
 * Проверяет, сохранена ли цитата за указанную дату.
 */
function isQuoteSaved(date = todayKey(), quoteKey, userId) {
  const entry = readJournalEntry(date, userId)
  return entry.freeWrites.some(w => w.kind === SAVED_KIND && w.quoteKey === quoteKey)
}

export {
  THOUGHT_KIND,
  SAVED_KIND,
  saveDailyThought,
  readDailyThought,
  readAllDailyThoughts,
  removeDailyThought,
  saveSavedQuote,
  readAllSavedQuotes,
  readAllDailyItems,
  isQuoteSaved,
}
