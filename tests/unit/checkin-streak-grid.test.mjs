import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * Оболочка и внутренняя сетка экрана серии (задача fix-checkin-layout).
 *
 * Владелец принял отсутствие скачка, но не принял пустую композицию серии:
 * внутренние полосы серии больше не обязаны совпадать с полосами финала
 * чек-ина. Контракт теперь такой:
 *   — общие остаются оболочка, полоса шапки и нижняя полоса с кнопкой
 *     (при переходе не двигаются края экрана и главное действие);
 *   — внутри серии своя компактная сетка: иллюстрация → заголовок →
 *     пояснение → дни, у каждой полосы фиксированная высота,
 *     резерв блока отзывов финала не наследуется.
 * Реальные размеры и позиции на 430×932 и 360×640 меряет
 * tests/ux/checkin-streak-stability.spec.mjs («сохранение → оценка → серия»).
 */

const read = path => readFile(new URL(path, import.meta.url), 'utf8')

const [streakJsx, checkinJsx, completionCss, streakCss, demoCss, glyphsJsx] = await Promise.all([
  read('../../src/components/StreakCelebration.jsx'),
  read('../../src/screens/CheckIn.jsx'),
  read('../../src/components/CheckInCompletion.css'),
  read('../../src/components/StreakCelebration.css'),
  read('../../src/screens/CheckInDemo.css'),
  read('../../src/components/StreakGlyphs.jsx'),
])

test('оболочка: шапка финала и серии одной высоты', () => {
  // Источник высоты — строка контролов утреннего чек-ина.
  assert.match(
    demoCss,
    /\.mx-demo-checkin__header:empty\s*{[^}]*min-height:\s*calc\(var\(--mx-header-control\) \+ 12px\)/s
  )
  assert.match(
    completionCss,
    /\.mx-finale-header-slot\s*{[^}]*min-height:\s*calc\(var\(--mx-header-control\) \+ 12px\)/s
  )
  assert.match(streakJsx, /className="mx-finale-header-slot"/)
  assert.doesNotMatch(streakJsx, /FULLSCREEN_HEADER_SLOT_CLASS/)
  const eveningFinale = checkinJsx.slice(checkinJsx.indexOf('if (step >= doneStep)'))
  assert.match(eveningFinale, /className="mx-finale-header-slot"/)
})

test('оболочка: нижняя полоса с кнопкой — тот же класс, что у финала', () => {
  assert.match(completionCss, /\.mx-completion-action\s*{/)
  // Финал (через CheckIn) и серия передают WebActionBar один и тот же класс,
  // поэтому кнопка стоит на одной линии до и после перехода.
  assert.match(streakJsx, /className="mx-completion-action"/)
  assert.match(checkinJsx, /className="mx-completion-action"/)
})

test('оболочка: оба экрана без полей ввода держат layout-высоту', () => {
  assert.match(checkinJsx, /keyboardStrategy:\s*step === doneStep \? 'stable' : 'resize'/)
  assert.match(streakJsx, /keyboardStrategy:\s*'stable'/)
})

test('сетка серии: свои полосы, резерв блока отзывов не наследуется', () => {
  // Порядок композиции: иллюстрация → заголовок → пояснение → дни → кнопка.
  const order = ['mx-streak-stage__art', 'mx-streak-celebration__title', 'mx-streak-celebration__note', 'mx-streak-celebration__days']
  const positions = order.map(name => streakJsx.indexOf(name))
  positions.forEach((position, index) => {
    assert.ok(position > 0, `в разметке серии есть ${order[index]}`)
    if (index > 0) assert.ok(position > positions[index - 1], `${order[index]} ниже предыдущего блока`)
  })
  assert.ok(
    streakJsx.indexOf('className="mx-completion-action"') > positions.at(-1),
    'кнопка ниже ряда дней'
  )

  // Полосы серии собственные и с фиксированной высотой.
  for (const variable of [
    '--mx-streak-art-band',
    '--mx-streak-art-size',
    '--mx-streak-title-band',
    '--mx-streak-note-band',
    '--mx-streak-days-band',
  ]) {
    assert.match(streakCss, new RegExp(`${variable}:\\s*\\d+px`), `полоса ${variable}`)
  }
  // Пустой резерв 260 px из финала в серию не переезжает.
  assert.doesNotMatch(streakJsx, /mx-completion__meta/)
  assert.doesNotMatch(streakCss, /--mx-completion-meta-band/)
  assert.doesNotMatch(streakCss, /\.mx-completion__meta/)
})

test('сетка серии: полосы не меняют высоту от числа дней и длины пояснения', () => {
  assert.match(
    streakCss,
    /\.mx-streak-celebration__days\s*{[^}]*min-height:\s*var\(--mx-streak-days-band\)/s
  )
  assert.match(
    streakCss,
    /\.mx-streak-celebration__note\s*{[^}]*min-height:\s*var\(--mx-streak-note-band\)/s
  )
  assert.match(
    streakCss,
    /\.mx-streak-celebration__title\s*{[^}]*min-height:\s*var\(--mx-streak-title-band\)/s
  )
  assert.match(
    streakCss,
    /\.mx-streak-stage__art\s*{[^}]*height:\s*var\(--mx-streak-art-band\)/s
  )
  // Сцена забирает свободную высоту и центрирует композицию.
  assert.match(streakCss, /\.mx-streak-stage\s*{[^}]*flex:\s*1 1 auto/s)
  assert.match(streakCss, /\.mx-streak-stage\s*{[^}]*justify-content:\s*center/s)
})

test('цветок: полноценная иллюстрация, а не значок', () => {
  // Экран серии передаёт размер рисунка явно, а полосы держат 100+ px.
  assert.match(streakJsx, /size=\{148\}/)
  assert.match(glyphsJsx, /viewBox="0 0 100 100"/)
  assert.match(streakCss, /--mx-streak-art-size:\s*(1[0-9]{2})px/)
  const sizes = [...streakCss.matchAll(/--mx-streak-art-size:\s*(\d+)px/g)].map(match => Number(match[1]))
  assert.ok(sizes.length >= 2, 'размер задан для обоих вьюпортов')
  assert.ok(Math.min(...sizes) >= 100, 'на коротком экране символ остаётся иллюстрацией')
})
