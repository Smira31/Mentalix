import { expect, test } from '@playwright/test'

/*
 * JOURNAL-001 — изоляция профилей на настоящих React-компонентах истории.
 *
 * В отличие от journal-history-profile-isolation.spec.mjs (там смена профиля —
 * полная загрузка приложения через ?guest=1, то есть перезагрузка), здесь
 * настоящие компоненты ProgressHistory и legacy History смонтированы в одном
 * документе (tests/fixtures/journal-history-isolation.html), а смена профиля —
 * это смена пропа `user` в живом React-дереве. Перезагрузки страницы нет.
 *
 * Единственный источник записей — дневник DailyJournal (api.dailyJournal) и
 * чек-ины (api.checkin.history); старый локальный журнал удалён.
 *
 * Проверяем:
 *   1) раскрытая запись дневника A исчезает сразу после смены user на B и на null;
 *   2) запоздавший ответ запроса, начатого для A, не отображается в профиле B —
 *      ни на «Прогресс → История», ни на legacy-поверхности History;
 *   3) ошибка загрузки дневника отличается от «записей нет».
 *
 * Даты считаются относительно текущего дня (правило репозитория).
 */

const SURFACE = '[data-testid="surface-progress"]'
const LEGACY = '[data-testid="surface-legacy"]'

async function openFixture(page) {
  const runtimeErrors = []
  page.on('pageerror', error => runtimeErrors.push(error.message))
  await page.goto('/tests/fixtures/journal-history-isolation.html')
  await expect(page.getByTestId('surface-progress')).toBeVisible()
  await expect(page.getByTestId('surface-legacy')).toBeVisible()
  const constants = await page.evaluate(() => ({
    profiles: window.__journalIsolation.profiles,
    texts: window.__journalIsolation.texts,
    dayLabels: window.__journalIsolation.dayLabels,
  }))
  return { runtimeErrors, ...constants }
}

function rowNamed(surface, text) {
  return surface.locator('[data-testid="progress-history-row"]').filter({ hasText: text })
}

/*
 * Записи настоящего дневника (api.dailyJournal) в «Прогресс → История»:
 * видны без предварительного открытия дневника, раскрываются в существующем
 * экране записи и так же изолированы по профилю, как остальные источники.
 */
test('JOURNAL-001: раскрытая запись дневника A исчезает сразу при смене user на B и на null', async ({
  page,
}) => {
  const { runtimeErrors, profiles, texts } = await openFixture(page)
  const progress = page.locator(SURFACE)

  // ── 1. Профиль A: разрешаем загрузки A — видна запись дневника A ──
  await page.evaluate(() => {
    const iso = window.__journalIsolation
    return Promise.all([
      iso.setCheckins(iso.profiles.A, []),
      iso.setDiary(iso.profiles.A, iso.diary.A),
    ])
  })

  const diaryRowA = rowNamed(progress, texts.DIARY_A)
  await expect(diaryRowA).toBeVisible()

  // ── 2. Раскрытие показывает содержимое записи в существующем экране ──
  await diaryRowA.click()
  const entryScreen = progress.locator('[data-testid="progress-entry-screen"]')
  await expect(entryScreen).toContainText(texts.DIARY_A)
  await expect(entryScreen.locator('[data-testid="progress-diary-entry"]')).toBeVisible()
  await page.screenshot({ path: 'artifacts/journal-history/component-diary-a-expanded.png' })

  // ── 3. A → B без перезагрузки: сразу после обновления текста A нет ──
  const afterB = await page.evaluate(() => {
    const iso = window.__journalIsolation
    return { text: iso.setProfile(iso.profiles.B), entryScreens: iso.entryScreens() }
  })
  expect(afterB.text).not.toContain(texts.DIARY_A)
  expect(afterB.entryScreens).toBe(0)
  await expect(page.getByText(texts.DIARY_A)).toHaveCount(0)

  // ── 4. Профиль B показывает только свой дневник ──
  await page.evaluate(() => {
    const iso = window.__journalIsolation
    return Promise.all([
      iso.setCheckins(iso.profiles.B, []),
      iso.setDiary(iso.profiles.B, iso.diary.B),
    ])
  })
  await expect(rowNamed(progress, texts.DIARY_B)).toBeVisible()
  await expect(page.getByText(texts.DIARY_A)).toHaveCount(0)
  await page.screenshot({ path: 'artifacts/journal-history/component-diary-b-after-switch.png' })

  // ── 5. «Выход» (user = null) не наследует дневник ни одного профиля ──
  const afterAnonymous = await page.evaluate(() => {
    const iso = window.__journalIsolation
    return { text: iso.setProfile(null), entryScreens: iso.entryScreens() }
  })
  expect(afterAnonymous.text).not.toContain(texts.DIARY_A)
  expect(afterAnonymous.text).not.toContain(texts.DIARY_B)
  expect(afterAnonymous.entryScreens).toBe(0)

  expect(runtimeErrors).toEqual([])
  expect(profiles.A).not.toEqual(profiles.B)
})

