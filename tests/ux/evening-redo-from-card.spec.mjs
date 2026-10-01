import { expect, test } from '@playwright/test'

/*
 * Повтор вечернего разбора с карточки «День закрыт» (Today):
 * тап по вечерней карточке → recap → меню «…» показывает только
 * «Пройти разбор заново» (без «Пройти утро заново») → подтверждение →
 * вечерний разбор открыт с первого шага. У утренней карточки — только
 * «Пройти утро заново». Поиск — только по data-testid; никаких
 * waitForTimeout — только ожидание состояния.
 */

test('вечерняя карточка «День закрыт» ведёт к повтору разбора, утренняя — к повтору утра', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })
  const page = await context.newPage()
  await page.goto('/?demo=1&today_state=dayClosed')

  // Обе карточки в состоянии done: день закрыт.
  await expect(page.getByTestId('today-card-evening')).toHaveAttribute('data-state', 'done')

  // Вечерняя карточка → recap («Сегодняшний чек-ин»).
  await page.getByTestId('today-card-evening').click()
  await expect(page.getByTestId('history-redo-button')).toBeVisible()

  // Меню «…»: только «Пройти разбор заново».
  await page.getByTestId('history-redo-button').click()
  const menu = page.getByTestId('history-redo-menu')
  await expect(menu.getByTestId('history-redo-item-evening')).toBeVisible()
  await expect(menu.getByTestId('history-redo-item-morning')).toHaveCount(0)

  // Подтверждение → вечерний разбор с первого шага (эмоции).
  await menu.getByTestId('history-redo-item-evening').click()
  await expect(page.getByTestId('history-redo-confirm')).toBeVisible()
  await page.getByTestId('history-redo-confirm').click()
  await expect(
    page.getByRole('heading', { name: 'Что ближе всего к тому, что ты чувствуешь?' })
  ).toBeVisible()

  // Утренняя карточка: меню показывает только «Пройти утро заново».
  // Отдельный заход: из открытого флоу DemoChrome уводит системной навигацией.
  await page.goto('/?demo=1&today_state=dayClosed')
  await expect(page.getByTestId('today-card-morning')).toHaveAttribute('data-state', 'done')
  await page.getByTestId('today-card-morning').click()
  await expect(page.getByTestId('history-redo-button')).toBeVisible()
  await page.getByTestId('history-redo-button').click()
  const morningMenu = page.getByTestId('history-redo-menu')
  await expect(morningMenu.getByTestId('history-redo-item-morning')).toBeVisible()
  await expect(morningMenu.getByTestId('history-redo-item-evening')).toHaveCount(0)

  await context.close()
})
