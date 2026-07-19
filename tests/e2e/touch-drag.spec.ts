import { expect, test } from '@playwright/test'

// A plain mobile-shaped viewport + touch capability, kept on the same chromium browser as the
// rest of the suite (rather than devices['iPhone 13'], which pulls in WebKit — a second browser
// binary this project doesn't otherwise need, just to prove touch *event handling* works).
test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
})

/** touchmove keeps firing on the element where the touch started rather than whatever is under
 * the finger, so the app itself uses elementFromPoint to resolve the current cell (see
 * Board.tsx). Simulating a real drag here needs the same approach, since Playwright's
 * touchscreen API only supports single taps, not multi-point drags. */
async function touchDrag(
  page: import('@playwright/test').Page,
  points: { x: number; y: number }[],
) {
  await page.evaluate((pts) => {
    function dispatch(type: string, el: Element, x: number, y: number) {
      const touch = new Touch({ identifier: 1, target: el, clientX: x, clientY: y })
      el.dispatchEvent(
        new TouchEvent(type, {
          touches: type === 'touchend' ? [] : [touch],
          changedTouches: [touch],
          bubbles: true,
          cancelable: true,
        }),
      )
    }
    const [first, ...rest] = pts
    const firstEl = document.elementFromPoint(first.x, first.y)
    if (firstEl) dispatch('touchstart', firstEl, first.x, first.y)
    for (const point of rest) {
      const el = document.elementFromPoint(point.x, point.y)
      if (el) dispatch('touchmove', el, point.x, point.y)
    }
    const last = pts[pts.length - 1]
    const lastEl = document.elementFromPoint(last.x, last.y)
    if (lastEl) dispatch('touchend', lastEl, last.x, last.y)
  }, points)
}

test('touch drag-paints a run of cells on a mobile viewport', async ({ page }) => {
  await page.goto('/')

  const cell = (r: number, c: number) => page.locator(`#ng-cell-${r}-${c}`)
  await expect(cell(0, 0)).toBeVisible({ timeout: 15000 })

  const boxes = await Promise.all(
    [0, 1, 2].map(async (c) => {
      const box = await cell(0, c).boundingBox()
      if (!box) throw new Error(`cell 0,${c} has no bounding box`)
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    }),
  )

  await touchDrag(page, boxes)

  await expect(cell(0, 0)).toHaveClass(/filled/)
  await expect(cell(0, 1)).toHaveClass(/filled/)
  await expect(cell(0, 2)).toHaveClass(/filled/)
})
