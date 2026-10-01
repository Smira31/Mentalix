/**
 * Хранилище «Мысли дня» — серверный API /quotes + локальный кэш.
 *
 * Новых серверных таблиц нет: и своя мысль, и сохранённая цитата — обычные
 * записи /quotes (api.quotes.create/list/remove) с размеченным tag:
 *   thought:YYYY-MM-DD — своя мысль за этот день;
 *   saved:YYYY-MM-DD   — сохранённая цитата дня.
 *
 * localStorage — только кэш: экран показывает данные сразу из него, затем
 * обновляется с сервера. Источник правды — сервер.
 *
 * Ранее мысль жила в journalStorage (freeWrites, kind='мысль'/'сохранено');
 * эти записи один раз переносятся на сервер через migrateLocalDailyItems().
 */

import { api } from './api.js'
import { deleteJournalFreeWrite, readJournalStore, todayKey } from './journalStorage.js'
import {
  THOUGHT_KIND,
  SAVED_KIND,
  isThoughtQuote,
  savedTag,
  sortByDateDesc,
  tagForKind,
  thoughtTag,
  toQuoteItems,
} from './quoteTags.js'

const CACHE_KEY = 'mx-daily-thoughts-cache-v1'
const MIGRATION_KEY = 'mx-daily-thoughts-migrated-v1'
/* Локальная заглушка id: сервер не вернул запись (демо-режим) — удалять нечего. */
const LOCAL_ID_PREFIX = 'local:'

function normalizeUserId(userId) {
  if (typeof userId === 'string' && userId.trim()) return userId.trim()
  if (typeof userId === 'number' && Number.isFinite(userId)) return String(userId)
  return null
}

function scopedKey(key, userId) {
  const normalized = normalizeUserId(userId)
  return normalized ? `${key}:user:${encodeURIComponent(normalized)}` : key
}

function isLocalId(id) {
  return typeof id === 'string' && id.startsWith(LOCAL_ID_PREFIX)
}

function readCache(userId) {
  try {
    const raw = JSON.parse(localStorage.getItem(scopedKey(CACHE_KEY, userId)) || 'null')
    return Array.isArray(raw?.items) ? raw.items : []
  } catch {
    return []
  }
}

function writeCache(userId, items) {
  try {
    localStorage.setItem(scopedKey(CACHE_KEY, userId), JSON.stringify({ items }))
  } catch {
    /* кэш недоступен — экран просто перечитает данные с сервера */
  }
}

function readMigrationFlag(userId) {
  try {
    return localStorage.getItem(scopedKey(MIGRATION_KEY, userId)) === '1'
  } catch {
    return false
  }
}

function writeMigrationFlag(userId) {
  try {
    localStorage.setItem(scopedKey(MIGRATION_KEY, userId), '1')
  } catch {
    /* флаг не сохранился — миграция просто повторится (дублей не будет) */
  }
}

// ── Кэш (синхронное чтение, мгновенный показ) ──

function readCachedDailyItems(userId) {
  return sortByDateDesc(readCache(userId))
}

function readCachedDailyThoughts(userId) {
  return readCachedDailyItems(userId).filter(item => item.kind === THOUGHT_KIND)
}

function readCachedSavedQuotes(userId) {
  return readCachedDailyItems(userId).filter(item => item.kind === SAVED_KIND)
}

function readCachedDailyThought(date = todayKey(), userId) {
  const items = readCachedDailyItems(userId)
  return items.find(item => item.kind === THOUGHT_KIND && item.date === date) || null
}

function isQuoteSaved(date = todayKey(), userId) {
  const items = readCachedDailyItems(userId)
  return items.some(item => item.kind === SAVED_KIND && item.date === date)
}

// ── Сервер ──

/**
 * Читает все записи «Мысли дня» с сервера и обновляет кэш.
 * Возвращает отсортированный по дате убыванию список
 * { id, text, kind, date }.
 */
async function loadDailyItems(userId) {
  if (!normalizeUserId(userId)) return []
  const list = await api.quotes.list(userId)
  const items = sortByDateDesc(toQuoteItems(list))
  writeCache(userId, items)
  return items
}

function withItem(items, item) {
  return sortByDateDesc([
    ...items.filter(existing => !(existing.kind === item.kind && existing.date === item.date)),
    item,
  ])
}

