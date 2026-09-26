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

test('Profile fetches profile + series data (buildSeriesViewModel) — no path, themes, analytics or achievements', () => {
  assert.match(settings, /api\.profile\.get\(user\.id\)/)
  assert.doesNotMatch(source, /api\.profile\.get\(user\.id\)/)
  // Серия «Лучшая серия» считается через buildSeriesViewModel — тот же
  // источник, что огонёк в шапке Today. Для этого нужны checkins, rituals,
  // ascezas, moodPractices и practiceDays.
  assert.match(source, /buildSeriesViewModel/)
  assert.doesNotMatch(source, /loadIndependentSources/)
  assert.doesNotMatch(source, /api\.themes\.list/)
  assert.doesNotMatch(source, /api\.analytics\.get/)
  assert.doesNotMatch(source, /Achievements/)
  assert.doesNotMatch(source, /buildPath/)
  assert.doesNotMatch(source, /мой путь/)
})
