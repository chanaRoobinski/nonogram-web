import { useCallback, useEffect, useReducer, useRef } from 'react'
import {
  CellState,
  boardReducer,
  createInitialBoardState,
  nextCellState,
} from './cellState'

export function cellElementId(row: number, col: number): string {
  return `ng-cell-${row}-${col}`
}

/** Arrow-key navigation target, or null if the key isn't a nav key or would move off the grid.
 * The board forces its own `direction: ltr` regardless of the app shell's RTL, so Left/Right
 * always mean decrease/increase column — no mirroring here. */
export function computeArrowTarget(
  row: number,
  col: number,
  key: string,
  numRows: number,
  numCols: number,
): { row: number; col: number } | null {
  let nextRow = row
  let nextCol = col
  switch (key) {
    case 'ArrowUp':
      nextRow = row - 1
      break
    case 'ArrowDown':
      nextRow = row + 1
      break
    case 'ArrowLeft':
      nextCol = col - 1
      break
    case 'ArrowRight':
      nextCol = col + 1
      break
    default:
      return null
  }
  if (nextRow < 0 || nextRow >= numRows || nextCol < 0 || nextCol >= numCols) {
    return null
  }
  return { row: nextRow, col: nextCol }
}

/**
 * Board interaction glue: wires the pure reducer (cellState.ts) to mouse drag-to-paint,
 * right-click mark-empty, and keyboard activation. Arrow-key focus movement is handled by the
 * caller using computeArrowTarget + cellElementId (needs a DOM focus() call, kept out of this
 * hook to keep it free of direct DOM access).
 */
export function useBoardState(initialGrid: CellState[][]) {
  const [state, dispatch] = useReducer(
    boardReducer,
    initialGrid,
    createInitialBoardState,
  )
  const dragValue = useRef<CellState | null>(null)

  useEffect(() => {
    const stopDrag = () => {
      dragValue.current = null
    }
    window.addEventListener('mouseup', stopDrag)
    return () => window.removeEventListener('mouseup', stopDrag)
  }, [])

  const startPaint = useCallback(
    (row: number, col: number) => {
      const value = nextCellState(state.grid[row][col])
      dragValue.current = value
      dispatch({ type: 'PAINT_START', row, col, value })
    },
    [state.grid],
  )

  const continuePaint = useCallback((row: number, col: number) => {
    if (dragValue.current === null) return
    dispatch({ type: 'PAINT_CONTINUE', row, col, value: dragValue.current })
  }, [])

  const markEmpty = useCallback((row: number, col: number) => {
    dispatch({ type: 'PAINT_START', row, col, value: CellState.MARKED_EMPTY })
  }, [])

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), [])
  const redo = useCallback(() => dispatch({ type: 'REDO' }), [])

  return {
    grid: state.grid,
    canUndo: state.history.length > 0,
    canRedo: state.future.length > 0,
    startPaint,
    continuePaint,
    markEmpty,
    undo,
    redo,
  }
}