test('JOURNAL-001: запоздавший ответ дневника A не применяется в профиле B', async ({ page }) => {
  const { runtimeErrors, texts } = await openFixture(page)
  const progress = page.locator(SURFACE)

  // ── 1. Запрос дневника A начат и ещё не разрешён ──
  const pendingA = await page.evaluate(() => window.__journalIsolation.pendingDiaryProfiles())
  expect(pendingA).toContain(900001)

  // ── 2. Переключаем профиль на B и разрешаем загрузки B ──
  await page.evaluate(() => {
    const iso = window.__journalIsolation
    iso.setProfile(iso.profiles.B)
    return Promise.all([
      iso.setCheckins(iso.profiles.B, []),
      iso.setDiary(iso.profiles.B, iso.diary.B),
    ])
  })
  await expect(rowNamed(progress, texts.DIARY_B)).toBeVisible()

  // ── 3. Разрешаем запоздавший ответ A — он не должен отрисоваться ──
  await page.evaluate(() => {
    const iso = window.__journalIsolation
    return iso.setDiary(iso.profiles.A, iso.diary.A)
  })
  await expect(page.getByText(texts.DIARY_A)).toHaveCount(0)
  await expect(rowNamed(progress, texts.DIARY_B)).toBeVisible()

  expect(runtimeErrors).toEqual([])
})

test('JOURNAL-001: запоздавший ответ чек-инов A не применяется в профиле B', async ({ page }) => {
  const { runtimeErrors, texts, dayLabels } = await openFixture(page)
  const progress = page.locator(SURFACE)
  const legacy = page.locator(LEGACY)

  // ── 1. Запрос A начат и ещё не разрешён ──
  const pendingBefore = await page.evaluate(() => window.__journalIsolation.pendingProfiles())
  expect(pendingBefore).toContain(900001)

  // ── 2. Переключаем профиль на B и разрешаем загрузку B ──
  await page.evaluate(() => {
    const iso = window.__journalIsolation
    iso.setProfile(iso.profiles.B)
    return iso.setCheckins(iso.profiles.B, iso.checkins.B)
  })
  await expect(legacy.getByText(texts.CHECKIN_B)).toBeVisible()
  await expect(progress.getByText(dayLabels.B)).toBeVisible()
  await expect(progress.getByText(dayLabels.A)).toHaveCount(0)
  const rowsBefore = await progress.locator('[data-testid="progress-history-row"]').count()
  expect(rowsBefore).toBeGreaterThan(0)

  // ── 3. Разрешаем запоздавший ответ A — он не должен отрисоваться ──
  await page.evaluate(() => {
    const iso = window.__journalIsolation
    return iso.setCheckins(iso.profiles.A, iso.checkins.A)
  })
  await expect(page.getByText(texts.CHECKIN_A)).toHaveCount(0)
  await expect(progress.getByText(dayLabels.A)).toHaveCount(0)
  expect(await progress.locator('[data-testid="progress-history-row"]').count()).toBe(rowsBefore)
  // Профиль B не сброшен и не подменён данными A.
  await expect(legacy.getByText(texts.CHECKIN_B)).toBeVisible()

  expect(runtimeErrors).toEqual([])
})

/*
 * Legacy-поверхность src/screens/History.jsx показывает только дни активного
 * профиля: смена пропа `user` не переносит чек-ины профиля A в профиль B.
 */
test('JOURNAL-001: legacy-поверхность History изолирует чек-ины профилей', async ({ page }) => {
  const { runtimeErrors, texts } = await openFixture(page)
  const legacy = page.locator(LEGACY)

  await page.evaluate(() => {
    const iso = window.__journalIsolation
    return iso.setCheckins(iso.profiles.A, iso.checkins.A)
  })
  await expect(legacy.getByText(texts.CHECKIN_A)).toBeVisible()

  await page.evaluate(() => {
    const iso = window.__journalIsolation
    iso.setProfile(iso.profiles.B)
    return iso.setCheckins(iso.profiles.B, iso.checkins.B)
  })
  await expect(legacy.getByText(texts.CHECKIN_B)).toBeVisible()
  await expect(legacy.getByText(texts.CHECKIN_A)).toHaveCount(0)

  expect(runtimeErrors).toEqual([])
})

test('JOURNAL-001: ошибка загрузки дневника отличается от «записей нет»', async ({ page }) => {
  const { runtimeErrors } = await openFixture(page)
  const progress = page.locator(SURFACE)

  // Чек-инов нет, а загрузка дневника падает: это ошибка, а не пустая история.
  await page.evaluate(() => {
    const iso = window.__journalIsolation
    return Promise.all([iso.setCheckins(iso.profiles.A, []), iso.failDiary(iso.profiles.A)])
  })

  await expect(progress.getByTestId('progress-history-diary-error')).toBeVisible()
  await expect(progress.getByTestId('progress-history-diary-retry')).toBeVisible()
  await page.screenshot({ path: 'artifacts/journal-history/component-diary-load-error.png' })

  expect(runtimeErrors).toEqual([])
})
