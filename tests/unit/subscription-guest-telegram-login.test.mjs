import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

/*
 * PAY-UI-001 (гость в вебе): экран «Подписка» ведёт во вход через Telegram.
 *
 * Рабочий вход на вебе — Telegram Login (POST /api/auth/telegram/login), а вход
 * по email выключен флагом VITE_EMAIL_LOGIN_ENABLED=false, пока у проекта нет
 * своего домена в Resend. Поэтому гость в вебе не должен видеть упоминаний email,
 * а кнопка ведёт в тот же экран входа (WebAuthScreen с Telegram Login), что и
 * прежняя «Сохранить прогресс по email»: нового флоу не появилось.
 */

const { webGuestLoginCopy } = await import(
  new URL('../../src/lib/yookassaCheckout.js', import.meta.url)
)

const screen = readFileSync(
  new URL('../../src/screens/SubscriptionManager.jsx', import.meta.url),
  'utf8'
)

test('вход по email выключен — на экране гостя нет ни слова про email', () => {
  const copy = webGuestLoginCopy({ emailLoginEnabled: false })

  assert.equal(copy.heading, 'Войди через Telegram, чтобы оформить Pro')
  assert.equal(copy.pitch, 'Так подписка привяжется к твоему аккаунту, а записи не потеряются.')
  assert.equal(copy.cta, 'Войти через Telegram')
  assert.equal(copy.emailCta, null)

  for (const text of [copy.heading, copy.pitch, copy.cta]) {
    assert.doesNotMatch(text, /email|почт/i)
  }
})

test('вход по email включён — он остаётся вторичным способом, Telegram основным', () => {
  const copy = webGuestLoginCopy({ emailLoginEnabled: true })

  assert.equal(copy.emailCta, 'Войти по email')
  assert.equal(copy.cta, 'Войти через Telegram')
  assert.equal(copy.heading, 'Войди через Telegram, чтобы оформить Pro')
})

test('копия гостя в вебе зависит от флага и рисуется только в вебе', () => {
  // Копия берётся из флага сборки, а не из константы.
  assert.match(screen, /const emailLoginEnabled = import\.meta\.env\.VITE_EMAIL_LOGIN_ENABLED !== 'false'/)
  assert.match(screen, /webGuestLoginCopy\(\{ emailLoginEnabled \}\)/)
  // Ветка Telegram не тронута: там прежний текст про сохранение прогресса.
  assert.match(screen, /Telegram: прежний сценарий — сохранение прогресса по email/)
  // Ссылка на email появляется только когда копия её даёт.
  assert.match(screen, /\{copy\.emailCta && \(/)
})

test('кнопка гостя ведёт в существующий вход через Telegram и возвращает к оплате', () => {
  // Тот же onGuestLogin (WebAuthScreen с Telegram Login), что и раньше.
  assert.match(screen, /onClick=\{onGuestCta\}/)
  assert.match(screen, /onGuestLogin\?\.\(\)/)
  // Механизм возврата к оплате после входа не менялся.
  assert.match(screen, /beginGuestCheckout\(\)/)
  assert.match(screen, /if \(!consumeGuestCheckout\(\)\) return/)
})

test('вошедший без email в вебе — не гость (иначе оплата недоступна)', () => {
  // После Telegram Login адреса почты у аккаунта нет: признак гостя для веба —
  // только is_guest, а «нет email» остаётся признаком Telegram-экрана.
  assert.match(
    screen,
    /const isGuest = !user \|\| Boolean\(user\.is_guest\) \|\| \(inTelegram && !user\.email\)/
  )
})
