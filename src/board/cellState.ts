/**
 * 3-state cell model, confirmed by the imported design's own prototype logic
 * (`cellClick`: `(cur + 1) % 3`) — see PROGRESS.md "Decisions made along the way".
 */
export const CellState = {
  UNKNOWN: 0,
  FILLED: 1,
  MARKED_EMPTY: 2,
} as const

export type CellState = (typeof CellState)[keyof typeof CellState]

export function createEmptyGrid(
  numRows: number,
  numCols: number,
): CellState[][] {
  return Array.from({ length: numRows }, () =>
    Array.from({ length: numCols }, () => CellState.UNKNOWN),
  )
}
