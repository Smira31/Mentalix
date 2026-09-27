/**
 * Локальный черновик Journal flow v3.
 *
 * Draft НЕ записывается на сервер до явного завершения.
 * Хранит: answers, template_id, templateTitle (для отображения),
 * updatedAt, idempotency_key (если была попытка submit).
 *
 * Шаблон следует guidedSelfDiscoveryDraft.js: один ключ на пользователя,
 * все драфты в одном объекте, безопасное чтение/запись.
 */

const STORAGE_KEY = 'mx-journal-draft-v3'

function normalizeUserId(userId) {
  if (typeof userId === 'string' && userId.trim()) return userId.trim()
  if (typeof userId === 'number' && Number.isFinite(userId)) return String(userId)
  return null
}

function storageKey(userId) {
  const normalized = normalizeUserId(userId)
  return normalized ? `${STORAGE_KEY}:user:${encodeURIComponent(normalized)}` : STORAGE_KEY
}

function readStore(userId) {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(userId)) || 'null')
    if (!raw || typeof raw !== 'object' || !raw.drafts) return { drafts: {} }
    return raw
  } catch {
    return { drafts: {} }
  }
}

function writeStore(userId, store) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(store))
    return true
  } catch {
    return false
  }
}

/**
 * Стабильная подпись содержимого answers для idempotency.
 * Сортируем ключи, нормализуем строки (trim), не-строки → JSON.
 */
function contentSignature(answers) {
  const entries = Object.entries(answers || {})
    .filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'number') return true
      return Boolean(String(value || '').trim())
    })
    .sort(([a], [b]) => String(a).localeCompare(String(b)))

  return entries
    .map(([key, value]) => {
      const normalized =
        typeof value === 'string'
          ? value.trim()
          : Array.isArray(value)
            ? value.join(',')
            : String(value)
      return `${key}:${normalized}`
    })
    .join('|')
}

/**
 * Простой детерминированный хеш → base36 строка.
 * Не криптостойкий — нужна только стабильность одинакового содержимого.
 */
function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return `jd3-${(hash >>> 0).toString(36)}`
}

/**
 * Генерировать стабильный idempotency_key из answers.
 * Одинаковое содержимое → одинаковый ключ.
 */
function generateIdempotencyKey(answers) {
  return hashString(contentSignature(answers))
}

/**
 * Проверить, валиден ли сохранённый key для текущего содержимого.
 * Если содержимое изменилось после failed attempt — ключ невалиден.
 */
function isKeyValid(storedKey, answers) {
  if (!storedKey) return false
  return storedKey === generateIdempotencyKey(answers)
}

function readJournalDraft(userId, templateId) {
  const store = readStore(userId)
  const draft = store.drafts[String(templateId)]
  if (!draft || typeof draft !== 'object') return null
  return {
    answers: draft.answers && typeof draft.answers === 'object' ? draft.answers : {},
    template_id: draft.template_id || String(templateId),
    templateTitle: draft.templateTitle || null,
    updatedAt: draft.updatedAt || null,
    idempotency_key: draft.idempotency_key || null,
  }
}

function saveJournalDraft(userId, templateId, answers, idempotencyKey, templateTitle) {
  const store = readStore(userId)
  const draft = {
    answers: { ...answers },
    template_id: String(templateId),
    templateTitle: templateTitle || store.drafts[String(templateId)]?.templateTitle || null,
    updatedAt: new Date().toISOString(),
    idempotency_key: idempotencyKey || store.drafts[String(templateId)]?.idempotency_key || null,
  }
  store.drafts[String(templateId)] = draft
  writeStore(userId, store)
  return draft
}

function clearJournalDraft(userId, templateId) {
  const store = readStore(userId)
  delete store.drafts[String(templateId)]
  writeStore(userId, store)
}

function listJournalDrafts(userId) {
  const store = readStore(userId)
  return Object.entries(store.drafts).map(([templateId, draft]) => ({
    templateId,
    ...draft,
  }))
}

export {
  STORAGE_KEY,
  contentSignature,
  generateIdempotencyKey,
  isKeyValid,
  readJournalDraft,
  saveJournalDraft,
  clearJournalDraft,
  listJournalDrafts,
}
