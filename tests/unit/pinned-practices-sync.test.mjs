import assert from 'node:assert/strict'
import test from 'node:test'

/*
 * Unit-тесты логики add/remove закреплённых практик (R1).
 *
 * PinnedPractices.jsx — React-компонент, его нельзя импортировать в Node
 * напрямую (зависимости от react, react-dom, platform). Поэтому проверяем
 * поведение через воспроизведение паттернов: оптимистичное обновление,
 * per-practice блокировка, откат при ошибке, синхронизация с кешем.
 *
 * Источник: src/components/PinnedPractices.jsx (togglePinned, undoRemove),
 *           src/lib/pinnedPracticesDataCache.js (invalidatePinnedPractices).
 */

// ── Воспроизведение логики togglePinned ──
//
// Тестируем контракт:
// 1. add: оптимистично добавляет → API → успех: заменяет temp / ошибка: откат
// 2. remove: оптимистично удаляет → API немедленно (не отложено) → успех: undo toast / ошибка: откат
// 3. per-practice busy: повторный тап по той же практике во время запроса игнорируется
// 4. разные практики доступны во время запроса (нет глобального lock)
// 5. undo: повторное добавление через API

function createPinnedStore({ initialPinned = [], api }) {
  let pinned = [...initialPinned]
  let undo = null
  let undoTimer = null
  let error = false
  const busyKeys = new Set()
  let invalidateCalls = 0

  function pinnedIds() {
    return new Set(pinned.map(item => item.practice_id))
  }

  function invalidate() {
    invalidateCalls += 1
  }

  async function togglePinned(practice) {
    const key = practice.key

    if (busyKeys.has(key)) return { ignored: true }

    if (pinnedIds().has(key)) {
      // ── REMOVE ──
      if (undoTimer) {
        clearTimeout(undoTimer)
        undoTimer = null
      }
      const item = pinned.find(i => i.practice_id === key)
      const index = pinned.findIndex(i => i.practice_id === key)

      pinned = pinned.filter(i => i.practice_id !== key)
      busyKeys.add(key)

      try {
        await api.pinnedPractices.remove('user-1', key)
        invalidate()
        undo = { item, index }
        undoTimer = setTimeout(() => {
          undo = null
          undoTimer = null
        }, 4000)
      } catch {
        // Rollback
        const next = [...pinned]
        next.splice(index, 0, item)
        pinned = next
        error = true
      } finally {
        busyKeys.delete(key)
      }
      return { action: 'remove', key }
    }

    // ── ADD ──
    if (undoTimer) {
      clearTimeout(undoTimer)
      undoTimer = null
      undo = null
    }

    const tempItem = { practice_id: key, _pending: true }
    pinned = [...pinned, tempItem]
    busyKeys.add(key)
    error = false

    try {
      const added = await api.pinnedPractices.add('user-1', key)
      pinned = pinned.map(i => (i._pending && i.practice_id === key ? added : i))
      invalidate()
    } catch {
      pinned = pinned.filter(i => !(i._pending && i.practice_id === key))
      error = true
    } finally {
      busyKeys.delete(key)
    }
    return { action: 'add', key }
  }

  async function undoRemove() {
    if (!undo) return
    if (undoTimer) {
      clearTimeout(undoTimer)
      undoTimer = null
    }
    const { item, index } = undo
    undo = null

    const next = [...pinned]
    next.splice(index, 0, item)
    pinned = next

    try {
      await api.pinnedPractices.add('user-1', item.practice_id)
      invalidate()
    } catch {
      pinned = pinned.filter(i => i.practice_id !== item.practice_id)
      error = true
    }
  }

  return {
    togglePinned,
    undoRemove,
    getState: () => ({
      pinned: [...pinned],
      undo,
      error,
      busyKeys: new Set(busyKeys),
      invalidateCalls,
    }),
  }
}

function makeApi({ addResult, removeResult, addThrows, removeThrows, delay = 0 }) {
  let addCalls = 0
  let removeCalls = 0

  return {
    api: {
      pinnedPractices: {
        add: async (userId, practiceId) => {
          addCalls += 1
          if (delay) await new Promise(r => setTimeout(r, delay))
          if (addThrows) throw addThrows
          return addResult || { id: Date.now(), practice_id: practiceId }
        },
        remove: async (userId, practiceId) => {
          removeCalls += 1
          if (delay) await new Promise(r => setTimeout(r, delay))
          if (removeThrows) throw removeThrows
          return removeResult || { ok: true }
        },
      },
    },
    stats: {
      get addCalls() {
        return addCalls
      },
      get removeCalls() {
        return removeCalls
      },
    },
  }
}

// ── Тесты: добавление ──

