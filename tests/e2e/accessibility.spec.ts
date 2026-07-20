import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('main game screen has no automatically-detectable accessibility violations', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('#ng-cell-0-0')).toBeVisible({ timeout: 15000 })

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('records modal has no automatically-detectable accessibility violations', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('#ng-cell-0-0')).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: 'שיאים והיסטוריה' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('manual edit mode has no automatically-detectable accessibility violations', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('#ng-cell-0-0')).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: /צור ידנית/ }).click()
  await expect(page.getByText(/מצב עריכה/)).toBeVisible()

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
