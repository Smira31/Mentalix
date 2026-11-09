import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

/*
 * Issue #1169 — «Доступ ИИ к записям»: тексты карточки и переключателя
 * утверждены дословно. Тест сверяет их посимвольно и держит два правила:
 * у карточки и переключателя свои константы, а латиницы «AI» в видимых
 * текстах и aria-label нет — только «ИИ».
 */

const read = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8')

const libSource = await read('src/lib/aiContextConsent.js')
const cardSource = await read('src/screens/mentalix/AiContextConsentCard.jsx')
const rowSource = await read('src/screens/settings/AiConsentSwitchRow.jsx')

// Значение константы из исходника: одна строка в одинарных кавычках.
function stringConstant(source, name) {
  const match = source.match(new RegExp(`export const ${name} =\\s*'((?:[^'\\\\]|\\\\.)*)'`))
  assert.ok(match, `константа ${name} должна быть строкой в одинарных кавычках`)
  return match[1].replace(/\\(.)/g, '$1')
}

const cardTitle = stringConstant(libSource, 'AI_CONSENT_CARD_TITLE')
const cardBody = stringConstant(libSource, 'AI_CONSENT_CARD_BODY')
const allowLabel = stringConstant(libSource, 'AI_CONSENT_ALLOW_LABEL')
const snoozeLabel = stringConstant(libSource, 'AI_CONSENT_SNOOZE_LABEL')
const switchTitle = stringConstant(libSource, 'AI_CONSENT_SWITCH_TITLE')
const switchSubtitle = stringConstant(libSource, 'AI_CONSENT_SWITCH_SUBTITLE')

test('заголовок карточки — дословно', () => {
  assert.equal(cardTitle, 'Показать собеседникам твои записи?')
})

test('текст карточки — дословно', () => {
  assert.equal(
    cardBody,
    'Собеседники увидят чек-ины, которые ты отметишь в «Истории», а также твои ритуалы, аскезы и цели — чтобы отвечать про твой день. Записи передаются в GigaChat (ПАО Сбербанк) только для ответа. Выключить можно в любой момент: Профиль → Твои данные → Доступ ИИ к записям.'
  )
})

test('кнопки карточки — дословно', () => {
  assert.equal(allowLabel, 'Разрешить')
  assert.equal(snoozeLabel, 'Не сейчас')
})

test('название переключателя — дословно', () => {
  assert.equal(switchTitle, 'Доступ ИИ к записям')
})

test('подпись переключателя — дословно', () => {
  assert.equal(
    switchSubtitle,
    'Собеседники видят отмеченные чек-ины, ритуалы, аскезы и цели. Выключишь — отметки снимутся.'
  )
})

test('пять текстов — без латиницы AI', () => {
  for (const text of [cardTitle, cardBody, allowLabel, snoozeLabel, switchTitle, switchSubtitle]) {
    assert.doesNotMatch(text, /AI/)
  }
  assert.match(switchTitle, /ИИ/)
})

test('обе поверхности берут тексты из своих констант', () => {
  assert.match(cardSource, /aria-label=\{AI_CONSENT_CARD_TITLE\}/)
  assert.match(cardSource, /\{AI_CONSENT_CARD_TITLE\}/)
  assert.match(cardSource, /\{AI_CONSENT_CARD_BODY\}/)
  assert.match(cardSource, /\{AI_CONSENT_ALLOW_LABEL\}/)
  assert.match(cardSource, /\{AI_CONSENT_SNOOZE_LABEL\}/)
  assert.match(rowSource, /title=\{AI_CONSENT_SWITCH_TITLE\}/)
  assert.match(rowSource, /subtitle=\{AI_CONSENT_SWITCH_SUBTITLE\}/)
  assert.match(rowSource, /label=\{AI_CONSENT_SWITCH_TITLE\}/)
})

test('тексты ошибок прежние и тоже без латиницы AI', () => {
  const errors = [
    'Не удалось включить доступ. Попробуй ещё раз.',
    'Не удалось загрузить настройку. Попробуй ещё раз.',
    'Настройка не сохранилась. Попробуй ещё раз.',
  ]

  assert.ok(cardSource.includes(errors[0]))
  assert.ok(rowSource.includes(errors[1]))
  assert.ok(rowSource.includes(errors[2]))

  for (const text of errors) assert.doesNotMatch(text, /AI/)
})
