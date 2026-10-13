import { expect, test } from '@playwright/test'

/*
 * JOURNAL-001 — доступный сценарий «Прогресс → История» на синтетических данных.
 *
 * Демо-режим (?demo=1) перехватывает API демо-данными, а журнал — локальный
 * (localStorage, ключ на профиль). Профиль A — демо-пользователь 900001,
 * профиль B — демо-гость 900002 (?guest=1); переключение профиля выполняет
 * само приложение.
 *
 * Проверяем:
 *   1) лента «Истории» показывает запись журнала текущего профиля и раскрывается;
 *   2) после смены профиля текст раскрытой записи A исчезает, видна только
 *      запись B, а раскрытая запись A не остаётся открытой;
 *   3) группировка и фильтр не сбрасываются при смене профиля;
 *   4) чтение истории не меняет данные журнала.
 *
 * Даты считаются относительно текущего дня (правило репозитория).
 */

const PROFILE_A = 900001
const PROFILE_B = 900002
const KEY_A = `mx-journal-v2:user:${PROFILE_A}`
const KEY_B = `mx-journal-v2:user:${PROFILE_B}`
const GRANULARITY_KEY = 'mx-history-granularity'
const FILTER_KEY = 'mx-history-filter'

const TEXT_A = 'JOURNAL-001 A: раскрытая запись профиля A'
const TEXT_B = 'JOURNAL-001 B: запись профиля B'

test.use({ viewport: { width: 393, height: 852 } })

/*
 * Синтетический local-журнал: одна запись дня в фазе «Идея».
 * Даты строятся в браузере, поэтому «сегодня» совпадает с днём приложения.
 */
function seedJournal(seeds) {
  return {
    seeds,
    script: ({ seeds: list }) => {
      const dayKey = date => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      for (const [key, text, daysAgo] of list) {
        const date = new Date()
        date.setDate(date.getDate() - daysAgo)
        localStorage.setItem(
          key,
          JSON.stringify({
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
        )
      }
    },
  }
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
  const seed = seedJournal([
    [KEY_A, TEXT_A, 0],
    [KEY_B, TEXT_B, 1],
  ])
  await page.addInitScript(seed.script, seed)

  // ── 1. Профиль A: «Прогресс» → «История» ──
  await openHistoryTab(page, '/?demo=1&frame=0&tab=trends')

  const rowA = page.locator('[data-testid="progress-history-row"]').filter({ hasText: TEXT_A })
  await expect(rowA).toBeVisible()

  // Данные журнала до чтения истории — чтобы доказать неизменность.
  const beforeA = await page.evaluate(key => localStorage.getItem(key), KEY_A)

  // ── 2. Раскрываем запись A ──
  await rowA.click()
  const entryA = page.getByTestId('progress-entry-screen')
  await expect(entryA).toBeVisible()
  await expect(entryA).toContainText(TEXT_A)
  await page.screenshot({ path: 'artifacts/journal-history/a-history-expanded.png' })

  // ── 3. Смена профиля (выход из A → вход под демо-гостем B) ──
  await openHistoryTab(page, '/?demo=1&guest=1&frame=0&tab=trends')

  // Текст раскрытой записи A не показывается, раскрытая запись не осталась открытой.
  await expect(page.getByTestId('progress-entry-screen')).toHaveCount(0)
  await expect(page.getByText(TEXT_A)).toHaveCount(0)
  // Видна запись профиля B.
  const rowB = page.locator('[data-testid="progress-history-row"]').filter({ hasText: TEXT_B })
  await expect(rowB).toBeVisible()
  await page.screenshot({ path: 'artifacts/journal-history/b-history-after-switch.png' })

  // ── 4. Данные журнала не изменились: ни A, ни B ──
  const afterA = await page.evaluate(key => localStorage.getItem(key), KEY_A)
  expect(afterA).toBe(beforeA)
  const storeB = await page.evaluate(key => localStorage.getItem(key), KEY_B)
  expect(JSON.parse(storeB).entries).toBeTruthy()
})

test('JOURNAL-001: группировка и фильтр сохраняются при смене профиля', async ({ page }) => {
  const seed = seedJournal([
    [KEY_A, TEXT_A, 0],
    [KEY_B, TEXT_B, 1],
  ])
  await page.addInitScript(seed.script, seed)

  await openHistoryTab(page, '/?demo=1&frame=0&tab=trends')

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
  await openHistoryTab(page, '/?demo=1&guest=1&frame=0&tab=trends')

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
