import { useCallback, useEffect, useRef, useState } from 'react'
import { useBoardState } from '../board/boardInteractions'
import { CellState, createEmptyGrid } from '../board/cellState'
import { useSolvePuzzle } from '../api/hooks/useSolvePuzzle'

export type SolutionSource =
  | { type: 'known'; solution: CellState[][] }
  | { type: 'fetch' }

const WRONG_FLASH_MS = 900

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
) {
  const numRows = rowClues.length
  const numCols = colClues.length
  const board = useBoardState(createEmptyGrid(numRows, numCols))
  const solvePuzzle = useSolvePuzzle()
  const cachedSolution = useRef<CellState[][] | null>(
    solutionSource.type === 'known' ? solutionSource.solution : null,
  )

  const [won, setWon] = useState(false)
  const [wrongCells, setWrongCells] = useState<ReadonlySet<string>>(new Set())
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [solveError, setSolveError] = useState(false)

  useEffect(() => {
    if (won) return
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [won])

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
    } else {
      setWrongCells(wrong)
      setTimeout(() => setWrongCells(new Set()), WRONG_FLASH_MS)
    }
  }, [ensureSolution, board.grid, numRows, numCols])

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
