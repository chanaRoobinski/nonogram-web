import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearSavedGame,
  loadSavedGame,
  saveGame,
  type SavedGame,
} from '../../src/game/persistence'
import { CellState, createEmptyGrid } from '../../src/board/cellState'

beforeEach(() => {
  localStorage.clear()
})

const sampleGame: SavedGame = {
  size: 5,
  difficulty: 'EASY',
  rowClues: [[1]],
  colClues: [[1]],
  solutionSource: { type: 'fetch' },
  grid: createEmptyGrid(5, 5),
  elapsedSeconds: 12,
  won: false,
}

describe('persistence', () => {
  it('returns null when nothing has been saved', () => {
    expect(loadSavedGame()).toBeNull()
  })

  it('round-trips a saved game exactly', () => {
    saveGame(sampleGame)
    expect(loadSavedGame()).toEqual(sampleGame)
  })

  it('round-trips a manually-created puzzle (known solution source)', () => {
    const grid = createEmptyGrid(3, 3)
    grid[0][0] = CellState.FILLED
    const game: SavedGame = {
      ...sampleGame,
      size: 3,
      grid,
      solutionSource: { type: 'known', solution: grid },
    }
    saveGame(game)
    expect(loadSavedGame()).toEqual(game)
  })

  it('clears the saved game', () => {
    saveGame(sampleGame)
    clearSavedGame()
    expect(loadSavedGame()).toBeNull()
  })

  it('returns null for corrupted JSON rather than throwing', () => {
    localStorage.setItem('nonogram-save-v1', '{not valid json')
    expect(loadSavedGame()).toBeNull()
  })
})
