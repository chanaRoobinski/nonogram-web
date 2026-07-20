import { useRef, useState } from 'react'
import type { KeyboardEvent, TouchEvent } from 'react'
import type { CellState } from './cellState'
import { Cell } from './Cell'
import { ClueList } from './ClueList'
import { isClueSatisfied, maxClueLength, runsOfLine } from './lineRuns'
import {
  cellElementId,
  computeArrowTarget,
  markTouchInteraction,
} from './boardInteractions'
import styles from './Board.module.css'

interface BoardProps {
  rowClues: number[][]
  colClues: number[][]
  grid: CellState[][]
  /** px per cell — see useFittedCellSize for how callers compute this (viewport-fit + zoom). */
  cellSize?: number
  /** Cells to flash as incorrect, keyed by `${row},${col}` (see PlayArea's check-solution). */
  wrongCells?: ReadonlySet<string>
  onCellMouseDown: (row: number, col: number) => void
  onCellMouseEnter: (row: number, col: number) => void
  onCellMarkEmpty: (row: number, col: number) => void
}

export function Board({
  rowClues,
  colClues,
  grid,
  cellSize = 32,
  wrongCells,
  onCellMouseDown,
  onCellMouseEnter,
  onCellMarkEmpty,
}: BoardProps) {
  const numRows = rowClues.length
  const numCols = colClues.length
  const [focusedCell, setFocusedCell] = useState({ row: 0, col: 0 })
  const lastTouchedCell = useRef<string | null>(null)

  const maxRowClueCount = maxClueLength(rowClues)
  const maxColClueCount = maxClueLength(colClues)
  const numberUnit = cellSize * 0.42
  const rowStripSize = Math.round(maxRowClueCount * numberUnit + cellSize * 0.3)
  const colStripSize = Math.round(maxColClueCount * numberUnit + cellSize * 0.3)

  const columns = grid[0]?.map((_, c) => grid.map((row) => row[c])) ?? []
  const rowSatisfied = rowClues.map((clue, r) =>
    isClueSatisfied(runsOfLine(grid[r] ?? []), clue),
  )
  const colSatisfied = colClues.map((clue, c) =>
    isClueSatisfied(runsOfLine(columns[c] ?? []), clue),
  )

  function handleCellKeyDown(row: number, col: number, event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onCellMouseDown(row, col)
      return
    }
    const target = computeArrowTarget(row, col, event.key, numRows, numCols)
    if (target) {
      event.preventDefault()
      setFocusedCell(target)
      document.getElementById(cellElementId(target.row, target.col))?.focus()
    }
  }

  // touchmove keeps firing on the element where the touch started, not whatever is currently
  // under the finger — unlike mouseenter, which fires per-element naturally. elementFromPoint
  // lets a drag-paint gesture work the same way via touch as it does via mouse.
  function handleTouchMove(event: TouchEvent) {
    const touch = event.touches[0]
    if (!touch) return
    const target = document
      .elementFromPoint(touch.clientX, touch.clientY)
      ?.closest<HTMLElement>('[data-row][data-col]')
    if (!target) return
    const row = Number(target.dataset.row)
    const col = Number(target.dataset.col)
    const key = `${row},${col}`
    if (lastTouchedCell.current === key) return
    lastTouchedCell.current = key
    markTouchInteraction()
    onCellMouseEnter(row, col)
  }

  return (
    <div
      className={styles.card}
      onTouchMove={handleTouchMove}
      role="grid"
      aria-label={`לוח נונוגרמה, ${numRows} על ${numCols}`}
      aria-rowcount={numRows + 1}
      aria-colcount={numCols + 1}
    >
      <div className={styles.headerRow} role="row" aria-rowindex={1}>
        <div
          style={{ width: rowStripSize, height: colStripSize }}
          role="columnheader"
          aria-hidden="true"
        />
        {colClues.map((clue, c) => (
          <ClueList
            key={c}
            clue={clue}
            orientation="column"
            cellSize={cellSize}
            stripSize={colStripSize}
            satisfied={colSatisfied[c]}
            ariaColIndex={c + 2}
          />
        ))}
      </div>

      {rowClues.map((clue, r) => (
        <div
          key={r}
          className={styles.row}
          role="row"
          aria-rowindex={r + 2}
        >
          <ClueList
            clue={clue}
            orientation="row"
            cellSize={cellSize}
            stripSize={rowStripSize}
            satisfied={rowSatisfied[r]}
            ariaColIndex={1}
          />
          {grid[r]?.map((cellState, c) => (
            <Cell
              key={c}
              row={r}
              col={c}
              state={cellState}
              size={cellSize}
              thickRight={c % 5 === 4 && c !== numCols - 1}
              thickBottom={r % 5 === 4 && r !== numRows - 1}
              wrong={wrongCells?.has(`${r},${c}`)}
              lineComplete={rowSatisfied[r] || colSatisfied[c]}
              tabbable={focusedCell.row === r && focusedCell.col === c}
              onMouseDown={onCellMouseDown}
              onMouseEnter={onCellMouseEnter}
              onMarkEmpty={onCellMarkEmpty}
              onFocusCell={(row, col) => setFocusedCell({ row, col })}
              onKeyDown={handleCellKeyDown}
              onTouchStart={() => {
                lastTouchedCell.current = `${r},${c}`
                onCellMouseDown(r, c)
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