test('add: оптимистичное добавление срабатывает сразу', async () => {
  const mock = makeApi({})
  const store = createPinnedStore({ initialPinned: [], api: mock.api })

  await store.togglePinned({ key: 'rituals' })

  const state = store.getState()
  assert.equal(state.pinned.length, 1, 'практика добавлена')
  assert.equal(state.pinned[0].practice_id, 'rituals')
  assert.equal(state.pinned[0]._pending, undefined, 'temp-маркер заменён реальным элементом')
  assert.equal(mock.stats.addCalls, 1, 'API add вызван 1 раз')
  assert.equal(state.invalidateCalls, 1, 'кеш инвалидирован')
  assert.equal(state.error, false, 'нет ошибки')
})

test('add: при ошибке сервера — откат и флаг ошибки', async () => {
  const serverError = new Error('Сервер недоступен: 503')
  serverError.status = 503
  const mock = makeApi({ addThrows: serverError })
  const store = createPinnedStore({ initialPinned: [], api: mock.api })

  await store.togglePinned({ key: 'rituals' })

  const state = store.getState()
  assert.equal(state.pinned.length, 0, 'практика удалена после отката')
  assert.equal(state.error, true, 'флаг ошибки установлен')
  assert.equal(mock.stats.addCalls, 1, 'API add вызван 1 раз')
})

// ── Тесты: удаление ──

test('remove: API вызывается немедленно, не отложено на 4с', async () => {
  const mock = makeApi({})
  const store = createPinnedStore({
    initialPinned: [{ practice_id: 'rituals' }],
    api: mock.api,
  })

  await store.togglePinned({ key: 'rituals' })

  const state = store.getState()
  assert.equal(state.pinned.length, 0, 'практика удалена из списка')
  assert.equal(mock.stats.removeCalls, 1, 'API remove вызван немедленно')
  assert.equal(state.invalidateCalls, 1, 'кеш инвалидирован')
  assert.ok(state.undo, 'undo toast показан')
})

test('remove: при ошибке сервера — откат и флаг ошибки', async () => {
  const serverError = new Error('Сервер недоступен: 500')
  serverError.status = 500
  const mock = makeApi({ removeThrows: serverError })
  const store = createPinnedStore({
    initialPinned: [{ practice_id: 'rituals' }],
    api: mock.api,
  })

  await store.togglePinned({ key: 'rituals' })

  const state = store.getState()
  assert.equal(state.pinned.length, 1, 'практика возвращена после отката')
  assert.equal(state.pinned[0].practice_id, 'rituals')
  assert.equal(state.error, true, 'флаг ошибки установлен')
  assert.equal(state.undo, null, 'undo toast не показан при ошибке')
})

// ── Тесты: повторный тап (гонки) ──

test('двойной тап add: второй тап по той же практике игнорируется во время запроса', async () => {
  const mock = makeApi({ delay: 50 })
  const store = createPinnedStore({ initialPinned: [], api: mock.api })

  // Первый тап — запускает запрос
  const promise1 = store.togglePinned({ key: 'rituals' })
  // Второй тап немедленно — пока запрос в полёте
  const result2 = await store.togglePinned({ key: 'rituals' })

  await promise1

  assert.equal(result2.ignored, true, 'второй тап проигнорирован')
  assert.equal(mock.stats.addCalls, 1, 'API add вызван только 1 раз')
  const state = store.getState()
  assert.equal(state.pinned.length, 1, 'только один элемент добавлен')
})

test('разные практики доступны во время запроса (нет глобального lock)', async () => {
  const mock = makeApi({ delay: 50 })
  const store = createPinnedStore({ initialPinned: [], api: mock.api })

  // Тап по первой практике — запускает запрос
  const promise1 = store.togglePinned({ key: 'rituals' })
  // Тап по второй практике немедленно — не должен блокироваться
  const result2 = await store.togglePinned({ key: 'ascezas' })

  await promise1

  assert.equal(result2.ignored, undefined, 'второй тап по другой практике не игнорирован')
  assert.equal(result2.action, 'add', 'добавление второй практики выполнено')
  assert.equal(mock.stats.addCalls, 2, 'API add вызван 2 раза')
  const state = store.getState()
  assert.equal(state.pinned.length, 2, 'обе практики добавлены')
})

test('двойной тап remove: второй тап по той же практике игнорируется', async () => {
  const mock = makeApi({ delay: 50 })
  const store = createPinnedStore({
    initialPinned: [{ practice_id: 'rituals' }],
    api: mock.api,
  })

  const promise1 = store.togglePinned({ key: 'rituals' })
  const result2 = await store.togglePinned({ key: 'rituals' })

  await promise1

  assert.equal(result2.ignored, true, 'второй тап remove проигнорирован')
  assert.equal(mock.stats.removeCalls, 1, 'API remove вызван только 1 раз')
})

// ── Тесты: undo ──

