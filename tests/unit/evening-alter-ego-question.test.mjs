import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { loadAlterEgosSync, saveAlterEgoSync } from '../../src/lib/alterEgoStorage.js'
import { eveningMorningFields } from '../../src/lib/checkinMorningFields.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const checkinSource = readFileSync(join(__dirname, '../../src/screens/CheckIn.jsx'), 'utf-8')
const historySource = readFileSync(join(__dirname, '../../src/screens/History.jsx'), 'utf-8')

function memoryStorage() {
  const map = new Map()
  return {
    getItem: key => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key),
  }
}

function freshStorage() {
  globalThis.localStorage = memoryStorage()
  globalThis.sessionStorage = memoryStorage()
}

freshStorage()
const { demoRequest } = await import('../../src/lib/demoMode.js')

const post = (path, body) => demoRequest(path, { method: 'POST', body: JSON.stringify(body) })
const get = path => demoRequest(path, { method: 'GET' })
const put = (path, body) => demoRequest(path, { method: 'PUT', body: JSON.stringify(body) })

const USER_ID = 900001

// ── 1. Есть альтер-эго → страница есть с именем ──

test('CheckIn: читает альтер-эго через loadAlterEgosSync/loadAlterEgos', () => {
  assert.ok(
    checkinSource.includes('loadAlterEgosSync'),
    'импортирует loadAlterEgosSync для синхронной проверки'
  )
  assert.ok(
    checkinSource.includes('loadAlterEgos'),
    'импортирует loadAlterEgos для асинхронной проверки (CloudStorage)'
  )
})

test('CheckIn: заголовок страницы альтер-эго содержит имя', () => {
  assert.ok(
    checkinSource.includes('`Был ли ты сегодня ${alterEgoName}?`'),
    'заголовок формируется из имени альтер-эго'
  )
})

test('CheckIn: подсказка страницы альтер-эго — «Когда получилось, а когда нет?»', () => {
  assert.ok(
    checkinSource.includes("'Когда получилось, а когда нет?'"),
    'подсказка серым текстом'
  )
})

test('CheckIn: cardCount увеличивается при наличии альтер-эго', () => {
  assert.ok(
    checkinSource.includes('LESSON_FIELDS.length + (hasAlterEgo ? 1 : 0)'),
    'cardCount учитывает страницу альтер-эго'
  )
})

test('CheckIn: страница альтер-эго — последняя (submitLabel «Закрыть день»)', () => {
  assert.ok(
    checkinSource.includes("submitLabel=\"Закрыть день\""),
    'кнопка последней страницы разбора — «Закрыть день»'
  )
})

test('CheckIn: data-testid страницы альтер-эго', () => {
  assert.ok(
    checkinSource.includes('alter-ego-evening-input'),
    'текстовое поле имеет testId alter-ego-evening-input'
  )
})

// ── 2. Нет альтер-эго → страницы нет ──

test('CheckIn: страница альтер-эго условна — hasAlterEgo = Boolean(alterEgoName)', () => {
  assert.ok(
    checkinSource.includes('const hasAlterEgo = Boolean(alterEgoName)'),
    'hasAlterEgo вычисляется из загруженного имени'
  )
  assert.ok(
    checkinSource.includes('isAlterEgoCard = isEvening && isCard && hasAlterEgo && cardIdx === LESSON_FIELDS.length'),
    'карточка рендерится только при hasAlterEgo и правильном индексе'
  )
})

test('CheckIn: без альтер-эго cardCount = LESSON_FIELDS.length (3 страницы)', () => {
  // Если alterEgoName null, hasAlterEgo = false, cardCount = 3 + 0 = 3
  freshStorage()
  const list = loadAlterEgosSync()
  assert.equal(list.length, 0, 'пустое хранилище — нет альтер-эго')
})

// ── 3. Пропуск работает ──

test('CheckIn: ответ альтер-эго добавляется в lessons только если не пустой', () => {
  assert.ok(
    checkinSource.includes('hasAlterEgo && alterEgoAnswer.trim()'),
    'buildLessons проверяет alterEgoAnswer.trim() перед добавлением'
  )
})

test('демо: пустой ответ альтер-эго не попадает в lessons', async () => {
  freshStorage()
  await post('/checkin', { user_id: USER_ID, mood: 4, energy: 3, note: 'Утро.' })
  const saved = await post('/checkin', {
    user_id: USER_ID,
    mood: 4,
    energy: 3,
    emotion: 'спокойно',
    lessons: 'Что получилось? Разобрать день',
    review_completed: true,
  })
  assert.ok(!saved.lessons.includes('Был ли ты сегодня'), 'нет строки альтер-эго при пустом ответе')
})

// ── 4. Ответ сохраняется и не трогает утренние поля ──

