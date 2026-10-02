import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const tabRefreshSource = await readFile(
  new URL('../../src/lib/tabRefresh.js', import.meta.url),
  'utf8'
)
const appSource = await readFile(new URL('../../src/App.jsx', import.meta.url), 'utf8')
const todaySource = await readFile(new URL('../../src/screens/Today.jsx', import.meta.url), 'utf8')
const practicesSource = await readFile(
  new URL('../../src/screens/Practices.jsx', import.meta.url),
  'utf8'
)
const analyticsSource = await readFile(
  new URL('../../src/screens/Analytics.jsx', import.meta.url),
  'utf8'
)
const mentalixSource = await readFile(
  new URL('../../src/screens/Mentalix.jsx', import.meta.url),
  'utf8'
)

test('tabRefresh.js экспортирует dispatchTabRefresh и useTabRefresh', () => {
  assert.match(tabRefreshSource, /export function dispatchTabRefresh/)
  assert.match(tabRefreshSource, /export function useTabRefresh/)
  assert.match(tabRefreshSource, /mentalix:tab-refresh/)
})

test('useTabRefresh использует ref для handler — не перезапускает эффект при смене handler', () => {
  assert.match(tabRefreshSource, /handlerRef\.current = handler/)
  assert.match(tabRefreshSource, /handlerRef\.current\(\)/)
})

test('App.jsx отправляет tab-refresh при переключении вкладки', () => {
  assert.match(appSource, /import \{[^}]*dispatchTabRefresh[^}]*\} from '\.\/lib\/tabRefresh'/)
  // При повторном тапе по активной вкладке
  assert.match(appSource, /if \(key === tab\) \{[\s\S]*?dispatchTabRefresh\(key\)/)
  // При переключении на другую вкладку
  assert.match(appSource, /setTab\(key\)[\s\S]*?dispatchTabRefresh\(key\)/)
})

test('App.jsx отправляет tab-refresh при возврате из фона (visibilitychange)', () => {
  assert.match(
    appSource,
    /if \(document\.hidden\) return[\s\S]*?dispatchTabRefresh\(tabRef\.current\)/
  )
})

test('App.jsx отправляет tab-refresh при закрытии оверлея настроек', () => {
  assert.match(appSource, /setOverlay\(null\)[\s\S]*?dispatchTabRefresh\(tabRef\.current\)/)
})

test('Today.jsx слушает tab-refresh и инвалидирует кеш для тихого обновления', () => {
  assert.match(todaySource, /import \{ useTabRefresh \} from '\.\.\/lib\/tabRefresh'/)
  assert.match(todaySource, /useTabRefresh\('today'/)
  assert.match(todaySource, /invalidateTodayData\(user\.id\)/)
  assert.match(todaySource, /setReloadToken/)
})

test('Practices.jsx слушает tab-refresh и делает тихий force-рефетч', () => {
  assert.match(practicesSource, /import \{[^}]*useTabRefresh[^}]*\} from '\.\.\/lib\/tabRefresh'/)
  assert.match(practicesSource, /useTabRefresh\('practices'/)
  assert.match(practicesSource, /fetchPracticesData\(user\.id, \{[\s\S]*?force: true[\s\S]*?\}/)
  // Обновление при закрытии вложенного экрана (Rituals/Ascezas)
  assert.match(practicesSource, /prevSub\.current !== null && sub === null/)
})

test('Analytics.jsx слушает tab-refresh и перезапускает загрузку', () => {
  assert.match(analyticsSource, /import \{[^}]*useTabRefresh[^}]*\} from '\.\.\/lib\/tabRefresh'/)
  assert.match(analyticsSource, /useTabRefresh\('trends'/)
  assert.match(analyticsSource, /setReloadKey\(k => k \+ 1\)/)
})

test('Mentalix.jsx слушает tab-refresh и инвалидирует историю диалога', () => {
  assert.match(mentalixSource, /import \{ useTabRefresh \} from '\.\.\/lib\/tabRefresh'/)
  assert.match(mentalixSource, /useTabRefresh\('mentor'/)
  assert.match(mentalixSource, /invalidateHistory\(user\.id, persona\)/)
  assert.match(mentalixSource, /refreshSignal/)
})
