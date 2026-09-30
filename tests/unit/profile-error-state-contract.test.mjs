import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../../src/screens/Profile.jsx', import.meta.url), 'utf8')
const settings = await readFile(new URL('../../src/screens/Settings.jsx', import.meta.url), 'utf8')

test('Profile exposes error copy and retry action', () => {
  assert.match(settings, /const \[profileError, setProfileError\] = useState\(false\)/)
  assert.match(source, /Не удалось загрузить профиль/)
  assert.match(source, /role="alert"/)
  assert.match(source, /onClick=\{retryProfile\}/)
  assert.match(settings, /setProfileReloadToken\(token => token \+ 1\)/)
})

test('Profile берёт серию с сервера, без восстановления из истории', () => {
  // Регэксп допускает и однострочный, и отформатированный prettier вид вызова.
  assert.match(settings, /api\.profile\s*\.\s*get\(user\.id\)/)
  assert.doesNotMatch(source, /api\.profile\.get\(user\.id\)/)
  assert.match(source, /api\.streak\(user\.id\)/)
  assert.match(source, /readCanonicalStreakStats\(payload\)/)
  // Числа серии приходят только из canonical-ответа; fallback по истории удалён.
  assert.match(source, /const currentStreak = canonical\?\.currentStreak/)
  assert.match(source, /const bestStreak = canonical\?\.bestStreak/)
  assert.doesNotMatch(source, /canonical\?\.currentStreak \?\? legacy/)
  // Значки серии тоже пересчитываются серверной статистикой.
  assert.match(source, /serverSeriesBadges\(legacy\.badges, canonical, daysInSystem\)/)
  assert.match(source, /buildServerSeriesViewModel/)
  assert.doesNotMatch(source, /\bbuildSeriesViewModel\(/)
  // Восстановление серии из неполной истории не возвращается.
  assert.doesNotMatch(source, /api\.moodPractices\.list/)
  assert.doesNotMatch(source, /api\.practiceDays\.list/)
  assert.doesNotMatch(source, /loadIndependentSources/)
  assert.doesNotMatch(source, /api\.themes\.list/)
  assert.doesNotMatch(source, /api\.analytics\.get/)
  assert.doesNotMatch(source, /Achievements/)
  assert.doesNotMatch(source, /buildPath/)
  assert.doesNotMatch(source, /мой путь/)
})
