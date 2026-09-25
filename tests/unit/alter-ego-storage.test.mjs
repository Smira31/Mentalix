import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import {
  loadAlterEgosSync,
  saveAlterEgoSync,
  updateAlterEgoSync,
  deleteAlterEgoSync,
} from '../../src/lib/alterEgoStorage.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const alterEgoSource = readFileSync(
  join(__dirname, '../../src/screens/AlterEgo.jsx'),
  'utf-8'
)

function stubLocalStorage() {
  const memory = new Map()
  globalThis.localStorage = {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: key => memory.delete(key),
  }
  return memory
}

/* ── Тесты новой схемы (6 страниц журнала) ── */

test('AlterEgo: 6 страниц в журнале', () => {
  const match = alterEgoSource.match(/const QUESTIONS\s*=\s*\[([\s\S]*?)\]/)
  assert.ok(match, 'массив QUESTIONS найден')
  const items = match[1].split(/^\s*\{/m).filter(Boolean)
  // Каждая запись начинается с { key: ... } — считаем по ключам
  const keys = (match[1].match(/key:\s*'/g) || []).length
  assert.equal(keys, 6, 'ровно 6 вопросов')
})

test('AlterEgo: имя обязательно (canProceed на шаге имени)', () => {
  assert.ok(
    alterEgoSource.includes('draft.name.trim().length > 0'),
    'проверка имени на пустоту'
  )
  assert.ok(
    alterEgoSource.includes('canProceed'),
    'canProceed используется для блокировки Далее'
  )
})

test('AlterEgo: последняя страница — «Сохранить»', () => {
  assert.ok(
    alterEgoSource.includes("'Сохранить'"),
    'submitLabel последней страницы — «Сохранить»'
  )
})

test('AlterEgo: «Надеть маску» показывает ответы (mindset, never, phrase)', () => {
  assert.ok(
    alterEgoSource.includes('data-testid="alter-ego-wear-mindset"'),
    'экран маски показывает «Как держится» (mindset)'
  )
  assert.ok(
    alterEgoSource.includes('data-testid="alter-ego-wear-never"'),
    'экран маски показывает «Чего никогда не делает» (never)'
  )
  assert.ok(
    alterEgoSource.includes('data-testid="alter-ego-wear-phrase"'),
    'экран маски показывает фразу (phrase)'
  )
})

test('AlterEgo: «Переписать» подставляет сохранённые ответы', () => {
  // initialDraft из editingCard содержит все 6 полей
  assert.ok(
    alterEgoSource.includes('editingCard.who'),
    'Переписать подставляет who'
  )
  assert.ok(
    alterEgoSource.includes('editingCard.mindset'),
    'Переписать подставляет mindset'
  )
  assert.ok(
    alterEgoSource.includes('editingCard.phrase'),
    'Переписать подставляет phrase'
  )
  assert.ok(
    alterEgoSource.includes('data-testid="alter-ego-rewrite"') ||
      alterEgoSource.includes('data-testid="alter-ego-rewrite-from-wear"'),
    'кнопка «Переписать» доступна'
  )
})

test('AlterEgo: нет старого 7-шагового потока', () => {
  assert.ok(
    !alterEgoSource.includes('TOTAL_STEPS'),
    'TOTAL_STEPS (7 шагов) удалён'
  )
  assert.ok(
    !alterEgoSource.includes('SITUATION_OPTIONS'),
    'SITUATION_OPTIONS удалён'
  )
  assert.ok(
    !alterEgoSource.includes('QUALITY_CHIPS'),
    'QUALITY_CHIPS удалён'
  )
})

/* ── Тесты хранилища (новые поля) ── */

test('сохранение карточки альтер-эго (новая схема)', () => {
  stubLocalStorage()

  const card = {
    who: 'Тот, кто не отступает',
    name: 'Командир',
    mindset: 'Думает спокойно, держится прямо',
    never: 'Не извиняется первым',
    when: 'Выступление',
    phrase: 'Я здесь главный',
  }

  const saved = saveAlterEgoSync(card)

  assert.ok(saved.id, 'у сохранённой карточки есть id')
  assert.equal(saved.name, 'Командир')
  assert.equal(saved.phrase, 'Я здесь главный')
  assert.equal(saved.mindset, 'Думает спокойно, держится прямо')
  assert.ok(saved.createdAt, 'есть createdAt')
  assert.ok(saved.updatedAt, 'есть updatedAt')
})

test('чтение сохранённых карточек (новая схема)', () => {
  stubLocalStorage()

  saveAlterEgoSync({
    who: '',
    name: 'Огонёк',
    mindset: '',
    never: '',
    when: 'Свидание',
    phrase: 'Мне с собой хорошо',
  })

  const list = loadAlterEgosSync()

  assert.equal(list.length, 1)
  assert.equal(list[0].name, 'Огонёк')
  assert.equal(list[0].phrase, 'Мне с собой хорошо')
})

test('чтение нескольких карточек', () => {
  stubLocalStorage()

  saveAlterEgoSync({ who: '', name: 'А', mindset: '', never: '', when: '', phrase: '' })
  saveAlterEgoSync({ who: '', name: 'Б', mindset: '', never: '', when: '', phrase: '' })

  const list = loadAlterEgosSync()
  assert.equal(list.length, 2)
  // Новая карточка добавляется в начало списка
  assert.equal(list[0].name, 'Б')
  assert.equal(list[1].name, 'А')
})

test('изменение существующей карточки', () => {
  stubLocalStorage()

  const saved = saveAlterEgoSync({
    who: '',
    name: 'Командир',
    mindset: 'Прямая спина',
    never: '',
    when: '',
    phrase: 'Я здесь главный',
  })

  const updated = updateAlterEgoSync(saved.id, {
    name: 'Полководец',
    phrase: 'Я веду за собой',
  })

  assert.ok(updated, 'updateAlterEgoSync вернул обновлённую карточку')
  assert.equal(updated.name, 'Полководец')
  assert.equal(updated.phrase, 'Я веду за собой')
  // Неизменённые поля сохраняются
  assert.equal(updated.mindset, 'Прямая спина')
  assert.ok(updated.updatedAt >= saved.updatedAt, 'updatedAt обновлён')

  // В хранилище — одна карточка с новым именем
  const list = loadAlterEgosSync()
  assert.equal(list.length, 1)
  assert.equal(list[0].name, 'Полководец')
})

test('изменение несуществующей карточки возвращает null', () => {
  stubLocalStorage()

  const result = updateAlterEgoSync('no-such-id', { name: 'X' })
  assert.equal(result, null)
})

test('удаление карточки', () => {
  stubLocalStorage()

  const a = saveAlterEgoSync({ who: '', name: 'А', mindset: '', never: '', when: '', phrase: '' })
  saveAlterEgoSync({ who: '', name: 'Б', mindset: '', never: '', when: '', phrase: '' })

  const remaining = deleteAlterEgoSync(a.id)
  assert.equal(remaining.length, 1)
  assert.equal(remaining[0].name, 'Б')

  const list = loadAlterEgosSync()
  assert.equal(list.length, 1)
})

test('пустое хранилище возвращает пустой массив', () => {
  stubLocalStorage()
  const list = loadAlterEgosSync()
  assert.deepEqual(list, [])
})

test('повреждённые данные не падают — возвращается пустой массив', () => {
  const memory = stubLocalStorage()
  memory.set('mx-alter-egos', 'not-json{')
  const list = loadAlterEgosSync()
  assert.deepEqual(list, [])
})

test('ID уникальны при быстром последовательном сохранении', () => {
  stubLocalStorage()

  const ids = new Set()
  for (let i = 0; i < 50; i++) {
    const saved = saveAlterEgoSync({ who: '', name: `Персона ${i}`, mindset: '', never: '', when: '', phrase: '' })
    ids.add(saved.id)
  }

  assert.equal(ids.size, 50, 'все 50 ID уникальны — нет коллизий')
  const list = loadAlterEgosSync()
  assert.equal(list.length, 50, 'все 50 карточек сохранены')
})
