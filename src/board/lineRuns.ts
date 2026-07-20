import { CellState } from './cellState'

/**
 * Run-length encode a line of cells, e.g. [FILLED, FILLED, UNKNOWN, FILLED] -> [2, 1].
 * A line with no filled cells returns [0] (mirrors the backend's Clue([]) meaning "empty",
 * normalized to a single displayable "0" the way the imported design renders it — see
 * docs/design-tokens.md "Cell states").
 */
export function runsOfLine(cells: readonly CellState[]): number[] {
  const runs: number[] = []
  let current = 0
  for (const cell of cells) {
    if (cell === CellState.FILLED) {
      current++
    } else if (current > 0) {
      runs.push(current)
      current = 0
    }
  }
  if (current > 0) runs.push(current)
  return runs.length > 0 ? runs : [0]
}

/** The backend serializes an empty clue as `[]` (`Clue([])`); normalized to the same `[0]`
 * `runsOfLine` uses for an all-empty line, so both display and comparison treat them alike. */
export function normalizeClue(clue: readonly number[]): number[] {
  return clue.length > 0 ? [...clue] : [0]
}

/**
 * Compares a line's actual fill pattern against its clue. The backend serializes an empty
 * clue as [] (Clue([])), while an all-empty line's runsOfLine is [0] — both normalized to [0]
 * here so "no runs" compares equal regardless of which side produced it.
 */
export function isClueSatisfied(
  actualRuns: number[],
  clue: readonly number[],
): boolean {
  const normalizedClue = normalizeClue(clue)
  if (actualRuns.length !== normalizedClue.length) return false
  return actualRuns.every((run, i) => run === normalizedClue[i])
}

/** The longest clue line's run count, across a whole row/col clue set — at least 1, so an
 * empty puzzle still reserves space for its (single, "0") clue number. */
export function maxClueLength(clues: readonly (readonly number[])[]): number {
  return Math.max(1, ...clues.map((clue) => clue.length))
}
