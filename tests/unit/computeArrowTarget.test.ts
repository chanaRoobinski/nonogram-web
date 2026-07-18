import { describe, expect, it } from 'vitest'
import { computeArrowTarget } from '../../src/board/boardInteractions'

describe('computeArrowTarget', () => {
  it('moves up/down/left/right within bounds', () => {
    expect(computeArrowTarget(2, 2, 'ArrowUp', 5, 5)).toEqual({ row: 1, col: 2 })
    expect(computeArrowTarget(2, 2, 'ArrowDown', 5, 5)).toEqual({ row: 3, col: 2 })
    expect(computeArrowTarget(2, 2, 'ArrowLeft', 5, 5)).toEqual({ row: 2, col: 1 })
    expect(computeArrowTarget(2, 2, 'ArrowRight', 5, 5)).toEqual({ row: 2, col: 3 })
  })

  it('returns null at the top/left edge', () => {
    expect(computeArrowTarget(0, 0, 'ArrowUp', 5, 5)).toBeNull()
    expect(computeArrowTarget(0, 0, 'ArrowLeft', 5, 5)).toBeNull()
  })

  it('returns null at the bottom/right edge', () => {
    expect(computeArrowTarget(4, 4, 'ArrowDown', 5, 5)).toBeNull()
    expect(computeArrowTarget(4, 4, 'ArrowRight', 5, 5)).toBeNull()
  })

  it('returns null for a non-navigation key', () => {
    expect(computeArrowTarget(2, 2, 'Enter', 5, 5)).toBeNull()
    expect(computeArrowTarget(2, 2, 'a', 5, 5)).toBeNull()
  })
})
