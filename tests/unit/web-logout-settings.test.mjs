// ISSUE #1163: «Выйти из аккаунта» в настройках веба и PWA.
//
// Контракт поверхности: пункт есть только вне Telegram (в Mini App его нет),
// выход спрашивает подтверждение в окне дизайн-системы, вызывает
// api.auth.logout() и возвращает экран входа через состояние App
// (без перезагрузки страницы). Токен не логируется.

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

// Общее окно появляется только в этой задаче, поэтому на основном коде
// файла ещё нет — читаем безопасно, чтобы падение было по контракту,
// а не по ENOENT на загрузке теста.
async function readSource(relative) {
  try {
    return await readFile(new URL(relative, import.meta.url), 'utf8')
  } catch {
    return ''
  }
}

const settingsSource = await readSource('../../src/screens/Settings.jsx')
const appSource = await readSource('../../src/App.jsx')
const apiSource = await readSource('../../src/lib/api.js')
const confirmDialogSource = await readSource('../../src/components/ConfirmDialog.jsx')

test('#1163: пункт «Выйти из аккаунта» есть только вне Telegram и не у гостя', () => {
  assert.match(settingsSource, /testId="profile-row-logout"/)
  assert.match(settingsSource, /Выйти из аккаунта/)
  // Условие строки: веб/PWA (не telegram) и не гостевой пользователь.
  assert.match(
    settingsSource,
    /\{!guest && platformName !== 'telegram' && \(\s*<ProfileRow[\s\S]*?profile-row-logout/
  )
})

test('#1163: перед выходом — подтверждение в существующем окне дизайн-системы', () => {
  assert.match(settingsSource, /<ConfirmDialog/)
  assert.match(settingsSource, /title="Выйти из аккаунта\?"/)
  assert.match(settingsSource, /confirmLabel=\{loggingOut \? 'Выходим…' : 'Выйти'\}/)
  // Кнопка «Отмена» — существующая подпись по умолчанию общего окна.
  assert.match(confirmDialogSource, /cancelLabel = 'Отмена'/)
  assert.match(confirmDialogSource, /role="dialog"/)
})

test('#1163: «Выйти» вызывает api.auth.logout и сбрасывает сессию приложения', () => {
  assert.match(settingsSource, /await api\.auth\.logout\(\)/)
  assert.match(settingsSource, /platform\.clearUser\?\.\(\)/)
  assert.match(settingsSource, /onLoggedOut\?\.\(\)/)
})

test('#1163: App показывает экран входа после выхода без перезагрузки', () => {
  const loggedOutHandler = appSource.match(/onLoggedOut=\{[^}]*\}/)
  assert.ok(loggedOutHandler, 'Settings должен получать onLoggedOut')
  assert.match(appSource, /<Settings[\s\S]*?onLoggedOut=/)
  // Сброс пользователя возвращает существующую ветку WebAuthScreen.
  assert.match(loggedOutHandler[0], /setUser\(null\)/)
})

test('#1163: после выхода автосоздание гостя не возвращает в приложение', () => {
  // На боевом хосте checkAuth создаёт гостя при отсутствии сессии; после
  // намеренного выхода это запрещено, иначе обновление не открывает вход.
  assert.match(settingsSource, /markWebLoggedOut\(\)/)
  assert.match(appSource, /canAutoCreateGuest\(\) && !isWebLoggedOut\(\)/)
  assert.match(appSource, /clearWebLoggedOut\(\)/)
})

test('#1163: api.auth.logout по-прежнему очищает токен в finally', () => {
  assert.match(
    apiSource,
    /logout: async \(\) => \{[\s\S]*?finally \{\s*platform\.clearSessionToken\?\.\(\)\s*\}/
  )
})

test('#1163: в настройках не логируется токен', () => {
  // Выход не выводит ни токен, ни заголовок авторизации в консоль.
  assert.doesNotMatch(settingsSource, /console\.(log|info|debug)/)
  assert.doesNotMatch(settingsSource, /Authorization/)
})
