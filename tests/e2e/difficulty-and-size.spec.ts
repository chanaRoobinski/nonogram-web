import { expect, test } from '@playwright/test'

const DIFFICULTIES = ['קל', 'בינוני', 'קשה', 'קשה מאוד']

for (const label of DIFFICULTIES) {
  test(`generates a puzzle at difficulty: ${label}`, async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#ng-cell-0-0')).toBeVisible({ timeout: 15000 })

    await page.getByRole('button', { name: label, exact: true }).click()
    await page.getByRole('button', { name: /צור חידה חדשה/ }).click()

    // A fresh 5x5 board (the default size) renders — the previous puzzle's cells are gone and
    // a full grid of 25 fresh gridcells is back.
    await expect(page.locator('#ng-cell-0-0')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('[role="gridcell"]')).toHaveCount(25)
  })
}

test('generates and renders a large (15x15) grid within a reasonable time', async ({
  page,
}) => {
  // 15 is the largest size that stays comfortably fast against the real backend — measured
  // directly: 15x15 ≈ 11.5s, 20x20 (the current UI max) ≈ 45s, 25x25 didn't finish in 2 minutes.
  // See PROGRESS.md for the full finding; this is a sanity check, not a benchmark of the max.
  await page.goto('/')
  await expect(page.locator('#ng-cell-0-0')).toBeVisible({ timeout: 15000 })

  const sizeSlider = page.getByLabel('גודל הלוח')
  await sizeSlider.fill('15')

  const start = Date.now()
  await page.getByRole('button', { name: /צור חידה חדשה/ }).click()
  await expect(page.locator('#ng-cell-14-14')).toBeVisible({ timeout: 30000 })
  const elapsedMs = Date.now() - start

  await expect(page.locator('[role="gridcell"]')).toHaveCount(225)
  expect(elapsedMs).toBeLessThan(30000)
})
