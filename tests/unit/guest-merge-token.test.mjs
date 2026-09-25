import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../../src/lib/guestAuth.js', import.meta.url), 'utf8')

/* ── Контракт: константы ── */

test('GUEST_MERGE_TOKEN_KEY — стабильный ключ localStorage', () => {
  assert.match(source, /export const GUEST_MERGE_TOKEN_KEY = 'mentalix_guest_merge_token'/)
})

test('GUEST_MERGED_EVENT — имя события для App.jsx', () => {
  assert.match(source, /export const GUEST_MERGED_EVENT = 'mentalix:guest-merged'/)
})

/* ── Контракт: isGuestUser ── */

test('isGuestUser возвращает true только при user.is_guest === true', () => {
  assert.match(source, /export function isGuestUser\(user\)/)
  assert.match(source, /return Boolean\(user\?\.is_guest\)/)
})

/* ── Контракт: управление merge_token в localStorage ── */

test('getGuestMergeToken читает из localStorage по ключу', () => {
  assert.match(source, /export function getGuestMergeToken\(\)/)
  assert.match(source, /window\.localStorage\.getItem\(GUEST_MERGE_TOKEN_KEY\)/)
})

test('setGuestMergeToken записывает токен в localStorage', () => {
  assert.match(source, /export function setGuestMergeToken\(token\)/)
  assert.match(source, /window\.localStorage\.setItem\(GUEST_MERGE_TOKEN_KEY, token\)/)
  assert.match(source, /!token\) return/)
})

test('clearGuestMergeToken удаляет токен из localStorage', () => {
  assert.match(source, /export function clearGuestMergeToken\(\)/)
  assert.match(source, /window\.localStorage\.removeItem\(GUEST_MERGE_TOKEN_KEY\)/)
})

/* ── Контракт: resetGuestState ── */

test('resetGuestState очищает токен и вызывает platform.clearUser', () => {
  assert.match(source, /export function resetGuestState\(\)/)
  assert.match(source, /clearGuestMergeToken\(\)/)
  assert.match(source, /platform\.clearUser\?\.()/)
})

/* ── Контракт: dispatchGuestMerged ── */

test('dispatchGuestMerged отправляет CustomEvent с правильным именем', () => {
  assert.match(source, /export function dispatchGuestMerged\(\)/)
  assert.match(source, /window\.dispatchEvent\(new CustomEvent\(GUEST_MERGED_EVENT\)\)/)
})

/* ── Контракт: attemptGuestMerge — нет токена ── */

test('attemptGuestMerge возвращает null если нет merge_token', () => {
  assert.match(source, /const token = getGuestMergeToken\(\)/)
  assert.match(source, /if \(!token\) return null/)
})

/* ── Контракт: attemptGuestMerge — обработка кодов ответа ── */

test('attemptGuestMerge: 200 ok — очищает токен и возвращает user', () => {
  // После успешного переноса токен удаляется
  assert.match(source, /clearGuestMergeToken\(\)/)
  assert.match(source, /return result\?\.user \|\| null/)
})

test('attemptGuestMerge: 404 guest_not_found — очищает токен, возвращает null', () => {
  assert.match(source, /status === 404 \|\| detail\.includes\('guest_not_found'\)/)
  assert.match(source, /clearGuestMergeToken\(\)/)
  assert.match(source, /return null/)
})

test('attemptGuestMerge: 409 guest_already_merged — очищает токен, возвращает null', () => {
  assert.match(source, /status === 409 && detail\.includes\('guest_already_merged'\)/)
  assert.match(source, /clearGuestMergeToken\(\)/)
  assert.match(source, /return null/)
})

test('attemptGuestMerge: 401 authenticated_account_required — оставляет токен, возвращает null', () => {
  assert.match(source, /status === 401 && detail\.includes\('authenticated_account_required'\)/)
  // После этого блока нет clearGuestMergeToken — токен сохраняется
  assert.match(source, /return null/)
})

test('attemptGuestMerge: 409 cannot_merge_into_guest — оставляет токен, возвращает null', () => {
  assert.match(source, /status === 409 && detail\.includes\('cannot_merge_into_guest'\)/)
  assert.match(source, /return null/)
})

test('attemptGuestMerge: прочие ошибки — оставляет токен, не блокирует вход', () => {
  // Последний return null в catch — для всех необработанных ошибок
  assert.match(source, /\/\/ Прочие ошибки — токен оставляем, не блокируем вход\./)
  assert.match(source, /return null/)
})

/* ── Контракт: API-эндпоинты в api.js ── */

