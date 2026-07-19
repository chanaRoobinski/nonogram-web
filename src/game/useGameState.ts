import { useCallback, useEffect, useRef, useState } from 'react'
import { useBoardState } from '../board/boardInteractions'
import { CellState, createEmptyGrid } from '../board/cellState'
import { useSolvePuzzle } from '../api/hooks/useSolvePuzzle'
import type { DifficultyLevel } from './difficulty'
import { recordCompletion } from './records'
import { saveGame } from './persistence'

export type SolutionSource =
  | { type: 'known'; solution: CellState[][] }
  | { type: 'fetch' }

const WRONG_FLASH_MS = 900

export interface UseGameStateOptions {
  size: number
  difficulty: DifficultyLevel
  initialGrid?: CellState[][]
  initialElapsedSeconds?: number
  initialWon?: boolean
}

/**
 * Board state + timer + hint/check-solution, for one puzzle. Callers should remount this (via a
 * React `key` on whatever component calls it) whenever a new puzzle loads or "reset all" is
 * clicked — simpler and less error-prone than adding reducer actions for those cases, since a
 * fresh mount already gives a blank grid/history/timer for free (see PROGRESS.md).
 */
export function useGameState(
  rowClues: number[][],
  colClues: number[][],
  solutionSource: SolutionSource,
  options: UseGameStateOptions,
) {
  const { size, difficulty, initialGrid, initialElapsedSeconds, initialWon } =
    options
  const numRows = rowClues.length
  const numCols = colClues.length
  const board = useBoardState(initialGrid ?? createEmptyGrid(numRows, numCols))
  const solvePuzzle = useSolvePuzzle()
  const cachedSolution = useRef<CellState[][] | null>(
    solutionSource.type === 'known' ? solutionSource.solution : null,
  )
  const hasRecordedCompletion = useRef(initialWon ?? false)

  const [won, setWon] = useState(initialWon ?? false)
  const [wrongCells, setWrongCells] = useState<ReadonlySet<string>>(new Set())
  const [elapsedSeconds, setElapsedSeconds] = useState(
    initialElapsedSeconds ?? 0,
  )
  const [solveError, setSolveError] = useState(false)

  useEffect(() => {
    if (won) return
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [won])

  // Persist progress on every move and every timer tick, so a reload restores exactly where the
  // player was. A small JSON blob written to localStorage once a second is cheap enough that
  // there's no need to throttle it further.
  useEffect(() => {
    saveGame({
      size,
      difficulty,
      rowClues,
      colClues,
      solutionSource,
      grid: board.grid,
      elapsedSeconds,
      won,
    })
  }, [board.grid, elapsedSeconds, won, size, difficulty, rowClues, colClues, solutionSource])

  const ensureSolution = useCallback(async (): Promise<CellState[][] | null> => {
    if (cachedSolution.current) return cachedSolution.current
    try {
      const response = await solvePuzzle.mutateAsync({
        row_clues: rowClues,
        col_clues: colClues,
      })
      if (response.status !== 'SOLVED' || !response.solution) {
        setSolveError(true)
        return null
      }
      const solution = response.solution.map((row) =>
        row.map((filled) => (filled ? CellState.FILLED : CellState.UNKNOWN)),
      )
      cachedSolution.current = solution
      setSolveError(false)
      return solution
    } catch {
      setSolveError(true)
      return null
    }
  }, [rowClues, colClues, solvePuzzle])

  const checkSolution = useCallback(async () => {
    const solution = await ensureSolution()
    if (!solution) return
    const wrong = new Set<string>()
    let allCorrect = true
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        const isFilled = board.grid[r][c] === CellState.FILLED
        const shouldBeFilled = solution[r][c] === CellState.FILLED
        if (isFilled && !shouldBeFilled) wrong.add(`${r},${c}`)
        if (isFilled !== shouldBeFilled) allCorrect = false
      }
    }
    if (allCorrect) {
      setWon(true)
      setWrongCells(new Set())
      if (!hasRecordedCompletion.current) {
        hasRecordedCompletion.current = true
        recordCompletion(size, difficulty, elapsedSeconds)
      }
    } else {
      setWrongCells(wrong)
      setTimeout(() => setWrongCells(new Set()), WRONG_FLASH_MS)
    }
  }, [ensureSolution, board.grid, numRows, numCols, size, difficulty, elapsedSeconds])

  const giveHint = useCallback(async () => {
    const solution = await ensureSolution()
    if (!solution) return
    const candidates: { row: number; col: number }[] = []
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        if (
          solution[r][c] === CellState.FILLED &&
          board.grid[r][c] !== CellState.FILLED
        ) {
          candidates.push({ row: r, col: c })
        }
      }
    }
    if (candidates.length === 0) return
    const { row, col } =
      candidates[Math.floor(Math.random() * candidates.length)]
    board.setCell(row, col, CellState.FILLED)
  }, [ensureSolution, board, numRows, numCols])

  const dismissWin = useCallback(() => setWon(false), [])

  return {
    ...board,
    won,
    wrongCells,
    elapsedSeconds,
    isSolving: solvePuzzle.isPending,
    solveError,
    checkSolution,
    giveHint,
    dismissWin,
  }
}
