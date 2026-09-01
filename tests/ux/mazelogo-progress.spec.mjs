import { test, expect } from '@playwright/test'

const states = [
  { value: '0', testId: 'maze-state-0', expectedDash: '0 1' },
  { value: '0.5', testId: 'maze-state-0-5', expectedDash: '0.5 1' },
  { value: '1', testId: 'maze-state-1', expectedDash: '1 1' },
]

test.describe('MazeLogo: контрольные состояния progress', () => {
  test('рендерит progress=0, 0.5 и 1 без ошибок и с ожидаемой геометрией', async ({ page }) => {
    const runtimeErrors = []
    page.on('pageerror', error => runtimeErrors.push(error.message))

    await page.goto('/tests/fixtures/mazelogo-progress.html')

    for (const state of states) {
      const card = page.getByTestId(state.testId)
      const svg = card.locator('svg')
      const trail = svg.locator('path').nth(1)
      const dot = svg.locator('g circle').last()

      await expect(card).toContainText(`progress=${state.value}`)
      await expect(svg).toHaveAttribute('viewBox', '0 0 200 200')
      await expect(trail).toHaveAttribute('stroke-dasharray', state.expectedDash)
      await expect(dot).toBeVisible()

      const dotPosition = await dot.evaluate(node => ({
        cx: Number(node.getAttribute('cx')),
        cy: Number(node.getAttribute('cy')),
      }))
      expect(dotPosition.cx).toBeGreaterThanOrEqual(0)
      expect(dotPosition.cx).toBeLessThanOrEqual(200)
      expect(dotPosition.cy).toBeGreaterThanOrEqual(0)
      expect(dotPosition.cy).toBeLessThanOrEqual(200)

      await card.screenshot({ path: `artifacts/mazelogo-progress/${state.testId}.png` })
    }

    expect(runtimeErrors).toEqual([])
  })
})
