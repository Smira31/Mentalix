/*
 * Хранилище практики «Альтер-эго».
 *
 * В Telegram — window.Telegram.WebApp.CloudStorage (per-user cloud).
 * Вне Telegram и в демо — localStorage, обёрнутый в try/catch.
 * Бэкенд не трогается.
 */

const STORAGE_KEY = 'mx-alter-egos'

/*
 * Генерация уникального ID.
 * Приоритет: crypto.randomUUID() (доступен в современных браузерах и Node ≥ 19).
 * Запасной вариант: Date.now() + криптослучайный суффикс — защищает от коллизий
 * при быстром последовательном сохранении в пределах одной миллисекунды.
 */
function generateId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    /* fall through */
  }
  const suffix = Math.random().toString(36).slice(2, 10)
  return `${Date.now()}-${suffix}`
}

/*
 * Объект карточки альтер-эго:
 * { id, name, situation, situationCustom, qualities: [3], posture, anchor, createdAt, updatedAt }
 */

function isTelegramCloudStorageAvailable() {
  try {
    return Boolean(window.Telegram?.WebApp?.CloudStorage)
  } catch {
    return false
  }
}

/* ── Telegram CloudStorage (callback → Promise) ── */

function tgGetItem(key) {
  return new Promise(resolve => {
    try {
      window.Telegram.WebApp.CloudStorage.getItem(key, (error, value) => {
        if (error) return resolve(null)
        resolve(value)
      })
    } catch {
      resolve(null)
    }
  })
}

function tgSetItem(key, value) {
  return new Promise(resolve => {
    try {
      window.Telegram.WebApp.CloudStorage.setItem(key, value, (error, success) => {
        resolve(!error && success)
      })
    } catch {
      resolve(false)
    }
  })
}

function tgRemoveItem(key) {
  return new Promise(resolve => {
    try {
      window.Telegram.WebApp.CloudStorage.removeItem(key, (error, success) => {
        resolve(!error && success)
      })
    } catch {
      resolve(false)
    }
  })
}

/* ── localStorage fallback ── */

function lsGetItem(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function lsSetItem(key, value) {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function lsRemoveItem(key) {
  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

/* ── Универсальные операции ── */

async function readRaw() {
  if (isTelegramCloudStorageAvailable()) {
    return tgGetItem(STORAGE_KEY)
  }
  return lsGetItem(STORAGE_KEY)
}

async function writeRaw(value) {
  if (isTelegramCloudStorageAvailable()) {
    return tgSetItem(STORAGE_KEY, value)
  }
  return lsSetItem(STORAGE_KEY, value)
}

async function removeRaw() {
  if (isTelegramCloudStorageAvailable()) {
    return tgRemoveItem(STORAGE_KEY)
  }
  return lsRemoveItem(STORAGE_KEY)
}

function parseList(raw) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/* ── Публичный API (async) ── */

export async function loadAlterEgos() {
  const raw = await readRaw()
  return parseList(raw)
}

export async function saveAlterEgo(card) {
  const list = await loadAlterEgos()
  const now = Date.now()
  const record = { ...card, id: card.id || generateId(), createdAt: now, updatedAt: now }
  const next = [record, ...list.filter(item => item.id !== record.id)]
  await writeRaw(JSON.stringify(next))
  return record
}

export async function updateAlterEgo(id, patch) {
  const list = await loadAlterEgos()
  const idx = list.findIndex(item => item.id === id)
  if (idx === -1) return null
  const updated = { ...list[idx], ...patch, id, updatedAt: Date.now() }
  list[idx] = updated
  await writeRaw(JSON.stringify(list))
  return updated
}

export async function deleteAlterEgo(id) {
  const list = await loadAlterEgos()
  const next = list.filter(item => item.id !== id)
  await writeRaw(JSON.stringify(next))
  return next
}

export async function getAlterEgo(id) {
  const list = await loadAlterEgos()
  return list.find(item => item.id === id) || null
}

export async function clearAllAlterEgos() {
  return removeRaw()
}

/*
 * Синхронная версия для unit-тестов: работает только с localStorage.
 * Telegram CloudStorage асинхронен и в тестах недоступен.
 */
export function loadAlterEgosSync() {
  return parseList(lsGetItem(STORAGE_KEY))
}

export function saveAlterEgoSync(card) {
  const list = loadAlterEgosSync()
  const now = Date.now()
  const record = { ...card, id: card.id || generateId(), createdAt: now, updatedAt: now }
  const next = [record, ...list.filter(item => item.id !== record.id)]
  lsSetItem(STORAGE_KEY, JSON.stringify(next))
  return record
}

export function updateAlterEgoSync(id, patch) {
  const list = loadAlterEgosSync()
  const idx = list.findIndex(item => item.id === id)
  if (idx === -1) return null
  const updated = { ...list[idx], ...patch, id, updatedAt: Date.now() }
  list[idx] = updated
  lsSetItem(STORAGE_KEY, JSON.stringify(list))
  return updated
}

export function deleteAlterEgoSync(id) {
  const list = loadAlterEgosSync()
  const next = list.filter(item => item.id !== id)
  lsSetItem(STORAGE_KEY, JSON.stringify(next))
  return next
}