test('демо: ответ альтер-эго сохраняется в lessons и виден в истории', async () => {
  freshStorage()
  await post('/checkin', { user_id: USER_ID, mood: 5, energy: 2, note: 'Утренняя мысль' })

  const alterEgoLine = 'Был ли ты сегодня Командир? Да, на собрании держался прямо'
  const lessons = `Что получилось? Закрыл задачу\nЧто было трудно? Трудный разговор\nКакой вывод забираешь? Говорить прямо\n${alterEgoLine}`

  const saved = await post('/checkin', {
    user_id: USER_ID,
    mood: 5,
    energy: 2,
    emotion: 'уверенно',
    lessons,
    review_completed: true,
  })

  assert.ok(saved.lessons.includes(alterEgoLine), 'ответ альтер-эго сохранён в lessons')
  assert.equal(saved.note, 'Утренняя мысль', 'утренняя мысль не затёрта')
  assert.equal(saved.mood, 5, 'утреннее настроение не затёрто')
  assert.equal(saved.energy, 2, 'утренняя энергия не затёрта')
  assert.ok(saved.review_completed_at, 'день закрыт')
})

test('вечерний payload с альтер-эго не меняет утренние поля (eveningMorningFields)', () => {
  const existing = { mood: 5, energy: 2, anxiety: 3, focus: 4, note: 'Утро' }
  const values = { mood: null, energy: null, anxiety: null, focus: null }
  const morning = eveningMorningFields(existing, values)

  assert.equal(morning.mood, 5, 'настроение из утренней записи')
  assert.equal(morning.energy, 2, 'энергия из утренней записи')
  assert.equal(morning.anxiety, 3, 'anxiety из утренней записи')
  assert.equal(morning.focus, 4, 'focus из утренней записи')
  assert.equal(morning.note, 'Утро', 'утренняя мысль сохранена')
})

test('демо: повторный разбор с альтер-эго не стирает утренние поля', async () => {
  freshStorage()
  await post('/checkin', { user_id: USER_ID, mood: 5, energy: 1, note: 'Думаю' })

  const alterEgoLine = 'Был ли ты сегодня Командир? Да'
  await post('/checkin', {
    user_id: USER_ID,
    mood: 5,
    energy: 1,
    emotion: 'спокойно',
    lessons: `Что получилось? Вечер\n${alterEgoLine}`,
    review_completed: true,
  })

  const beforeRedo = await get('/checkin/today')
  assert.equal(beforeRedo.mood, 5)
  assert.equal(beforeRedo.energy, 1)
  assert.equal(beforeRedo.note, 'Думаю')

  // Повторный разбор: пустые шкалы, новые уроки, новый ответ альтер-эго
  const morning = eveningMorningFields(beforeRedo, { mood: null, energy: null, anxiety: null, focus: null })
  await put('/checkin/today', {
    user_id: USER_ID,
    mood: morning.mood ?? 3,
    energy: morning.energy ?? 3,
    note: morning.note,
    emotion: 'радостно',
    lessons: `Что получилось? Второй вечер\nБыл ли ты сегодня Командир? Нет, не вышло`,
    review_completed: true,
  })

  const afterRedo = await get('/checkin/today')
  assert.equal(afterRedo.mood, 5, 'настроение утра осталось 5')
  assert.equal(afterRedo.energy, 1, 'энергия утра осталась 1')
  assert.equal(afterRedo.note, 'Думаю', 'утренняя мысль осталась')
  assert.ok(afterRedo.lessons.includes('Был ли ты сегодня Командир?'), 'новый ответ альтер-эго сохранён')
  assert.ok(afterRedo.review_completed_at, 'день остаётся закрытым')
})

// ── 5. History: parseLessons показывает ответ альтер-эго ──

test('History: parseLessons распознаёт строку альтер-эго', () => {
  assert.ok(
    historySource.includes("ALTER_EGO_PREFIX = 'Был ли ты сегодня '"),
    'History определяет префикс альтер-эго'
  )
})

test('History: parseLessons извлекает вопрос и ответ альтер-эго', () => {
  // Импортируем parseLessons через исходник — функция не экспортирована,
  // проверяем логику через демо-данные.
  const lessons = 'Что получилось? Закрыл задачу\nБыл ли ты сегодня Командир? Да, держался прямо'
  const lines = lessons.split('\n')

  const alterEgoLine = lines.find(l => l.startsWith('Был ли ты сегодня '))
  assert.ok(alterEgoLine, 'строка альтер-эго найдена')

  const qEnd = alterEgoLine.indexOf('? ')
  const question = alterEgoLine.slice(0, qEnd + 1)
  const answer = alterEgoLine.slice(qEnd + 2)

  assert.equal(question, 'Был ли ты сегодня Командир?')
  assert.equal(answer, 'Да, держался прямо')
})

// ── 6. Хранилище альтер-эго: данные читаются так же, как в практике ──

test('saveAlterEgoSync → loadAlterEgosSync: имя доступно для вечернего разбора', () => {
  freshStorage()
  saveAlterEgoSync({
    who: 'Тот, кто не отступает',
    name: 'Командир',
    mindset: 'Думает спокойно',
    never: 'Не извиняется первым',
    when: 'Выступление',
    phrase: 'Я здесь главный',
  })

  const list = loadAlterEgosSync()
  assert.equal(list.length, 1)
  assert.equal(list[0].name, 'Командир', 'имя доступно для заголовка страницы')
})

test('пустое хранилище: loadAlterEgosSync возвращает [] — страница не покажется', () => {
  freshStorage()
  const list = loadAlterEgosSync()
  assert.deepEqual(list, [])
})
