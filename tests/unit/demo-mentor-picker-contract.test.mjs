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

test('Диалог: шапка — инлайн-SVG профилей без PNG-референса', () => {
  assert.match(picker, /mx-dialog-hero-svg/)
  assert.doesNotMatch(picker, /dialog-hero-reference/)
  assert.doesNotMatch(picker, /\.png['"]/)
})
