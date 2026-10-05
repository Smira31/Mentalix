import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * Регрессия: при ошибке первоначальной загрузки списка записей
 * DailyJournalEntries показывал пустое состояние «Здесь будут твои
 * страницы», будто записей нет. Нужно явно показывать ошибку и
 * кнопку «Повторить».
 *
 * Дополнительно: ошибки loadMore и openEntry не должны ломать уже
 * загруженные записи.
 */

const source = await readFile(
  new URL('../../src/screens/DailyJournal/DailyJournalEntries.jsx', import.meta.url),
  'utf8'
)

// ── Первоначальная загрузка ──

test('DailyJournalEntries: есть state loadError для первоначальной загрузки', () => {
  assert.match(source, /const \[loadError, setLoadError\] = useState\(false\)/)
})

test('DailyJournalEntries: при ошибке init вызывается setLoadError(true)', () => {
  // В catch-блоке init должен быть setLoadError(true)
  assert.match(
    source,
    /async function init\(\)[\s\S]*?catch[\s\S]*?setLoadError\(true\)/,
    'init должен выставлять loadError при ошибке'
  )
})

test('DailyJournalEntries: есть data-testid экрана ошибки', () => {
  assert.match(source, /data-testid="dj-entries-load-error"/)
})

test('DailyJournalEntries: есть data-testid кнопки «Повторить»', () => {
  assert.match(source, /data-testid="dj-entries-load-retry"/)
})

test('DailyJournalEntries: экран ошибки имеет role="alert"', () => {
  assert.match(source, /role="alert"[\s\S]*?data-testid="dj-entries-load-error"/)
})

test('DailyJournalEntries: пустое состояние показывается только после успешной загрузки', () => {
  // Условие empty-state должно включать !loadError
  assert.match(
    source,
    /!\s*loading\s*&&\s*!loadError\s*&&\s*entries\.length\s*===\s*0/,
    'empty-state должен проверять !loadError'
  )
})

test('DailyJournalEntries: экран ошибки стоит до пустого состояния в рендере', () => {
  const errorPos = source.indexOf('data-testid="dj-entries-load-error"')
  const emptyPos = source.indexOf('dj-entries-empty')
  assert.ok(errorPos > 0, 'экран ошибки найден')
  assert.ok(emptyPos > 0, 'пустое состояние найдено')
  assert.ok(errorPos < emptyPos, 'экран ошибки должен идти до пустого состояния')
})

test('DailyJournalEntries: кнопка «Повторить» перезапускает начальную загрузку', () => {
  // retry должен менять внутренний ключ, который входит в deps useEffect init
  assert.match(source, /setRetryKey\(k => k \+ 1\)/)
  assert.match(source, /retryKey/)
  // retryKey должен быть в deps эффекта init
  const initEffectMatch = source.match(
    /useEffect\(\(\)\s*=>\s*\{[\s\S]*?async function init[\s\S]*?\}\s*,\s*\[([^\]]+)\]/
  )
  assert.ok(initEffectMatch, 'найден useEffect с init')
  assert.match(initEffectMatch[1], /retryKey/, 'retryKey должен быть в deps эффекта init')
})

test('DailyJournalEntries: при старте init loadError сбрасывается', () => {
  assert.match(
    source,
    /async function init\(\)[\s\S]*?setLoadError\(false\)/,
    'init должен сбрасывать loadError перед загрузкой'
  )
})

// ── loadMore: не ломает загруженные записи ──

test('DailyJournalEntries: loadMore не очищает entries при ошибке', () => {
  const loadMoreMatch = source.match(
    /const loadMore = useCallback\([\s\S]*?\}\s*,\s*\[[^\]]*\]\)/
  )
  assert.ok(loadMoreMatch, 'loadMore найден')
  const body = loadMoreMatch[0]
  // В catch-блоке loadMore не должно быть setEntries([])
  assert.doesNotMatch(body, /setEntries\(\[\]\)/, 'loadMore не должен очищать entries при ошибке')
  // Уже загруженные записи должны сохраняться
  assert.doesNotMatch(body, /setEntries\(res/, 'loadMore не должен заменять entries целиком')
})

test('DailyJournalEntries: loadMore имеет индикацию ошибки для пользователя', () => {
  // При ошибке loadMore должен показывать сообщение и кнопку повтора
  assert.match(source, /loadMoreError/)
  assert.match(source, /data-testid="dj-entries-load-more-error"/)
  assert.match(source, /data-testid="dj-entries-load-more-retry"/)
})

// ── openEntry: не ломает уже загруженные записи ──

test('DailyJournalEntries: openEntry при ошибке getEntry показывает сообщение, не ломая список', () => {
  // Должен быть state entryError
  assert.match(source, /entryError/)
  // При ошибке getEntry должен устанавливаться entryError
  assert.match(source, /setEntryError\(/)
  // В catch getEntry должен вызываться setEntryError
  assert.match(
    source,
    /api\.dailyJournal\.getEntry\([\s\S]*?\.catch\([\s\S]*?setEntryError/,
    'catch getEntry должен вызывать setEntryError'
  )
})

test('DailyJournalEntries: openEntry сбрасывает entryError при открытии новой записи', () => {
  // При вызове openEntry entryError должен сбрасываться
  const openEntryMatch = source.match(/function openEntry\([\s\S]*?\}\n  \}/)
  assert.ok(openEntryMatch, 'openEntry найден')
  assert.match(openEntryMatch[0], /setEntryError\(''\)/, 'openEntry должен сбрасывать entryError')
})
