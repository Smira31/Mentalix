import { test, expect } from '@playwright/test'

/*
 * #1095 — карточка «Дневник» в библиотеке «Твои практики».
 *
 * Данные берём из демо-режима (?demo=1) — он даёт практики без backend.
 * Поиск элементов — только по data-testid, текст проверяем как отображение.
 * Ожидания — по состоянию, без waitForTimeout.
 */

// Бейдж демо-панели и переключатель «Demo viewport» — превью-артефакты
// демо-режима, перекрывают шапку шторок (как в progress-segment-visibility.spec.mjs)
async function hideDemoBadge(page) {
  await page.addStyleTag({
    content: [
      '[data-testid="demo-panel-badge"] { display: none !important; }',
      '.mx-preview-device-switcher { display: none !important; }',
    ].join('\n'),
  })
}

const DIARY_ROW = 'library-row-journal'
const DIARY_MANAGE_CARD = 'practice-manage-card-journal'
const DIARY_TILE = page => page.getByTestId('practice-tile').filter({ hasText: 'Дневник' })

test.use({ viewport: { width: 393, height: 852 } })

test('Дневник: есть в библиотеке, добавление → плитка на Today → тап открывает журнал', async ({
  page,
}) => {
  await page.goto('/?demo=1&tab=today')
  await hideDemoBadge(page)

  // Открываем шторку управления «Твои практики»
  await page.getByTestId('pinned-practices-manage').click()
  await expect(page.getByRole('heading', { name: 'твои практики.' })).toBeVisible()

  // Открываем библиотеку практик
  await page.getByText('Добавить из библиотеки').click()
  await expect(page.getByRole('heading', { name: 'библиотека практик.' })).toBeVisible()

  // «Дневник» присутствует в библиотеке
  const diaryRow = page.getByTestId(DIARY_ROW)
  await expect(diaryRow).toBeVisible()

  // Добавляем «Дневник» в набор: кнопка-переключатель показывает закрепление
  if ((await diaryRow.getAttribute('aria-pressed')) !== 'true') {
    await diaryRow.click()
  }
  await expect(diaryRow).toHaveAttribute('aria-pressed', 'true')

  // Закрываем библиотеку → шторка управления → Today. Кнопки закрытия —
  // только по data-testid: getByRole({ name: 'Закрыть' }) матчит по подстроке
  // и на Today ловит также «Закрыть подсказку о серии» (strict mode violation).
  await page.getByTestId('pinned-sheet-close-library').click()
  await page.getByTestId('pinned-sheet-close').click()

  // На Today в блоке «Твои практики» появилась ровно одна плитка «Дневник»
  await expect(DIARY_TILE(page)).toHaveCount(1)
  await expect(DIARY_TILE(page)).toBeVisible()

  // Тап по плитке «Дневник» открывает существующий журнал (DailyJournalFlow)
  await DIARY_TILE(page).click()
  await expect(page.getByText(/страница для себя|запиши|что на душе/i)).toBeVisible({
    timeout: 10_000,
  })
})

test('Дневник: повторное добавление не создаёт дубль', async ({ page }) => {
  await page.goto('/?demo=1&tab=today')
  await hideDemoBadge(page)

  await page.getByTestId('pinned-practices-manage').click()
  await page.getByText('Добавить из библиотеки').click()

  const diaryRow = page.getByTestId(DIARY_ROW)
  await expect(diaryRow).toBeVisible()

  // Если ещё не закреплён — закрепляем
  if ((await diaryRow.getAttribute('aria-pressed')) !== 'true') {
    await diaryRow.click()
    await expect(diaryRow).toHaveAttribute('aria-pressed', 'true')
  }

  // Повторный клик — снимает закрепление (toggle, не дубль)
  await diaryRow.click()
  await expect(diaryRow).toHaveAttribute('aria-pressed', 'false')

  // Снова клик — закрепляем обратно
  await diaryRow.click()
  await expect(diaryRow).toHaveAttribute('aria-pressed', 'true')

  // Закрываем и проверяем: только одна плитка «Дневник» на Today
  await page.getByTestId('pinned-sheet-close-library').click()
  await page.getByTestId('pinned-sheet-close').click()

  await expect(DIARY_TILE(page)).toHaveCount(1)
})

test('Дневник: удаление из набора через меню «…» убирает плитку с Today', async ({ page }) => {
  await page.goto('/?demo=1&tab=today')
  await hideDemoBadge(page)

  // Сначала добавим «Дневник» через библиотеку, если его нет
  if (!(await DIARY_TILE(page).isVisible().catch(() => false))) {
    await page.getByTestId('pinned-practices-manage').click()
    await page.getByText('Добавить из библиотеки').click()
    const diaryRow = page.getByTestId(DIARY_ROW)
    await diaryRow.click()
    await expect(diaryRow).toHaveAttribute('aria-pressed', 'true')
    await page.getByTestId('pinned-sheet-close-library').click()
    await page.getByTestId('pinned-sheet-close').click()
    await expect(DIARY_TILE(page)).toBeVisible()
  }

  // Открываем шторку управления и меню «…» карточки «Дневник»
  await page.getByTestId('pinned-practices-manage').click()
  const diaryCard = page.getByTestId(DIARY_MANAGE_CARD)
  await expect(diaryCard).toBeVisible()
  await diaryCard.getByTestId('practice-card-more-journal').click()

  // Выбираем «Убрать из набора»
  await page.getByTestId('practice-card-menu-remove').click()

  // Карточка исчезла из шторки управления
  await expect(diaryCard).toHaveCount(0)

  // Закрываем шторку
  await page.getByTestId('pinned-sheet-close').click()

  // На Today плитки «Дневник» больше нет
  await expect(DIARY_TILE(page)).toHaveCount(0)
})
