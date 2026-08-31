import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [todaySource, cacheSource] = await Promise.all([
  readFile(new URL('../../src/screens/Today.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../src/lib/todayDataCache.js', import.meta.url), 'utf8'),
])

test('Today показывает отдельное error-state и повторяет загрузку вместо empty-state', () => {
  assert.match(todaySource, /const \[loadError, setLoadError\] = useState\(false\)/)
  assert.match(todaySource, /function retryTodayData\(\)[\s\S]*invalidateTodayData\(user\.id\)[\s\S]*setReloadToken/)
  assert.match(todaySource, /if \(loadError\)[\s\S]*Не удалось загрузить день[\s\S]*role="alert"[\s\S]*onClick=\{retryTodayData\}/)
})

test('Критичные данные Today не подменяются fallback и не кэшируются после ошибки', () => {
  assert.match(cacheSource, /api\.rituals\.list\(userId\),/)
  assert.match(cacheSource, /api\.ascezas\.list\(userId\),/)
  assert.match(cacheSource, /api\.checkin\.today\(userId\),/)
  assert.match(cacheSource, /api\.profile\.getSettings\(userId\),/)
  assert.doesNotMatch(cacheSource, /api\.checkin\.today\(userId\)\.catch/)
  assert.doesNotMatch(cacheSource, /api\.profile\.getSettings\(userId\)\.catch/)
  assert.match(cacheSource, /Promise\.all\([\s\S]*api\.checkin\.today\(userId\),[\s\S]*\.then\(\(\[rituals, ascezas, quote, checkin, themes, settings\]\) => \{[\s\S]*cache\.set/)
})

