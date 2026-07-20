import { expect, test } from '@playwright/test'

test('shows an error message when the backend is unreachable for generate', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('#ng-cell-0-0')).toBeVisible({ timeout: 15000 })

  await page.route('**/puzzles/generate', (route) => route.abort('failed'))
  await page.getByRole('button', { name: /צור חידה חדשה/ }).click()

  await expect(page.getByText(/שגיאה ביצירת החידה/)).toBeVisible()
})

test('shows an error message when generation times out (backend 422)', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('#ng-cell-0-0')).toBeVisible({ timeout: 15000 })

  await page.route('**/puzzles/generate', (route) =>
    route.fulfill({
      status: 422,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'GenerationTimeoutError' }),
    }),
  )
  await page.getByRole('button', { name: /צור חידה חדשה/ }).click()

  await expect(page.getByText(/שגיאה ביצירת החידה/)).toBeVisible()
})

test('shows an error message when check-solution can\'t reach the backend', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('#ng-cell-0-0')).toBeVisible({ timeout: 15000 })

  await page.route('**/puzzles/solve', (route) => route.abort('failed'))
  await page.getByRole('button', { name: /^✓ בדיקה$/ }).click()

  await expect(page.getByRole('alert')).toBeVisible()
})
