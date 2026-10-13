import { expect, test } from '@playwright/test'

/*
 * JOURNAL-001 — доступный сценарий «Прогресс → История» на синтетических данных.
 *
 * Демо-режим (?demo=1) перехватывает API демо-данными, а журнал — локальный
 * (localStorage, ключ на профиль). Профиль A — демо-пользователь 900001,
 * профиль B — демо-гость 900002 (?guest=1).
 *
 * Что именно доказывает сценарий: смена профиля здесь выполняется ПОЛНОЙ
 * ЗАГРУЗКОЙ приложения (?guest=1), то есть перезагрузкой страницы — у каждого
 * профиля свой документ и своё дерево React. Поэтому сценарий доказывает
 * раздельное отображение и отсутствие унаследованного состояния ПОСЛЕ
 * ПЕРЕЗАГРУЗКИ, а не смену профиля внутри приложения без перезагрузки. Смену
 * пропа `user` в живом дереве проверяет
 * journal-history-component-isolation.spec.mjs (fixture настоящих компонентов).
 *
 * Проверяем:
 *   1) лента «Истории» показывает запись журнала текущего профиля и раскрывается;
 *   2) после смены профиля (полной загрузкой) текст раскрытой записи A исчезает,
 *      видна только запись B, а раскрытая запись A не остаётся открытой;
 *   3) группировка и фильтр не сбрасываются при смене профиля;
 *   4) чтение истории не меняет данные журнала: исходные строки обоих профилей
 *      до первого чтения и после всех действий совпадают.
 *
 * Даты считаются относительно текущего дня (правило репозитория).
 *
 * Почему viewport 793×1196 и демо-рамка: на телефонной ширине без рамки
 * (frame=0) плашка демо-панели (`demo-panel-badge`, position: fixed,
 * top/right 12px, z-index 9999) ложится на центр вкладки «История» — замер
 * 393×852: вкладка x=197…289, y=8…48, плашка x=202…381, y=12…42,
 * elementFromPoint в центре вкладки возвращает плашку, поэтому тап по вкладке
 * недоступен. Штатного способа скрыть плашку нет: её рендер зависит только от
 * isPreviewDemoMode() и не-Telegram платформы, ?panel=1 открывает панель,
 * ?frame=0 и ?toolbar=0 плашку не убирают. Это отдельный дефект демо-оверлея
 * (не продуктового), здесь не чинится; сценарий идёт в демо-рамке на 793×1196 —
 * плашка остаётся за рамкой (x=602), а поверхность внутри рамки та же
 * телефонная 393×852.
 *
 * Ограничения покрытия:
 *   — смена профиля без перезагрузки и запоздавший ответ A покрыты на настоящих
 *     компонентах в journal-history-component-isolation.spec.mjs: ProgressHistory
 *     и legacy History смонтированы в одном документе, тест меняет проп `user`,
 *     а ответ api.checkin.history управляется отложенным промисом (unit-тест
 *     journal-history-profile-isolation.test.mjs дублирует это на модельном
 *     уровне и проверяет токен профиля);
 *   — в демо-режиме API считается в процессе (src/lib/demoMode.js) и не проходит
 *     через сеть, которую можно притормозить page.route, поэтому окна «ответ A
 *     приходит уже в B» у этого сценария нет;
 *   — legacy-поверхность src/screens/History.jsx в приложении не смонтирована
 *     (в App.jsx только предзагрузка), поэтому здесь она не проверяется — её
 *     изоляцию проверяет fixture-тест выше и ручной проход.
 */

const PROFILE_A = 900001
const PROFILE_B = 900002
const KEY_A = `mx-journal-v2:user:${PROFILE_A}`
const KEY_B = `mx-journal-v2:user:${PROFILE_B}`
const GRANULARITY_KEY = 'mx-history-granularity'
const FILTER_KEY = 'mx-history-filter'

const TEXT_A = 'JOURNAL-001 A: раскрытая запись профиля A'
const TEXT_B = 'JOURNAL-001 B: запись профиля B'

test.use({ viewport: { width: 793, height: 1196 } })

const SEED_SENTINEL = 'mx-journal-isolation-seeded-v1'

const SEEDS = [
  [KEY_A, TEXT_A, 0],
  [KEY_B, TEXT_B, 1],
]

/*
 * Засев ровно один раз, без повторного засева при навигации: init-script
 * выполняется на каждом документе, поэтому второй и последующие запуски
 * выходят по sentinel-ключу. Иначе смена профиля (?guest=1) заново записала бы
 * те же строки, и сравнение «до/после» ничего бы не доказывало.
 *
 * Синтетический local-журнал: одна запись дня в фазе «Идея». Даты строятся в
 * браузере, поэтому «сегодня» совпадает с днём приложения. До первого чтения
 * истории исходные строки обоих профилей фиксируются в window.__journalSeedRaw.
 */
