import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * PRO-002b/c: вход в Mentalix Pro перенесён из профиля в аналитику.
 *
 * Вкладка «Прогресс» → «Аналитика»: одна карточка «Разбор и план недели» над
 * графиками открывает прежний вложенный путь Pro (разбор → план → прогресс).
 * Прежний вход «Разбор недели» из профиля убран; подписка и тарифы остаются в
 * профиле. Карточка не входит в настройку графиков, поэтому порядок, скрытие и
 * фильтры аналитики она не затрагивает. Флаг VITE_PRO_REVIEW_PLAN_ENABLED
 * остаётся default false.
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
const cardsSource = await readFile(
  new URL('../../src/screens/progress/analyticsCardPreferences.js', import.meta.url),
  'utf8'
)
const proFlagSource = await readFile(new URL('../../src/lib/proFlag.js', import.meta.url), 'utf8')

test('карточка входа в Pro живёт в аналитике, над графиками', () => {
  assert.match(analyticsSource, /import ProAnalyticsCard from '\.\/pro\/ProAnalyticsCard'/)
  assert.match(analyticsSource, /<ProAnalyticsCard/)
  assert.match(analyticsSource, /onOpen=\{\(\) => setProOpen\(true\)\}/)

  // Карточка идёт до блока графиков (cardPreferences.order), а не после него.
  const cardIndex = analyticsSource.indexOf('<ProAnalyticsCard')
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

test('доступность карточки — флаг Pro, пользователь и не гость', () => {
  assert.match(analyticsSource, /import \{ PRO_REVIEW_PLAN_ENABLED \} from '\.\.\/lib\/proFlag'/)
  assert.match(analyticsSource, /import \{ isGuestUser \} from '\.\.\/lib\/guestAuth'/)
  assert.match(
    analyticsSource,
    /const proAvailable = PRO_REVIEW_PLAN_ENABLED && Boolean\(user\) && !isGuestUser\(user\)/
  )
})

test('карточка не входит в настройку графиков аналитики', () => {
  // Порядок/скрытие графиков знает только список ANALYTICS_CARDS: карточка Pro
  // не должна попасть ни в него, ни в сохранённые предпочтения.
  // Комментарий карточки намеренно называет эту настройку по имени, поэтому
  // проверяем код, а не прозу: комментарии перед проверкой убираем.
  const cardCode = cardSource.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  assert.doesNotMatch(cardCode, /analyticsCardPreferences|ANALYTICS_CARDS/)
  // Реестр графиков живёт в analyticsCardPreferences, а не в Analytics.jsx:
  // проверяем именно его.
  assert.match(cardsSource, /id: 'practices'/)
  assert.doesNotMatch(cardsSource, /progress-pro-card/)
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
