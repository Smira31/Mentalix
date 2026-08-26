import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  AVAILABLE_PRACTICES,
  PRACTICE_KEYS,
  isPracticeAvailable,
} from '../../src/config/practiceAvailability.js'
import { withQuery } from '../../src/lib/apiQuery.js'
import { MOOD_CHECK_CHECKIN_ERROR, shouldShowMoodCheckGate } from '../../src/lib/moodCheckGate.js'

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
  assert.equal(shouldShowMoodCheckGate({ ...base, todayCheckin: MOOD_CHECK_CHECKIN_ERROR }), false)
  assert.equal(shouldShowMoodCheckGate({ ...base, todayCheckin: { id: 10 } }), false)
})

test('MXL-PREVIEW-STOP-DRY-RUN-001 связывает npm-алиас с безопасным DryRun', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
  )
  const source = readFileSync(new URL('../../scripts/preview-stop.ps1', import.meta.url), 'utf8')
  assert.equal(
    packageJson.scripts['preview:stop:dry-run'],
    'powershell -NoProfile -ExecutionPolicy Bypass -File scripts/preview-stop.ps1 -DryRun'
  )
  assert.match(source, /\[switch\]\$DryRun/)
  assert.match(source, /No Vercel, state, process, or Telegram operations will run/)
})

test('MXL-DOCS-BACKLOG-NORMALIZATION-001 публикует docs:check и task index', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
  )
  const index = readFileSync(new URL('../../docs/TASK_INDEX.md', import.meta.url), 'utf8')
  const checker = readFileSync(new URL('../../scripts/docs-check.mjs', import.meta.url), 'utf8')

  assert.equal(packageJson.scripts['docs:check'], 'node scripts/docs-check.mjs')
  assert.match(index, /## Автономная очередь/)
  assert.match(index, /Сейчас очередь `autonomous` пуста/)
  assert.match(index, /## Product decision register/)
  assert.match(checker, /broken local link/)
  assert.match(checker, /duplicate task heading/)
  assert.match(checker, /requiredFiles/)
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
  assert.match(source, /\[switch\]\$DryRun/)
  assert.match(source, /MENTALIX_PREVIEW_STOP_RETRY_ATTEMPTS/)
  assert.match(source, /MENTALIX_PREVIEW_STOP_RETRY_DELAY_SECONDS/)
  assert.match(source, /retry attempts=\{0\}, delay seconds=\{1\}/)
  const dryRunGuard = source.indexOf('if ($DryRun -or $dryRunFromEnv)')
  assert.ok(dryRunGuard > 0)
  assert.ok(dryRunGuard < source.indexOf('vercel@latest list'))
  assert.match(source, /-le \$retryAttempts/)
  assert.match(source, /Start-Sleep -Seconds \$retryDelaySeconds/)
  assert.match(source, /State сохранён для повторной попытки/)
  assert.match(launcher, /Join-Path \$PSScriptRoot 'preview-stop\.ps1'/)
  assert.doesNotMatch(launcher, /Start-Sleep -Seconds 3600; npx vercel@latest remove/)
})

test('MXL-007 публикует цикл Today: идея, действие, анализ и новый шаг', () => {
  const thread = readFileSync(
    new URL('../../src/components/TodayMotionExperiment.jsx', import.meta.url),
    'utf8'
  )
  const today = readFileSync(new URL('../../src/screens/Today.jsx', import.meta.url), 'utf8')

  assert.match(thread, /const THREAD_LABELS = \['Идея', 'Действие', 'Анализ', 'Новый шаг'\]/)
  assert.match(thread, /<strong>Цикл дня<\/strong>/)
  assert.match(today, /'Идея дня'/)
  assert.match(thread, /<small>Действие дня<\/small>/)
  assert.match(today, /'Анализ дня'/)
  assert.match(today, /Новый шаг/)
})

test('MXL-008 публикует Stoic-like Journey и объясняет метрику активных дней', () => {
  const source = readFileSync(new URL('../../src/screens/YearPath.jsx', import.meta.url), 'utf8')

  assert.match(source, />Мой путь<\/div>/)
  assert.match(source, /История регулярности и движения/)
  assert.match(source, /дней с практикой|дней в периоде/i)
  assert.match(source, /daily_activity/)
})
