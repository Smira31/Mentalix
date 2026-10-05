import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(
  new URL('../../src/screens/Daimon/DaimonFlow.jsx', import.meta.url),
  'utf8'
)

/* ── Bug 1: ошибка загрузки истории клетки ── */

test('ошибка загрузки истории отслеживается состоянием, а не молча проглатывается', () => {
  // Старый код: catch { thread = [] } — ошибка невидима, thread пустой,
  // затем sendChat('') молча начинает разговор заново.
  assert.match(source, /historyError/)
  assert.doesNotMatch(source, /catch\s*\{\s*thread\s*=\s*\[\]\s*\}/)
})

test('при ошибке загрузки истории разговор не начинается заново — sendChat недостижим', () => {
  // После исправления есть guard (historyFailed) с return до ветки sendChat('').
  assert.match(source, /historyFailed/)
  assert.match(source, /historyFailed[\s\S]*?return/)
})

test('ошибка загрузки истории видна пользователю и есть кнопка повтора', () => {
  // Функция повтора загрузки истории.
  assert.match(source, /loadCellHistory/)
  // Рендер: historyError связан с onRetry (экран ошибки с кнопкой).
  assert.match(source, /historyError[\s\S]*?onRetry/)
})

/* ── Bug 2: ошибка броска кубика ── */

test('ошибка броска кубика отображается на поле, а не только сохраняется в состоянии', () => {
  // Старый код: setError('Не удалось бросить кубик') — но на поле не показывается
  // (paywallMessage показывает только error?.includes('На сегодня')).
  assert.match(source, /daimon-roll-error/)
})

test('при ошибке броска есть кнопка «Повторить»', () => {
  assert.match(source, /daimon-roll-retry/)
})

/* ── Регресс: уже обработанные ошибки отправки сообщений не сломаны ── */

test('кнопка повтора отправки сообщения в разговоре сохранена', () => {
  assert.match(source, /daimon-chat-retry/)
  assert.match(source, /failed\.text/)
})
