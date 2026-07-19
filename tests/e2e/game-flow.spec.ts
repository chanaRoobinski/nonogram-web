import { expect, test } from '@playwright/test'

const BOARD_SIZE = 5

test('generate, move, undo, hint to completion, check solution, win', async ({
  page,
}) => {
  await page.goto('/')

  const cell = (r: number, c: number) => page.locator(`#ng-cell-${r}-${c}`)

  // A puzzle auto-generates on load.
  await expect(cell(0, 0)).toBeVisible({ timeout: 15000 })

  // Make a move, then undo it, leaving the board blank again.
  await cell(0, 0).click()
  await expect(cell(0, 0)).toHaveClass(/filled/)
  await page.getByRole('button', { name: /בטל/ }).click()
  await expect(cell(0, 0)).not.toHaveClass(/filled/)

  // Repeatedly hint until every correct cell is revealed (bounded by the grid size — hint
  // always reveals one previously-unfilled correct cell, so this terminates).
  const hintButton = page.getByRole('button', { name: /רמז/ })
  for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
    await hintButton.click()
  }

  await page.getByRole('button', { name: /^✓ בדיקה$/ }).click()

  await expect(page.getByText('פתרתם את החידה!')).toBeVisible({
    timeout: 5000,
  })
})
