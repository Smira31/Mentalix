import { expect, test } from '@playwright/test'

async function openOnboarding(page) {
  await page.addInitScript(() => {
    localStorage.setItem('mentalix_web_user', JSON.stringify({ id: 900001, first_name: 'Тест' }))
    localStorage.removeItem('mx-onboarded-v2')
    localStorage.removeItem('mx-onboarding-progress')
  })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Начать' })).toBeVisible()
}

async function reachAgeStep(page) {
  await openOnboarding(page)
  await page.getByRole('button', { name: 'Начать' }).click()
  await expect(page.getByRole('heading', { name: 'Сколько тебе лет?' })).toBeVisible()
}

test('приветствие показывает обновлённый подзаголовок', async ({ page }) => {
  await openOnboarding(page)
  await expect(page.getByText('Пара коротких вопросов — и начнём. Это займёт минуту.')).toBeVisible()
})

test('флоу: приветствие → возраст → напоминание → готово (без шага фокуса)', async ({ page }) => {
  await reachAgeStep(page)
  // Возраст
  await page.getByRole('button', { name: '18–24' }).click()
  await page.getByRole('button', { name: 'Дальше' }).click()
  // Напоминание
  await expect(page.getByRole('heading', { name: 'Когда напомнить о себе?' })).toBeVisible()
  await page.getByRole('button', { name: 'Дальше' }).click()
  // Готово
  await expect(page.getByRole('heading', { name: 'Готово. Путь размечен.' })).toBeVisible()
  await expect(page.getByText('Наставник, Спутник, Наблюдатель и Даймон ждут тебя в «Диалоге»')).toBeVisible()
})

test('до 18 — экран 18+ с кнопкой «Закрыть» (в Telegram)', async ({ page }) => {
  await reachAgeStep(page)
  await page.getByRole('button', { name: 'До 18' }).click()
  await expect(page.getByRole('heading', { name: 'Mentalix доступен с 18 лет' })).toBeVisible()
  await expect(page.getByText('практики саморефлексии')).toBeVisible()
  // В web-режиме кнопки «Закрыть» нет
  await expect(page.getByRole('button', { name: 'Закрыть' })).toHaveCount(0)
  // Назад возвращает к выбору возраста
  await page.getByRole('button', { name: 'Назад' }).click()
  await expect(page.getByRole('heading', { name: 'Сколько тебе лет?' })).toBeVisible()
})

test('с 18 лет можно продолжить знакомство', async ({ page }) => {
  await reachAgeStep(page)
  await page.getByRole('button', { name: '18–24' }).click()
  await expect(page.getByRole('button', { name: 'Дальше' })).toBeEnabled()
  await page.getByRole('button', { name: 'Дальше' }).click()
  await expect(page.getByRole('heading', { name: 'Когда напомнить о себе?' })).toBeVisible()
})

test('прогресс восстанавливается после перезапуска', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mentalix_web_user', JSON.stringify({ id: 900001, first_name: 'Тест' }))
    localStorage.removeItem('mx-onboarded-v2')
    localStorage.setItem('mx-onboarding-progress', JSON.stringify({ step: 2, age: '25–34', reminder: 'evening' }))
  })
  await page.goto('/')
  // Должны сразу оказаться на шаге напоминания
  await expect(page.getByRole('heading', { name: 'Когда напомнить о себе?' })).toBeVisible()
  // Вечер должен быть выбран
  const eveningBtn = page.getByRole('button', { name: /Вечер/ })
  await expect(eveningBtn).toBeVisible()
})
