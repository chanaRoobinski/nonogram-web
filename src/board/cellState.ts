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

/** Click-to-toggle cycle: UNKNOWN -> FILLED -> MARKED_EMPTY -> UNKNOWN. */
export function nextCellState(current: CellState): CellState {
  return ((current + 1) % 3) as CellState
}

export interface BoardReducerState {
  grid: CellState[][]
  history: CellState[][][]
  future: CellState[][][]
}

export type BoardAction =
  | { type: 'PAINT_START'; row: number; col: number; value: CellState }
  | { type: 'PAINT_CONTINUE'; row: number; col: number; value: CellState }
  | { type: 'UNDO' }
  | { type: 'REDO' }

export function createInitialBoardState(
  grid: CellState[][],
): BoardReducerState {
  return { grid, history: [], future: [] }
}

function setCell(
  grid: CellState[][],
  row: number,
  col: number,
  value: CellState,
): CellState[][] {
  if (grid[row][col] === value) return grid
  const next = grid.map((line) => line.slice())
  next[row][col] = value
  return next
}

/**
 * Pure reducer for board cell state. PAINT_START begins a new discrete user action (pushes one
 * history entry, clears redo); PAINT_CONTINUE paints additional cells as part of that SAME
 * gesture (e.g. a drag) without pushing further history entries, so a whole drag undoes/redoes
 * as one step — never per-cell.
 */
export function boardReducer(
  state: BoardReducerState,
  action: BoardAction,
): BoardReducerState {
  switch (action.type) {
    case 'PAINT_START': {
      const nextGrid = setCell(state.grid, action.row, action.col, action.value)
      if (nextGrid === state.grid) return state
      return { grid: nextGrid, history: [...state.history, state.grid], future: [] }
    }
    case 'PAINT_CONTINUE': {
      const nextGrid = setCell(state.grid, action.row, action.col, action.value)
      if (nextGrid === state.grid) return state
      return { ...state, grid: nextGrid }
    }
    case 'UNDO': {
      if (state.history.length === 0) return state
      const previous = state.history[state.history.length - 1]
      return {
        grid: previous,
        history: state.history.slice(0, -1),
        future: [state.grid, ...state.future],
      }
    }
    case 'REDO': {
      if (state.future.length === 0) return state
      const [next, ...rest] = state.future
      return {
        grid: next,
        history: [...state.history, state.grid],
        future: rest,
      }
    }
    default:
      return state
  }
}
