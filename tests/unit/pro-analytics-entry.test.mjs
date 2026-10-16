import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * PRO-002b/c: вход в Mentalix Pro перенесён из профиля в аналитику.
 *
 * Карточка «Разбор и план недели» в «Прогресс → Аналитика» теперь показывается
 * всем — гостям и пользователям без Pro — как витрина Pro. Тап по витрине
 * ведёт к оплате (экран «Подписка»). Для пользователя с активным Pro —
 * прежняя карточка с запросом GET /api/pro/report и переходом в разбор/план.
 *
 * Флаг VITE_PRO_REVIEW_PLAN_ENABLED — общий выключатель всей карточки:
 * если выключен, карточки нет ни у кого. Прежний вход «Разбор недели» из
 * профиля убран; подписка и тарифы остаются в профиле.
 */

const analyticsSource = await readFile(
  new URL('../../src/screens/Analytics.jsx', import.meta.url),
  'utf8'
)
const settingsSource = await readFile(
  new URL('../../src/screens/Settings.jsx', import.meta.url),
  'utf8'
)
const cardSource = await readFile(
  new URL('../../src/screens/pro/ProAnalyticsCard.jsx', import.meta.url),
  'utf8'
)
const entrySource = await readFile(
  new URL('../../src/screens/pro/ProAnalyticsEntry.jsx', import.meta.url),
  'utf8'
)
const showcaseSource = await readFile(
  new URL('../../src/screens/pro/ProShowcaseCard.jsx', import.meta.url),
  'utf8'
)
const cardsSource = await readFile(
  new URL('../../src/screens/progress/analyticsCardPreferences.js', import.meta.url),
  'utf8'
)
const proFlagSource = await readFile(new URL('../../src/lib/proFlag.js', import.meta.url), 'utf8')

test('карточка входа в Pro живёт в аналитике, над графиками', () => {
  assert.match(analyticsSource, /import ProAnalyticsEntry from '\.\/pro\/ProAnalyticsEntry'/)
  assert.match(analyticsSource, /<ProAnalyticsEntry/)

  // Карточка идёт до блока графиков (cardPreferences.order), а не после него.
  const cardIndex = analyticsSource.indexOf('<ProAnalyticsEntry')
  const chartsIndex = analyticsSource.indexOf('cardPreferences.order.filter')
  assert.ok(cardIndex > -1, 'карточка отрендерена')
  assert.ok(chartsIndex > -1, 'блок графиков найден')
  assert.ok(cardIndex < chartsIndex, 'карточка выше графиков')
})

test('карточка открывает существующий путь Pro возвратом в аналитику', () => {
  // Один и тот же компонент ProScreen, никакого дублирующего экрана.
  assert.match(analyticsSource, /import ProScreen from '\.\/pro\/ProScreen'/)
  assert.match(analyticsSource, /<ProScreen/)
  assert.match(analyticsSource, /setProOpen\(false\)/)
  // Возврат из Pro перечитывает готовность разбора по данным, не по нажатию.
  assert.match(analyticsSource, /setProRefresh\(value => value \+ 1\)/)
  assert.match(cardSource, /data-testid="progress-pro-card"/)
  assert.match(cardSource, /Разбор и план недели/)
})

test('карточка Pro — та же оболочка и композиция, что у карточек аналитики', () => {
  // Размеры берутся из образца владельца (карточка «Твои практики» и её
  // пустое состояние «кольцо слева, текст справа»), а не задаются заново.
  assert.match(cardSource, /mx-progress-card mx-pro-analytics-card/)
  assert.match(cardSource, /mx-progress-card__head/)
  assert.match(cardSource, /mx-progress-card__title/)
  assert.match(cardSource, /mx-progress-card__subtitle/)
  assert.match(cardSource, /mx-progress-practices__empty-ring/)
  assert.match(cardSource, /mx-progress-practices__empty-title/)
  assert.match(cardSource, /mx-progress-practices__empty-hint/)

  // Иллюстрации внутри кольца нет: кольцо показывает готовность разбора.
  assert.doesNotMatch(cardSource, /CardSystemGlyph/)

  // Вход в разбор — нативная кнопка, открывается с клавиатуры.
  assert.match(cardSource, /data-testid="pro-card-open"/)
  assert.match(cardSource, /type="button"/)
  assert.match(cardSource, /onClick=\{onOpen\}/)

  // Ни фиктивного процента прогресса, ни неработающего меню «…».
  const cardCode = cardSource.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  assert.doesNotMatch(cardCode, /%/)
  assert.doesNotMatch(cardCode, /…/)
})