function seedScript({ seeds, sentinel }) {
  if (localStorage.getItem(sentinel)) return

  const dayKey = date => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const raw = {}
  for (const [key, text, daysAgo] of seeds) {
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    const value = JSON.stringify({
      version: 2,
      entries: {
        [dayKey(date)]: {
          version: 2,
          cycle: {
            idea: { text, status: 'final', updatedAt: null },
            action: { text: '', status: 'draft', updatedAt: null },
            analysis: { text: '', status: 'draft', updatedAt: null },
            newStep: { text: '', status: 'draft', updatedAt: null },
          },
          freeWrites: [],
          updatedAt: null,
        },
      },
    })
    localStorage.setItem(key, value)
    raw[key] = value
  }

  localStorage.setItem(sentinel, '1')
  window.__journalSeedRaw = raw
}

async function openHistoryTab(page, url) {
  await page.goto(url)
  await expect(page.getByTestId('progress-tab-history')).toBeVisible()
  await page.getByTestId('progress-tab-history').click()
  await expect(page.getByTestId('progress-tab-history')).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByTestId('progress-history-list')).toBeVisible()
}

test('JOURNAL-001: раскрытая запись A исчезает после смены профиля, в B видна только запись B', async ({
  page,
}) => {
  await page.addInitScript(seedScript, { seeds: SEEDS, sentinel: SEED_SENTINEL })

  // ── 1. Профиль A: «Прогресс» → «История» ──
  await openHistoryTab(page, '/?demo=1&tab=trends')

  // Исходные строки обоих профилей — сняты до первого чтения истории.
  const seededRaw = await page.evaluate(() => window.__journalSeedRaw)
  expect(Object.keys(seededRaw).sort()).toEqual([KEY_A, KEY_B].sort())

  const rowA = page.locator('[data-testid="progress-history-row"]').filter({ hasText: TEXT_A })
  await expect(rowA).toBeVisible()

  // ── 2. Раскрываем запись A ──
  await rowA.click()
  const entryA = page.getByTestId('progress-entry-screen')
  await expect(entryA).toBeVisible()
  await expect(entryA).toContainText(TEXT_A)
  await page.screenshot({ path: 'artifacts/journal-history/a-history-expanded.png' })

  // ── 3. Смена профиля полной загрузкой (выход из A → вход под демо-гостем B) ──
  await openHistoryTab(page, '/?demo=1&guest=1&tab=trends')

  // Повторного засева при навигации нет: init-script вышел по sentinel.
  expect(await page.evaluate(() => window.__journalSeedRaw ?? null)).toBeNull()
  expect(await page.evaluate(key => localStorage.getItem(key), SEED_SENTINEL)).toBe('1')

  // Текст раскрытой записи A не показывается, раскрытая запись не осталась открытой.
  await expect(page.getByTestId('progress-entry-screen')).toHaveCount(0)
  await expect(page.getByText(TEXT_A)).toHaveCount(0)
  // Видна запись профиля B.
  const rowB = page.locator('[data-testid="progress-history-row"]').filter({ hasText: TEXT_B })
  await expect(rowB).toBeVisible()
  await page.screenshot({ path: 'artifacts/journal-history/b-history-after-switch.png' })

  // ── 4. Данные журнала не изменились: исходные строки обоих профилей те же ──
  const afterA = await page.evaluate(key => localStorage.getItem(key), KEY_A)
  const afterB = await page.evaluate(key => localStorage.getItem(key), KEY_B)
  expect(afterA).toBe(seededRaw[KEY_A])
  expect(afterB).toBe(seededRaw[KEY_B])
})

test('JOURNAL-001: группировка и фильтр сохраняются при смене профиля', async ({ page }) => {
  await page.addInitScript(seedScript, { seeds: SEEDS, sentinel: SEED_SENTINEL })

  await openHistoryTab(page, '/?demo=1&tab=trends')

  // Группировка «Недели»
  await page.getByTestId('history-grouping-pill').click()
  await page.getByTestId('history-grouping-week').click()
  await expect(page.getByTestId('history-grouping-pill')).toContainText('Недели')

  // Фильтр «Дневник»
  await page.getByTestId('history-filter-btn').click()
  await expect(page.getByTestId('history-filter-sheet')).toBeVisible()
  await page.getByTestId('history-filter-row-journal').click()
  await page.getByTestId('history-filter-close').click()
  await expect(page.getByTestId('history-filter-sheet')).toHaveCount(0)

  const savedFilter = await page.evaluate(key => localStorage.getItem(key), FILTER_KEY)
  expect(JSON.parse(savedFilter)).toEqual(['journal'])

  // ── Смена профиля: настройки остаются теми же ──
  await openHistoryTab(page, '/?demo=1&guest=1&tab=trends')

  await expect(page.getByTestId('history-grouping-pill')).toContainText('Недели')
  const filterAfterSwitch = await page.evaluate(key => localStorage.getItem(key), FILTER_KEY)
  expect(JSON.parse(filterAfterSwitch)).toEqual(['journal'])
  const granularityAfterSwitch = await page.evaluate(
    key => localStorage.getItem(key),
    GRANULARITY_KEY
  )
  expect(granularityAfterSwitch).toBe('week')

  // Возвращаемся к «Дням»: фильтр «Дневник» всё ещё применён — видна запись B,
  // строк чек-инов нет.
  await page.getByTestId('history-grouping-pill').click()
  await page.getByTestId('history-grouping-day').click()
  await expect(
    page.locator('[data-testid="progress-history-row"]').filter({ hasText: TEXT_B })
  ).toBeVisible()
  await expect(page.getByText(TEXT_A)).toHaveCount(0)
})
