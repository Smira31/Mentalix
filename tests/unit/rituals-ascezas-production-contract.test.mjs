import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const rituals = await readFile(new URL('../../src/screens/Rituals.jsx', import.meta.url), 'utf8')
const ascezas = await readFile(new URL('../../src/screens/Ascezas.jsx', import.meta.url), 'utf8')
const sceneCss = await readFile(
  new URL('../../src/components/practices/SceneLayout.css', import.meta.url),
  'utf8'
)

function slice(source, start, end) {
  const from = source.indexOf(start)
  assert.notEqual(from, -1, `${start} must exist`)
  const to = end ? source.indexOf(end, from) : -1
  return source.slice(from, to === -1 ? undefined : to)
}

test('production Rituals and Ascezas use the compact 44px Variant A shell', () => {
  assert.match(sceneCss, /\.mx-rituals-screen__header,[\s\S]*?min-height: 20px/)
  assert.match(sceneCss, /\.mx-rituals-screen__carousel,[\s\S]*?padding-top: 24px/)
  assert.match(sceneCss, /\.mx-rituals-screen__carousel,[\s\S]*?\.mx-ascezas-screen__carousel[\s\S]*?padding-top: 24px/)
  assert.equal(20 + 24, 44)
  for (const source of [rituals, ascezas]) {
    assert.match(source, /flex-1 flex flex-col min-h-0 overflow-hidden/)
    assert.match(source, /w-\[84%\]/)
    assert.match(source, /snap-x snap-mandatory/)
  }
  assert.match(rituals, /font-display text-\[20px\][^>]*>ритуалы\./)
  assert.match(ascezas, /<h2[^>]*>аскезы\.</)
})

test('production cards preserve Variant A internals and one flat outer surface', () => {
  for (const [source, className] of [
    [rituals, 'mx-rituals-contract-card'],
    [ascezas, 'mx-ascezas-contract-card'],
  ]) {
    assert.match(source, new RegExp(`${className}`))
    assert.match(sceneCss, new RegExp(`\\.${className}[\\s\\S]*?height: 620px[\\s\\S]*?padding: 20px`))
    assert.match(sceneCss, new RegExp(`\\.${className.replace('card', 'art')}[\\s\\S]*?top: 72px[\\s\\S]*?height: 250px[\\s\\S]*?border: 0`))
    assert.match(sceneCss, new RegExp(`\\.${className.replace('card', 'title')}[\\s\\S]*?top: 350px`))
  }
  assert.match(sceneCss, /\.mx-rituals-contract-actions[\s\S]*?top: 454px/)
  assert.match(rituals, /level === 'optimal' \? 'bg-gold'/)
  assert.doesNotMatch(rituals, /className=\{`[^`]*\$\{level \? 'bg-gold/)
  assert.doesNotMatch(ascezas, /status === 'held'[\s\S]*?bg-gold\/10/)
  assert.match(rituals, /SemanticGlyph kind=\{semanticKindForRitual\(ritual\.name\)\}/)
  assert.match(ascezas, /SemanticGlyph kind=\{semanticKindForAsceza\(asceza\)\}/)
})

test('production Ascezas retain exact held/broke semantics and triggers', () => {
  const card = slice(ascezas, 'function AscezaCard', 'function CreateAscezaScreen')
  const sheet = slice(ascezas, 'function BreakContextSheet', 'function AscezaCard')
  for (const label of ['Удержался', 'Сорвался', 'Причина:', 'Замена:', 'Восстановить пропущенный день']) {
    assert.match(card, new RegExp(label))
  }
  for (const trigger of ['Стресс', 'Скука', 'Усталость', 'Тревога', 'Компания', 'Импульс', 'Другое']) {
    assert.match(ascezas, new RegExp(trigger))
  }
  assert.doesNotMatch(sheet, /Автопилот/)
  assert.match(sheet, /Что сильнее всего повлияло\?/) 
  assert.match(sheet, /Хочешь добавить пару слов\?/) 
  assert.match(sheet, /submitLabel="Сохранить"/) 
  assert.match(sheet, /Ты заранее выбрал замену/) 
})

test('production create flows retain fullscreen, Telegram actions and 16px fields', () => {
  for (const [source, formName, heading, cta] of [
    [rituals, 'CreateRitualScreen', 'новый ритуал.', 'Создать ритуал'],
    [ascezas, 'CreateAscezaScreen', 'новая аскеза.', 'Принять аскезу'],
  ]) {
    const form = slice(source, `function ${formName}`, 'export default function')
    assert.match(form, /useFullscreenSurface\(\)/)
    assert.match(form, /<BackButton onClick=\{onCancel\} \/>/)
    assert.match(form, /text-\[16px\]/)
    assert.match(form, /<WebActionBar action=\{webAction\} \/>/)
    assert.match(form, /useMainButton\(/)
    assert.match(form, new RegExp(heading))
    assert.match(form, new RegExp(cta))
  }
})

export {}
void test
void assert
void rituals
void ascezas
void sceneCss
void slice
