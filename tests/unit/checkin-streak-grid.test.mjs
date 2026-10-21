import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * Общая сетка финала чек-ина и экрана серии (задача fix-checkin-layout).
 *
 * Оба экрана обязаны стоять на одной геометрии: полоса героя, полоса
 * заголовка и нижний блок задаются одними и теми же переменными
 * (--mx-finale-title-band, --mx-completion-meta-band), а шапка — одной
 * высотой, что и строка контролов утреннего чек-ина. Контракт проверяется
 * по исходникам; реальные позиции на 430×932 и 360×640 меряет
 * tests/ux/checkin-streak-stability.spec.mjs («сохранение → оценка → серия»).
 */

const componentSources = Object.fromEntries(
  await Promise.all(
    [
      '../../src/components/CheckInCompletion.jsx',
      '../../src/components/StreakCelebration.jsx',
      '../../src/screens/CheckIn.jsx',
    ].map(async path => [path, await readFile(new URL(path, import.meta.url), 'utf8')])
  )
)

const completionCss = await readFile(
  new URL('../../src/components/CheckInCompletion.css', import.meta.url),
  'utf8'
)
const streakCss = await readFile(
  new URL('../../src/components/StreakCelebration.css', import.meta.url),
  'utf8'
)
const demoCss = await readFile(
  new URL('../../src/screens/CheckInDemo.css', import.meta.url),
  'utf8'
)

const completionJsx = componentSources['../../src/components/CheckInCompletion.jsx']
const streakJsx = componentSources['../../src/components/StreakCelebration.jsx']
const checkinJsx = componentSources['../../src/screens/CheckIn.jsx']

test('сетка: общие переменные полос заголовка и нижнего блока', () => {
  assert.match(completionCss, /--mx-finale-title-band:\s*\d+px/)
  assert.match(completionCss, /--mx-completion-meta-band:\s*\d+px/)
  assert.match(completionCss, /\.mx-completion__title\s*{[^}]*min-height:\s*var\(--mx-finale-title-band\)/s)
  assert.match(completionCss, /\.mx-completion__meta\s*{[^}]*min-height:\s*var\(--mx-completion-meta-band\)/s)
})

test('сетка: экран серии использует те же классы полос, что и финал', () => {
  for (const className of [
    'mx-completion__art-wrap',
    'mx-completion__title',
    'mx-completion__meta',
  ]) {
    assert.match(completionJsx, new RegExp(className), `финал: ${className}`)
    assert.match(streakJsx, new RegExp(className), `серия: ${className}`)
  }
  // Оба экрана без полей ввода: клавиатура не пересобирает раскладку.
  assert.match(checkinJsx, /keyboardStrategy:\s*step === doneStep \? 'stable' : 'resize'/)
  assert.match(streakJsx, /keyboardStrategy:\s*'stable'/)
})

test('сетка: шапка финала, серии и строки контролов — одной высоты', () => {
  // Источник высоты — строка контролов утреннего чек-ина.
  assert.match(
    demoCss,
    /\.mx-demo-checkin__header:empty\s*{[^}]*min-height:\s*calc\(var\(--mx-header-control\) \+ 12px\)/s
  )
  assert.match(
    completionCss,
    /\.mx-finale-header-slot\s*{[^}]*min-height:\s*calc\(var\(--mx-header-control\) \+ 12px\)/s
  )
  // Финал вечера и серия пользуются этой полосой, а не 52 px из общего слота:
  // иначе герой серии начинается на 3 px выше иллюстрации финала.
  assert.match(streakJsx, /className="mx-finale-header-slot"/)
  assert.doesNotMatch(streakJsx, /FULLSCREEN_HEADER_SLOT_CLASS/)
  const eveningFinale = checkinJsx.slice(checkinJsx.indexOf('if (step >= doneStep)'))
  assert.match(eveningFinale, /className="mx-finale-header-slot"/)
})

test('сетка: нижний блок серии стоит на линии плашки даты финала', () => {
  assert.match(streakCss, /\.mx-streak-celebration__days\s*{[^}]*margin:\s*var\(--mx-finale-meta-gap\)/s)
  assert.match(completionCss, /\.mx-completion__date-pill\s*{[^}]*margin-top:\s*var\(--mx-finale-meta-gap\)/s)
})