test('undo: повторное добавление вызывает API add', async () => {
  const mock = makeApi({})
  const store = createPinnedStore({
    initialPinned: [{ practice_id: 'rituals' }],
    api: mock.api,
  })

  await store.togglePinned({ key: 'rituals' })
  assert.equal(mock.stats.removeCalls, 1, 'remove выполнен')

  await store.undoRemove()

  const state = store.getState()
  assert.equal(state.pinned.length, 1, 'практика возвращена')
  assert.equal(state.pinned[0].practice_id, 'rituals')
  assert.equal(mock.stats.addCalls, 1, 'API add вызван для undo')
  assert.equal(state.invalidateCalls, 2, 'кеш инвалидирован дважды')
})

test('undo при ошибке сервера: откат undo (практика снова удаляется)', async () => {
  const mock = makeApi({})
  // undo вызывает add — делаем его падающим
  mock.api.pinnedPractices.add = async () => {
    throw new Error('Сервер недоступен: 503')
  }
  const store = createPinnedStore({
    initialPinned: [{ practice_id: 'rituals' }],
    api: mock.api,
  })

  await store.togglePinned({ key: 'rituals' })
  await store.undoRemove()

  const state = store.getState()
  assert.equal(state.pinned.length, 0, 'практика удалена после неудачного undo')
  assert.equal(state.error, true, 'флаг ошибки установлен')
})

// ── Тесты: синхронизация с кешем ──

test('invalidatePinnedPractices: после add/remove кеш инвалидирован', async () => {
  const mock = makeApi({})
  const store = createPinnedStore({ initialPinned: [], api: mock.api })

  await store.togglePinned({ key: 'rituals' })
  assert.equal(store.getState().invalidateCalls, 1, 'invalidate после add')

  await store.togglePinned({ key: 'rituals' })
  assert.equal(store.getState().invalidateCalls, 2, 'invalidate после remove')
})

test('invalidatePinnedPractices: cache.delete вместо fetchedAt=0', async () => {
  // Проверяем контракт invalidatePinnedPractices — должен удалять запись,
  // а не помечать устаревшей (peekPinnedPractices возвращает null после invalidation).
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(
    new URL('../../src/lib/pinnedPracticesDataCache.js', import.meta.url),
    'utf8'
  )

  assert.match(source, /export function invalidatePinnedPractices\(userId\)/)
  assert.match(source, /cache\.delete\(userId\)/, 'invalidate должен вызывать cache.delete')
  assert.doesNotMatch(
    source,
    /entry\.fetchedAt = 0/,
    'invalidate не должен ставить fetchedAt=0 (peek вернёт устаревшие данные)'
  )
})

// ── Тесты: demo action ──

test('demoMode: previewPinnedPracticesAction экспортирован', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(
    new URL('../../src/lib/demoMode.js', import.meta.url),
    'utf8'
  )

  assert.match(source, /export function previewPinnedPracticesAction/, 'функция экспортирована')
  assert.match(source, /DEMO_PINNED_PRACTICES_ACTION/, 'константа действия определена')
  assert.match(
    source,
    /practices_manage/,
    'action=practices_manage открывает шторку'
  )
})

test('PinnedPractices: initialSheet prop принят', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(
    new URL('../../src/components/PinnedPractices.jsx', import.meta.url),
    'utf8'
  )

  assert.match(source, /initialSheet = null/, 'prop initialSheet объявлен с default null')
  assert.match(source, /useState\(initialSheet\)/, 'sheet инициализируется из initialSheet')
})

test('PinnedPractices: per-practice busyKeys вместо глобального busyId', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(
    new URL('../../src/components/PinnedPractices.jsx', import.meta.url),
    'utf8'
  )

  assert.match(source, /busyKeys/, 'используется busyKeys (Set)')
  assert.doesNotMatch(
    source,
    /useState\(null\).*\n.*busyId/,
    'глобальный busyId не должен использоваться'
  )
  assert.match(source, /if \(busyKeys\.has\(key\)\) return/, 'per-practice guard')
})

test('PinnedPractices: remove вызывает API немедленно (не через setTimeout)', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(
    new URL('../../src/components/PinnedPractices.jsx', import.meta.url),
    'utf8'
  )

  // API remove должен быть в try-блоке, не внутри setTimeout
  assert.match(
    source,
    /await api\.pinnedPractices\.remove\(user\.id, key\)/,
    'remove вызывается через await (немедленно)'
  )
  // setTimeout должен только скрывать undo toast, не вызывать API
  assert.doesNotMatch(
    source,
    /setTimeout.*api\.pinnedPractices\.remove/,
    'API remove не должен быть внутри setTimeout'
  )
})

test('PinnedPractices: undo вызывает API add для повторного добавления', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(
    new URL('../../src/components/PinnedPractices.jsx', import.meta.url),
    'utf8'
  )

  assert.match(
    source,
    /async function undoRemove/,
    'undoRemove — async функция'
  )
  assert.match(
    source,
    /await api\.pinnedPractices\.add\(user\.id, item\.practice_id\)/,
    'undo вызывает API add'
  )
})
