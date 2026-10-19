import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * MXL-KEYBOARD-MOTION-001 («Диалог / Спутник»): клавиатура не пересобирает
 * раскладку экрана. Оболочка держит стабильную высоту, а лента сообщений и
 * composer поднимаются одним transform'ом на величину инсета клавиатуры —
 * поэтому промежуточные события visualViewport/viewportChanged не двигают
 * layout, scrollTop ленты не меняется, а последняя реплика остаётся над полем
 * ввода и при открытии, и при закрытии клавиатуры.
 *
 * Второе требование того же шага — пустой чат не прокручивается вовсе, а
 * иллюстрация шапки «Диалога» занимает своё место до загрузки PNG
 * (MXL-DIALOG-HERO-STABLE-001): без размеров картинка была нулевой высоты и
 * после загрузки сдвигала весь экран вниз.
 *
 * Реальный подъём composer'а открытием клавиатуры на iPhone/Telegram
 * автопрогоном не покрывается — это ручной gate; здесь проверяется контракт
 * кода: единственная точка подъёма, набор анимируемых свойств, длительность
 * и кривая, отключение движения при prefers-reduced-motion.
 */

const conversationSource = await readFile(
  new URL('../../src/screens/mentalix/Conversation.jsx', import.meta.url),
  'utf8'
)
const conversationCss = await readFile(
  new URL('../../src/screens/mentalix/Conversation.css', import.meta.url),
  'utf8'
)
const pickerSource = await readFile(
  new URL('../../src/screens/mentalix/PersonaPicker.jsx', import.meta.url),
  'utf8'
)
const pickerCss = await readFile(
  new URL('../../src/screens/mentalix/PersonaPicker.css', import.meta.url),
  'utf8'
)
const tokensCss = await readFile(new URL('../../src/index.css', import.meta.url), 'utf8')
const surfaceSource = await readFile(
  new URL('../../src/lib/fullscreenSurface.js', import.meta.url),
  'utf8'
)

/** Тело CSS-правила по селектору — от `{` до парной `}`. */
function cssRule(css, selector) {
  const start = css.indexOf(`${selector} {`)
  assert.notEqual(start, -1, `правило ${selector} найдено`)

  const open = css.indexOf('{', start)
  const close = css.indexOf('}', open)
  assert.notEqual(close, -1, `правило ${selector} закрыто`)

  return css.slice(open + 1, close)
}

test('подъём composer\'а — режим lift fullscreen-контракта, а не пересборка высоты', () => {
  assert.match(
    conversationSource,
    /useFullscreenSurface\(\{\s*keyboardStrategy: 'lift',?\s*\}\)/,
    '«Диалог» обязан запрашивать lift-стратегию у общего контракта'
  )
  assert.match(conversationSource, /--mx-keyboard-inset/, 'инсет клавиатуры уходит в CSS-переменную')
  assert.match(
    surfaceSource,
    /keyboardStrategy = 'resize'/,
    'по умолчанию контракт сохраняет прежнее поведение остальных экранов'
  )
  assert.match(
    surfaceSource,
    /keyboardOpen && !liftKeyboard/,
    'в lift-режиме оболочка больше не умещается под клавиатуру'
  )
})

test('анимируется только transform — height, top и padding не переходятся', () => {
  const lift = cssRule(conversationCss, '.mx-conversation-lift')

  assert.match(lift, /transform: translateY\(calc\(-1 \* var\(--mx-keyboard-inset, 0px\)\)\)/)
  assert.match(lift, /transition: transform var\(--mx-motion-keyboard\) var\(--mx-ease-ios\)/)
  assert.doesNotMatch(
    lift,
    /transition:[^;]*(\bheight\b|\btop\b|\bbottom\b|\bpadding\b|\bmargin\b)/,
    'переход не должен трогать свойства раскладки'
  )
})

test('длительность и кривая подъёма — как у клавиатуры iOS (250–300 мс)', () => {
  const duration = Number(tokensCss.match(/--mx-motion-keyboard:\s*(\d+)ms/)?.[1])

  assert.ok(Number.isFinite(duration), 'токен --mx-motion-keyboard объявлен')
  assert.ok(duration >= 250 && duration <= 300, `длительность ${duration}ms вне диапазона 250–300 мс`)

  assert.match(
    tokensCss,
    /--mx-ease-ios:\s*cubic-bezier\(0\.32, 0\.72, 0, 1\)/,
    'кривая подъёма совпадает с нативной анимацией клавиатуры iOS'
  )
})

test('сцена держит свободную высоту и обрезает поднятую группу сверху', () => {
  const stage = cssRule(conversationCss, '.mx-conversation-stage')

  assert.match(stage, /overflow: hidden/)
  assert.match(stage, /flex: 1 1 auto/)
  assert.match(stage, /min-height: 0/)

  const lift = cssRule(conversationCss, '.mx-conversation-lift')
  assert.match(lift, /flex-direction: column/)
  assert.match(lift, /flex: 1 1 auto/)
})

test('пустой чат не прокручивается, а автопрокрут на клавиатуру убран', () => {
  assert.match(
    conversationSource,
    /if \(loading\) return\s*\n\s*if \(messages\.length === 0\) return/,
    'пустой чат — без автопрокрута к низу'
  )
  assert.doesNotMatch(
    conversationSource,
    /if \(!keyboardOpen\) return undefined/,
    'отдельного автопрокрута на открытие клавиатуры больше нет: ленту поднимает transform'
  )
})

test('prefers-reduced-motion отключает переход подъёма', () => {
  const block = conversationCss.slice(conversationCss.indexOf('@media (prefers-reduced-motion: reduce)'))

  assert.match(block, /\.mx-conversation-lift \{\s*transition: none;/)
})

test('иллюстрация шапки «Диалога» занимает место до загрузки PNG', () => {
  assert.match(pickerSource, /<img[\s\S]*?width=\{851\}/, 'у картинки объявлена собственная ширина')
  assert.match(pickerSource, /height=\{505\}/, 'у картинки объявлена собственная высота')
  assert.match(
    cssRule(pickerCss, '.mx-dialog-hero-reference'),
    /aspect-ratio: 851 \/ 505/,
    'место под иллюстрацию занято до загрузки картинки'
  )
})
