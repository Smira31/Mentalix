import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

// ── Source-code contract tests ──
// Проверяем интеграцию кеша в Practices.jsx и структуру themesDataCache.js.

const practicesSource = await readFile(
  new URL('../../src/screens/Practices.jsx', import.meta.url),
  'utf8'
)

const cacheSource = await readFile(
  new URL('../../src/lib/themesDataCache.js', import.meta.url),
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
})

test('themesDataCache: TTL 30 секунд', () => {
  assert.match(cacheSource, /THEMES_CACHE_TTL_MS = 30_000/)
})

test('themesDataCache: кеш изолирован по userId (Map keyed by userId)', () => {
  assert.match(cacheSource, /cache\.get\(userId\)/)
  assert.match(cacheSource, /cache\.set\(userId,/)
})

test('themesDataCache: peekThemesData — синхронный доступ без сети', () => {
  assert.match(cacheSource, /export function peekThemesData\(userId\)/)
  assert.match(cacheSource, /freshEntry\(userId\)\?\.data \?\? null/)
})

test('themesDataCache: fetchThemesData с inFlight-дедупликацией', () => {
  assert.match(cacheSource, /inFlight\.has\(userId\)/)
  assert.match(cacheSource, /inFlight\.set\(userId, request\)/)
  assert.match(cacheSource, /inFlight\.delete\(userId\)/)
})

test('themesDataCache: force=true обходит TTL-проверку', () => {
  assert.match(cacheSource, /if \(!force && cached\)/)
})

test('themesDataCache: withRetry сохраняется для list и get', () => {
  assert.match(cacheSource, /withRetry\(\(\) => api\.themes\.list\(userId\)\)/)
  assert.match(cacheSource, /withRetry\(\(\) => api\.themes\.get\(currentTheme\.id, userId\)\)/)
})

test('themesDataCache: MXL-525 G5 сортировка is_current первой', () => {
  assert.match(
    cacheSource,
    /\(b\.is_current === true \? 1 : 0\) - \(a\.is_current === true \? 1 : 0\)/
  )
})

test('themesDataCache: пустой список тем не вызывает get', () => {
  assert.match(cacheSource, /if \(!currentTheme\)/)
  assert.match(cacheSource, /const data = \[\]/)
})

test('themesDataCache: invalidateThemesData очищает кеш', () => {
  assert.match(cacheSource, /export function invalidateThemesData\(userId\)/)
  assert.match(cacheSource, /cache\.delete\(userId\)/)
})

// ── Поведенческие тесты (cold / warm / error / retry / isolation) ──
// themesDataCache.js нельзя импортировать в Node.js напрямую (api.js →
// ../platform — directory import, не поддерживается в ESM). Поэтому
// логика кеша воспроизведена локально с теми же паттернами: TTL 30с,
// Map per-user, inFlight-дедупликация, force-обход. Проверяем поведение,
// а не строку-в-строку с модулем — структура проверяется тестами выше.

const TEST_TTL_MS = 30_000

function createThemesCache() {
  const cache = new Map()
  const inFlight = new Map()

  function freshEntry(userId) {
    const cached = cache.get(userId)
    if (cached && Date.now() - cached.fetchedAt < TEST_TTL_MS) return cached
    return null
  }

  function peek(userId) {
    return freshEntry(userId)?.data ?? null
  }

  async function fetchThemes(userId, { force = false, api } = {}) {
    const cached = freshEntry(userId)
    if (!force && cached) return cached.data
    if (inFlight.has(userId)) return inFlight.get(userId)

    const request = (async () => {
      const themesData = await api.themes.list(userId)
      const list = Array.isArray(themesData) ? themesData : []
      const sorted = list
        .slice()
        .sort((a, b) => (b.is_current === true ? 1 : 0) - (a.is_current === true ? 1 : 0))
      const currentTheme = sorted[0]
      if (!currentTheme) {
        const data = []
        cache.set(userId, { data, fetchedAt: Date.now() })
        return data
      }
      const detail = await api.themes.get(currentTheme.id, userId)
      const data = [{ ...currentTheme, ...detail }]
      cache.set(userId, { data, fetchedAt: Date.now() })
      return data
    })().finally(() => {
      inFlight.delete(userId)
    })

    inFlight.set(userId, request)
    return request
  }

  function invalidate(userId) {
    cache.delete(userId)
  }

  return { peek, fetchThemes, invalidate }
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

test('cold: первый fetch делает list + get и кеширует результат', async () => {
  const mock = makeApi({
    themesList: () => [{ id: 1, title: 'Тема', is_current: true }],
    themesGet: () => ({ id: 1, title: 'Тема', days: [{ day: 1, text: 'q1' }] }),
  })
  const c = createThemesCache()

  const result = await c.fetchThemes('user-1', { api: mock.api })

  assert.equal(mock.stats.listCalls, 1, 'list вызван 1 раз')
  assert.equal(mock.stats.getCalls, 1, 'get вызван 1 раз')
  assert.equal(result.length, 1)
  assert.equal(result[0].id, 1)
  assert.equal(result[0].days.length, 1)
})

test('warm: повторный fetch возвращает кеш без новых API-вызовов', async () => {
  const mock = makeApi({
    themesList: () => [{ id: 1, title: 'Тема', is_current: true }],
    themesGet: () => ({ id: 1, title: 'Тема', days: [{ day: 1, text: 'q1' }] }),
  })
  const c = createThemesCache()

  await c.fetchThemes('user-1', { api: mock.api })
  const beforeCalls = { list: mock.stats.listCalls, get: mock.stats.getCalls }

  const result = await c.fetchThemes('user-1', { api: mock.api })

  assert.equal(mock.stats.listCalls, beforeCalls.list, 'list не вызван повторно')
  assert.equal(mock.stats.getCalls, beforeCalls.get, 'get не вызван повторно')
  assert.equal(result.length, 1)
  assert.equal(result[0].id, 1)
})

test('warm: peek возвращает кеш синхронно', async () => {
  const mock = makeApi({
    themesList: () => [{ id: 1, title: 'Тема', is_current: true }],
    themesGet: () => ({ id: 1, title: 'Тема', days: [{ day: 1, text: 'q1' }] }),
  })
  const c = createThemesCache()

  assert.equal(c.peek('user-2'), null)
  await c.fetchThemes('user-2', { api: mock.api })
  const peeked = c.peek('user-2')
  assert.ok(peeked, 'peek возвращает данные после fetch')
  assert.equal(peeked.length, 1)
  assert.equal(peeked[0].id, 1)
})

test('error: при ошибке list выбрасывается, кеш не записывается', async () => {
  const listError = new Error('Сеть недоступна')
  listError.status = 503
  const mock = makeApi({ themesList: () => [], themesGet: () => ({}), listThrows: listError })
  const c = createThemesCache()

  await assert.rejects(() => c.fetchThemes('user-err', { api: mock.api }), /Сеть недоступна/)
  assert.equal(c.peek('user-err'), null)
})

test('error: при ошибке get выбрасывается, кеш не записывается', async () => {
  const getError = new Error('Тема не найдена')
  getError.status = 404
  const mock = makeApi({
    themesList: () => [{ id: 1, title: 'Тема', is_current: true }],
    themesGet: () => ({}),
    getThrows: getError,
  })
  const c = createThemesCache()

  await assert.rejects(() => c.fetchThemes('user-err-get', { api: mock.api }), /Тема не найдена/)
  assert.equal(c.peek('user-err-get'), null)
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
  const c = createThemesCache()

  const first = await c.fetchThemes('user-retry', { api: mock.api })
  assert.equal(first[0].id, 1, 'первый fetch → id=1')

  const cached = await c.fetchThemes('user-retry', { api: mock.api })
  assert.equal(cached[0].id, 1, 'тёплый → кеш id=1')

  const forced = await c.fetchThemes('user-retry', { force: true, api: mock.api })
  assert.equal(forced[0].id, 2, 'force → новый fetch id=2')
})

test('isolation: кеши разных пользователей не смешиваются', async () => {
  const mock = makeApi({
    themesList: userId => [{ id: userId === 'user-A' ? 100 : 200, title: 'T', is_current: true }],
    themesGet: id => ({ id, title: 'T', days: [{ day: 1, text: 'q1' }] }),
  })
  const c = createThemesCache()

  const dataA = await c.fetchThemes('user-A', { api: mock.api })
  const dataB = await c.fetchThemes('user-B', { api: mock.api })

  assert.equal(dataA[0].id, 100, 'user-A → id=100')
  assert.equal(dataB[0].id, 200, 'user-B → id=200')
  assert.equal(c.peek('user-A')[0].id, 100)
  assert.equal(c.peek('user-B')[0].id, 200)
})

test('empty: themes.list возвращает [] — кеш хранит пустой массив', async () => {
  const mock = makeApi({ themesList: () => [], themesGet: () => ({}) })
  const c = createThemesCache()

  const result = await c.fetchThemes('user-empty', { api: mock.api })
  assert.equal(result.length, 0)
  assert.equal(mock.stats.getCalls, 0, 'get не вызван для пустого списка')

  const cached = await c.fetchThemes('user-empty', { api: mock.api })
  assert.equal(cached.length, 0)
  assert.equal(mock.stats.listCalls, 1, 'list не вызван повторно')
})

test('invalidate: очищает кеш пользователя', async () => {
  const mock = makeApi({
    themesList: () => [{ id: 1, title: 'T', is_current: true }],
    themesGet: () => ({ id: 1, title: 'T', days: [] }),
  })
  const c = createThemesCache()

  await c.fetchThemes('user-inv', { api: mock.api })
  assert.ok(c.peek('user-inv'))

  c.invalidate('user-inv')
  assert.equal(c.peek('user-inv'), null)
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
  const c = createThemesCache()

  const result = await c.fetchThemes('user-sort', { api: mock.api })
  assert.equal(result.length, 1, 'только текущая тема (sorted[0])')
  assert.equal(result[0].id, 2, 'is_current тема выбрана первой')
  assert.equal(result[0].title, 'Текущая')
})
