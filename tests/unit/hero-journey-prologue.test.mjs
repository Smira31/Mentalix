import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const dataSource = (
  await readFile(new URL('../../src/data/heroJourney.js', import.meta.url), 'utf8')
).replace(/^import (\w+) from '[^']+\.(?:svg|webp|avif|png|jpe?g|gif)'$/gm, "const $1 = ''")
const { HERO_JOURNEY_PROLOGUE, HERO_JOURNEY_COURSE } = await import(
  `data:text/javascript;base64,${Buffer.from(dataSource).toString('base64')}`
)

test('пролог: метка, заголовок и четыре абзаца дословно по документу', () => {
  assert.equal(HERO_JOURNEY_PROLOGUE.eyebrow, 'ПУТЬ ГЕРОЯ')
  assert.equal(HERO_JOURNEY_PROLOGUE.title, 'Зачем этот курс')
  assert.equal(HERO_JOURNEY_PROLOGUE.menuLabel, 'О курсе')
  assert.equal(HERO_JOURNEY_PROLOGUE.paragraphs.length, 4)
  const text = HERO_JOURNEY_PROLOGUE.paragraphs.join('\n')
  assert.match(text, /Бывает так: день прошёл, а что в нём было, не вспомнить\./)
  assert.match(text, /На автопилоте живёт почти каждый/)
  assert.match(text, /В курсе 16 шагов\. В каждом одна тема из обычной жизни/)
  assert.match(text, /Не нужно ничего менять сразу\./)
})

test('пролог: без оговорки про терапию и без строки про космонавта', () => {
  const text = JSON.stringify(HERO_JOURNEY_PROLOGUE)
  assert.doesNotMatch(text, /терапия|космонавт|специалист/i)
  assert.equal(HERO_JOURNEY_PROLOGUE.note, undefined)
})

test('описание карточки курса в Библиотеке', () => {
  assert.equal(
    HERO_JOURNEY_COURSE.description,
    '16 шагов о том, как не прожить жизнь на автопилоте. В каждом шаге: прочитать, записать, сделать одно действие.'
  )
})
