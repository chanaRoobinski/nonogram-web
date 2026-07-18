import { describe, expect, it } from 'vitest'
import {
  CellState,
  boardReducer,
  createEmptyGrid,
  createInitialBoardState,
  nextCellState,
} from '../../src/board/cellState'

const { UNKNOWN, FILLED, MARKED_EMPTY } = CellState

describe('nextCellState', () => {
  it('cycles UNKNOWN -> FILLED -> MARKED_EMPTY -> UNKNOWN', () => {
    expect(nextCellState(UNKNOWN)).toBe(FILLED)
    expect(nextCellState(FILLED)).toBe(MARKED_EMPTY)
    expect(nextCellState(MARKED_EMPTY)).toBe(UNKNOWN)
  })
})

describe('boardReducer', () => {
  it('PAINT_START sets a cell and pushes one history entry', () => {
    const initial = createInitialBoardState(createEmptyGrid(2, 2))
    const state = boardReducer(initial, {
      type: 'PAINT_START',
      row: 0,
      col: 0,
      value: FILLED,
    })
    expect(state.grid[0][0]).toBe(FILLED)
    expect(state.history).toHaveLength(1)
    expect(state.history[0]).toBe(initial.grid)
  })

  it('PAINT_START is a no-op (same state reference) when the value does not change', () => {
    const initial = createInitialBoardState(createEmptyGrid(2, 2))
    const state = boardReducer(initial, {
      type: 'PAINT_START',
      row: 0,
      col: 0,
      value: UNKNOWN,
    })
    expect(state).toBe(initial)
  })

  it('PAINT_START clears the redo (future) stack', () => {
    let state = createInitialBoardState(createEmptyGrid(2, 2))
    state = boardReducer(state, { type: 'PAINT_START', row: 0, col: 0, value: FILLED })
    state = boardReducer(state, { type: 'UNDO' })
    expect(state.future).toHaveLength(1)
    state = boardReducer(state, { type: 'PAINT_START', row: 1, col: 1, value: FILLED })
    expect(state.future).toHaveLength(0)
  })

  it('a drag (PAINT_START then several PAINT_CONTINUE) produces exactly one history entry', () => {
    let state = createInitialBoardState(createEmptyGrid(1, 4))
    state = boardReducer(state, { type: 'PAINT_START', row: 0, col: 0, value: FILLED })
    state = boardReducer(state, { type: 'PAINT_CONTINUE', row: 0, col: 1, value: FILLED })
    state = boardReducer(state, { type: 'PAINT_CONTINUE', row: 0, col: 2, value: FILLED })
    state = boardReducer(state, { type: 'PAINT_CONTINUE', row: 0, col: 3, value: FILLED })

    expect(state.grid[0]).toEqual([FILLED, FILLED, FILLED, FILLED])
    expect(state.history).toHaveLength(1)
  })

  it('undoing a drag reverts the whole run in a single step', () => {
    let state = createInitialBoardState(createEmptyGrid(1, 3))
    state = boardReducer(state, { type: 'PAINT_START', row: 0, col: 0, value: FILLED })
    state = boardReducer(state, { type: 'PAINT_CONTINUE', row: 0, col: 1, value: FILLED })
    state = boardReducer(state, { type: 'PAINT_CONTINUE', row: 0, col: 2, value: FILLED })

    state = boardReducer(state, { type: 'UNDO' })

    expect(state.grid[0]).toEqual([UNKNOWN, UNKNOWN, UNKNOWN])
    expect(state.history).toHaveLength(0)
  })

  it('redo restores a previously-undone action', () => {
    let state = createInitialBoardState(createEmptyGrid(1, 1))
    state = boardReducer(state, { type: 'PAINT_START', row: 0, col: 0, value: FILLED })
    state = boardReducer(state, { type: 'UNDO' })
    expect(state.grid[0][0]).toBe(UNKNOWN)

    state = boardReducer(state, { type: 'REDO' })
    expect(state.grid[0][0]).toBe(FILLED)
    expect(state.future).toHaveLength(0)
  })

  it('UNDO on empty history is a no-op', () => {
    const initial = createInitialBoardState(createEmptyGrid(1, 1))
    const state = boardReducer(initial, { type: 'UNDO' })
    expect(state).toBe(initial)
  })

  it('REDO on empty future is a no-op', () => {
    const initial = createInitialBoardState(createEmptyGrid(1, 1))
    const state = boardReducer(initial, { type: 'REDO' })
    expect(state).toBe(initial)
  })

  it('supports a full undo/redo sequence across multiple discrete actions', () => {
    let state = createInitialBoardState(createEmptyGrid(1, 2))
    state = boardReducer(state, { type: 'PAINT_START', row: 0, col: 0, value: FILLED })
    state = boardReducer(state, { type: 'PAINT_START', row: 0, col: 1, value: MARKED_EMPTY })
    expect(state.grid[0]).toEqual([FILLED, MARKED_EMPTY])

    state = boardReducer(state, { type: 'UNDO' })
    expect(state.grid[0]).toEqual([FILLED, UNKNOWN])
    state = boardReducer(state, { type: 'UNDO' })
    expect(state.grid[0]).toEqual([UNKNOWN, UNKNOWN])

    state = boardReducer(state, { type: 'REDO' })
    expect(state.grid[0]).toEqual([FILLED, UNKNOWN])
    state = boardReducer(state, { type: 'REDO' })
    expect(state.grid[0]).toEqual([FILLED, MARKED_EMPTY])
  })

  it('right-click-style direct MARKED_EMPTY works as its own discrete PAINT_START', () => {
    const initial = createInitialBoardState(createEmptyGrid(1, 1))
    const state = boardReducer(initial, {
      type: 'PAINT_START',
      row: 0,
      col: 0,
      value: MARKED_EMPTY,
    })
    expect(state.grid[0][0]).toBe(MARKED_EMPTY)
    expect(state.history).toHaveLength(1)
  })
})
