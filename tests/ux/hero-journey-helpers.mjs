import { expect } from '@playwright/test'

/*
 * Помощники «Пути героя» для браузерных сценариев.
 *
 * Демо-шаг 1 отдаётся листами, как в сторис (необязательное поле шага pages):
 * экрана «Начать шаг» у него нет, а последний лист открывает «Запиши». Листаем
 * тем же жестом, что у пользователя, — белой круглой кнопкой «›».
 */
export const DEMO_STEP_ONE_SHEETS = 4

/* Пролистать вводку-сторис до экрана «Запиши». */
export async function advanceStoryToWrite(page) {
  for (let i = 0; i < DEMO_STEP_ONE_SHEETS; i += 1) {
    await page.getByTestId('hero-story-next').click()
  }
  await page.getByTestId('hero-write-input').waitFor({ state: 'visible' })
}

/*
 * Открыть «Запиши» из вводки шага: у шага с листами (pages) экрана «Начать шаг»
 * нет — листы листает белая круглая кнопка «›», и последний лист ведёт на
 * запись; у шага без листов вступление стартует кнопкой «Начать шаг».
 */
export async function openStepWrite(page) {
  const storyNext = page.getByTestId('hero-story-next')
  await expect(storyNext.or(page.getByTestId('hero-step-start'))).toBeVisible()
  if ((await storyNext.count()) > 0) {
    await advanceStoryToWrite(page)
    return
  }
  await page.getByTestId('hero-step-start').click()
  await page.getByTestId('hero-write-input').waitFor({ state: 'visible' })
}
