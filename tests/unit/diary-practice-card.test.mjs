import assert from 'node:assert/strict'
import test from 'node:test'

/*
 * #1095 — карточка «Дневник» в библиотеке «Твои практики».
 *
 * Проверяем, что:
 * 1. «Дневник» присутствует в каталоге практик с правильным sub='journal'.
 * 2. Ключ 'journal' доступен (isPracticeAvailable → true).
 * 3. 'journal' входит в PRACTICE_RAIL_KEYS (виден в «Рекомендуем»).
 * 4. Тап открывает существующий журнал: Practices.jsx рендерит DailyJournalFlow
 *    при sub === 'journal'.
 * 5. Удаление карточки из набора не удаляет записи: API remove работает
 *    только с /pinned-practices, не затрагивая dailyJournal.
 * 6. Повторное добавление не создаёт дубль: togglePinned проверяет pinnedIds.
 * 7. Выбор сохраняется после перезапуска: данные хранятся на сервере
 *    (demo API пишет в state).
 */

import {
  PRACTICE_KEYS,
  AVAILABLE_PRACTICES,
  isPracticeAvailable,
} from '../../src/config/practiceAvailability.js'
import {
  PRACTICE_CATALOG_REGISTRY,
  PRACTICE_RAIL_KEYS,
  buildPracticeViewModels,
} from '../../src/lib/practiceCatalogRegistry.js'

// ── Каталог ──

test('PRACTICE_KEYS содержит journal', () => {
  assert.equal(PRACTICE_KEYS.journal, 'journal')
})

test('AVAILABLE_PRACTICES содержит journal', () => {
  assert.ok(AVAILABLE_PRACTICES.includes('journal'))
})

test('isPracticeAvailable: journal → true', () => {
  assert.equal(isPracticeAvailable('journal'), true)
})

test('PRACTICE_CATALOG_REGISTRY содержит «Дневник» с sub=journal', () => {
  const diary = PRACTICE_CATALOG_REGISTRY.find(p => p.key === 'journal')
  assert.ok(diary, 'карточка «Дневник» есть в каталоге')
  assert.equal(diary.title, 'Дневник')
  assert.equal(diary.sub, 'journal', 'sub указывает на существующий журнал')
  assert.equal(diary.kind, 'journal')
  assert.equal(diary.completionSource, 'none')
})

test('PRACTICE_RAIL_KEYS содержит journal (виден в «Рекомендуем»)', () => {
  assert.ok(PRACTICE_RAIL_KEYS.includes('journal'))
})

test('buildPracticeViewModels: «Дневник» доступен и без прогресса', () => {
  const models = buildPracticeViewModels({})
  const diary = models.find(p => p.key === 'journal')
  assert.ok(diary, 'модель «Дневник» построена')
  assert.equal(diary.available, true)
  assert.equal(diary.soon, false)
  assert.equal(diary.progress, null, 'у дневника нет числового прогресса')
  assert.equal(diary.completedToday, false)
})

// ── Навигация: тап открывает существующий журнал ──

test('Practices.jsx: sub=journal рендерит DailyJournalFlow', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(
    new URL('../../src/screens/Practices.jsx', import.meta.url),
    'utf8'
  )
  // Существующий путь: sub === 'journal' → DailyJournalFlow
  assert.match(
    source,
    /if \(sub === 'journal' && user\)/,
    'журнал открывается через существующий DailyJournalFlow'
  )
  assert.match(
    source,
    /return <DailyJournalFlow userId=\{user\.id\} onClose=\{backToList\} \/>/,
    'рендерится тот же DailyJournalFlow, без второго журнала'
  )
})

test('PinnedPractices.jsx: openPractice передаёт sub (journal)', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(
    new URL('../../src/components/PinnedPractices.jsx', import.meta.url),
    'utf8'
  )
  // Контракт навигации: onOpenPractice вызывается с practice.sub || practice.key
  assert.match(
    source,
    /onOpenPractice\?\.\(practice\.sub \|\| practice\.key\)/,
    'openPractice передаёт sub (для дневника — journal)'
  )
})

// ── Удаление не удаляет записи ──

test('API: pinned remove работает только с /pinned-practices, не затрагивая dailyJournal', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(
    new URL('../../src/lib/api.js', import.meta.url),
    'utf8'
  )
  // remove — это DELETE /pinned-practices/{id}, не имеет отношения к dailyJournal
  const removeBlock = source.match(
    /remove:\s*\(userId,\s*practiceId\)\s*=>\s*request\([\s\S]*?method:\s*'DELETE'[\s\S]*?\)/
  )
  assert.ok(removeBlock, 'pinnedPractices.remove определён')
  assert.match(removeBlock[0], /pinned-practices/, 'remove работает с /pinned-practices')
  assert.doesNotMatch(
    removeBlock[0],
    /daily-journal|dailyJournal/,
    'remove не затрагивает dailyJournal'
  )
})

// ── Повторное добавление не создаёт дубль ──

test('togglePinned: повторный add пропускается, если ключ уже закреплён', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(
    new URL('../../src/components/PinnedPractices.jsx', import.meta.url),
    'utf8'
  )
  // В ветке ADD нет отдельной проверки дубля — она стоит в самом начале:
  // if (pinnedIds.has(key)) → remove, иначе → add.
  // Значит, повторный тап по уже закреплённой практике вызывает remove, не add.
  assert.match(
    source,
    /if \(pinnedIds\.has\(key\)\)/,
    'проверка pinnedIds перед добавлением — повторный тап не создаёт дубль'
  )
})

// ── Выбор сохраняется после перезапуска (demo API пишет в state) ──

test('demo API: pinned practices сохраняются в state (перезапуск)', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(
    new URL('../../src/lib/demoMode.js', import.meta.url),
    'utf8'
  )
  // POST /pinned-practices пишет в state.pinnedPractices
  assert.match(
    source,
    /pathname === '\/pinned-practices' && method === 'POST'/,
    'POST сохраняет закрепление'
  )
  assert.match(
    source,
    /writeState\(\{ \.\.\.state, pinnedPractices \}\)/,
    'состояние записывается — выбор сохраняется после перезапуска'
  )
  // GET читает из state
  assert.match(
    source,
    /pathname === '\/pinned-practices' && method === 'GET'/,
    'GET возвращает сохранённые закрепления'
  )
})
