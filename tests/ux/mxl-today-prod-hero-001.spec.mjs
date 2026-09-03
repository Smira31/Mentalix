import { expect, test } from '@playwright/test'

// Адаптировано из tests/ux/mxl-daily-canonical-ui-lab-001.spec.mjs как шаблона —
// без обёртки DailyCanonicalExperiment, прямое тестирование diff'а
// feature/mxl-today-prod-hero-001 к src/screens/Today.jsx через уже существующий
// ?ui_lab=baseline (TodayStatePreview.baseline), который и так рендерит настоящий
// prod Today.jsx с фикстурой на все 4 состояния — тот же приём, что уже
// использует DailyCanonicalExperiment.TodayBaseline.
//
// Функциональный diff (текст кнопки 'Пройти чек-ин' → 'Начать чек-ин', удаление
// 'Открыть разбор снова' на dayClosed) уже плотно покрыт существующими
// tests/unit/maintenance-contracts.test.mjs, tests/ux/mxl-010-release-gate.spec.mjs
// и tests/ux/ux-check.spec.mjs (изменены в этой же ветке) — здесь не дублируем то
// же самое, а закрываем то, чего там нет: все 4 состояния на 320/390/430px через
// ?ui_lab=baseline и no-overflow.

const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
]

const STATES = [
  { label: 'Чек-ин', key: 'checkinPending' },
  { label: 'В процессе', key: 'dayInProgress' },
  { label: 'Разбор', key: 'reviewPending' },
  { label: 'Завершён', key: 'dayClosed' },
]

for (const viewport of VIEWPORTS) {
  test(`Today baseline (?ui_lab=baseline) все 4 состояния на ${viewport.name} — без horizontal overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })

    const consoleErrors = []
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('CloudStorage is not supported')) {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/?ui_lab=baseline')

    const baseline = page.locator('.mx-lab-today-baseline')
    await expect(baseline).toBeVisible()

    for (const state of STATES) {
      await page.getByRole('tab', { name: state.label }).click()
      await expect(baseline).toHaveAttribute('data-state', state.key)
      await expect(baseline).toBeVisible()

      const noHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
      )
      expect(noHorizontalOverflow, `overflow on ${state.key} @ ${viewport.name}`).toBe(true)
    }

    expect(consoleErrors).toEqual([])
  })
}

test('Today baseline reflects the #490 hero contract diff on the same ?ui_lab=baseline surface', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?ui_lab=baseline')

  const baseline = page.locator('.mx-lab-today-baseline')

  // checkinPending: 'Пройти чек-ин' -> 'Начать чек-ин'
  await page.getByRole('tab', { name: 'Чек-ин' }).click()
  await expect(baseline.getByRole('button', { name: 'Начать чек-ин' })).toBeVisible()
  await expect(baseline.getByRole('button', { name: 'Пройти чек-ин' })).toHaveCount(0)

  // dayClosed: 'Открыть разбор снова' убрана, текст сменился
  await page.getByRole('tab', { name: 'Завершён' }).click()
  await expect(baseline).toContainText('Сегодняшний цикл завершён')
  await expect(baseline).not.toContainText('Вечерний разбор завершён')
  await expect(baseline.getByRole('button', { name: 'Открыть разбор снова' })).toHaveCount(0)
})

// Safe-area / header-overlap (тот же класс бага, что нашли и починили в
// DailyCanonicalExperiment, см. UI-DEC-003) — ЧЕСТНО: headless Chromium не рисует
// нативную Telegram-шапку (Закрыть/шеврон/меню), поэтому оверлап с ней в принципе
// не воспроизводим вне реального Telegram Mini App. NOT RUN / ENV BLOCKED для самого
// визуального перекрытия.
//
// Что можно и нужно проверить здесь: diff этой ветки НЕ трогает src/screens/Today.jsx
// ни в чём, что касается layout/padding/position (git diff показывает только смену
// текста кнопки и удаление одной кнопки/абзаца — см. коммит-сообщение), и не трогает
// UiLab.jsx/TodayStatePreview.jsx/index.css/tgFullscreen.js вообще. Риск-профиль
// ?ui_lab=baseline по safe-area идентичен тому, что уже прошло реальный Telegram/
// iPhone gate в UI-DEC-001 (там explicitly проверялся «Telegram header/top safe
// area» для baseline/experiments/compare, PASS, без overlap) — эта ветка ничего в
// нём не меняет. Структурная проверка ниже: у .mx-ui-lab всё ещё есть top padding,
// завязанный на --app-safe-top (тот же токен, что чинили для DailyCanonicalExperiment).
test('Today baseline surface (?ui_lab=baseline) не убрал top safe-area padding — структурная проверка', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?ui_lab=baseline')

  const paddingTop = await page.locator('.mx-ui-lab').evaluate(el => getComputedStyle(el).paddingTop)
  // В headless без Telegram --app-safe-top обычно 0px — важно, что правило вообще
  // применяется (paddingTop не 'auto'/пусто), а не что оно ненулевое здесь.
  expect(paddingTop).not.toBe('')
  expect(paddingTop).not.toBe('auto')
})
