import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

/*
 * AUD-012: гостевой путь вокруг закреплённых практик.
 *
 * PinnedPractices.jsx — React-компонент, его нельзя импортировать в Node
 * напрямую (react, react-dom, portal, platform), поэтому проверяем тремя
 * слоями, как в tests/unit/pinned-practices-sync.test.mjs:
 *   1) реальный guard hasCanonicalUserId из src/lib/guestAuth.js;
 *   2) загрузчик, воспроизводящий контракт useEffect и retryPinned;
 *   3) контракт исходника — те же решения найдены в PinnedPractices.jsx.
 *
 * Отрицательный гостевой id не является canonical users row: запрос
 * /pinned-practices с ним отвечает HTTP 500 (AUD-001).
 *
 * Источник: src/components/PinnedPractices.jsx (useEffect, retryPinned,
 *           ветки разметки), src/components/StepsExplore.jsx (handlePin),
 *           src/lib/guestAuth.js (hasCanonicalUserId).
 */

const guestAuthSource = await readFile(
  new URL('../../src/lib/guestAuth.js', import.meta.url),
  'utf8'
)
const pinnedSource = await readFile(
  new URL('../../src/components/PinnedPractices.jsx', import.meta.url),
  'utf8'
)
const stepsSource = await readFile(
  new URL('../../src/components/StepsExplore.jsx', import.meta.url),
  'utf8'
)

// guestAuth.js импортирует ../platform — в Node подменяем его (как в
// tests/unit/guest-auth-hostname.test.mjs), чтобы импортировать реальный guard.
const moduleSource = `
const platform = globalThis.__testPlatform
${guestAuthSource.replace("import { platform } from '../platform'", '')}
`
globalThis.__testPlatform = { setUser: () => {}, clearUser: () => {} }
const { hasCanonicalUserId } = await import(
  `data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`
)

/*
 * Воспроизведение загрузки списка из PinnedPractices.jsx:
 * useEffect (guard → запрос → loading/error) и retryPinned
 * (сброс ошибки, скелетон, новый retryKey → повторный запрос).
 *
 * kind — ветка разметки: 'loading' | 'error' | 'empty' | 'rail'.
 */
function createPinnedLoader({ user, api }) {
  const canQueryPinned = hasCanonicalUserId(user)
  let loading = true
  let error = false
  let pinned = []
  let retryKey = 0
  let kind = 'loading'

  function renderKind() {
    if (loading) return 'loading'
    if (error && pinned.length === 0) return 'error'
    if (pinned.length === 0) return 'empty'
    return 'rail'
  }

  async function load() {
    if (!canQueryPinned) {
      // Гость: запрос не отправляем, показываем пустое состояние, не ошибку.
      loading = false
      kind = renderKind()
      return
    }
    try {
      pinned = await api.pinnedPractices.list(user.id)
      error = false
    } catch {
      error = true
    } finally {
      loading = false
    }
    kind = renderKind()
  }

  async function retryPinned() {
    loading = true
    error = false
    retryKey += 1
    await load()
  }

  return {
    load,
    retryPinned,
    getState: () => ({
      kind,
      loading,
      error,
      retryKey,
      canQueryPinned,
      pinned: [...pinned],
    }),
  }
}

function makeApi({ items = [], fail = false } = {}) {
  let calls = 0
  let shouldFail = fail
  return {
    api: {
      pinnedPractices: {
        list: async () => {
          calls += 1
          if (shouldFail) throw new Error('Сервер недоступен: 500')
          return items
        },
      },
    },
    stats: {
      get calls() {
        return calls
      },
      stopFailing() {
        shouldFail = false
      },
    },
  }
}

// ── Тесты: гость с отрицательным id ──

test('гость с отрицательным id: API закреплённых практик не вызывается, показано пустое состояние', async () => {
  const mock = makeApi({ items: [{ practice_id: 'rituals' }] })
  const loader = createPinnedLoader({ user: { id: -145327, is_guest: true }, api: mock.api })

  await loader.load()

  const state = loader.getState()
  assert.equal(state.canQueryPinned, false, 'guard не пропускает отрицательный id')
  assert.equal(mock.stats.calls, 0, 'запрос к /pinned-practices не отправлен')
  assert.equal(state.kind, 'empty', 'показано пустое состояние, а не ошибка')
  assert.equal(state.error, false, 'ошибка не выставлена')
  assert.equal(state.loading, false, 'скелетон снят')
})

