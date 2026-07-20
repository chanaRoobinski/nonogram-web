import { expect, test } from '@playwright/test'

const BOARD_SIZE = 5

test('full keyboard-only playthrough: navigate, toggle, hint, check, win, dismiss', async ({
  page,
}) => {
  await page.goto('/')

  const cell = (r: number, c: number) => page.locator(`#ng-cell-${r}-${c}`)
  await expect(cell(0, 0)).toBeVisible({ timeout: 15000 })

  // Focus the first cell and operate the grid purely via keyboard: Enter toggles, arrow keys
  // move focus (roving tabindex — see Stage 3). Locator.press() (unlike page.keyboard.press())
  // waits for the target to be actionable first, so it won't race a button's disabled state.
  await cell(0, 0).press('Enter')
  await expect(cell(0, 0)).toHaveClass(/filled/)

  await cell(0, 0).press('ArrowRight')
  await expect(cell(0, 1)).toBeFocused()
  await cell(0, 1).press(' ')
  await expect(cell(0, 1)).toHaveClass(/filled/)

  // Undo both exploratory moves via keyboard (confirming the button is keyboard-operable too),
  // back to a blank board — otherwise cell (0,0) would stay filled regardless of whether it's
  // actually part of the solution, and hinting alone could never reach a fully-correct board.
  const undoButton = page.getByRole('button', { name: /בטל/ })
  await undoButton.press('Enter')
  await expect(cell(0, 1)).not.toHaveClass(/filled/)
  await undoButton.press('Enter')
  await expect(cell(0, 0)).not.toHaveClass(/filled/)

  // Hint repeatedly via keyboard until the puzzle is fully revealed.
  const hintButton = page.getByRole('button', { name: /רמז/ })
  for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
    await hintButton.press('Enter')
  }

  const checkButton = page.getByRole('button', { name: /^✓ בדיקה$/ })
  await checkButton.press('Enter')

  const winDialog = page.getByRole('dialog', { name: 'פתרתם את החידה' })
  await expect(winDialog).toBeVisible({ timeout: 5000 })

  // Escape closes the win modal (a11y modal pattern from Stage 6) and focus should have moved
  // into the dialog on open.
  await expect(winDialog.getByRole('button', { name: 'המשך' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(winDialog).not.toBeVisible()
})