test('флаг — общий выключатель карточки, гость и не-Pro видят витрину', () => {
  // Флаг проверяется в Analytics.jsx для всей карточки (витрины и Pro).
  assert.match(analyticsSource, /import \{ PRO_REVIEW_PLAN_ENABLED \} from '\.\.\/lib\/proFlag'/)
  assert.match(analyticsSource, /PRO_REVIEW_PLAN_ENABLED && \(/)

  // isGuestUser переехал в ProAnalyticsEntry — там определяется статус.
  assert.match(entrySource, /import \{ isGuestUser \} from '\.\.\/\.\.\/lib\/guestAuth'/)

  // ProScreen открывается только по proOpen (из карточки Pro, не витрины).
  assert.match(analyticsSource, /\{proOpen && \(/)
})

test('витрина показывается гостям и не-Pro без запросов к /api/pro/*', () => {
  // Витрина — отдельный компонент без API-вызовов.
  const showcaseCode = showcaseSource.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  assert.doesNotMatch(showcaseCode, /api\.pro/)
  assert.doesNotMatch(showcaseCode, /api\.subscription/)

  // Витрина использует цену из общей константы, не хардкод.
  assert.match(showcaseSource, /import \{ PAYMENT_UI_ENABLED, PRO_PRICE, PRO_PERIOD_LABEL \}/)
  assert.match(showcaseSource, /PRO_PRICE/)
  assert.match(showcaseSource, /PRO_PERIOD_LABEL/)

  // Кнопка «Открыть Pro» ведёт на экран подписки.
  assert.match(showcaseSource, /data-testid="pro-showcase-open"/)
  assert.match(showcaseSource, /onClick=\{onOpenSubscription\}/)
  assert.match(showcaseSource, /Открыть Pro/)

  // Бейдж «Pro» и заголовок на месте.
  assert.match(showcaseSource, /data-testid="progress-pro-showcase"/)
  assert.match(showcaseSource, /Разбор и план недели/)
  assert.match(showcaseSource, /mx-pro-showcase-card__badge/)
})

test('определение статуса Pro — через /api/subscription, скелетон при загрузке', () => {
  // Статус определяется ответом /api/subscription (has_pro), не новым источником.
  assert.match(entrySource, /api\.subscription/)
  assert.match(entrySource, /has_pro/)

  // Скелетон показывается при загрузке, не витрина.
  assert.match(entrySource, /data-testid="progress-pro-card-skeleton"/)
  assert.match(entrySource, /'loading'/)

  // Гости — сразу non-pro без запроса.
  assert.match(entrySource, /isGuestUser\(user\)/)
  assert.match(entrySource, /'non-pro'/)
})

test('карточка не входит в настройку графиков аналитики', () => {
  // Порядок/скрытие графиков знает только список ANALYTICS_CARDS: карточка Pro
  // не должна попасть ни в него, ни в сохранённые предпочтения.
  const cardCode = cardSource.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  assert.doesNotMatch(cardCode, /analyticsCardPreferences|ANALYTICS_CARDS/)
  // Реестр графиков живёт в analyticsCardPreferences, а не в Analytics.jsx:
  // проверяем именно его.
  assert.match(cardsSource, /id: 'practices'/)
  assert.doesNotMatch(cardsSource, /progress-pro-card/)
  assert.doesNotMatch(cardsSource, /progress-pro-showcase/)
})

test('прежний вход «Разбор недели» из профиля убран, подписка остаётся', () => {
  assert.doesNotMatch(settingsSource, /pro-review-plan/)
  assert.doesNotMatch(settingsSource, /profile-row-pro/)
  assert.doesNotMatch(settingsSource, /Разбор недели/)
  // Подписка и тарифы остаются в профиле как прежде.
  assert.match(settingsSource, /onClick=\{\(\) => setScreen\('subscription'\)\}/)
})

test('флаг VITE_PRO_REVIEW_PLAN_ENABLED остаётся default false', () => {
  assert.match(
    proFlagSource,
    /import\.meta\.env\?\.VITE_PRO_REVIEW_PLAN_ENABLED === 'true'/
  )
})
