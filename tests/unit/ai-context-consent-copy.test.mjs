import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

/*
 * Приватность — «Доступ ИИ к записям»: строка переключателя и окно согласия
 * в Профиле. Тексты утверждены дословно — тест сверяет их посимвольно и
 * держит один источник (src/lib/aiContextConsent.js), из которого Профиль
 * берёт текст, а не из разметки. В «Диалоге» поверхности нет.
 */

const read = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8')

const libSource = await read('src/lib/aiContextConsent.js')
const rowSource = await read('src/screens/settings/AiConsentSwitchRow.jsx')

// Значение константы из исходника: строка в одинарных кавычках.
function stringConstant(source, name) {
  const match = source.match(new RegExp(`export const ${name} =\\s*'((?:[^'\\\\]|\\\\.)*)'`))
  assert.ok(match, `константа ${name} должна быть строкой в одинарных кавычках`)
  return match[1].replace(/\\(.)/g, '$1')
}

const switchTitle = stringConstant(libSource, 'AI_CONSENT_SWITCH_TITLE')
const switchSubtitle = stringConstant(libSource, 'AI_CONSENT_SWITCH_SUBTITLE')
const dialogTitle = stringConstant(libSource, 'AI_CONSENT_DIALOG_TITLE')
const dialogBody = stringConstant(libSource, 'AI_CONSENT_DIALOG_BODY')
const dialogConfirm = stringConstant(libSource, 'AI_CONSENT_DIALOG_CONFIRM')
const dialogCancel = stringConstant(libSource, 'AI_CONSENT_DIALOG_CANCEL')

test('строка переключателя в Профиле — дословно', () => {
  assert.equal(switchTitle, 'Собеседники видят мои записи')
  assert.equal(
    switchSubtitle,
    'Видят отмеченные чек-ины, ритуалы, аскезы, цели и память разговоров. Ответы готовит GigaChat (Сбер).'
  )
})

test('окно согласия — дословно', () => {
  assert.equal(dialogTitle, 'Собеседники увидят твои записи')
  assert.equal(
    dialogBody,
    'Чтобы отвечать про твой день, Наблюдатель, Наставник и Спутник будут видеть чек-ины, которые ты отметишь в «Истории», ритуалы, аскезы, цели и то, что запомнят из ваших разговоров. Ответы готовит нейросеть GigaChat (ПАО Сбербанк) — записи передаются туда только для ответа. Выключить можно в любой момент здесь же.'
  )
  assert.equal(dialogConfirm, 'Включить')
  assert.equal(dialogCancel, 'Не сейчас')
})

test('видимые тексты без латиницы AI — только «ИИ» и название модели', () => {
  for (const text of [
    switchTitle,
    switchSubtitle,
    dialogTitle,
    dialogBody,
    dialogConfirm,
    dialogCancel,
  ]) {
    assert.doesNotMatch(text, /AI/)
  }
  // Честный текст окна называет нейросеть и её оператора.
  assert.match(dialogBody, /GigaChat \(ПАО Сбербанк\)/)
})

test('Профиль берёт тексты из своих констант', () => {
  assert.match(rowSource, /title=\{AI_CONSENT_SWITCH_TITLE\}/)
  assert.match(rowSource, /subtitle=\{AI_CONSENT_SWITCH_SUBTITLE\}/)
  assert.match(rowSource, /label=\{AI_CONSENT_SWITCH_TITLE\}/)
  assert.match(rowSource, /title=\{AI_CONSENT_DIALOG_TITLE\}/)
  assert.match(rowSource, /description=\{AI_CONSENT_DIALOG_BODY\}/)
  assert.match(rowSource, /confirmLabel=\{AI_CONSENT_DIALOG_CONFIRM\}/)
  assert.match(rowSource, /cancelLabel=\{AI_CONSENT_DIALOG_CANCEL\}/)
})

test('неиспользуемых текстов карточки и строки не осталось', () => {
  // Тексты прежних поверхностей «Диалога» удалены вместе с ними.
  assert.doesNotMatch(libSource, /AI_CONSENT_CARD_TITLE/)
  assert.doesNotMatch(libSource, /AI_CONSENT_CARD_BODY/)
  assert.doesNotMatch(libSource, /AI_CONSENT_ALLOW_LABEL/)
  assert.doesNotMatch(libSource, /AI_CONSENT_SNOOZE_LABEL/)
  assert.doesNotMatch(libSource, /AI_CONSENT_LINE_TEXT/)
  assert.doesNotMatch(libSource, /AI_CONSENT_LINE_ACTION/)
  assert.doesNotMatch(libSource, /Показать собеседникам твои записи/)
  assert.doesNotMatch(libSource, /GigaChat \(ПАО Сбербанк\) только для ответа/)
})

test('тексты ошибок прежние и тоже без латиницы AI', () => {
  const errors = [
    'Не удалось загрузить настройку. Попробуй ещё раз.',
    'Настройка не сохранилась. Попробуй ещё раз.',
  ]

  assert.ok(rowSource.includes(errors[0]))
  assert.ok(rowSource.includes(errors[1]))

  for (const text of errors) assert.doesNotMatch(text, /AI/)
})
