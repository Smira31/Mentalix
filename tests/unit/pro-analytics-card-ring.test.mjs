import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * PRO-002b/c: кольцо карточки Pro показывает готовность РАЗБОРА (не
 * выполнение плана) и опирается только на данные существующего контракта.
 *
 * Проверяются контракты, которые не видны «на глаз»:
 *  - источник готовности — GET состояния разбора; POST-генерацию карточка не
 *    отправляет, согласие не включает;
 *  - состояния кольца названы словами владельца, процентов сборки нет;
 *  - период — по датам разбора, а не «за текущую неделю»;
 *  - ошибка запроса не выглядит как отсутствие разбора и даёт повтор;
 *  - смена профиля и поздние ответы не показывают чужой разбор.
 */

const cardSource = await readFile(
  new URL('../../src/screens/pro/ProAnalyticsCard.jsx', import.meta.url),
  'utf8'
)
const cardCss = await readFile(
  new URL('../../src/screens/pro/ProAnalyticsCard.css', import.meta.url),
  'utf8'
)
const analyticsSource = await readFile(
  new URL('../../src/screens/Analytics.jsx', import.meta.url),
  'utf8'
)

/* Прозаичные комментарии объясняют решения словами — проверяем код. */
function code(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

test('готовность разбора читается только из GET существующего контракта', () => {
  assert.match(cardSource, /api\.pro/)
  assert.match(cardSource, /getReport\(\)/)
  // Карточка не запускает генерацию и не трогает план/прогресс.
  assert.doesNotMatch(
    code(cardSource),
    /createReport|createPlan|patchPlanItem|setPlanItemStatus|getPlan\(|getProgress/
  )
  // Согласие включается только на экране Pro, не карточкой.
  assert.doesNotMatch(code(cardSource), /setContextConsent/)
})

test('состояния кольца названы словами владельца, процентов сборки нет', () => {
  assert.match(cardSource, /'Подведи итоги недели'/)
  assert.match(cardSource, /'Собираем разбор'/)
  assert.match(cardSource, /'Разбор готов'/)

  // Состояние сборки — подтверждённое состояние контракта (код 409 POST).
  assert.match(cardSource, /generation_in_progress/)

  // Заполненность кольца — факт готовности, а не вычисленная доля.
  const cardCode = code(cardSource)
  assert.doesNotMatch(cardCode, /%/)
  assert.doesNotMatch(cardCode, /completion_rate|Math\.round|toFixed/)

  // Внутри кольца нет иллюстрации — только состояние.
  assert.doesNotMatch(cardCss, /mx-card-system-glyph/)
})

test('период — по датам разбора, а не «за текущую неделю»', () => {
  assert.match(cardSource, /formatWeekRange/)
  assert.match(cardSource, /isoDay/)
  assert.match(cardSource, /data-testid="pro-card-period"/)
  assert.doesNotMatch(code(cardSource), /За текущую неделю/)
})

test('ошибка запроса — нейтральное состояние с повтором, а не «разбора нет»', () => {
  assert.match(cardSource, /state === 'error'/)
  assert.match(cardSource, /data-testid="pro-card-retry"/)
  assert.match(cardSource, /Повторить загрузку/)
  // Кольцо ошибки отличается от пустого кольца отсутствия разбора.
  assert.match(cardCss, /\.mx-pro-analytics-card--error/)
  assert.match(cardCss, /border-style: dashed/)
})

test('смена профиля и поздние ответы не показывают чужой разбор', () => {
  // Граница профиля — перемонтирование карточки по ключу профиля.
  assert.match(analyticsSource, /import \{ profileScopeKey \} from '\.\.\/lib\/historyProfileScope'/)
  assert.match(analyticsSource, /key=\{profileScopeKey\(user\.id\)\}/)
  // Поздний ответ загрузки отбрасывается по номеру запроса.
  assert.match(cardSource, /loadSeqRef/)
  assert.match(cardSource, /aliveRef/)
  // Возврат из Pro перечитывает готовность по данным.
  assert.match(analyticsSource, /refreshToken=\{proRefresh\}/)
})
