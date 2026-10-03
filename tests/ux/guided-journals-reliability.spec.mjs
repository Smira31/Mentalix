import { expect, test } from '@playwright/test'

/*
 * Надёжность «Направленных записей»: продолжение черновика по снимку вопросов
 * и ошибка каталога с кнопкой «Повторить». Только data-testid.
 */

test.use({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true })

const DEMO_USER_ID = 900001
const DRAFT_KEY = `mx-journal-draft-v3:user:${DEMO_USER_ID}`

async function openJournals(page, query = '') {
  await page.goto(`/?demo=1&tab=library${query}`)
  await page
    .getByRole('button', { name: /Направленные записи|Все записи|Открыть/ })
    .first()
    .click()
}

test.describe('Направленные записи — надёжность', () => {
  test('продолжение черновика (id числом) открывает нужный шаблон по снимку', async ({
    page,
    context,
  }) => {
    await context.addInitScript(
      ({ key }) => {
        if (sessionStorage.getItem('gj-seeded')) return
        sessionStorage.setItem('gj-seeded', '1')
        localStorage.setItem('mx-onboarded-v2', '1')
        localStorage.setItem('mx-app-lock-enabled', '0')
        localStorage.setItem(
          key,
          JSON.stringify({
            drafts: {
              2: {
                answers: { 'snap-1': 'Первый ответ' },
                template_id: 2,
                templateTitle: 'Снимок: вечер',
                templateVersion: 7,
                snapshot: [
                  { id: 'snap-1', title: 'Вопрос из снимка 1', type: 'free_text', required: false },
                  { id: 'snap-2', title: 'Вопрос из снимка 2', type: 'free_text', required: false },
                ],
                updatedAt: new Date().toISOString(),
              },
            },
          })
        )
      },
      { key: DRAFT_KEY }
    )
    await openJournals(page)

    await page.getByTestId('journal-v3-resume').first().click()
    // Редактор открылся на первом неотвеченном вопросе СНИМКА, а не текущего шаблона
    await expect(page.getByText('Вопрос из снимка 2')).toBeVisible()
    await expect(page.getByText(/Снимок: вечер · 2 из 2/)).toBeVisible()
    await expect(page.getByTestId('journal-v3-next')).toBeVisible()
  })

  test('ошибка каталога показывает «Повторить», повтор загружает шаблоны', async ({
    page,
    context,
  }) => {
    await context.addInitScript(() => {
      localStorage.setItem('mx-onboarded-v2', '1')
      localStorage.setItem('mx-app-lock-enabled', '0')
    })
    await openJournals(page, '&guidedTest=catalogError')

    await expect(page.getByTestId('journal-v3-catalog-error')).toBeVisible()
    await expect(page.getByTestId('journal-v3-template-card')).toHaveCount(0)

    await page.getByTestId('journal-v3-catalog-retry').click()

    await expect(page.getByTestId('journal-v3-catalog-error')).toHaveCount(0)
    await expect(page.getByTestId('journal-v3-template-card').first()).toBeVisible()
  })
})
