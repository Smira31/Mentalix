import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

// Импортируем модуль кеша напрямую для поведенческих тестов.
// Подменяем api и withRetry через динамический импорт после настройки окружения.

const practicesSource = await readFile(
  new URL('../../src/screens/Practices.jsx', import.meta.url),
  'utf8'
)

test('Practices использует кеш тем: peekThemesData для синхронной инициализации', () => {
  assert.match(practicesSource, /peekThemesData\(user\.id\)/)
  assert.match(practicesSource, /useState\(initialThemesData \?\? \[\]\)/)
  assert.match(practicesSource, /useState\(!initialThemesData\)/)
})

test('Practices loadThemes делегирует fetchThemesData вместо прямых api-вызовов', () => {
  assert.match(practicesSource, /fetchThemesData\(user\.id, \{ force \}\)/)
  assert.doesNotMatch(practicesSource, /api\.themes\.list\(user\.id\)/)
  assert.doesNotMatch(practicesSource, /api\.themes\.get\(currentTheme\.id/)
})

test('Practices retry-кнопка обходит кеш (force: true)', () => {
  assert.match(practicesSource, /loadThemes\(\{ force: true \}\)/)
})

test('Practices themes-эффект не фетчит при тёплом кеше (initialThemesData guard)', () => {
  assert.match(
    practicesSource,
    /if \(!user \|\| sub !== null \|\| initialThemesData\) return/
  )
})

test('Practices сохраняет error-state и retry для тем', () => {
  assert.match(practicesSource, /setThemesError\(true\)/)
  assert.match(practicesSource, /onRetryThemes=\{(\(\) => loadThemes\(\{ force: true \}\)|loadThemes)\}/)
})

// ——— Поведенческие тесты кеша (cold / warm / error / retry) ———

async function loadCacheModule({ apiImpl, retryDelays }) {
  // Подменяем api и todayRetry через моки перед динамическим импортом.
  const apiModule = await import('../../src/lib/api.js')
  const retryModule = await import('../../src/lib/todayRetry.js')

  // Сохраняем оригиналы.
  const origApi = apiModule.api
  const origRetry = retryModule.withRetry

  // Подменяем.
  apiModule.api = apiImpl
  retryModule.withRetry = async fn => {
    // В тестах retry работает без задержек.
    return fn()
  }

  // Динамически импортируем модуль кеша (fresh module instance).
  // Используем query-суффикс для bypass кеша импортов.
  const cacheModule = await import(`../../src/lib/themesDataCache.js?t=${Date.now()}`)

  return {
    module: cacheModule,
    restore: () => {
      apiModule.api = origApi
      retryModule.withRetry = origRetry
    },
  }
}

function makeApi({ themesList, themesGet, listThrows, getThrows }) {
  let listCalls = 0
  let getCalls = 0

  return {
    api: {
      themes: {
        list: async userId => {
          listCalls += 1
          if (listThrows) throw listThrows
          return themesList(userId)
        },
        get: async (themeId, userId) => {
          getCalls += 1
          if (getThrows) throw getThrows
          return themesGet(themeId, userId)
        },
      },
    },
    stats: {
      get listCalls() {
        return listCalls
      },
      get getCalls() {
        return getCalls
      },
    },
  }
}

test('cold: первый fetchThemesData делает list + get и кеширует результат', async () => {
  const mock = makeApi({
    themesList: () => [{ id: 1, title: 'Тема', is_current: true }],
    themesGet: () => ({ id: 1, title: 'Тема', days: [{ day: 1, text: 'q1' }] }),
  })

  const { module, restore } = await loadCacheModule({ apiImpl: mock.api })
  try {
    const result = await module.fetchThemesData('user-1')

    assert.equal(mock.stats.listCalls, 1, 'list вызван 1 раз')
    assert.equal(mock.stats.getCalls, 1, 'get вызван 1 раз')
    assert.equal(result.length, 1)
    assert.equal(result[0].id, 1)
    assert.equal(result[0].days.length, 1)
  } finally {
    restore()
  }
})

test('warm: повторный fetchThemesData возвращает кеш без новых API-вызовов', async () => {
  const mock = makeApi({
    themesList: () => [{ id: 1, title: 'Тема', is_current: true }],
    themesGet: () => ({ id: 1, title: 'Тема', days: [{ day: 1, text: 'q1' }] }),
  })

  const { module, restore } = await loadCacheModule({ apiImpl: mock.api })
  try {
    await module.fetchThemesData('user-1')
    const beforeCalls = { list: mock.stats.listCalls, get: mock.stats.getCalls }

    const result = await module.fetchThemesData('user-1')

    assert.equal(mock.stats.listCalls, beforeCalls.list, 'list не вызван повторно')
    assert.equal(mock.stats.getCalls, beforeCalls.get, 'get не вызван повторно')
    assert.equal(result.length, 1)
    assert.equal(result[0].id, 1)
  } finally {
    restore()
  }
})

test('warm: peekThemesData возвращает кеш синхронно', async () => {
  const mock = makeApi({
    themesList: () => [{ id: 1, title: 'Тема', is_current: true }],
    themesGet: () => ({ id: 1, title: 'Тема', days: [{ day: 1, text: 'q1' }] }),
  })

  const { module, restore } = await loadCacheModule({ apiImpl: mock.api })
  try {
    // До fetch — null.
    assert.equal(module.peekThemesData('user-2'), null)

    await module.fetchThemesData('user-2')

    // После fetch — синхронный доступ.
    const peeked = module.peekThemesData('user-2')
    assert.ok(peeked, 'peek возвращает данные после fetch')
    assert.equal(peeked.length, 1)
    assert.equal(peeked[0].id, 1)
  } finally {
    restore()
  }
})

test('error: при ошибке list выбрасывается, кеш не записывается', async () => {
  const listError = new Error('Сеть недоступна')
  listError.status = 503

  const mock = makeApi({
    themesList: () => [],
    themesGet: () => ({}),
    listThrows: listError,
  })

  const { module, restore } = await loadCacheModule({ apiImpl: mock.api })
  try {
    await assert.rejects(
      () => module.fetchThemesData('user-err'),
      /Сеть недоступна/
    )

    // Кеш не записан — peek возвращает null.
    assert.equal(module.peekThemesData('user-err'), null)
  } finally {
    restore()
  }
})

test('error: при ошибке get выбрасывается, кеш не записывается', async () => {
  const getError = new Error('Тема не найдена')
  getError.status = 404

  const mock = makeApi({
    themesList: () => [{ id: 1, title: 'Тема', is_current: true }],
    themesGet: () => ({}),
    getThrows: getError,
  })

  const { module, restore } = await loadCacheModule({ apiImpl: mock.api })
  try {
    await assert.rejects(
      () => module.fetchThemesData('user-err-get'),
      /Тема не найдена/
    )

    assert.equal(module.peekThemesData('user-err-get'), null)
  } finally {
    restore()
  }
})

test('retry: force=true обходит кеш и делает новый запрос', async () => {
  let counter = 0
  const mock = makeApi({
    themesList: () => {
      counter += 1
      return [{ id: counter, title: `Тема ${counter}`, is_current: true }]
    },
    themesGet: id => ({ id, title: `Тема ${id}`, days: [{ day: 1, text: 'q1' }] }),
  })

  const { module, restore } = await loadCacheModule({ apiImpl: mock.api })
  try {
    const first = await module.fetchThemesData('user-retry')
    assert.equal(first[0].id, 1, 'первый fetch → id=1')

    // Тёплый — кеш.
    const cached = await module.fetchThemesData('user-retry')
    assert.equal(cached[0].id, 1, 'тёплый → кеш id=1')

    // Force — новый запрос.
    const forced = await module.fetchThemesData('user-retry', { force: true })
    assert.equal(forced[0].id, 2, 'force → новый fetch id=2')
  } finally {
    restore()
  }
})

test('isolation: кеши разных пользователей не смешиваются', async () => {
  const mock = makeApi({
    themesList: userId => [{ id: userId === 'user-A' ? 100 : 200, title: 'T', is_current: true }],
    themesGet: id => ({ id, title: 'T', days: [{ day: 1, text: 'q1' }] }),
  })

  const { module, restore } = await loadCacheModule({ apiImpl: mock.api })
  try {
    const dataA = await module.fetchThemesData('user-A')
    const dataB = await module.fetchThemesData('user-B')

    assert.equal(dataA[0].id, 100, 'user-A → id=100')
    assert.equal(dataB[0].id, 200, 'user-B → id=200')

    // Peek не путает пользователей.
    assert.equal(module.peekThemesData('user-A')[0].id, 100)
    assert.equal(module.peekThemesData('user-B')[0].id, 200)
  } finally {
    restore()
  }
})

test('empty: themes.list возвращает [] — кеш хранит пустой массив', async () => {
  const mock = makeApi({
    themesList: () => [],
    themesGet: () => ({}),
  })

  const { module, restore } = await loadCacheModule({ apiImpl: mock.api })
  try {
    const result = await module.fetchThemesData('user-empty')
    assert.equal(result.length, 0)
    assert.equal(mock.stats.getCalls, 0, 'get не вызван для пустого списка')

    // Тёплый — кеш пустого массива.
    const cached = await module.fetchThemesData('user-empty')
    assert.equal(cached.length, 0)
    assert.equal(mock.stats.listCalls, 1, 'list не вызван повторно')
  } finally {
    restore()
  }
})

test('invalidate: invalidateThemesData очищает кеш пользователя', async () => {
  const mock = makeApi({
    themesList: () => [{ id: 1, title: 'T', is_current: true }],
    themesGet: () => ({ id: 1, title: 'T', days: [] }),
  })

  const { module, restore } = await loadCacheModule({ apiImpl: mock.api })
  try {
    await module.fetchThemesData('user-inv')
    assert.ok(module.peekThemesData('user-inv'))

    module.invalidateThemesData('user-inv')
    assert.equal(module.peekThemesData('user-inv'), null)
  } finally {
    restore()
  }
})

test('MXL-525 G5: is_current тема идёт первой в отсортированном результате', async () => {
  const mock = makeApi({
    themesList: () => [
      { id: 1, title: 'Старая', is_current: false },
      { id: 2, title: 'Текущая', is_current: true },
      { id: 3, title: 'Будущая', is_current: false },
    ],
    themesGet: id => {
      const t = { 1: { days: [] }, 2: { days: [{ day: 1, text: 'q' }] }, 3: { days: [] } }
      return t[id] || { days: [] }
    },
  })

  const { module, restore } = await loadCacheModule({ apiImpl: mock.api })
  try {
    const result = await module.fetchThemesData('user-sort')
    assert.equal(result.length, 1, 'только текущая тема (sorted[0])')
    assert.equal(result[0].id, 2, 'is_current тема выбрана первой')
    assert.equal(result[0].title, 'Текущая')
  } finally {
    restore()
  }
})
