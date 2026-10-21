import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  STREAK_DAYS_MAX,
  buildStreakDays,
  litStreakPetals,
  shouldCelebrateStreak,
  streakCelebrationCopy,
  streakDaysWord,
} from '../../src/lib/streakCelebration.js'

function dayKey(offset) {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset))
    .toISOString()
    .slice(0, 10)
}

const checkinSource = await readFile(new URL('../../src/screens/CheckIn.jsx', import.meta.url), 'utf8')
const demoSource = await readFile(new URL('../../src/lib/demoMode.js', import.meta.url), 'utf8')
const componentSource = await readFile(
  new URL('../../src/components/StreakCelebration.jsx', import.meta.url),
  'utf8'
)
const glyphSource = await readFile(
  new URL('../../src/components/StreakGlyphs.jsx', import.meta.url),
  'utf8'
)

test('окончания: 1 день, 2–4 дня, 5+ дней', () => {
  assert.equal(streakDaysWord(1), 'день')
  assert.equal(streakDaysWord(3), 'дня')
  assert.equal(streakDaysWord(5), 'дней')
  assert.equal(streakDaysWord(11), 'дней')
  assert.equal(streakDaysWord(21), 'день')
})

test('заголовки серии: «Серия: 1 день», «Серия: 3 дня», «Серия: 5 дней»', () => {
  assert.equal(streakCelebrationCopy(1).title, 'Серия: 1 день')
  assert.equal(streakCelebrationCopy(3).title, 'Серия: 3 дня')
  assert.equal(streakCelebrationCopy(5).title, 'Серия: 5 дней')
  assert.equal(streakCelebrationCopy(9).title, 'Серия: 9 дней')
  assert.equal(streakCelebrationCopy(21).title, 'Серия: 21 день')
})

test('пояснение спокойное, без обещаний на будущее и без «привычка останется»', () => {
  const copies = [1, 2, 3, 5, 9, 30].map(count => streakCelebrationCopy(count))
  for (const copy of copies) {
    assert.equal(copy.note, 'Один лепесток — один день. Пятый завершает круг.')
    assert.ok(!/привычк/i.test(copy.note), 'нет обещания привычки')
    assert.ok(!/останется/i.test(copy.note), 'нет обещания привычки')
  }
  // Обещание убрано из кода экрана целиком.
  assert.ok(!/привычк[а-я]* которая останется/i.test(componentSource))
})

test('светлые лепестки — дни в текущем круге из пяти', () => {
  assert.equal(litStreakPetals(1), 1)
  assert.equal(litStreakPetals(5), 5)
  assert.equal(litStreakPetals(6), 1)
  assert.equal(litStreakPetals(10), 5)
})

test('ряд дней: только подтверждённые дни серии, до недели', () => {
  const today = dayKey(0)
  assert.equal(STREAK_DAYS_MAX, 7)

  // 1 день — только сегодня: дни до начала серии неизвестны и не рисуются.
  const one = buildStreakDays({ streak: 1, today })
  assert.equal(one.length, 1)
  assert.equal(one[0].key, today)
  assert.equal(one[0].state, 'today')
  assert.equal(buildStreakDays({ streak: 3, today }).length, 3)
  assert.equal(buildStreakDays({ streak: 9, today }).length, 7)
  assert.equal(buildStreakDays({ streak: 30, today }).length, 7)
  assert.deepEqual(buildStreakDays({ streak: 0, today }), [])
})

test('ряд дней: ни один день не помечен пропуском без заморозки', () => {
  const today = dayKey(0)
  for (const streak of [1, 2, 3, 5, 9, 12]) {
    const days = buildStreakDays({ streak, today })
    assert.equal(days.length, Math.min(streak, STREAK_DAYS_MAX))
    assert.deepEqual(
      days.map(day => day.key),
      days.map((_, index) => dayKey(index - (days.length - 1)))
    )
    assert.ok(
      days.slice(0, -1).every(day => day.state === 'done'),
      `серия ${streak}: дни до сегодня — выполненные`
    )
    assert.equal(days.at(-1).state, 'today')
  }
})

test('пропуск мягкой серии — только при заморозке и одиночной дыре в истории', () => {
  const today = dayKey(0)
  const checkins = [{ date: dayKey(-2) }, { date: dayKey(-3) }]
  const withFreeze = buildStreakDays({ streak: 3, checkins, freezeUsed: true, today })
  assert.deepEqual(
    withFreeze.map(day => day.state),
    ['done', 'gap', 'today']
  )
  const noFreeze = buildStreakDays({ streak: 3, checkins, freezeUsed: false, today })
  assert.ok(noFreeze.every(day => day.state !== 'gap'))
})

test('цветок: пять одинаковых лепестков, повёрнутых на 72°, центр пустой', () => {
  // Один путь-лепесток, повторённый пять раз: смеси миндалины и полумесяцев нет.
  assert.equal((glyphSource.match(/^const [A-Z_]+_PATH =/gm) || []).length, 1)
  assert.match(glyphSource, /STREAK_PETALS/)
  assert.match(glyphSource, /360 \/ STREAK_PETALS/)
  assert.match(glyphSource, /rotate\(\$\{index \* \(360 \/ STREAK_PETALS\)\} 50 50\)/)
  // Пустой центр: в разметке цветка нет круга, эллипса или заливки фона.
  const flowerBody = glyphSource.slice(
    glyphSource.indexOf('export function StreakFlower'),
    glyphSource.indexOf('export function StreakFlame')
  )
  assert.ok(!/<circle|<ellipse/.test(flowerBody), 'в центре нет круга')
  assert.ok(!/fill="rgb\(var\(--c-bg\)\)"/.test(flowerBody), 'фон центра не заливается')
})

test('экран показывается только если завершение увеличило серию', () => {
  assert.equal(shouldCelebrateStreak(false, { currentStreak: 3 }), true)
  assert.equal(shouldCelebrateStreak(true, { currentStreak: 3 }), false)
  assert.equal(shouldCelebrateStreak(null, { currentStreak: 3 }), false)
  assert.equal(shouldCelebrateStreak(false, null), false)
  assert.equal(shouldCelebrateStreak(false, { currentStreak: 0 }), false)
})

test('переход: «Сохранить и выйти» → экран серии или «Сегодня»; «Отлично!» → «Сегодня»', () => {
  // 2 в реальном потоке (утро/вечер через exitCompletion) + 1 в DemoCompletionScreen.
  assert.equal((checkinSource.match(/text: 'Сохранить и выйти'/g) || []).length, 3)
  assert.match(checkinSource, /onClick: exitCompletion/)
  assert.match(checkinSource, /run: exitCompletion/)
  assert.match(componentSource, /text: 'Отлично!'/)
  assert.match(componentSource, /useBackButton\(/)
  assert.match(componentSource, /prefers-reduced-motion|StreakCelebration\.css/)
})

test('экран серии не наследует пустой резерв блока отзывов финала', () => {
  assert.ok(!/mx-completion__meta/.test(componentSource), 'нет полосы отзывов финала')
  assert.ok(!/mx-completion__feedback/.test(componentSource), 'нет блока отзывов')
  assert.ok(!/--mx-completion-meta-band/.test(componentSource))
})

test('демо: ?demo=1&action=streak_celebration[&streak_days=N]', () => {
  assert.match(demoSource, /export function previewStreakCelebrationDays\(\)/)
  assert.match(demoSource, /params\.get\('action'\) !== 'streak_celebration'/)
  assert.match(demoSource, /params\.get\('streak_days'\)/)
  assert.match(checkinSource, /previewStreakCelebrationDays\(\)/)
})
