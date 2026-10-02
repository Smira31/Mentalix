import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const picker = await readFile(
  new URL('../../src/screens/mentalix/PersonaPicker.jsx', import.meta.url),
  'utf8'
)

test('Диалог: карусель ролей без демо-подмены текста и с 4-й карточкой Даймона', () => {
  // Демо больше не подменяет копию карточки — один и тот же текст во всех режимах.
  assert.doesNotMatch(picker, /useDemoMentorCopy/)
  assert.doesNotMatch(picker, /isPreviewDemoMode/)

  // Тексты карточек ролей (крупно / мелко серым) — по решению владельца.
  assert.match(picker, /Выслушает, когда нужно выговориться\./)
  assert.match(picker, /Идёт рядом\. Не оценивает и не торопит\./)
  assert.match(picker, /Превратит намерение в один шаг\./)
  assert.match(picker, /Честный и строгий\. Не даст себя жалеть\./)
  assert.match(picker, /Подведёт итоги дня со стороны\./)
  assert.match(picker, /Спокойный\. Замечает то, что ты пропустил\./)
  assert.match(picker, /Игра самопознания: брось кубик и узнай, где ты сейчас\./)
  assert.match(picker, /Внутренний голос\. Первые броски бесплатно\./)

  // Четвёртая карточка — Даймон: открывает игру, а не создаёт разговор.
  assert.match(picker, /key: 'daimon'/)
  assert.match(picker, /onOpenDaimon\?\.\(\)/)
})

test('Диалог: чипсы — один постоянный набор из 5 стартеров', async () => {
  const { DIALOG_STARTER_CHIPS, PERSONA_STARTER_CHIP_LABELS } = await import(
    '../../src/data/prompts.js'
  )

  // Один и тот же набор чипсов при любой активной роли (решение владельца).
  assert.match(picker, /DIALOG_STARTER_CHIPS/)

  assert.equal(DIALOG_STARTER_CHIPS.length, 5)

  // За чипсом закреплена роль и непустой длинный стартер, уходящий в поле ввода.
  for (const chip of DIALOG_STARTER_CHIPS) {
    assert.ok(['mayak', 'kompas'].includes(chip.persona), `Неизвестная роль чипса: ${chip.persona}`)
    assert.ok(
      typeof chip.starter === 'string' && chip.starter.trim().length > 0,
      `Пустой стартер чипса роли ${chip.persona}`
    )
  }

  // Надписи чипсов — ровно заданный владельцем набор.
  assert.deepEqual(
    DIALOG_STARTER_CHIPS.map(chip => PERSONA_STARTER_CHIP_LABELS[chip.starter]),
    ['Всё вымотало', 'Что-то давит', 'Хочу выговориться', 'Тревожно с утра', 'Не знаю, что делать']
  )
})

test('Диалог: шапка — PNG-референс, инлайн-SVG профилей убран', () => {
  // Возврат к референсу владельца: текст шапки нарисован на PNG, SVG удалён.
  assert.match(picker, /dialog-hero-reference/)
  assert.match(picker, /\.png['"]/)
  assert.doesNotMatch(picker, /mx-dialog-hero-svg/)
  assert.doesNotMatch(picker, /mx-dialog-hero-lines/)
})
