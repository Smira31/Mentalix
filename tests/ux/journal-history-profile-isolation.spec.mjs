import { expect, test } from '@playwright/test'

/*
 * JOURNAL-001 — доступный сценарий «Прогресс → История» при смене профиля
 * ПОЛНОЙ ЗАГРУЗКОЙ приложения (?guest=1), то есть перезагрузкой страницы: у
 * каждого профиля свой документ и своё дерево React. Поэтому сценарий
 * доказывает раздельное отображение и отсутствие унаследованного состояния
 * ПОСЛЕ ПЕРЕЗАГРУЗКИ, а не смену профиля внутри приложения без перезагрузки.
 * Смену пропа `user` в живом дереве проверяет
 * journal-history-component-isolation.spec.mjs (fixture настоящих компонентов).
 *
 * Единственный источник записей — дневник DailyJournal (api.dailyJournal);
 * старый локальный журнал (mx-journal-v2, цикл «Идея / Действие / Анализ /
 * Новый шаг») из приложения удалён. Здесь он не используется: после всех
 * действий ключей `mx-journal-v2*` в хранилище не появляется.
 *
 * Проверяем:
 *   1) лента «Истории» показывает запись дневника текущего профиля и раскрывается
 *      вместе с ответом на вопрос дня; строка ровно одна, без дублей;
 *   2) после смены профиля (полной загрузкой) текст раскрытой записи A исчезает,
 *      видна только запись B, а раскрытая запись A не остаётся открытой;
 *   3) группировка и фильтр не сбрасываются при смене профиля;
 *   4) чтение истории не меняет данные: список записей дневника до первого чтения
 *      и после всех действий совпадает, legacy-ключей `mx-journal-v2` нет.
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
 *     а ответ api.dailyJournal управляется отложенным промисом (unit-тест
 *     journal-history-profile-isolation.test.mjs дублирует это на модельном
 *     уровне и проверяет токен профиля);
 *   — в демо-режиме API считается в процессе (src/lib/demoMode.js) и не проходит
 *     через сеть, которую можно притормозить page.route, поэтому окна «ответ A
 *     приходит уже в B» у этого сценария нет;
 *   — legacy-поверхность src/screens/History.jsx в приложении не смонтирована
 *     (в App.jsx только предзагрузка), поэтому здесь она не проверяется — её
 *     изоляцию проверяет fixture-тест выше и ручной проход.
 */

const DEMO_STATE_KEY = 'mentalix_preview_demo_state_v6'
const GRANULARITY_KEY = 'mx-history-granularity'
const FILTER_KEY = 'mx-history-filter'
const LEGACY_KEY_PREFIX = 'mx-journal-v2'

const TEXT_A = 'JOURNAL-001 A: запись дневника профиля A'
const TEXT_B = 'JOURNAL-001 B: запись дневника профиля B'
const ANSWER_A = 'JOURNAL-001 A: ответ на вопрос дня профиля A'
const ANSWER_B = 'JOURNAL-001 B: ответ на вопрос дня профиля B'

test.use({ viewport: { width: 793, height: 1196 } })

/*
 * Кладёт синтетическую запись дневника в демо-состояние текущего документа и
 * возвращает получившийся список записей — по нему потом сверяется, что чтение
 * истории ничего не изменило.
 *
 * Данные профиля подаются так, как их подал бы сервер: демо-API отдаёт одно
 * общее демо-состояние на оба демо-профиля (по user_id оно не разделено),
 * поэтому запись кладётся в документ конкретного профиля.
 *
 * Засев здесь не init-script на каждой навигации, а явный шаг документа профиля,
 * поэтому sentinel не нужен: сравнивается массив записей, а не сырая строка.
 *
 * Само демо-состояние создаёт приложение первым GET /daily-journal/setup,
 * поэтому сначала открываем дневник: иначе в хранилище лёг бы частичный объект
 * без остальных полей демо-данных.
 */
async function seedDiary(page, { text, answer, id }) {
  await page.goto('/?demo=1&tab=practices')
  await page.getByTestId('journal-open-cta').click()
  await expect(
    page
      .locator(
        '[data-testid="dj-stream-input"], [data-testid="dj-today-append"], [data-testid="dj-review-next"], [data-testid="dj-intro-skip"]'
      )
      .first()
  ).toBeVisible()
  await expect
    .poll(() => page.evaluate(key => localStorage.getItem(key) !== null, DEMO_STATE_KEY))
    .toBe(true)

  return page.evaluate(
    ({ key, text, answer, id }) => {
      const now = new Date()
      const dayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const state = JSON.parse(localStorage.getItem(key) || '{}')
      const entry = {
        id,
        date: dayKey,
        stream_text: text,
        prompt_text: 'Вопрос дня профиля',
        prompt_answer: answer,
        helpful: null,
        day_number: 1,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      }
      state.dailyJournalEntries = [
        entry,
        ...(state.dailyJournalEntries || []).filter(item => item.date !== dayKey),
      ]
      localStorage.setItem(key, JSON.stringify(state))
      return state.dailyJournalEntries
    },
    { key: DEMO_STATE_KEY, text, answer, id }
  )
}

