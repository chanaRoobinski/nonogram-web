import { describe, expect, it } from 'vitest'
import {
  MAX_ZOOM,
  MIN_ZOOM,
  clampZoomIn,
  clampZoomOut,
} from '../../src/board/useFittedCellSize'

describe('clampZoomIn', () => {
  it('increases zoom by one step', () => {
    expect(clampZoomIn(1)).toBe(1.15)
  })

  it('clamps at the maximum', () => {
    expect(clampZoomIn(MAX_ZOOM)).toBe(MAX_ZOOM)
    expect(clampZoomIn(MAX_ZOOM - 0.05)).toBe(MAX_ZOOM)
  })
})

describe('clampZoomOut', () => {
  it('decreases zoom by one step', () => {
    expect(clampZoomOut(1)).toBe(0.85)
  })

  it('clamps at the minimum', () => {
    expect(clampZoomOut(MIN_ZOOM)).toBe(MIN_ZOOM)
    expect(clampZoomOut(MIN_ZOOM + 0.05)).toBe(MIN_ZOOM)
  })
})
