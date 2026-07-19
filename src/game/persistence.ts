import type { CellState } from '../board/cellState'
import type { DifficultyLevel } from './difficulty'
import type { SolutionSource } from './useGameState'

const SAVE_KEY = 'nonogram-save-v1'

export interface SavedGame {
  size: number
  difficulty: DifficultyLevel
  rowClues: number[][]
  colClues: number[][]
  solutionSource: SolutionSource
  grid: CellState[][]
  elapsedSeconds: number
  won: boolean
}

/** localStorage can throw (quota exceeded, private browsing) — persistence is a nicety, so
 * failures are swallowed rather than surfaced to the player. */
export function saveGame(game: SavedGame): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game))
  } catch {
    // ignore
  }
}

export function loadSavedGame(): SavedGame | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SavedGame
  } catch {
    return null
  }
}

export function clearSavedGame(): void {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    // ignore
  }
}
