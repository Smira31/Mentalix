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
import {
  clearJournalStore,
  hasLegacyJournalData,
  journalStorageKey,
  migrateLegacyJournalToUser,
  readJournalEntry,
  saveJournalPhase,
} from '../../src/lib/journalStorage.js'
import { readJournalHistory } from '../../src/lib/journalHistory.js'
import {
  clearCheckinDraft,
  draftHasContent,
  morningDraftToNote,
  readCheckinDraft,
  saveCheckinDraft,
} from '../../src/lib/checkinDraft.js'

test('allowlist сохраняет доступные практики и активирует Lila entry', () => {
  assert.deepEqual(AVAILABLE_PRACTICES, [
    'lila-discover',
    'rituals',
    'ascezas',
    'first-step',
    'no-blame',
    'narrow-focus',
    'one-finish',
    // Meditation: product decision 2026-09-19 — not ready; «Скоро» in catalog.
    // MXL-525 G6: brain/breathing/focus признаны доступными.
    'brain',
    'breathing',
    'focus',
  ])

  assert.equal(isPracticeAvailable(PRACTICE_KEYS.brain), true)
  assert.equal(isPracticeAvailable(PRACTICE_KEYS.breathing), true)
  assert.equal(isPracticeAvailable(PRACTICE_KEYS.focus), true)
  assert.equal(isPracticeAvailable(PRACTICE_KEYS.meditation), false)
  assert.equal(isPracticeAvailable('unknown-practice'), false)
})

