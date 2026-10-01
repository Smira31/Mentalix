import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const jsxSource = await readFile(
  new URL('../../src/screens/HeroJourneyMap.jsx', import.meta.url),
  'utf8'
)
const cssSource = await readFile(
  new URL('../../src/screens/HeroJourneyMap.css', import.meta.url),
  'utf8'
)

test('StepComplete всегда рендерит видимую кнопку «К карте пути» в футере', () => {
  // Кнопка должна быть в footer, который рендерится без условий
  assert.match(jsxSource, /К карте пути/)
  // footer передаётся в Shell без условного рендеринга
  assert.match(jsxSource, /footer=\{/)
  // Кнопка имеет класс cta-pill
  assert.match(jsxSource, /cta-pill mx-hj-complete__cta/)
})

test('футер StepComplete закреплён внизу и ограничен по ширине контента', () => {
  // футер не сжимается и имеет отступ снизу с safe-area
  assert.match(cssSource, /\.mx-hj-complete__footer[\s\S]*?flex-shrink:\s*0/)
  assert.match(cssSource, /\.mx-hj-complete__footer[\s\S]*?padding-bottom:\s*calc\(env\(safe-area-inset-bottom/)
  // отступ снизу не меньше 24px
  assert.match(cssSource, /\.mx-hj-complete__footer[\s\S]*?24px\)/)
  // футер ограничен по ширине и центрирован (классы в JSX)
  assert.match(jsxSource, /mx-hj-complete__footer mx-auto w-full max-w-md/)
})

test('карточка главы на экране завершения во всю ширину контента', () => {
  // карточка имеет width: 100%
  assert.match(cssSource, /\.mx-hj-complete__chapter-card[\s\S]*?width:\s*100%/)
  // сегменты растянуты на всю ширину карточки
  assert.match(cssSource, /\.mx-hj-complete__chapter-segs[\s\S]*?width:\s*100%/)
  // подпись по центру
  assert.match(cssSource, /\.mx-hj-complete__chapter-card[\s\S]*?text-align:\s*center/)
})
