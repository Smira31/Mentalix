/*
 * JOURNAL-001 — записи настоящего дневника (DailyJournal, api.dailyJournal)
 * для общей ленты «Прогресс → История».
 *
 * Источник — существующий серверный API дневника: те же записи, что видит
 * экран «Мои записи» (DailyJournalEntries). Модуль только нормализует ответ
 * и сливает страницы; он ничего не пишет в localStorage, не мигрирует и не
 * меняет серверное хранение.
 *
 * Отдельно от локального journalStorage (`mx-journal-v2`, цикл «Идея /
 * Действие / Анализ / Новый шаг») — это другой источник и другой признак
 * записи, их нельзя путать.
 */

/** Размер страницы, как у экрана «Мои записи» (DailyJournalEntries). */
export const DAILY_JOURNAL_PAGE_SIZE = 30

function normalizeId(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string' && value.trim()) return value.trim()
  return null
}

function asText(value) {
  return typeof value === 'string' ? value : ''
}

/**
 * Приводит запись дневника к виду истории.
 *
 * Без id и даты запись нельзя ни раскрыть, ни сгруппировать — такая
 * отбрасывается. Пустые записи (нет ни потока, ни ответа на вопрос) тоже не
 * показываем: строка без содержимого ничего не значит.
 */
export function normalizeDiaryEntry(raw) {
  if (!raw || typeof raw !== 'object') return null

  const id = normalizeId(raw.id)
  const rawDate = normalizeId(raw.date)
  const date = rawDate ? rawDate.slice(0, 10) : null
  if (!id || !date) return null

  const streamText = asText(raw.stream_text)
  const promptText = asText(raw.prompt_text)
  const promptAnswer = asText(raw.prompt_answer)
  if (!streamText.trim() && !promptAnswer.trim()) return null

  return {
    id,
    date,
    dayNumber: Number.isFinite(raw.day_number) ? raw.day_number : null,
    streamText,
    promptText,
    promptAnswer,
    createdAt: asText(raw.created_at),
  }
}

/** Нормализует страницу ответа API, отбрасывая непригодные записи. */
export function normalizeDiaryPage(items) {
  return (Array.isArray(items) ? items : []).map(normalizeDiaryEntry).filter(Boolean)
}

/**
 * Сливает новую страницу с уже показанными записями без дублей.
 *
 * Ключ — id записи, поэтому повторное открытие, обновление и загрузка
 * следующей страницы не удваивают строки. Разные записи одного дня остаются
 * разными строками: по дате мы их не схлопываем.
 */
export function mergeDiaryEntries(existing, incoming) {
  const seen = new Set((existing || []).map(entry => entry.id))
  const merged = [...(existing || [])]
  for (const entry of incoming || []) {
    if (seen.has(entry.id)) continue
    seen.add(entry.id)
    merged.push(entry)
  }
  // Новые сверху; внутри одного дня порядок ответа сохраняется.
  return merged.sort((left, right) => (left.date < right.date ? 1 : left.date > right.date ? -1 : 0))
}

/**
 * Есть ли ещё страницы. Сервер отдаёт полную страницу, пока есть что
 * отдавать, — неполная страница означает конец истории. Пока это true,
 * заявлять полноту ленты нельзя.
 */
export function diaryPageHasMore(items) {
  return Array.isArray(items) && items.length >= DAILY_JOURNAL_PAGE_SIZE
}

/** Курсор следующей страницы — дата последней загруженной записи. */
export function diaryPageCursor(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return undefined
  return entries[entries.length - 1].date
}