async function openHistoryTab(page, url) {
  await page.goto(url)
  await expect(page.getByTestId('progress-tab-history')).toBeVisible()
  await page.getByTestId('progress-tab-history').click()
  await expect(page.getByTestId('progress-tab-history')).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByTestId('progress-history-list')).toBeVisible()
}

function diaryRow(page, text) {
  return page.locator('[data-testid="progress-history-row"]').filter({ hasText: text })
}

test('JOURNAL-001: раскрытая запись дневника A исчезает после смены профиля, в B видна только запись B', async ({
  page,
}) => {
  // ── 1. Профиль A: «Прогресс» → «История» ──
  const seededA = await seedDiary(page, { text: TEXT_A, answer: ANSWER_A, id: 700001 })
  expect(seededA.filter(item => item.stream_text === TEXT_A)).toHaveLength(1)

  await openHistoryTab(page, '/?demo=1&tab=trends')

  const rowA = diaryRow(page, TEXT_A)
  await expect(rowA).toHaveCount(1)
  await expect(rowA).toBeVisible()

  // ── 2. Раскрываем запись A: поток и ответ на вопрос дня на месте ──
  await rowA.click()
  const entryA = page.getByTestId('progress-entry-screen')
  await expect(entryA).toBeVisible()
  await expect(entryA).toContainText(TEXT_A)
  await expect(entryA).toContainText(ANSWER_A)
  await page.screenshot({ path: 'artifacts/journal-history/a-history-expanded.png' })

  // ── 3. Смена профиля полной загрузкой (выход из A → вход под демо-гостем B) ──
  const seededB = await seedDiary(page, { text: TEXT_B, answer: ANSWER_B, id: 700002 })

  await openHistoryTab(page, '/?demo=1&guest=1&tab=trends')

  // Текст раскрытой записи A не показывается, раскрытая запись не осталась открытой.
  await expect(page.getByTestId('progress-entry-screen')).toHaveCount(0)
  await expect(page.getByText(TEXT_A)).toHaveCount(0)
  await expect(page.getByText(ANSWER_A)).toHaveCount(0)

  // Видна запись профиля B — и ровно одной строкой.
  const rowB = diaryRow(page, TEXT_B)
  await expect(rowB).toHaveCount(1)
  await expect(rowB).toBeVisible()
  await page.screenshot({ path: 'artifacts/journal-history/b-history-after-switch.png' })

  // ── 4. Чтение истории ничего не писало: записи дневника те же, legacy-ключей нет ──
  const entriesAfter = await page.evaluate(
    key => JSON.parse(localStorage.getItem(key) || '{}').dailyJournalEntries,
    DEMO_STATE_KEY
  )
  expect(entriesAfter).toEqual(seededB)

  const legacyKeys = await page.evaluate(
    prefix => Object.keys(localStorage).filter(key => key.startsWith(prefix)),
    LEGACY_KEY_PREFIX
  )
  expect(legacyKeys).toEqual([])
})

test('JOURNAL-001: группировка и фильтр сохраняются при смене профиля', async ({ page }) => {
  await seedDiary(page, { text: TEXT_A, answer: ANSWER_A, id: 700001 })

  await openHistoryTab(page, '/?demo=1&tab=trends')

  // Группировка «Недели»
  await page.getByTestId('history-grouping-pill').click()
  await page.getByTestId('history-grouping-week').click()
  await expect(page.getByTestId('history-grouping-pill')).toContainText('Недели')

  // Фильтр «Дневник»
  await page.getByTestId('history-filter-btn').click()
  await expect(page.getByTestId('history-filter-sheet')).toBeVisible()
  await page.getByTestId('history-filter-row-dailyJournal').click()
  await page.getByTestId('history-filter-close').click()
  await expect(page.getByTestId('history-filter-sheet')).toHaveCount(0)

  const savedFilter = await page.evaluate(key => localStorage.getItem(key), FILTER_KEY)
  expect(JSON.parse(savedFilter)).toEqual(['dailyJournal'])

  // ── Смена профиля: настройки остаются теми же ──
  await seedDiary(page, { text: TEXT_B, answer: ANSWER_B, id: 700002 })

  await openHistoryTab(page, '/?demo=1&guest=1&tab=trends')

  await expect(page.getByTestId('history-grouping-pill')).toContainText('Недели')
  const filterAfterSwitch = await page.evaluate(key => localStorage.getItem(key), FILTER_KEY)
  expect(JSON.parse(filterAfterSwitch)).toEqual(['dailyJournal'])
  const granularityAfterSwitch = await page.evaluate(
    key => localStorage.getItem(key),
    GRANULARITY_KEY
  )
  expect(granularityAfterSwitch).toBe('week')

  // Возвращаемся к «Дням»: фильтр «Дневник» всё ещё применён — видна только
  // запись B, строк чек-инов и мыслей нет.
  await page.getByTestId('history-grouping-pill').click()
  await page.getByTestId('history-grouping-day').click()
  await expect(diaryRow(page, TEXT_B)).toBeVisible()
  await expect(page.locator('[data-testid="progress-history-row"]')).toHaveCount(1)
})
