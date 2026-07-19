import { describe, expect, it } from 'vitest'
import { CellState, createEmptyGrid } from '../../src/board/cellState'
import {
  deriveCluesFromSolution,
  isValidManualSolution,
} from '../../src/game/manualPuzzle'

const { FILLED } = CellState

describe('isValidManualSolution', () => {
  it('rejects an all-empty draft', () => {
    expect(isValidManualSolution(createEmptyGrid(3, 3))).toBe(false)
  })

  it('rejects an all-filled draft', () => {
    const draft = createEmptyGrid(3, 3).map((row) => row.map(() => FILLED))
    expect(isValidManualSolution(draft)).toBe(false)
  })

  it('accepts a draft with at least one filled and one empty cell', () => {
    const draft = createEmptyGrid(3, 3)
    draft[0][0] = FILLED
    expect(isValidManualSolution(draft)).toBe(true)
  })
})

describe('deriveCluesFromSolution', () => {
  it('derives row/col clues matching the drawn solution', () => {
    const draft = createEmptyGrid(2, 2)
    draft[0][0] = FILLED
    draft[0][1] = FILLED
    draft[1][1] = FILLED

    const { rowClues, colClues } = deriveCluesFromSolution(draft)
    expect(rowClues).toEqual([[2], [1]])
    expect(colClues).toEqual([[1], [2]])
  })
})