test('api.js определяет guest и guestMerge эндпоинты', async () => {
  const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')
  assert.match(apiSource, /guest:\s*\(\)\s*=>\s*request\('\/auth\/guest'/)
  assert.match(apiSource, /guestMerge:\s*mergeToken\s*=>\s*request\('\/auth\/guest\/merge'/)
})

/* ── Контракт: 401 guest_merged в api.js ── */

test('api.js обрабатывает 401 guest_merged — сбрасывает гостевое состояние', async () => {
  const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')
  assert.match(apiSource, /res\.status === 401 && raw\.includes\('guest_merged'\)/)
  assert.match(apiSource, /resetGuestState\(\)/)
  assert.match(apiSource, /dispatchGuestMerged\(\)/)
})

/* ── Контракт: демо-гостевой режим в demoMode.js ── */

test('demoMode.js экспортирует isDemoGuestMode и DEMO_GUEST_USER', async () => {
  const demoSource = await readFile(new URL('../../src/lib/demoMode.js', import.meta.url), 'utf8')
  assert.match(demoSource, /export const DEMO_GUEST_USER/)
  assert.match(demoSource, /is_guest: true/)
  assert.match(demoSource, /export function isDemoGuestMode\(\)/)
  assert.match(demoSource, /isPreviewDemoMode\(\) && new URLSearchParams/)
  assert.match(demoSource, /get\('guest'\) === '1'/)
})

test('demoMode.js: демо-эндпоинт /auth/guest возвращает merge_token и user', async () => {
  const demoSource = await readFile(new URL('../../src/lib/demoMode.js', import.meta.url), 'utf8')
  assert.match(demoSource, /\/auth\/guest' && method === 'POST'/)
  assert.match(demoSource, /merge_token: 'demo-guest-merge-token'/)
  assert.match(demoSource, /user: DEMO_GUEST_USER/)
})

test('demoMode.js: демо-эндпоинт /auth/guest/merge возвращает user', async () => {
  const demoSource = await readFile(new URL('../../src/lib/demoMode.js', import.meta.url), 'utf8')
  assert.match(demoSource, /\/auth\/guest\/merge' && method === 'POST'/)
  assert.match(demoSource, /user: \{ \.\.\.DEMO_USER, merged_from_guest: true \}/)
})

/* ── Контракт: App.jsx использует демо-гостевой режим ── */

test('App.jsx: демо-гость переключается через useEffect при isDemoGuestMode', async () => {
  const appSource = await readFile(new URL('../../src/App.jsx', import.meta.url), 'utf8')
  assert.match(appSource, /useState\(\(\) => \(isPreviewDemoMode\(\) \? DEMO_USER : null\)\)/)
  assert.match(appSource, /isDemoGuestMode\(\)/)
  assert.match(appSource, /setUser\(DEMO_GUEST_USER\)/)
})

test('App.jsx: слушает GUEST_MERGED_EVENT и сбрасывает user', async () => {
  const appSource = await readFile(new URL('../../src/App.jsx', import.meta.url), 'utf8')
  assert.match(appSource, /GUEST_MERGED_EVENT/)
  assert.match(appSource, /addEventListener\(GUEST_MERGED_EVENT, handleGuestMerged\)/)
  assert.match(appSource, /setUser\(null\)/)
})

/* ── Контракт: WebAuthScreen — гостевой вход и merge ── */

test('WebAuthScreen: кнопка «Продолжить без входа» использует общий гостевой вход', async () => {
  const screenSource = await readFile(
    new URL('../../src/screens/WebAuthScreen.jsx', import.meta.url),
    'utf8'
  )
  assert.match(screenSource, /handleGuestLogin/)
  assert.match(screenSource, /loginAsGuest\(api, onAuthed\)/)
  assert.match(source, /apiInstance\.auth\.guest\(\)/)
  assert.match(source, /setGuestMergeToken\(result\.merge_token\)/)
  assert.match(screenSource, /data-testid="web-auth-guest-button"/)
})

test('WebAuthScreen: merge после email и Telegram входа', async () => {
  const screenSource = await readFile(
    new URL('../../src/screens/WebAuthScreen.jsx', import.meta.url),
    'utf8'
  )
  assert.match(screenSource, /attemptGuestMerge\(api\)/)
  assert.match(screenSource, /onAuthed\(mergedUser \|\| result\.user\)/)
})

/* ── Контракт: Mentalix — блокировка AI для гостя ── */

test('Mentalix.jsx: 403 guest_ai_forbidden обрабатывается', async () => {
  const mentalixSource = await readFile(
    new URL('../../src/screens/Mentalix.jsx', import.meta.url),
    'utf8'
  )
  assert.match(mentalixSource, /isGuestAiForbidden/)
  assert.match(mentalixSource, /error\?\.status === 403/)
  assert.match(mentalixSource, /guest_ai_forbidden/)
  assert.match(mentalixSource, /GuestAiGate/)
  assert.match(mentalixSource, /data-testid="guest-ai-gate"/)
})

/* ── Контракт: Settings — гостевые подсказки ── */

test('Settings.jsx: гостевой email-вход не сбрасывает merge-токен', async () => {
  const settingsSource = await readFile(
    new URL('../../src/screens/Settings.jsx', import.meta.url),
    'utf8'
  )
  assert.match(settingsSource, /isGuestUser\(user\)/)
  assert.match(settingsSource, /title="Сохранить прогресс по email"/)
  assert.match(settingsSource, /onClick=\{onGuestLogin\}/)
  assert.doesNotMatch(settingsSource, /resetGuestState\(\)/)
})
