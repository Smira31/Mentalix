import test from 'node:test'
import assert from 'node:assert/strict'

import {
  loadAlterEgosSync,
  saveAlterEgoSync,
  updateAlterEgoSync,
  deleteAlterEgoSync,
} from '../../src/lib/alterEgoStorage.js'

function stubLocalStorage() {
  const memory = new Map()
  globalThis.localStorage = {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: key => memory.delete(key),
  }
  return memory
}

test('сохранение карточки альтер-эго', () => {
  stubLocalStorage()

  const card = {
    name: 'Командир',
    situation: 'Выступление',
    qualities: ['уверенный', 'собранный', 'точный'],
    posture: 'Прямая спина, спокойный взгляд',
    anchor: 'Я здесь главный',
  }

  const saved = saveAlterEgoSync(card)

  assert.ok(saved.id, 'у сохранённой карточки есть id')
  assert.equal(saved.name, 'Командир')
  assert.equal(saved.situation, 'Выступление')
  assert.deepEqual(saved.qualities, ['уверенный', 'собранный', 'точный'])
  assert.ok(saved.createdAt, 'есть createdAt')
  assert.ok(saved.updatedAt, 'есть updatedAt')
})

test('чтение сохранённых карточек', () => {
  stubLocalStorage()

  saveAlterEgoSync({
    name: 'Огонёк',
    situation: 'Свидание',
    qualities: ['тёплый', 'спокойный', 'щедрый'],
    posture: 'Расслабленные плечи',
    anchor: 'Мне с собой хорошо',
  })

  const list = loadAlterEgosSync()

  assert.equal(list.length, 1)
  assert.equal(list[0].name, 'Огонёк')
  assert.equal(list[0].anchor, 'Мне с собой хорошо')
})

test('чтение нескольких карточек', () => {
  stubLocalStorage()

  saveAlterEgoSync({ name: 'А', situation: 'Выступление', qualities: [], posture: '', anchor: '' })
  saveAlterEgoSync({ name: 'Б', situation: 'Свидание', qualities: [], posture: '', anchor: '' })

  const list = loadAlterEgosSync()
  assert.equal(list.length, 2)
  // Новая карточка добавляется в начало списка
  assert.equal(list[0].name, 'Б')
  assert.equal(list[1].name, 'А')
})

test('изменение существующей карточки', () => {
  stubLocalStorage()

  const saved = saveAlterEgoSync({
    name: 'Командир',
    situation: 'Выступление',
    qualities: ['уверенный', 'собранный', 'точный'],
    posture: 'Прямая спина',
    anchor: 'Я здесь главный',
  })

  const updated = updateAlterEgoSync(saved.id, {
    name: 'Полководец',
    anchor: 'Я веду за собой',
  })

  assert.ok(updated, 'updateAlterEgoSync вернул обновлённую карточку')
  assert.equal(updated.name, 'Полководец')
  assert.equal(updated.anchor, 'Я веду за собой')
  // Неизменённые поля сохраняются
  assert.equal(updated.situation, 'Выступление')
  assert.deepEqual(updated.qualities, ['уверенный', 'собранный', 'точный'])
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

  const a = saveAlterEgoSync({ name: 'А', situation: 'X', qualities: [], posture: '', anchor: '' })
  saveAlterEgoSync({ name: 'Б', situation: 'Y', qualities: [], posture: '', anchor: '' })

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
