/*
 * Права «Пути героя» (#1122): контракт ответа сервера — access.has_pro,
 * access.free_chapter_keys и флаг locked у глав, шагов и финала.
 *
 * Правила доступа — чистые функции, поэтому проверяются без браузера. Демо-набор
 * обязан нести тот же контракт, что сервер (глава I бесплатна, главы II–IV
 * закрыты), и не подставлять закрытые тексты вместо серверных.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import {
  heroChapterLocked,
  heroFinaleLocked,
  heroTrialLocked,
  normalizeHeroAccess,
  validateHeroJourneyPayload,
} from '../../src/lib/heroJourneyPayload.js'

/* Главы без флага locked: так их отдаёт сервер до контракта и так же —
   когда он решает по правам (free_chapter_keys / has_pro). */
const chapters = [
  { key: 'call', roman: 'I', trialIds: ['uncertainty'] },
  { key: 'threshold', roman: 'II', trialIds: ['body'] },
]
const freeChapterAccess = normalizeHeroAccess({ has_pro: false, free_chapter_keys: ['call'] })

test('права из ответа: has_pro и free_chapter_keys', () => {
  // Нет объекта — нет прав: до контракта закрытых глав не рисуется.
  assert.equal(normalizeHeroAccess(null), null)
  assert.equal(normalizeHeroAccess([]), null)
  assert.deepEqual(normalizeHeroAccess({ has_pro: true, free_chapter_keys: ['call', 7, ''] }), {
    hasPro: true,
    freeChapterKeys: ['call'],
  })
  assert.deepEqual(normalizeHeroAccess({}), { hasPro: false, freeChapterKeys: [] })
})

test('глава I бесплатна, главы II–IV закрыты без Pro', () => {
  assert.equal(heroChapterLocked(chapters[0], freeChapterAccess), false)
  assert.equal(heroChapterLocked(chapters[1], freeChapterAccess), true)
  // Pro открывает главы, даже если ключа нет в списке бесплатных.
  assert.equal(heroChapterLocked(chapters[1], normalizeHeroAccess({ has_pro: true })), false)
  // Явный флаг сервера важнее списка бесплатных глав: сервер решает сам.
  assert.equal(heroChapterLocked({ ...chapters[1], locked: false }, freeChapterAccess), false)
  assert.equal(heroChapterLocked({ ...chapters[0], locked: true }, freeChapterAccess), true)
  // Контракта нет (прежний backend) — ничего не закрываем.
  assert.equal(heroChapterLocked(chapters[1], null), false)
})

test('шаг закрыт флагом или закрытой главой, финал — без действующего Pro', () => {
  assert.equal(heroTrialLocked({ id: 'body' }, chapters, freeChapterAccess), true)
  assert.equal(heroTrialLocked({ id: 'uncertainty' }, chapters, freeChapterAccess), false)
  assert.equal(heroTrialLocked({ id: 'uncertainty', locked: true }, chapters, freeChapterAccess), true)
  assert.equal(heroTrialLocked(null, chapters, freeChapterAccess), false)

  assert.equal(heroFinaleLocked({ id: 'return' }, freeChapterAccess), true)
  assert.equal(heroFinaleLocked({ id: 'return' }, normalizeHeroAccess({ has_pro: true })), false)
  assert.equal(heroFinaleLocked({ id: 'return', locked: true }, null), true)
  assert.equal(heroFinaleLocked({ id: 'return' }, null), false)
  assert.equal(heroFinaleLocked(null, freeChapterAccess), false)
})

test('закрытый шаг без текстов — корректный формат, а не ошибка', () => {
  const data = {
    course: { title: 'Путь героя' },
    chapters: [{ key: 'threshold', roman: 'II', trialIds: ['body'], locked: true }],
    trials: [
      { id: 'uncertainty', intro: 'Вступление' },
      // Закрытый шаг: сервер не отдаёт ни текстов, ни листов.
      { id: 'body', number: 5, locked: true },
    ],
    access: { has_pro: false, free_chapter_keys: [] },
  }
  assert.equal(validateHeroJourneyPayload(data), data)
  // У открытого шага лист без текста — по-прежнему ошибка формата.
  assert.throws(
    () =>
      validateHeroJourneyPayload({
        ...data,
        trials: [...data.trials, { id: 'extra', pages: [{ text: ' ' }] }],
      }),
    /hero-journey/
  )
})

test('демо несёт тот же контракт прав и не подставляет закрытые тексты', async () => {
  const { DEMO_HERO_JOURNEY } = await import('../../src/data/demoContent.js')
  const access = normalizeHeroAccess(DEMO_HERO_JOURNEY.access)
  assert.deepEqual(access, { hasPro: false, freeChapterKeys: ['call'] })

  const [first, ...rest] = DEMO_HERO_JOURNEY.chapters
  assert.equal(heroChapterLocked(first, access), false)
  assert.equal(rest.length, 3)
  for (const chapter of rest) assert.equal(heroChapterLocked(chapter, access), true)

  // У закрытых шагов нет ни текстов, ни листов: пустого экрана не получится.
  for (const step of DEMO_HERO_JOURNEY.steps.filter(item => item.number > 4)) {
    assert.equal(step.intro, undefined)
    assert.equal(step.pages, undefined)
    assert.equal(step.title, undefined)
    assert.equal(heroTrialLocked(step, DEMO_HERO_JOURNEY.chapters, access), true)
  }
})

test('права перечитываются: возврат на вкладку обновляет курс тихо', async () => {
  const library = await readFile(new URL('../../src/screens/Library.jsx', import.meta.url), 'utf8')
  const content = await readFile(
    new URL('../../src/lib/heroJourneyContent.js', import.meta.url),
    'utf8'
  )
  const screen = await readFile(
    new URL('../../src/screens/HeroJourneyMap.jsx', import.meta.url),
    'utf8'
  )
  // Возврат на вкладку (и закрытие профиля, App отправляет mentalix:tab-refresh)
  // перечитывает тот же ответ: счётчик уходит в курс как refreshToken.
  assert.match(library, /useTabRefresh\('library'/)
  assert.match(library, /refreshToken=\{heroRefresh\}/)
  assert.match(screen, /props\.refreshToken/)
  // Тихое перечитывание: скелетон не мигает, показанный курс остаётся.
  assert.match(content, /\[enabled, userId, demo, attempt, refreshToken\]/)
  assert.match(content, /fallback \?\? \(prev\.userId === userId \? prev\.course : null\)/)
  // Закрытая глава ведёт на существующий экран подписки, а не в пустой шаг.
  assert.match(screen, /onOpenSubscription\?\.\(\)/)
})