/**
 * Сохраняет мысль дня. Изменение уже записанной мысли — это remove + create:
 * у /quotes нет update, а дата (и значит tag) остаётся той же.
 */
async function saveDailyThought({ date = todayKey(), text, userId }) {
  const items = readCachedDailyItems(userId)
  const existing = items.find(item => item.kind === THOUGHT_KIND && item.date === date)

  if (existing && !isLocalId(existing.id)) await api.quotes.remove(existing.id)

  const created = await api.quotes.create(userId, text, thoughtTag(date))
  const next = withItem(items, {
    id: created?.id ?? `${LOCAL_ID_PREFIX}${date}`,
    text,
    kind: THOUGHT_KIND,
    date,
  })
  writeCache(userId, next)
  return next
}

/**
 * Сохраняет цитату дня (один раз на дату) как запись kind='сохранено'.
 */
async function saveSavedQuote({ date = todayKey(), text, userId }) {
  const items = readCachedDailyItems(userId)
  if (items.some(item => item.kind === SAVED_KIND && item.date === date)) return items

  const created = await api.quotes.create(userId, text, savedTag(date))
  const next = withItem(items, {
    id: created?.id ?? `${LOCAL_ID_PREFIX}${date}`,
    text,
    kind: SAVED_KIND,
    date,
  })
  writeCache(userId, next)
  return next
}

/**
 * Удаляет запись «Мысли дня» (мысль или сохранённую цитату) по id.
 */
async function removeDailyThought({ id, userId }) {
  const items = readCachedDailyItems(userId)
  if (!isLocalId(id)) await api.quotes.remove(id)
  const next = items.filter(item => item.id !== id)
  writeCache(userId, next)
  return next
}

// ── Одноразовая миграция локальных мыслей на сервер ──

const migrationInFlight = new Map()

/**
 * Записи прежнего локального хранилища (journalStorage freeWrites
 * с kind='мысль'/'сохранено').
 */
function readLegacyLocalItems(userId) {
  const store = readJournalStore(userId)
  const items = []
  for (const [date, entry] of Object.entries(store.entries)) {
    for (const write of entry.freeWrites) {
      if (write.kind !== THOUGHT_KIND && write.kind !== SAVED_KIND) continue
      const text = typeof write.text === 'string' ? write.text.trim() : ''
      if (!text) continue
      items.push({ date, id: write.id, kind: write.kind, text })
    }
  }
  return items
}

async function runMigration(userId) {
  const legacy = readLegacyLocalItems(userId)
  if (legacy.length === 0) {
    writeMigrationFlag(userId)
    return false
  }

  const existing = await loadDailyItems(userId)
  const known = new Set(existing.map(item => `${item.kind}:${item.date}`))

  for (const item of legacy) {
    const key = `${item.kind}:${item.date}`
    // Уже на сервере (частичная миграция, повторный запуск) — не дублируем.
    if (!known.has(key)) {
      await api.quotes.create(userId, item.text, tagForKind(item.kind, item.date))
      known.add(key)
    }
    deleteJournalFreeWrite({ date: item.date, id: item.id, userId })
  }

  await loadDailyItems(userId)
  writeMigrationFlag(userId)
  return true
}

/**
 * Первая и единственная миграция: переносит уже записанные локальные мысли
 * на сервер, затем удаляет их из локального хранилища. При ошибке сети
 * локальные данные не теряются, флаг не ставится — попробуем при следующем
 * открытии. Повторный запуск не создаёт дублей (сверка с сервером по дате).
 */
async function migrateLocalDailyItems(userId) {
  if (!normalizeUserId(userId) || readMigrationFlag(userId)) return false
  if (migrationInFlight.has(userId)) return migrationInFlight.get(userId)

  const task = (async () => {
    try {
      return await runMigration(userId)
    } catch (error) {
      console.error('Не удалось перенести локальные мысли на сервер', error)
      return false
    }
  })()

  migrationInFlight.set(userId, task)
  try {
    return await task
  } finally {
    migrationInFlight.delete(userId)
  }
}

export {
  THOUGHT_KIND,
  SAVED_KIND,
  isThoughtQuote,
  readCachedDailyItems,
  readCachedDailyThoughts,
  readCachedSavedQuotes,
  readCachedDailyThought,
  isQuoteSaved,
  loadDailyItems,
  saveDailyThought,
  saveSavedQuote,
  removeDailyThought,
  migrateLocalDailyItems,
}
