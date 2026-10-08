import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const src = fs.readFileSync(new URL('../../src/screens/Onboarding.jsx', import.meta.url), 'utf8')

// ── 1. Двойной тап «Войти» → один запрос ──

test('finish() guarded against double-submit', () => {
  // Флаг submitting проверяется в начале finish()
  assert.match(src, /async function finish\(\)\s*\{[\s\S]*if \(submitting\) return/)
  // Кнопка «Войти» блокируется на время запроса
  assert.match(src, /disabled=\{revealed < PLAN_CARDS\.length \|\| submitting\}/)
})

// ── 2. Ошибка сохранения → онбординг не завершён ──

test('saveSettings error does not call onFinish', () => {
  // В catch-блоке нет вызова onFinish или clearProgress
  const catchBlock = src.match(/catch \(e\)\s*\{[\s\S]*?\}/)
  assert.ok(catchBlock, 'catch block for saveSettings must exist')
  assert.doesNotMatch(catchBlock[0], /onFinish/, 'onFinish must not be called on error')
  assert.doesNotMatch(catchBlock[0], /clearProgress/, 'progress must not be cleared on error')
  // saveError устанавливается
  assert.match(catchBlock[0], /setSaveError\(true\)/)
})

test('save error shows inline retry and skip options', () => {
  assert.match(src, /data-testid="onboarding-save-retry"/)
  assert.match(src, /data-testid="onboarding-save-skip"/)
  assert.match(src, /Не удалось сохранить напоминание/)
})

// ── 3. Восстановление шага после перезапуска ──

test('progress persisted to localStorage and restored on mount', () => {
  // Ключ прогресса
  assert.match(src, /const PROGRESS_KEY = 'mx-onboarding-progress'/)
  // Чтение на mount
  assert.match(src, /const saved = readProgress\(\)/)
  assert.match(src, /useState\(saved\.step/)
  assert.match(src, /useState\(saved\.age/)
  assert.match(src, /useState\(saved\.reminder/)
  // Запись в эффекте
  assert.match(src, /useEffect\([\s\S]*writeProgress\(\{ step, age, reminder \}\)/)
  // Очистка после завершения
  assert.match(src, /clearProgress\(\)/)
})

// ── 4. «До 18» → экран 18+ ──

test('underage selection shows dedicated 18+ screen, not blocked button', () => {
  // Выбор «До 18» устанавливает underage
  assert.match(src, /if \(a === 'До 18'\)\s*\{[\s\S]*setUnderage\(true\)/)
  // Отдельный экран для underage
  assert.match(src, /step === 1 && underage/)
  assert.match(src, /Mentalix доступен с 18 лет/)
  // Кнопка «Закрыть» только в Telegram
  assert.match(src, /platformName === 'telegram'[\s\S]*platform\.close\(\)/)
  // Назад из 18+ возвращает к выбору возраста, а не к приветствию
  assert.match(src, /if \(underage\)\s*\{[\s\S]*setUnderage\(false\)/)
})

// ── 5. localStorage mx-onboarding больше не пишется ──

test('legacy mx-onboarding key is not written', () => {
  assert.doesNotMatch(src, /localStorage\.setItem\('mx-onboarding'/)
  assert.doesNotMatch(src, /mx-onboarding['"]\s*,\s*JSON\.stringify/)
})

// ── 6. Токены дизайн-системы ──

test('side padding uses --mx-screen-x token', () => {
  assert.match(src, /px-\[var\(--mx-screen-x\)\]/)
  // px-14 больше нет на cta-pill
  assert.doesNotMatch(src, /cta-pill[^"]*px-14/)
})

test('radius uses --mx-radius-card token', () => {
  assert.match(src, /rounded-\[var\(--mx-radius-card\)\]/)
})
