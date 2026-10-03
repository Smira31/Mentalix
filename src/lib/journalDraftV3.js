/**
 * Локальный черновик Journal flow v3.
 *
 * Draft НЕ записывается на сервер до явного завершения.
 * Хранит: answers, template_id, templateTitle (для отображения),
 * snapshot вопросов (id, title, type, …) и templateVersion, updatedAt,
 * idempotency_key — уникальный ключ попытки записи (создаётся при начале).
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

/**
 * templateId может прийти числом, строкой или с пробелами → канонический вид.
 * Возвращает строку или null, если id пустой.
 */
function normalizeTemplateId(templateId) {
  if (typeof templateId === 'number') {
    return Number.isFinite(templateId) ? String(templateId) : null
  }
  if (typeof templateId !== 'string') return null
  const trimmed = templateId.trim()
  if (!trimmed) return null
  return /^\d+$/.test(trimmed) ? String(Number(trimmed)) : trimmed
}

function sameTemplateId(a, b) {
  const left = normalizeTemplateId(a)
  return left !== null && left === normalizeTemplateId(b)
}

/**
 * Снимок вопросов шаблона: достаточно, чтобы продолжить запись,
 * даже если шаблон потом изменили или удалили.
 */
function buildQuestionSnapshot(steps) {
  if (!Array.isArray(steps)) return []
  return steps
    .filter(step => step && step.id !== undefined && step.id !== null)
    .map(step => {
      const item = {
        id: step.id,
        title: String(step.title || ''),
        type: step.type || 'free_text',
        required: Boolean(step.required),
      }
      if (step.helper) item.helper = String(step.helper)
      if (Array.isArray(step.options)) item.options = step.options.map(String)
      if (step.validation && typeof step.validation === 'object') {
        item.validation = { ...step.validation }
      }
      return item
    })
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
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => [
      String(key),
      typeof value === 'string'
        ? value.trim()
        : Array.isArray(value)
          ? value.map(String)
          : String(value),
    ])
  // JSON однозначен: разделители внутри текста не смешиваются с ключами/значениями
  return JSON.stringify(entries)
}

/**
 * Уникальный ключ идемпотентности одной попытки записи.
 * Создаётся при начале записи, хранится в черновике и переиспользуется при повторах.
 */
function newAttemptKey() {
  const cryptoApi = globalThis.crypto
  let random = ''
  if (cryptoApi?.getRandomValues) {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(8))
    random = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  } else {
    random = `${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`.slice(0, 16)
  }
  return `jd3-${Date.now().toString(36)}-${random}`
}

function readJournalDraft(userId, templateId) {
  const id = normalizeTemplateId(templateId)
  if (id === null) return null
  const store = readStore(userId)
  const draft = store.drafts[id]
  if (!draft || typeof draft !== 'object') return null
  return {
    answers: draft.answers && typeof draft.answers === 'object' ? draft.answers : {},
    template_id: draft.template_id || id,
    templateTitle: draft.templateTitle || null,
    templateVersion: draft.templateVersion ?? null,
    snapshot: Array.isArray(draft.snapshot) ? draft.snapshot : null,
    updatedAt: draft.updatedAt || null,
    idempotency_key: draft.idempotency_key || null,
    attempt_sig: draft.attempt_sig || null,
  }
}

/**
 * @returns {{ ok: boolean, draft: object|null }} ok=false, если localStorage недоступен/переполнен.
 */
function saveJournalDraft(userId, templateId, answers, idempotencyKey, templateTitle, meta = {}) {
  const id = normalizeTemplateId(templateId)
  if (id === null) return { ok: false, draft: null }
  const store = readStore(userId)
  const prev = store.drafts[id] || {}
  const draft = {
    answers: { ...answers },
    template_id: id,
    templateTitle: templateTitle || prev.templateTitle || null,
    templateVersion: meta.templateVersion ?? prev.templateVersion ?? null,
    snapshot: meta.snapshot ?? prev.snapshot ?? null,
    updatedAt: new Date().toISOString(),
    idempotency_key: idempotencyKey || prev.idempotency_key || null,
    attempt_sig: meta.attemptSig !== undefined ? meta.attemptSig : prev.attempt_sig || null,
  }
  store.drafts[id] = draft
  return { ok: writeStore(userId, store), draft }
}

function clearJournalDraft(userId, templateId) {
  const id = normalizeTemplateId(templateId)
  if (id === null) return false
  const store = readStore(userId)
  delete store.drafts[id]
  return writeStore(userId, store)
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
  newAttemptKey,
  normalizeTemplateId,
  sameTemplateId,
  buildQuestionSnapshot,
  readJournalDraft,
  saveJournalDraft,
  clearJournalDraft,
  listJournalDrafts,
}