test('MXL-014 публикует короткую текстовую медитацию без backend changes', () => {
  const flow = readFileSync(
    new URL('../../src/screens/MeditationFlow.jsx', import.meta.url),
    'utf8'
  )
  const practices = readFileSync(
    new URL('../../src/screens/Practices.jsx', import.meta.url),
    'utf8'
  )
  const availability = readFileSync(
    new URL('../../src/config/practiceAvailability.js', import.meta.url),
    'utf8'
  )

  assert.match(flow, /5–10 минут/)
  assert.match(flow, /Что сейчас происходит\?/)
  assert.match(flow, /Что из этого зависит от тебя\?/)
  assert.match(flow, /Какой один шаг ты выбираешь\?/)
  assert.match(flow, /Если становится тяжелее, остановись/)
  assert.match(flow, /<SceneLayout/)
  assert.match(flow, /practice-scene--input practice-scene--input-centered/)
  assert.equal((flow.match(/floatingToolbar/g) || []).length, 3)
  assert.match(flow, /<JournalTextarea/)
  // Component remains in tree; entry is gated by allowlist (Скоро).
  assert.match(practices, /MeditationFlow/)
  assert.match(practices, /buildPracticeViewModels\(\{ rituals, ascezas, completedToday \}\)/)
  // Key remains in PRACTICE_KEYS object; not listed in AVAILABLE_PRACTICES.
  assert.match(availability, /meditation:\s*'meditation'/)
  assert.equal(isPracticeAvailable(PRACTICE_KEYS.meditation), false)
  assert.doesNotMatch(flow, /api\./)
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

test('MXL-JOURNAL-ORGANIZE-001 сериализует несколько tag-параметров и включает server-side Journey UI', () => {
  const history = readFileSync(new URL('../../src/screens/History.jsx', import.meta.url), 'utf8')
  const journeySearch = readFileSync(
    new URL('../../src/screens/JourneySearch.jsx', import.meta.url),
    'utf8'
  )
  const api = readFileSync(new URL('../../src/lib/api.js', import.meta.url), 'utf8')

  assert.equal(
    withQuery('/journey/entries', { tag_id: [4, 9] }),
    '/journey/entries?tag_id=4&tag_id=9'
  )
  assert.match(history, /JourneySearch/)
  assert.match(journeySearch, /Поиск работает только по твоим сохранённым записям/)
  assert.match(journeySearch, /Показать ещё/)
  assert.match(api, /replaceTags/)
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
  assert.equal(shouldShowMoodCheckGate({ ...
    shouldShowMoodCheckGate({ ...base, todayCheckin: undefined }),
    false
  )
  assert.equal(shouldShowMoodCheckGate({ ...base, todayCheckin: MOOD_CHECK_CHECKIN_ERROR }), false)
  assert.equal(shouldShowMoodCheckGate({ ...base, todayCheckin: { id: 10 } }), false)
})

test('MXL-HOME-QUIET-V2-002 сохраняет нижний воздух и различимое active CTA-состояние', () => {
  const styles = readFileSync(new URL('../../src/index.css', import.meta.url), 'utf8')

  assert.match(styles, /--bottom-nav-content-gap:\s*46px/)
  assert.match(styles, /\.cta-pill:active\s*\{[\s\S]*background:\s*rgb\(var\(--btn-bg\) \/ 0\.88\)/)
  assert.match(styles, /\.cta-pill:active\s*\{[\s\S]*box-shadow:\s*inset 0 0 0 2px/)
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
  assert.match(source, /\$httpVerifiedRemoved -and \$inspectVerifiedRemoved/)
  assert.match(source, /\[regex\]::IsMatch\(/)
  assert.match(source, /RegexOptions\]::IgnoreCase/)
  assert.doesNotMatch(source, /-match '\(\?i\)/)
  assert.doesNotMatch(source, /-notmatch '\(\?i\)/)
  assert.match(source, /\[switch\]\$DryRun/)
  assert.match(source, /MENTALIX_PREVIEW_STOP_VERIFY_DEADLINE_SECONDS/)
  assert.match(source, /MENTALIX_PREVIEW_STOP_RETRY_DELAY_SECONDS/)
  assert.match(source, /MENTALIX_PREVIEW_STOP_RETRY_MAX_DELAY_SECONDS/)
  assert.match(
    source,
    /verify deadline seconds=\{0\}, initial delay seconds=\{1\}, max delay seconds=\{2\}/
  )
  const dryRunGuard = source.indexOf('if ($DryRun -or $dryRunFromEnv)')
  assert.ok(dryRunGuard > 0)
  assert.ok(dryRunGuard < source.indexOf('vercel@latest list'))
  assert.match(source, /while \(\(Get-Date\) -lt \$verificationDeadline/)
  assert.match(
    source,
    /\$currentDelaySeconds = \[math\]::Min\(\$currentDelaySeconds \* 2, \$retryMaxDelaySeconds\)/
  )
  assert.match(source, /Start-Sleep -Seconds \$sleepSeconds/)
  assert.match(source, /State сохранён для повторной попытки/)
  assert.match(launcher, /Join-Path \$PSScriptRoot 'preview-stop\.ps1'/)
  assert.doesNotMatch(launcher, /Start-Sleep -Seconds 3600; npx vercel@latest remove/)
})

test('MXL-TODAY-PROD-HERO-001 Preview использует PR-aware demo fixtures без production controls', () => {
  const launcher = readFileSync(
    new URL('../../scripts/preview-telegram.ps1', import.meta.url),
    'utf8'
  )
  const demo = readFileSync(new URL('../../src/lib/demoMode.js', import.meta.url), 'utf8')

  assert.match(launcher, /\[int\]\$PullRequest = 0/)
  assert.match(launcher, /Legacy Telegram Preview requires -PullRequest/)
  assert.doesNotMatch(launcher, /PR #n\/a/)
  assert.match(launcher, /Открыть Preview · \$prLabel/)
  assert.match(launcher, /stateUrl = \$previewUrl \+ '\?demo=1&today_state='/)
  for (const state of ['checkinPending', 'dayInProgress', 'reviewPending', 'dayClosed']) {
    assert.match(demo, new RegExp(`'${state}'`))
  }
  assert.match(demo, /params\.get\('demo'\)/)
  assert.match(demo, /checkin\/today.*state\.checkins\[0\]/)
  assert.match(
    demo,
    /previewTodayState\(\) === 'reviewPending' \|\| previewTodayState\(\) === 'dayClosed' \? 0 : 24/
  )
  assert.ok(
    demo.indexOf("pathname === '/profile/settings' && method === 'GET'") <
      demo.indexOf("pathname.startsWith('/profile/') && method === 'GET'")
  )
})

test('MXL-PREVIEW-CLOUDFLARE-001 разрешает Quick Tunnel только через Preview demo gate', () => {
  const demo = readFileSync(new URL('../../src/lib/demoMode.js', import.meta.url), 'utf8')

  assert.match(demo, /host\.endsWith\('\.trycloudflare\.com'\)/)
  assert.match(demo, /const localPreviewEnabled = import\.meta\.env\.VITE_LOCAL_PREVIEW === 'true'/)
  assert.match(
    demo,
    /const isPreviewRuntime =\s+import\.meta\.env\.DEV \|\| import\.meta\.env\.VERCEL_ENV === 'preview' \|\| localPreviewEnabled/
  )
  assert.match(
    demo,
    /const isQaProductionHost =\s+host === 'mentalix-preview\.vercel\.app' \|\| host === 'mentalix-owner-qa\.pages\.dev'/
  )
  assert.match(
    demo,
    /const demoRequested = params\.get\('demo'\) === '1'/
  )
  assert.match(demo, /const pwaDemoRequested = params\.get\('source'\) === 'pwa'/)
  assert.match(demo, /\(isPreviewRuntime \|\| isQaProductionHost\)/)
})

test('MXL-CLOUDFLARE-OWNER-QA-001 использует manual exact-SHA Demo gate', () => {
  const workflow = readFileSync(
    new URL('../../.github/workflows/cloudflare-owner-qa.yml', import.meta.url),
    'utf8'
  )

  assert.match(workflow, /workflow_dispatch:/)
  assert.match(workflow, /commit_sha:/)
  assert.match(workflow, /mentalix-owner-qa/)
  assert.match(workflow, /qa-build\.json/)
  assert.match(workflow, /X-Robots-Tag: noindex, nofollow/)
  assert.match(workflow, /cloudflare\/wrangler-action@[0-9a-f]{40}/)
  assert.match(workflow, /pages deploy dist/)
  assert.match(workflow, /immutable provenance/)
})
