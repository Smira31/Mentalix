import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

/*
 * Тексты пролога и описания курса приезжают с сервера (#1112, этап 3):
 * GET /api/content/hero-journey. В бандле они остались только как демо-копия
 * (?demo=1) — её и проверяем, плюс следим, чтобы тексты не вернулись в
 * структурный модуль курса.
 */
const source = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8')

const { DEMO_HERO_JOURNEY } = await import('../../src/data/demoContent.js')
const HERO_JOURNEY_PROLOGUE = DEMO_HERO_JOURNEY.prologue

test('пролог: метка, заголовок и четыре абзаца дословно по документу', () => {
  assert.equal(HERO_JOURNEY_PROLOGUE.eyebrow, 'ПУТЬ ГЕРОЯ')
  assert.equal(HERO_JOURNEY_PROLOGUE.title, 'Зачем этот практикум')
  assert.equal(HERO_JOURNEY_PROLOGUE.menuLabel, 'О практикуме')
  assert.equal(HERO_JOURNEY_PROLOGUE.paragraphs.length, 4)
  const text = HERO_JOURNEY_PROLOGUE.paragraphs.join('\n')
  assert.match(text, /Бывает так: день прошёл, а что в нём было, не вспомнить\./)
  assert.match(text, /На автопилоте живёт почти каждый/)
  assert.match(text, /В практикуме 16 шагов\. В каждом одна тема из обычной жизни/)
  assert.match(text, /Не нужно ничего менять сразу\./)
})

test('пролог: без оговорки про терапию и без строки про космонавта', () => {
  const text = JSON.stringify(HERO_JOURNEY_PROLOGUE)
  assert.doesNotMatch(text, /терапия|космонавт|специалист/i)
  assert.equal(HERO_JOURNEY_PROLOGUE.note, undefined)
})

test('описание карточки курса в Библиотеке', async () => {
  const description =
    '16 шагов о том, как не прожить жизнь на автопилоте. В каждом шаге: прочитать, записать, сделать одно действие.'
  assert.equal(DEMO_HERO_JOURNEY.description, description)
  // Тот же текст стоит в структурных данных курса для карточки Библиотеки.
  assert.match(await source('src/data/courses/hero.js'), new RegExp(description.replaceAll('.', '\\.')))
})

test('серверные тексты не продублированы в структурном модуле курса', async () => {
  const heroData = await source('src/data/heroJourney.js')
  assert.doesNotMatch(heroData, /Бывает так: день прошёл/)
  assert.doesNotMatch(heroData, /Зачем этот практикум/)
  assert.doesNotMatch(heroData, /16 шагов о том, как не прожить жизнь на автопилоте/)
})
