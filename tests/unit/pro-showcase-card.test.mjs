import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * Витрина Pro: выбор состояния карточки «Разбор и план недели».
 *
 * Проверяет контракты выбора (Pro / не Pro / гость / флаг выключен /
 * статус грузится) по исходникам, без рендеринга:
 *  — флаг выключен → карточки нет ни у кого;
 *  — гость → витрина без запроса к /api/pro/*;
 *  — не-Pro → витрина без запроса к /api/pro/*;
 *  — Pro → настоящая карточка с GET /api/pro/report;
 *  — статус грузится → нейтральный скелетон, не витрина.
 */

const entrySource = await readFile(
  new URL('../../src/screens/pro/ProAnalyticsEntry.jsx', import.meta.url),
  'utf8'
)
const showcaseSource = await readFile(
  new URL('../../src/screens/pro/ProShowcaseCard.jsx', import.meta.url),
  'utf8'
)
const cardSource = await readFile(
  new URL('../../src/screens/pro/ProAnalyticsCard.jsx', import.meta.url),
  'utf8'
)
const analyticsSource = await readFile(
  new URL('../../src/screens/Analytics.jsx', import.meta.url),
  'utf8'
)

function code(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

test('флаг выключен — карточки нет ни у кого', () => {
  // ProAnalyticsEntry возвращает null при выключенном флаге.
  assert.match(entrySource, /if \(!PRO_REVIEW_PLAN_ENABLED\) return null/)
  // Analytics.jsx рендерит entry только при включённом флаге.
  assert.match(analyticsSource, /PRO_REVIEW_PLAN_ENABLED && \(/)
})

test('гость — сразу non-pro без запроса', () => {
  const entryCode = code(entrySource)
  // Гость определяется до API-вызова.
  assert.match(entryCode, /if \(!user \|\| isGuestUser\(user\)\) return 'non-pro'/)
  // Витрина не вызывает /api/pro/*.
  const showcaseCode = code(showcaseSource)
  assert.doesNotMatch(showcaseCode, /api\.pro/)
  assert.doesNotMatch(showcaseCode, /api\.subscription/)
})

test('не-Pro — витрина без запросов к /api/pro/*', () => {
  // При non-pro рендерится ProShowcaseCard, не ProAnalyticsCard.
  assert.match(entrySource, /proStatus === 'non-pro'/)
  assert.match(entrySource, /<ProShowcaseCard/)
  // ProAnalyticsCard (с /api/pro/report) рендерится только при 'pro'.
  assert.match(entrySource, /proStatus === 'pro'/)
  assert.match(entrySource, /<ProAnalyticsCard/)
  // ProAnalyticsCard делает запрос к /api/pro/report.
  assert.match(cardSource, /api\.pro/)
  assert.match(cardSource, /getReport/)
})

test('Pro — настоящая карточка с GET /api/pro/report', () => {
  // При 'pro' рендерится ProAnalyticsCard с onOpen (открывает ProScreen).
  assert.match(entrySource, /onOpen=\{onOpen\}/)
  // ProAnalyticsCard вызывает getReport.
  assert.match(cardSource, /getReport\(\)/)
})

test('статус грузится — нейтральный скелетон, не витрина', () => {
  // Скелетон показывается при 'loading', до определения статуса.
  assert.match(entrySource, /proStatus === 'loading'/)
  assert.match(entrySource, /data-testid="progress-pro-card-skeleton"/)
  // Скелетон не содержит кнопку «Открыть Pro».
  const entryCode = code(entrySource)
  const skeletonMatch = entryCode.match(/ProCardSkeleton\(\)[\s\S]*?function ProCardSkeleton/)
  // Скелетон — отдельная функция, не ProShowcaseCard.
  assert.match(entrySource, /function ProCardSkeleton/)
})

test('статус Pro определяется через /api/subscription, не новый источник', () => {
  const entryCode = code(entrySource)
  assert.match(entryCode, /api\.subscription/)
  assert.match(entryCode, /\.get\(\)/)
  assert.match(entryCode, /has_pro/)
  // Ошибка запроса — non-pro, не краш.
  assert.match(entryCode, /catch/)
  assert.match(entryCode, /'non-pro'/)
})

test('витрина не вызывает /api/pro/* и /api/subscription', () => {
  const showcaseCode = code(showcaseSource)
  assert.doesNotMatch(showcaseCode, /api\./)
  assert.doesNotMatch(showcaseCode, /fetch/)
  assert.doesNotMatch(showcaseCode, /request/)
})

test('кнопка витрины ведёт на экран подписки, не в Pro', () => {
  assert.match(showcaseSource, /data-testid="pro-showcase-open"/)
  assert.match(showcaseSource, /onClick=\{onOpenSubscription\}/)
  // Витрина не открывает ProScreen.
  const showcaseCode = code(showcaseSource)
  assert.doesNotMatch(showcaseCode, /onOpen\b(?!Subscription)/)
  assert.doesNotMatch(showcaseCode, /ProScreen/)
})

test('PAYMENT_UI_ENABLED=false — витрина без кнопки оплаты', () => {
  // Кнопка рендерится только при PAYMENT_UI_ENABLED.
  assert.match(showcaseSource, /\{PAYMENT_UI_ENABLED && \(/)
  assert.match(showcaseSource, /data-testid="pro-showcase-open"/)
  // Без флага кнопка не рендерится — карточка остаётся как витрина.
  const showcaseCode = code(showcaseSource)
  // Тело карточки (заголовок, описание) показывается всегда.
  assert.match(showcaseSource, /data-testid="pro-showcase-title"/)
  assert.match(showcaseSource, /data-testid="pro-showcase-hint"/)
})

test('цена в витрине — из общей константы, не хардкод', () => {
  assert.match(showcaseSource, /import \{ PAYMENT_UI_ENABLED, PRO_PRICE, PRO_PERIOD_LABEL \}/)
  assert.match(showcaseSource, /\{PRO_PRICE\}/)
  assert.match(showcaseSource, /\{PRO_PERIOD_LABEL\}/)
  // Нет захардкоженной цены.
  const showcaseCode = code(showcaseSource)
  assert.doesNotMatch(showcaseCode, /990/)
  assert.doesNotMatch(showcaseCode, /690/)
})

test('dev-параметр ?proStatus=pro переопределяет статус для тестов', () => {
  const entryCode = code(entrySource)
  assert.match(entryCode, /getDemoProStatus/)
  assert.match(entryCode, /proStatus/)
  assert.match(entryCode, /'pro'/)
  // Только в dev/preview, не в production.
  assert.match(entryCode, /import\.meta\.env\?\.DEV/)
  assert.match(entryCode, /VITE_LOCAL_PREVIEW/)
})
