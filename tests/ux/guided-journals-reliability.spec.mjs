import { expect, test } from '@playwright/test'

// UI удалён по решению владельца, данные и код остаются.
test('Старый вход направленных записей возвращает в Библиотеку без удаления черновика', async ({
  page,
}) => {
  const key = 'mx-journal-draft-v3:user:900001'
  const draft = JSON.stringify({ drafts: { 2: { answers: { one: 'Сохранённый ответ' } } } })
  await page.addInitScript(({ key, draft }) => localStorage.setItem(key, draft), { key, draft })
  await page.goto('/?demo=1&tab=library&sub=journals&frame=0&tgshell=0')
  await expect(page.getByTestId('library-home')).toBeVisible()
  await expect(page.getByTestId('journal-builder-open')).toHaveCount(0)
  await expect(page.getByTestId('journal-v3-template-card')).toHaveCount(0)
  await expect(page).not.toHaveURL(/sub=journals/)
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(draft)
})
