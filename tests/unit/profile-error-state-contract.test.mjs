import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../../src/screens/Profile.jsx', import.meta.url), 'utf8')

test('Profile exposes error copy and retry action', () => {
  assert.match(source, /const \[error, setError\] = useState\(false\)/)
  assert.match(source, /Не удалось загрузить профиль/)
  assert.match(source, /role="alert"/)
  assert.match(source, /onClick=\{retryProfile\}/)
  assert.match(source, /setReloadToken\(token => token \+ 1\)/)
})

test('Profile fetches only the profile endpoint — no path, themes, analytics, checkins, ascezas or rituals', () => {
  assert.match(source, /api\.profile\s+\.get\(user\.id\)/)
  assert.doesNotMatch(source, /loadIndependentSources/)
  assert.doesNotMatch(source, /api\.checkin\.history/)
  assert.doesNotMatch(source, /api\.ascezas\.list/)
  assert.doesNotMatch(source, /api\.rituals\.list/)
  assert.doesNotMatch(source, /api\.themes\.list/)
  assert.doesNotMatch(source, /api\.analytics\.get/)
  assert.doesNotMatch(source, /Achievements/)
  assert.doesNotMatch(source, /buildPath/)
  assert.doesNotMatch(source, /мой путь/)
})
