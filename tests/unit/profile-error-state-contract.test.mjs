import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../../src/screens/Profile.jsx', import.meta.url), 'utf8')

test('Profile exposes explicit domain status, auth/error copy, and retry action', () => {
  assert.match(source, /const \[loadResult, setLoadResult\] = useState\(null\)/)
  assert.match(source, /Профиль требует повторной авторизации/)
  assert.match(source, /Не удалось загрузить профиль и историю пути/)
  assert.match(source, /role="alert"/)
  assert.match(source, /onClick=\{retryProfile\}/)
  assert.match(source, /setReloadToken\(token => token \+ 1\)/)
})

test('Profile loads path sources independently and never masks failures as empty arrays', () => {
  assert.match(source, /loadIndependentSources\(/)
  assert.match(source, /profile: \(\) => api\.profile\.get\(user\.id\)/)
  assert.match(source, /checkins: \(\) => api\.checkin\.history\(user\.id, 90\)/)
  assert.match(source, /ascezas: \(\) => api\.ascezas\.list\(user\.id\)/)
  assert.match(source, /rituals: \(\) => api\.rituals\.list\(user\.id\)/)
  assert.doesNotMatch(source, /\.catch\(\(\) => \[\]\)/)
  assert.match(source, /retrySources\(previous\)/)
})
