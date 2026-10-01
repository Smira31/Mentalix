/**
 * Разметка записей /quotes для «Мысли дня».
 *
 * Новых серверных таблиц нет: мысль дня и сохранённая цитата — обычные
 * записи /quotes, различимые по tag:
 *   thought:YYYY-MM-DD — своя мысль за этот день;
 *   saved:YYYY-MM-DD   — сохранённая цитата дня.
 *
 * Здесь только чистые функции разбора/сборки тега — их использует и
 * хранилище (dailyThoughtStorage.js), и экраны, которые обязаны не
 * показывать эти записи как обычные фразы (QuoteView, QuotesManager).
 */

export const THOUGHT_KIND = 'мысль'
export const SAVED_KIND = 'сохранено'

export const THOUGHT_TAG_PREFIX = 'thought:'
export const SAVED_TAG_PREFIX = 'saved:'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function tagFor(prefix, kind, date) {
  return `${prefix}${date}`
}

function thoughtTag(date) {
  return tagFor(THOUGHT_TAG_PREFIX, THOUGHT_KIND, date)
}

function savedTag(date) {
  return tagFor(SAVED_TAG_PREFIX, SAVED_KIND, date)
}

function tagForKind(kind, date) {
  return kind === SAVED_KIND ? savedTag(date) : thoughtTag(date)
}

/**
 * Разбирает tag записи /quotes. Возвращает { kind, date } для наших
 * записей и null для всех остальных (обычные фразы пользователя).
 */
function parseQuoteTag(tag) {
  if (typeof tag !== 'string') return null

  const prefix = tag.startsWith(THOUGHT_TAG_PREFIX)
    ? THOUGHT_TAG_PREFIX
    : tag.startsWith(SAVED_TAG_PREFIX)
      ? SAVED_TAG_PREFIX
      : null
  if (!prefix) return null

  const date = tag.slice(prefix.length)
  if (!DATE_RE.test(date)) return null

  return { kind: prefix === THOUGHT_TAG_PREFIX ? THOUGHT_KIND : SAVED_KIND, date }
}

/**
 * true, если запись /quotes принадлежит «Мысли дня» и не должна
 * попадать в списки обычных фраз.
 */
function isThoughtQuote(quote) {
  return parseQuoteTag(quote?.tag) !== null
}

/**
 * Запись /quotes → элемент «Мысли дня» ({ id, text, kind, date }).
 * Чужие и пустые записи отсеиваются (null).
 */
function toQuoteItem(quote) {
  const parsed = parseQuoteTag(quote?.tag)
  const text = typeof quote?.text === 'string' ? quote.text.trim() : ''
  if (!parsed || !text) return null
  return {
    id: quote.id,
    text,
    kind: parsed.kind,
    date: parsed.date,
    // Время записи: нужно ленте «История», чтобы показать, когда мысль записана.
    createdAt: quote.created_at || quote.createdAt || null,
  }
}

function toQuoteItems(list) {
  if (!Array.isArray(list)) return []
  return list.map(toQuoteItem).filter(Boolean)
}

function sortByDateDesc(items) {
  return [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

export {
  thoughtTag,
  savedTag,
  tagForKind,
  parseQuoteTag,
  isThoughtQuote,
  toQuoteItem,
  toQuoteItems,
  sortByDateDesc,
}