test('гость с отрицательным id: «Повторить» тоже не создаёт запрос', async () => {
  const mock = makeApi({ fail: true })
  const loader = createPinnedLoader({ user: { id: -7, is_guest: true }, api: mock.api })

  await loader.load()
  await loader.retryPinned()

  const state = loader.getState()
  assert.equal(mock.stats.calls, 0, 'ни одной попытки запроса')
  assert.equal(state.kind, 'empty', 'состояние остаётся пустым')
})

test('демо-гость с положительным id 900002: запрос отправляется как раньше', async () => {
  const mock = makeApi({ items: [{ practice_id: 'rituals' }] })
  const loader = createPinnedLoader({ user: { id: 900002, is_guest: true }, api: mock.api })

  await loader.load()

  const state = loader.getState()
  assert.equal(state.canQueryPinned, true, 'положительный id — обычная строка')
  assert.equal(mock.stats.calls, 1, 'API вызван один раз')
  assert.equal(state.kind, 'rail', 'список практик показан')
})

// ── Тесты: ошибка загрузки и повтор ──

test('ошибка загрузки: состояние ошибки, «Повторить» повторяет запрос и возвращает список', async () => {
  const mock = makeApi({ items: [{ practice_id: 'rituals' }], fail: true })
  const loader = createPinnedLoader({ user: { id: 900001 }, api: mock.api })

  await loader.load()

  let state = loader.getState()
  assert.equal(state.kind, 'error', 'показано состояние ошибки')
  assert.equal(state.error, true, 'ошибка выставлена')
  assert.equal(mock.stats.calls, 1, 'первый запрос отправлен')

  mock.stats.stopFailing()
  await loader.retryPinned()

  state = loader.getState()
  assert.equal(mock.stats.calls, 2, 'повторный запрос отправлен')
  assert.equal(state.retryKey, 1, 'retryPinned меняет ключ эффекта')
  assert.equal(state.error, false, 'ошибка снята')
  assert.equal(state.kind, 'rail', 'список показан после повтора')
  assert.equal(state.loading, false, 'скелетон снят')
})

// ── Контракт исходника: PinnedPractices.jsx ──

test('PinnedPractices: guard стоит до запроса, пустое состояние без ошибки', () => {
  assert.match(pinnedSource, /import \{ hasCanonicalUserId \} from '\.\.\/lib\/guestAuth'/)
  assert.match(pinnedSource, /const canQueryPinned = hasCanonicalUserId\(user\)/)
  assert.match(
    pinnedSource,
    /if \(!canQueryPinned\) \{\n\s*setLoading\(false\)\n\s*return undefined\n\s*\}/,
    'до запроса есть выход без обращения к API'
  )
  assert.match(
    pinnedSource,
    /\}, \[user\.id, canQueryPinned, retryKey\]\)/,
    'эффект перезапрашивает данные по retryKey'
  )
  assert.match(pinnedSource, /setRetryKey\(key => key \+ 1\)/, 'retryPinned увеличивает ключ')
})

test('PinnedPractices: кнопка «Повторить» и честные тексты состояний', () => {
  assert.match(
    pinnedSource,
    /error && pinnedPractices\.length === 0 \? \(/,
    'ошибка показывается, когда список практик пуст'
  )
  assert.match(pinnedSource, /data-testid="pinned-practices-retry"/, 'кнопка повтора с testid')
  assert.match(pinnedSource, /onClick=\{retryPinned\}/, 'кнопка вызывает retryPinned')
  assert.match(pinnedSource, />\s*Повторить\s*</, 'текст кнопки — «Повторить»')
  assert.match(pinnedSource, /Не получилось загрузить практики\./, 'текст ошибки')
  assert.match(pinnedSource, /Здесь пока пусто\./, 'текст пустого состояния')
})

// ── Контракт исходника: StepsExplore.jsx ──

test('StepsExplore: закрепление практики гостем не отправляет POST', () => {
  const guardIndex = stepsSource.indexOf('if (!hasCanonicalUserId(user)) return')
  const addIndex = stepsSource.indexOf('api.pinnedPractices.add(user.id, practice.key)')

  assert.notEqual(guardIndex, -1, 'guard объявлен')
  assert.notEqual(addIndex, -1, 'вызов API найден')
  assert.ok(guardIndex < addIndex, 'guard стоит до вызова API')
})
