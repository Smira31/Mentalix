/*
 * Локальный черновик журнала — поток сознания, ответ на вопрос и текст вопроса.
 * Сохраняется по мере ввода, переживает закрытие приложения.
 * Ключ: user_id + дата (YYYY-MM-DD).
 */
const STORAGE_PREFIX = 'mx-daily-journal-draft'

function normalizeUserId(userId) {
  if (typeof userId === 'string' && userId.trim()) return userId.trim()
  if (typeof userId === 'number' && Number.isFinite(userId)) return String(userId)
  return null
}

function storageKey(userId, date) {
  const uid = normalizeUserId(userId)
  return `${STORAGE_PREFIX}:${uid ? encodeURIComponent(uid) : 'default'}:${date}`
}

export function readDailyJournalDraft(userId, date) {
  try {
    const raw = localStorage.getItem(storageKey(userId, date))
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return null
    return {
      streamText: typeof data.streamText === 'string' ? data.streamText : '',
      promptAnswer: typeof data.promptAnswer === 'string' ? data.promptAnswer : '',
      promptText: typeof data.promptText === 'string' ? data.promptText : '',
      pendingSave: Boolean(data.pendingSave),
      updatedAt: data.updatedAt || null,
    }
  } catch {
    return null
  }
}

export function saveDailyJournalDraft(
  userId,
  date,
  { streamText, promptAnswer, promptText, pendingSave = false }
) {
  const value = {
    streamText: streamText || '',
    promptAnswer: promptAnswer || '',
    promptText: promptText || '',
    pendingSave,
    updatedAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(storageKey(userId, date), JSON.stringify(value))
  } catch (error) {
    console.error(error)
  }
  return value
}

export function clearDailyJournalDraft(userId, date) {
  try {
    localStorage.removeItem(storageKey(userId, date))
  } catch (error) {
    console.error(error)
  }
}
