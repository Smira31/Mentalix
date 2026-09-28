import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
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

test('окончания: 1 день, 2–4 дня, 5+ дней', () => {
  assert.equal(streakDaysWord(1), 'день')
  assert.equal(streakDaysWord(3), 'дня')
  assert.equal(streakDaysWord(5), 'дней')
  assert.equal(streakDaysWord(11), 'дней')
  assert.equal(streakDaysWord(21), 'день')
})

test('тексты экрана серии по числу дней', () => {
  assert.deepEqual(streakCelebrationCopy(1), {
    title: 'Серия 1 день.',
    body: 'Первый шаг сделан. Путь начинается здесь!',
  })
  assert.equal(streakCelebrationCopy(2).body, 'Два дня подряд. Ты набираешь ход!')
  assert.equal(streakCelebrationCopy(3).title, 'Серия 3 дня.')
  assert.equal(streakCelebrationCopy(3).body, 'Три дня подряд. Привычка крепнет!')
  assert.equal(streakCelebrationCopy(6).body, 'Так держать. Ты строишь привычку, которая останется!')
})

test('светлые лепестки — дни в текущем круге из пяти', () => {
  assert.equal(litStreakPetals(1), 1)
  assert.equal(litStreakPetals(5), 5)
  assert.equal(litStreakPetals(6), 1)
  assert.equal(litStreakPetals(10), 5)
})

test('кружки дней: максимум 7, сегодня — огонёк, прошлые — галочка', () => {
  const today = dayKey(0)
  const three = buildStreakDays({ streak: 3, today })
  assert.deepEqual(
    three.map(day => day.state),
    ['done', 'done', 'today']
  )
  assert.equal(three[2].key, today)
  assert.equal(buildStreakDays({ streak: 12, today }).length, 7)
  assert.deepEqual(buildStreakDays({ streak: 0, today }), [])
})

test('пропуск мягкой серии — только при заморозке и одиночной дыре в истории', () => {
  const today = dayKey(0)
  const checkins = [{ date: dayKey(-2) }, { date: dayKey(-3) }]
  const withFreeze = buildStreakDays({ streak: 3, checkins, freezeUsed: true, today })
  assert.deepEqual(
    withFreeze.map(day => day.state),
    ['done', 'done', 'gap', 'today']
  )
  const noFreeze = buildStreakDays({ streak: 3, checkins, freezeUsed: false, today })
  assert.ok(noFreeze.every(day => day.state !== 'gap'))
})

test('экран показывается только если завершение увеличило серию', () => {
  assert.equal(shouldCelebrateStreak(false, { currentStreak: 3 }), true)
  assert.equal(shouldCelebrateStreak(true, { currentStreak: 3 }), false)
  assert.equal(shouldCelebrateStreak(null, { currentStreak: 3 }), false)
  assert.equal(shouldCelebrateStreak(false, null), false)
  assert.equal(shouldCelebrateStreak(false, { currentStreak: 0 }), false)
})

test('переход: «Сохранить и выйти» → экран серии или «Сегодня»; «Отлично!» → «Сегодня»', () => {
  assert.equal((checkinSource.match(/text: 'Сохранить и выйти'/g) || []).length, 2)
  assert.match(checkinSource, /onClick: exitCompletion/)
  assert.match(checkinSource, /run: exitCompletion/)
  assert.match(componentSource, /text: 'Отлично!'/)
  assert.match(componentSource, /useBackButton\(/)
  assert.match(componentSource, /prefers-reduced-motion|StreakCelebration\.css/)
})

test('демо: ?demo=1&action=streak_celebration[&streak_days=N]', () => {
  assert.match(demoSource, /export function previewStreakCelebrationDays\(\)/)
  assert.match(demoSource, /params\.get\('action'\) !== 'streak_celebration'/)
  assert.match(demoSource, /params\.get\('streak_days'\)/)
  assert.match(checkinSource, /previewStreakCelebrationDays\(\)/)
})
