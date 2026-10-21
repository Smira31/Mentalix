import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')
const loaderSource = await readFile(
  new URL('../../src/lib/heroJourneyContent.js', import.meta.url),
  'utf8'
)

/*
 * Клиент собирается из настоящего src/lib/api.js: перехват демо-режима и сам
 * запрос курса проверяются на боевом коде, а не на копии контракта.
 */
function client({ status = 200, body = { trials: [] }, demo = false } = {}) {
  const calls = []
  let mocked = 0
  const source = apiSource
    .replace(/^import .*$/gm, '')
    .replaceAll('import.meta.env', '({ DEV: false })')
    .replaceAll('export ', '')
  const api = new Function(
    'platform',
    'isPreviewDemoMode',
    'demoRequest',
    'isProMockMode',
    'fetch',
    `${source}\nreturn api`
  )(
    { getSessionToken: () => 'unit-session', clearSessionToken() {} },
    () => demo,
    async () => {
      mocked += 1
      return { ok: true }
    },
    () => false,
    async (url, options) => {
      calls.push({ url, options })
      return { ok: status === 200, status, text: async () => JSON.stringify(body) }
    }
  )
  return { api, calls, mocked: () => mocked }
}

test('вне демо контент курса действительно запрашивается у сервера', async () => {
  const payload = { course: { title: 'Путь героя' }, trials: [], chapters: [] }
  const c = client({ body: payload })
  assert.deepEqual(await c.api.content.heroJourney(), payload)
  assert.equal(c.calls.length, 1)
  assert.equal(c.mocked(), 0)
  assert.equal(c.calls[0].url, '/api/content/hero-journey')
  assert.equal(c.calls[0].options.credentials, 'include')
  assert.equal(c.calls[0].options.headers.Authorization, 'Bearer unit-session')
})

test('в демо-режиме обёртка API перехватывает курс: на сервер не уходим', async () => {
  // Изоляция демо-режима: перехват в обёртке остаётся единственной точкой входа,
  // отдельного обхода для контента курса нет.
  const c = client({ demo: true })
  await c.api.content.heroJourney()
  assert.equal(c.calls.length, 0)
  assert.equal(c.mocked(), 1)
  await c.api.articles.list()
  assert.equal(c.calls.length, 0)
  assert.equal(c.mocked(), 2)
  // Запрос курса стоит только в ветке вне демо-режима.
  assert.match(loaderSource, /if \(enabled && !demo\) \{\s*api\.content\.heroJourney\(\)\.then\(/)
  assert.match(loaderSource, /const fallback = enabled && demo \? buildDemoCourse\(\) : null/)
})

test('401 — отказ доступа, а не пустой успешный курс', async () => {
  const c = client({ status: 401, body: { detail: 'verified_identity_required' } })
  await assert.rejects(c.api.content.heroJourney(), error => error.status === 401)
  assert.equal(c.calls.length, 1)
})

test('причина отказа и отсутствие контента различаются', async () => {
  const { heroJourneyErrorKind, validateHeroJourneyPayload } = await import(
    '../../src/lib/heroJourneyPayload.js'
  )
  // 401/403 — отказ доступа; сеть и 5xx — сбой загрузки.
  assert.equal(heroJourneyErrorKind({ status: 401 }), 'access')
  assert.equal(heroJourneyErrorKind({ status: 403 }), 'access')
  assert.equal(heroJourneyErrorKind({ status: 503 }), 'load')
  assert.equal(heroJourneyErrorKind(new TypeError('Failed to fetch')), 'load')
  // Пустой курс — не ошибка: формат корректен, шагов нет.
  const empty = { course: { title: 'Путь героя' }, trials: [], chapters: [] }
  assert.equal(validateHeroJourneyPayload(empty), empty)
})

test('главы II–IV в бандле закрыты: у шагов 5–16 нет текстов', async () => {
  const { DEMO_HERO_JOURNEY } = await import('../../src/data/demoContent.js')
  const locked = DEMO_HERO_JOURNEY.steps.filter(step => step.number > 4)
  assert.equal(locked.length, 12)
  for (const step of locked) {
    assert.equal(step.intro, undefined)
    assert.equal(step.pages, undefined)
    assert.equal(step.writePrompt, undefined)
    assert.equal(step.actionPrompt, undefined)
  }
  // Закрытыми помечены ровно три главы (II–IV), первая открыта.
  assert.equal(DEMO_HERO_JOURNEY.chapters.filter(ch => ch.demoLocked).length, 3)
  assert.equal(DEMO_HERO_JOURNEY.chapters[0].demoLocked, undefined)
})

test('некорректный payload не считается пустым курсом; листы не достраиваются', async () => {
  const { validateHeroJourneyPayload } = await import('../../src/lib/heroJourneyPayload.js')
  for (const value of [null, [], { ok: true }, {}, { course: {}, trials: null, chapters: [] }]) {
    assert.throws(() => validateHeroJourneyPayload(value), /hero-journey/)
  }
  const empty = { course: { title: 'Путь героя' }, trials: [], chapters: [] }
  const pages = [1, 2, 3, 4].map(n => ({ text: `Проверочный лист ${n}` }))
  const data = {
    ...empty,
    trials: [
      { id: 'uncertainty', pages },
      { id: 'temporality', intro: 'Вступление' },
    ],
  }
  assert.equal(validateHeroJourneyPayload(data), data)
  assert.equal(data.trials[0].pages.length, 4)
  assert.equal(data.trials[1].pages, undefined)
  assert.throws(
    () => validateHeroJourneyPayload({ ...empty, trials: [{ id: 'bad', pages: [{ text: '' }] }] }),
    /hero-journey/
  )
})
