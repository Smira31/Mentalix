import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  AVAILABLE_PRACTICES,
  PRACTICE_KEYS,
  isPracticeAvailable,
} from '../../src/config/practiceAvailability.js'
import { withQuery } from '../../src/lib/apiQuery.js'
import {
  MOOD_CHECK_CHECKIN_ERROR,
  shouldShowMoodCheckGate,
} from '../../src/lib/moodCheckGate.js'

test('allowlist сохраняет текущие шесть доступных практик', () => {
  assert.deepEqual(AVAILABLE_PRACTICES, [
    'rituals',
    'ascezas',
    'first-step',
    'no-blame',
    'narrow-focus',
    'one-finish',
  ])

  assert.equal(isPracticeAvailable(PRACTICE_KEYS.brain), false)
  assert.equal(isPracticeAvailable(PRACTICE_KEYS.breathing), false)
  assert.equal(isPracticeAvailable(PRACTICE_KEYS.focus), false)
  assert.equal(isPracticeAvailable(PRACTICE_KEYS.meditation), false)
  assert.equal(isPracticeAvailable('unknown-practice'), false)
})

test('withQuery сохраняет порядок и кодирует значения', () => {
  assert.equal(
    withQuery('/mentalix/messages', { user_id: 42, persona: 'mentor & guide' }),
    '/mentalix/messages?user_id=42&persona=mentor+%26+guide'
  )
})

test('withQuery пропускает только null/undefined и не добавляет пустой query', () => {
  assert.equal(withQuery('/articles'), '/articles')
  assert.equal(
    withQuery('/example', { empty: null, missing: undefined, zero: 0, disabled: false }),
    '/example?zero=0&disabled=false'
  )
})

test('MXL-MOOD-CHECK-ERROR-GUARD-001 не блокирует запуск при неизвестном check-in state', () => {
  const base = {
    user: { id: 1 },
    onboarded: true,
    locked: false,
    enabled: true,
    dismissedToday: false,
  }

  assert.equal(shouldShowMoodCheckGate({ ...base, todayCheckin: null }), true)
  assert.equal(shouldShowMoodCheckGate({ ...base, todayCheckin: undefined }), false)
  assert.equal(
    shouldShowMoodCheckGate({ ...base, todayCheckin: MOOD_CHECK_CHECKIN_ERROR }),
    false
  )
  assert.equal(shouldShowMoodCheckGate({ ...base, todayCheckin: { id: 10 } }), false)
})

test('preview cleanup подтверждает удаление до очистки state и уведомления', () => {
  const source = readFileSync(new URL('../../scripts/preview-stop.ps1', import.meta.url), 'utf8')
  const launcher = readFileSync(
    new URL('../../scripts/preview-telegram.ps1', import.meta.url),
    'utf8'
  )
  const removeCall = source.indexOf('vercel@latest remove')
  const verificationGate = source.indexOf('if (-not $verifiedRemoved)')
  const stateCleanup = source.indexOf('if (Test-Path -LiteralPath $statePath)', verificationGate)
  const telegramNotification = source.indexOf("$token = $envValues['TELEGRAM_MAIN_BOT_TOKEN']")
  const successMessage = source.indexOf("Write-Output 'Preview stopped.'")

  assert.ok(removeCall >= 0)
  assert.ok(verificationGate > removeCall)
  assert.ok(stateCleanup > verificationGate)
  assert.ok(telegramNotification > stateCleanup)
  assert.ok(successMessage > telegramNotification)
  assert.match(source, /\$httpCode -match '\^\(404\|410\)\$'/)
  assert.match(source, /\$inspectExit -ne 0 -and \$inspectMissing/)
  assert.match(source, /\[regex\]::IsMatch\(/)
  assert.match(source, /RegexOptions\]::IgnoreCase/)
  assert.doesNotMatch(source, /-match '\(\?i\)/)
  assert.doesNotMatch(source, /-notmatch '\(\?i\)/)
  assert.match(source, /State сохранён для повторной попытки/)
  assert.match(launcher, /Join-Path \$PSScriptRoot 'preview-stop\.ps1'/)
  assert.doesNotMatch(launcher, /Start-Sleep -Seconds 3600; npx vercel@latest remove/)
})
