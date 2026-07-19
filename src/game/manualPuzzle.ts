import { CellState } from '../board/cellState'
import { runsOfLine } from '../board/lineRuns'

/**
 * A manually-drawn solution must have at least one filled and one empty cell — an all-empty or
 * all-filled "puzzle" has a degenerate (trivial or contradictory) clue set, matching the design's
 * own validation before accepting a hand-drawn solution.
 */
export function isValidManualSolution(draft: CellState[][]): boolean {
  const cells = draft.flat()
  const hasFilled = cells.some((cell) => cell === CellState.FILLED)
  const hasEmpty = cells.some((cell) => cell !== CellState.FILLED)
  return hasFilled && hasEmpty
}

export function deriveCluesFromSolution(solution: CellState[][]): {
  rowClues: number[][]
  colClues: number[][]
} {
  const rowClues = solution.map((row) => runsOfLine(row))
  const colClues = (solution[0] ?? []).map((_, c) =>
    runsOfLine(solution.map((row) => row[c])),
  )
  return { rowClues, colClues }
}
