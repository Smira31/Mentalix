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
  readJournalEntry,
  saveJournalPhase,
} from '../../src/lib/journalStorage.js'

test('allowlist сохраняет текущие семь доступных практик', () => {
  assert.deepEqual(AVAILABLE_PRACTICES, [
    'rituals',
    'ascezas',
    'first-step',
    'no-blame',
    'narrow-focus',
    'one-finish',
    'meditation',
  ])

  assert.equal(isPracticeAvailable(PRACTICE_KEYS.brain), false)
  assert.equal(isPracticeAvailable(PRACTICE_KEYS.breathing), false)
  assert.equal(isPracticeAvailable(PRACTICE_KEYS.focus), false)
  assert.equal(isPracticeAvailable(PRACTICE_KEYS.meditation), true)
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
  assert.match(practices, /<MeditationFlow onClose=\{\(\) => setSub\(null\)\} \/>/)
  assert.match(practices, /title="Медитация"/)
  assert.match(availability, /PRACTICE_KEYS\.meditation,/)
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

test('MXL-007 публикует дневные strips и убирает старый цикл из Today', () => {
  const today = readFileSync(new URL('../../src/screens/Today.jsx', import.meta.url), 'utf8')
  const conversation = readFileSync(
    new URL('../../src/screens/mentalix/Conversation.jsx', import.meta.url),
    'utf8'
  )
  const analytics = readFileSync(new URL('../../src/screens/Analytics.jsx', import.meta.url), 'utf8')

  assert.match(today, /mx-today-streaks/)
  assert.match(today, /Дни недели/)
  assert.doesNotMatch(today, /<DayThread|DayThreadTrigger/)
  assert.doesNotMatch(conversation, /AiFlowIndicator|flowPhase/)
  assert.match(analytics, /stroke="rgb\(94 178 237\)"/)
  assert.match(analytics, /cursor=\{false\}/)
  assert.doesNotMatch(analytics, /🛡/)
})

test('MXL-008 публикует Stoic-like Journey и объясняет метрику активных дней', () => {
  const source = readFileSync(new URL('../../src/screens/YearPath.jsx', import.meta.url), 'utf8')

  assert.match(source, />Мой путь<\/div>/)
  assert.match(source, /История регулярности и движения/)
  assert.match(source, /дней с практикой|дней в периоде/i)
  assert.match(source, /daily_activity/)
})

test('MXL-021 связывает Journey с продолжением Today', () => {
  const yearPath = readFileSync(new URL('../../src/screens/YearPath.jsx', import.meta.url), 'utf8')
  const today = readFileSync(new URL('../../src/screens/Today.jsx', import.meta.url), 'utf8')

  assert.match(yearPath, /Начать сегодня/)
  assert.match(yearPath, /Продолжить сегодня/)
  assert.match(yearPath, /onContinueToday/)
  assert.match(today, /<YearPath user=\{user\} onContinueToday=\{\(\) => changeSub\(null\)\} \/>/)
})

test('MXL-JOURNAL-001 публикует полноценный четыре-фазный Journal Home', () => {
  const journal = readFileSync(
    new URL('../../src/screens/mentalix/JournalHome.jsx', import.meta.url),
    'utf8'
  )
  const mentalix = readFileSync(new URL('../../src/screens/Mentalix.jsx', import.meta.url), 'utf8')

  assert.match(journal, /Идея/)
  assert.match(journal, /Действие/)
  assert.match(journal, /Анализ/)
  assert.match(journal, /Новый шаг/)
  assert.match(journal, /JournalTextarea/)
  assert.match(journal, /readJournalEntry|saveJournalPhase/)
  assert.match(journal, /Пойти глубже с наставником/)
  assert.match(journal, /Завершить запись/)
  assert.match(journal, /stickyToolbar=\{false\}/)
  assert.doesNotMatch(journal, /aria-label="Прогресс журнала"/)
  assert.match(mentalix, /JournalHome/)
  assert.match(mentalix, /journalOpen/)
})

test('MXL-JOURNAL-PERSISTENCE-001 сохраняет фазы, различает draft/final и мигрирует прототипный формат', () => {
  const memory = new Map()
  globalThis.localStorage = {
    getItem: key => memory.get(key) || null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: key => memory.delete(key),
  }

  memory.set(
    'mx-journal-prototype-v1',
    JSON.stringify({
      date: '2026-08-27',
      phaseIndex: 1,
      drafts: { idea: 'Старая идея', action: 'Один шаг' },
    })
  )

  const migrated = readJournalEntry('2026-08-27')
  assert.equal(migrated.cycle.idea.text, 'Старая идея')
  assert.equal(migrated.cycle.idea.status, 'draft')

  saveJournalPhase({ date: '2026-08-27', phase: 'analysis', text: 'Итог дня' })
  saveJournalPhase({
    date: '2026-08-27',
    phase: 'newStep',
    text: 'Продолжить завтра',
    status: 'final',
  })
  const saved = readJournalEntry('2026-08-27')
  assert.equal(saved.cycle.analysis.status, 'draft')
  assert.equal(saved.cycle.newStep.status, 'final')
  assert.equal(saved.cycle.newStep.text, 'Продолжить завтра')
  assert.match(saved.updatedAt, /^\d{4}-\d{2}-\d{2}T/)
  assert.equal(clearJournalStore(), true)
})

test('MXL-009 ограничивает insights описательными наблюдениями', () => {
  const analytics = readFileSync(
    new URL('../../src/screens/Analytics.jsx', import.meta.url),
    'utf8'
  )
  const safety = readFileSync(
    new URL('../../src/lib/descriptiveInsights.js', import.meta.url),
    'utf8'
  )

  assert.match(analytics, /selectDescriptiveInsights\(data\.insights\)/)
  assert.match(analytics, /не диагнозы и не доказанные причины/)
  assert.match(analytics, /чаще совпадала/)
  assert.doesNotMatch(analytics, /Собранность не зависит от энергии/)
  assert.match(safety, /UNSAFE_INSIGHT_PATTERNS/)
  assert.match(safety, /MAX_INSIGHTS = 3/)
  assert.match(safety, /вызывает/)
  assert.match(safety, /диагноз/)
})

test('MXL-019 заменяет Journey mountain metaphor на continuous progress line', () => {
  const path = readFileSync(new URL('../../src/screens/Path.jsx', import.meta.url), 'utf8')
  const line = readFileSync(
    new URL('../../src/components/JourneyLineArt.jsx', import.meta.url),
    'utf8'
  )

  assert.doesNotMatch(path, /WireframeMountain/)
  assert.match(path, /JourneyLineArt progress=\{goal\.progress\}/)
  assert.match(path, /Создай первую — и увидишь линию движения/)
  assert.match(line, /const PATH_D/)
  assert.equal((line.match(/<path/g) || []).length, 2)
  assert.match(line, /strokeDasharray=\{`\$\{normalized\} 100`\}/)
  assert.match(line, /role="img"/)
})

test('MXL-016 публикует семь авторских мыслей без непроверенной атрибуции', () => {
  const thoughts = readFileSync(new URL('../../src/data/dailyThoughts.js', import.meta.url), 'utf8')
  const today = readFileSync(new URL('../../src/screens/Today.jsx', import.meta.url), 'utf8')
  const quoteView = readFileSync(
    new URL('../../src/screens/QuoteView.jsx', import.meta.url),
    'utf8'
  )

  assert.equal((thoughts.match(/key: '/g) || []).length, 7)
  assert.equal((thoughts.match(/attribution: 'авторская мысль Mentalix'/g) || []).length, 7)
  assert.equal((thoughts.match(/prompt:/g) || []).length, 7)
  assert.equal((thoughts.match(/action:/g) || []).length, 7)
  assert.equal((thoughts.match(/nextStep:/g) || []).length, 7)
  assert.match(thoughts, /not quotations/)
  assert.match(today, /const thoughtOfDay = useMemo/)
  assert.match(today, /dailyQuote \? \{ text: dailyQuote/)
  assert.match(today, /getDailyThought\(\)/)
  assert.match(quoteView, /current\.attribution \|\| current\.tag/)
  assert.match(quoteView, /current\.prompt/)
  assert.match(quoteView, /current\.nextStep/)
})

test('MXL-015 публикует семь curated Stoic-inspired тем без backend предположений', () => {
  const source = readFileSync(new URL('../../src/data/weeklyThemes.js', import.meta.url), 'utf8')

  assert.match(source, /export const WEEKLY_THEME_CATALOG = \[/)
  assert.equal((source.match(/key: '/g) || []).length, 7)
  assert.match(source, /control-and-influence/)
  assert.match(source, /attention/)
  assert.match(source, /friction/)
  assert.match(source, /courage/)
  assert.match(source, /temperance/)
  assert.match(source, /perspective/)
  assert.match(source, /renewal/)
  assert.equal((source.match(/stoicQuestion:/g) || []).length, 7)
  assert.equal((source.match(/actionPrompt:/g) || []).length, 7)
  assert.equal((source.match(/analysisPrompt:/g) || []).length, 7)
  assert.equal((source.match(/nextStepPrompt:/g) || []).length, 7)
  assert.match(source, /Backend theme IDs, publication, and reflection persistence remain/)
})

test('MXL-001 сохраняет Stoic-inspired AI flow без backend изменений и без entry-strip в PersonaPicker', () => {
  const indicator = readFileSync(
    new URL('../../src/screens/mentalix/AiFlowIndicator.jsx', import.meta.url),
    'utf8'
  )
  const picker = readFileSync(
    new URL('../../src/screens/mentalix/PersonaPicker.jsx', import.meta.url),
    'utf8'
  )
  const conversation = readFileSync(
    new URL('../../src/screens/mentalix/Conversation.jsx', import.meta.url),
    'utf8'
  )
  const container = readFileSync(new URL('../../src/screens/Mentalix.jsx', import.meta.url), 'utf8')

  assert.match(indicator, /idea.*action.*analysis.*next/s)
  assert.match(indicator, /Цикл разговора: идея, действие, анализ, новый шаг/)
  assert.doesNotMatch(picker, /AiFlowIndicator/)
  assert.doesNotMatch(conversation, /AiFlowIndicator|flowPhase/)
  assert.match(container, /api\.mentalix\.send\(user\.id, text, persona\)/)
  assert.doesNotMatch(container, /api\.mentalix\.send\([^\n]*flow/)
})

test('MXL-006 публикует единый AI typography baseline без backend изменений', () => {
  const tokens = readFileSync(new URL('../../src/index.css', import.meta.url), 'utf8')
  const conversation = readFileSync(
    new URL('../../src/screens/mentalix/Conversation.jsx', import.meta.url),
    'utf8'
  )
  const personaPicker = readFileSync(
    new URL('../../src/screens/mentalix/PersonaPicker.jsx', import.meta.url),
    'utf8'
  )

  assert.match(tokens, /\.mx-ai-title\s*\{[\s\S]*font-size: clamp\(1\.5rem, 6vw, 1\.75rem\)/)
  assert.match(tokens, /\.mx-ai-body\s*\{[\s\S]*font-size: 0\.875rem[\s\S]*line-height: 1\.55/)
  assert.match(tokens, /\.mx-ai-caption\s*\{[\s\S]*font-size: 0\.75rem[\s\S]*line-height: 1\.45/)
  assert.match(tokens, /\.mx-ai-meta\s*\{[\s\S]*font-size: 0\.6875rem/)
  assert.match(tokens, /\.mx-ai-input\s*\{[\s\S]*font-size: 1rem/)
  assert.match(conversation, /mx-ai-body/)
  assert.match(conversation, /mx-ai-input/)
  assert.doesNotMatch(personaPicker, /mx-ai-title/)
  assert.match(personaPicker, /mx-type-persona-title/)
})

test('MXL-TYPE-SYSTEM-001 использует единый Onest baseline без пользовательских serif overrides', () => {
  const journalHome = readFileSync(
    new URL('../../src/screens/mentalix/JournalHome.jsx', import.meta.url),
    'utf8'
  )
  const journalStart = readFileSync(
    new URL('../../src/screens/mentalix/JournalStart.jsx', import.meta.url),
    'utf8'
  )
  const analytics = readFileSync(
    new URL('../../src/screens/Analytics.jsx', import.meta.url),
    'utf8'
  )

  assert.match(journalHome, /font-display/)
  assert.match(journalStart, /font-display/)
  assert.match(analytics, /fontFamily="Onest"/)
  assert.doesNotMatch(journalHome, /Georgia|Times New Roman/)
  assert.doesNotMatch(journalStart, /Georgia|Times New Roman/)
  assert.doesNotMatch(analytics, /Manrope/)
})

test('MXL-HOME-QUIET-FOUNDATION-001 ставит главный Today hero перед вторичными секциями', () => {
  const today = readFileSync(new URL('../../src/screens/Today.jsx', import.meta.url), 'utf8')
  const heroIndex = today.indexOf('ГЕРОЙ-КАРТОЧКА')
  const secondaryIndex = today.indexOf('mx-today-hero-breath', heroIndex)

  assert.ok(heroIndex >= 0)
  assert.ok(secondaryIndex >= 0)
  const styles = readFileSync(new URL('../../src/index.css', import.meta.url), 'utf8')
  const todayStyles = readFileSync(new URL('../../src/screens/Today.css', import.meta.url), 'utf8')
  const app = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8')
  assert.ok(heroIndex < secondaryIndex)
  assert.match(styles, /--bottom-nav-content-gap:\s*46px/)
  assert.match(today, /mx-today-primary-card/)
  assert.match(today, /data-complete=\{heroPresentationState === 'allDone' \|\| heroPresentationState === 'dayClosed'\}/)
  assert.match(today, /heroPresentationState !== 'allDone' && heroPresentationState !== 'dayClosed'/)
  assert.match(today, /mx-today-hero-breath/)
  assert.doesNotMatch(today, /TodayFocusCard|TodayFocusFlow|Разгрузить голову/)
  assert.match(today, /mx-today-affirmation-card/)
  assert.match(todayStyles, /\.mx-today-primary-card\s*\{[\s\S]*min-height:\s*452px/)
  assert.match(todayStyles, /\.mx-today-primary-card\[data-complete='true'\][\s\S]*background:\s*rgb\(var\(--c-card\)\)/)
  assert.match(todayStyles, /\.mx-today-primary-card\[data-complete='true'\] \.mx-type-hero[\s\S]*font-size:\s*1\.25rem/)
  assert.match(todayStyles, /\.mx-today-hero-breath\s*\{[\s\S]*height:\s*16px/)
  assert.match(todayStyles, /\.mx-today-affirmation-card\s*\{[\s\S]*min-height:\s*340px/)
  assert.match(app, /ref={scrollRootRef}[\s\S]*paddingBottom: contentBottomPadding/)
  assert.match(app, /scrollPaddingBottom: contentBottomPadding/)
})

test('MXL-TYPE-CONSISTENCY-001 задаёт единый Onest typography scale для пяти вкладок', () => {
  const styles = readFileSync(new URL('../../src/index.css', import.meta.url), 'utf8')
  const app = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8')
  const today = readFileSync(new URL('../../src/screens/Today.jsx', import.meta.url), 'utf8')
  const practices = readFileSync(
    new URL('../../src/screens/Practices.jsx', import.meta.url),
    'utf8'
  )
  const library = readFileSync(new URL('../../src/screens/Library.jsx', import.meta.url), 'utf8')
  const articles = readFileSync(new URL('../../src/screens/Articles.jsx', import.meta.url), 'utf8')
  const analytics = readFileSync(new URL('../../src/screens/Analytics.jsx', import.meta.url), 'utf8')
  const personaPicker = readFileSync(
    new URL('../../src/screens/mentalix/PersonaPicker.jsx', import.meta.url),
    'utf8'
  )
  const journalHome = readFileSync(
    new URL('../../src/screens/mentalix/JournalHome.jsx', import.meta.url),
    'utf8'
  )
  const courses = readFileSync(new URL('../../src/screens/Courses.jsx', import.meta.url), 'utf8')
  const brainTrainer = readFileSync(
    new URL('../../src/screens/BrainTrainer.jsx', import.meta.url),
    'utf8'
  )
  const focus = readFileSync(new URL('../../src/screens/Focus.jsx', import.meta.url), 'utf8')

  assert.match(styles, /--mx-type-page-size:\s*1\.875rem/)
  assert.match(styles, /--mx-type-greeting-size:\s*1\.125rem/)
  assert.match(styles, /\.mx-type-page\s*\{[\s\S]*line-height:\s*1[\s\S]*font-weight:\s*700/)
  assert.match(styles, /\.mx-type-greeting\s*\{[\s\S]*font-size:\s*var\(--mx-type-greeting-size\)/)
  assert.match(styles, /\.mx-type-body\s*\{[\s\S]*font-size:\s*var\(--mx-type-body-size\)/)
  assert.match(styles, /\.mx-type-control\s*\{[\s\S]*font-size:\s*var\(--mx-type-control-size\)/)
  assert.match(styles, /\.mx-type-insight\s*\{[\s\S]*font-size:\s*1\.1875rem/)
  assert.match(styles, /\.mx-type-weekday\s*\{[\s\S]*font-size:\s*0\.625rem/)
  assert.match(styles, /\.mx-type-calendar-date\s*\{[\s\S]*font-size:\s*0\.8125rem/)
  assert.match(styles, /\.mx-type-list-title\s*,[\s\S]*font-size:\s*0\.9375rem/)
  assert.match(styles, /\.mx-type-list-body\s*,[\s\S]*font-size:\s*0\.8125rem/)
  assert.match(styles, /\.mx-type-persona-title\s*\{[\s\S]*font-size:\s*1\.125rem/)
  assert.match(styles, /\.mx-type-article-title\s*\{[\s\S]*font-size:\s*1rem/)
  assert.match(styles, /\.mx-type-article-meta\s*\{[\s\S]*font-size:\s*0\.625rem/)
  assert.match(styles, /\.mx-type-flow-title\s*\{[\s\S]*font-size:\s*1\.375rem/)
  assert.match(styles, /\.mx-type-flow-body\s*\{[\s\S]*font-size:\s*0\.8125rem/)
  assert.match(styles, /\.mx-type-flow-action\s*\{[\s\S]*font-size:\s*0\.875rem/)
  assert.match(styles, /\.mx-type-segment\s*\{[\s\S]*font-size:\s*var\(--mx-type-segment-size\)/)
  assert.doesNotMatch(styles, /Honest/)

  assert.match(app, /mx-type-greeting/)
  assert.match(today, /mx-type-hero/)
  assert.match(today, /mx-type-weekday/)
  assert.match(today, /mx-type-calendar-date/)
  assert.match(today, /mx-type-card/)
  assert.match(today, /mx-type-list-title/)
  assert.match(today, /mx-type-flow-action/)
  assert.match(practices, /mx-type-page/)
  assert.match(practices, /mx-type-list-title/)
  assert.match(practices, /mx-type-list-body/)
  assert.match(library, /mx-type-page/)
  assert.match(library, /mx-type-segment/)
  assert.match(articles, /mx-type-article-title/)
  assert.match(articles, /mx-type-article-body/)
  assert.match(analytics, /mx-type-page/)
  assert.match(analytics, /mx-type-analytics-heading/)
  assert.match(analytics, /mx-type-insight/)
  assert.match(personaPicker, /mx-type-page/)
  assert.match(personaPicker, /mx-type-persona-title/)
  assert.match(personaPicker, /mx-type-persona-body/)
  assert.doesNotMatch(personaPicker, /AiFlowIndicator/)
  assert.doesNotMatch(personaPicker, /mx-ai-title/)
  assert.doesNotMatch(journalHome, /mx-type-page|mx-type-hero/)
  assert.match(courses, /mx-type-list-title/)
  assert.match(courses, /mx-type-flow-action/)
  assert.match(courses, /text-\[16px\]/)
  assert.match(brainTrainer, /mx-type-list-title/)
  assert.match(brainTrainer, /mx-type-flow-action/)
  assert.match(brainTrainer, /text-\[16px\]/)
  assert.match(focus, /text-\[13px\]/)
})
