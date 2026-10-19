import { test, expect } from '@playwright/test'

/*
 * #1095 — карточка «Дневник» в библиотеке «Твои практики».
 *
 * Данные берём из демо-режима (?demo=1) — он даёт практики без backend.
 * Поиск элементов — только по data-testid, текст проверяем как отображение.
 * Ожидания — по состоянию, без waitForTimeout.
 */

test.use({ viewport: { width: 393, height: 852 } })

test('Дневник: есть в библиотеке, добавление → плитка на Today → тап открывает журнал', async ({
  page,
}) => {
  await page.goto('/?demo=1&tab=today')

  // Открываем шторку управления «Твои практики»
  await page.getByTestId('pinned-practices-manage').click()
  await expect(page.getByRole('heading', { name: 'твои практики.' })).toBeVisible()

  // Открываем библиотеку практик
  await page.getByText('Добавить из библиотеки').click()
  await expect(page.getByRole('heading', { name: 'библиотека практик.' })).toBeVisible()

  // «Дневник» присутствует в библиотеке
  const diaryRow = page.getByRole('listitem').filter({ hasText: 'Дневник' })
  await expect(diaryRow).toBeVisible()

  // Добавляем «Дневник» в набор
  await diaryRow.click()

  // Кнопка-переключатель показывает галочку (закреплено)
  await expect(diaryRow).toHaveAttribute('aria-pressed', 'true')

  // Закрываем библиотеку → шторка управления
  await page.getByRole('button', { name: 'Сохранить и закрыть' }).click()

  // Закрываем шторку управления
  await page.getByRole('button', { name: 'Закрыть' }).click().catch(async () => {
    // В Telegram-режиме кнопки «Закрыть» нет — закрываем по клику на фон
    await page.keyboard.press('Escape')
  })

  // На Today в блоке «Твои практики» появилась плитка «Дневник»
  const diaryTile = page.getByTestId('practice-tile').filter({ hasText: 'Дневник' })
  await expect(diaryTile).toBeVisible()

  // Тап по плитке «Дневник» открывает существующий журнал (DailyJournalFlow)
  await diaryTile.click()

  // Журнал открыт: DailyJournalFlow рендерит свою поверхность
  await expect(page.getByText(/страница для себя|запиши|что на душе/i)).toBeVisible({
    timeout: 10_000,
  })
})

test('Дневник: повторное добавление не создаёт дубль', async ({ page }) => {
  await page.goto('/?demo=1&tab=today')

  await page.getByTestId('pinned-practices-manage').click()
  await page.getByText('Добавить из библиотеки').click()

  const diaryRow = page.getByRole('listitem').filter({ hasText: 'Дневник' })
  await expect(diaryRow).toBeVisible()

  // Если ещё не закреплён — закрепляем
  const isPressed = await diaryRow.getAttribute('aria-pressed')
  if (isPressed !== 'true') {
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
  await page.getByRole('button', { name: 'Сохранить и закрыть' }).click()
  await page.keyboard.press('Escape')

  const diaryTiles = page.getByTestId('practice-tile').filter({ hasText: 'Дневник' })
  await expect(diaryTiles).toHaveCount(1)
})

test('Дневник: удаление из набора через меню «…» убирает плитку с Today', async ({ page }) => {
  await page.goto('/?demo=1&tab=today')

  // Сначала добавим «Дневник» через библиотеку, если его нет
  const diaryTile = page.getByTestId('practice-tile').filter({ hasText: 'Дневник' })
  const tileVisible = await diaryTile.isVisible().catch(() => false)

  if (!tileVisible) {
    await page.getByTestId('pinned-practices-manage').click()
    await page.getByText('Добавить из библиотеки').click()
    const diaryRow = page.getByRole('listitem').filter({ hasText: 'Дневник' })
    await diaryRow.click()
    await expect(diaryRow).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Сохранить и закрыть' }).click()
    await page.keyboard.press('Escape')
    await expect(diaryTile).toBeVisible()
  }

  // Открываем шторку управления
  await page.getByTestId('pinned-practices-manage').click()

  // Находим карточку «Дневник» в шторке управления и открываем меню «…»
  const diaryCard = page.locator('.mx-pinned-practice-card--managed').filter({ hasText: 'Дневник' })
  await expect(diaryCard).toBeVisible()
  await diaryCard.getByTestId(/practice-card-more-/).click()

  // Выбираем «Убрать из набора»
  await page.getByTestId('practice-card-menu-remove').click()

  // Карточка исчезла из шторки управления
  await expect(diaryCard).toHaveCount(0)

  // Закрываем шторку
  await page.keyboard.press('Escape')

  // На Today плитки «Дневник» больше нет
  await expect(page.getByTestId('practice-tile').filter({ hasText: 'Дневник' })).toHaveCount(0)
})
