import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../../src/screens/Profile.jsx', import.meta.url), 'utf8')

test('Profile exposes an explicit load error and retry action', () => {
  assert.match(source, /const \[loadError, setLoadError\] = useState\(false\)/)
  assert.match(source, /Не удалось загрузить профиль и историю пути/)
  assert.match(source, /role="alert"/)
  assert.match(source, /onClick=\{retryProfile\}/)
  assert.match(source, /setReloadToken\(token => token \+ 1\)/)
})

test('Profile keeps partial secondary data fallbacks but does not mask primary profile failure', () => {
  assert.match(source, /api\.profile\.get\(user\.id\),/)
  assert.match(source, /\.catch\(\(\) => \[\]\)/)
  assert.match(source, /\.catch\(\(\) => \{\s*if \(active\) setLoadError\(true\)/)
})
