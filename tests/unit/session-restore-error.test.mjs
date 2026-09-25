import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const appSource = await readFile(new URL('../../src/App.jsx', import.meta.url), 'utf8')
const errorComponent = await readFile(
  new URL('../../src/components/SessionRestoreError.jsx', import.meta.url),
  'utf8'
)

test('App отслеживает authError отдельно от отсутствия сессии', () => {
  assert.match(appSource, /const \[authError, setAuthError\] = useState\(null\)/)
})

test('checkAuth вынесен в callback для повторного запуска', () => {
  assert.match(appSource, /const checkAuth = useCallback\(async \(\) => \{/)
  assert.match(appSource, /const existing = await platform\.requestAuth\(\)/)
})

test('retryAuth сбрасывает authChecked и перезапускает checkAuth', () => {
  assert.match(appSource, /const retryAuth = useCallback\(\(\) => \{/)
  assert.match(appSource, /setAuthChecked\(false\)/)
  assert.match(appSource, /checkAuth\(\)/)
})

test('экран ошибки показывается до WebAuthScreen только для web', () => {
  assert.match(appSource, /authError && !user && platformName === 'web'/)
  assert.match(appSource, /SessionRestoreError onRetry=\{retryAuth\}/)
})

test('WebAuthScreen, Onboarding и AppLock загружаются lazy', () => {
  assert.match(appSource, /const WebAuthScreen = lazy\(\(\) => import\('\.\/screens\/WebAuthScreen'\)\)/)
  assert.match(appSource, /const Onboarding = lazy\(\(\) => import\('\.\/screens\/Onboarding'\)\)/)
  assert.match(appSource, /const AppLock = lazy\(\(\) => import\('\.\/screens\/AppLock'\)\)/)
})

test('lazy-экраны обёрнуты в Suspense с fallback Splash', () => {
  assert.match(appSource, /<Suspense fallback=\{<Splash \/>\}>[\s\S]*<Onboarding/)
  assert.match(appSource, /<Suspense fallback=\{<Splash \/>\}>[\s\S]*<WebAuthScreen/)
  assert.match(appSource, /<Suspense fallback=\{<Splash \/>\}>[\s\S]*<AppLock/)
})

test('SessionRestoreError показывает сообщение и кнопку «Повторить»', () => {
  assert.match(errorComponent, /Не удалось связаться с сервером/)
  assert.match(errorComponent, /Повторить/)
  assert.match(errorComponent, /data-testid="session-retry-button"/)
  assert.match(errorComponent, /onRetry/)
})

test('SessionRestoreError использует только русские тексты для пользователя', () => {
  assert.match(errorComponent, /Не удалось связаться с сервером/)
  assert.match(errorComponent, /Проверь подключение и попробуй снова/)
  assert.match(errorComponent, /Повторить/)
})
