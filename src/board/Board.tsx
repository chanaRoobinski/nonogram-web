import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { CellState } from './cellState'
import { Cell } from './Cell'
import { ClueList } from './ClueList'
import { isClueSatisfied, runsOfLine } from './lineRuns'
import { cellElementId, computeArrowTarget } from './boardInteractions'
import styles from './Board.module.css'

interface BoardProps {
  rowClues: number[][]
  colClues: number[][]
  grid: CellState[][]
  /** px per cell. Viewport-fit sizing + zoom are Stage 5 concerns (see PROGRESS.md); this is a
   * plain, overridable default for now. */
  cellSize?: number
  onCellMouseDown: (row: number, col: number) => void
  onCellMouseEnter: (row: number, col: number) => void
  onCellMarkEmpty: (row: number, col: number) => void
}

export function Board({
  rowClues,
  colClues,
  grid,
  cellSize = 32,
  onCellMouseDown,
  onCellMouseEnter,
  onCellMarkEmpty,
}: BoardProps) {
  const numRows = rowClues.length
  const numCols = colClues.length
  const [focusedCell, setFocusedCell] = useState({ row: 0, col: 0 })

  const maxRowClueCount = Math.max(1, ...rowClues.map((c) => c.length))
  const maxColClueCount = Math.max(1, ...colClues.map((c) => c.length))
  const numberUnit = cellSize * 0.42
  const rowStripSize = Math.round(maxRowClueCount * numberUnit + cellSize * 0.3)
  const colStripSize = Math.round(maxColClueCount * numberUnit + cellSize * 0.3)

  const columns = grid[0]?.map((_, c) => grid.map((row) => row[c])) ?? []

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

  return (
    <div className={styles.card}>
      <div className={styles.headerRow}>
        <div style={{ width: rowStripSize, height: colStripSize }} />
        {colClues.map((clue, c) => (
          <ClueList
            key={c}
            clue={clue}
            orientation="column"
            cellSize={cellSize}
            stripSize={colStripSize}
            satisfied={isClueSatisfied(runsOfLine(columns[c] ?? []), clue)}
          />
        ))}
      </div>

      {rowClues.map((clue, r) => (
        <div key={r} className={styles.row}>
          <ClueList
            clue={clue}
            orientation="row"
            cellSize={cellSize}
            stripSize={rowStripSize}
            satisfied={isClueSatisfied(runsOfLine(grid[r] ?? []), clue)}
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
              tabbable={focusedCell.row === r && focusedCell.col === c}
              onMouseDown={onCellMouseDown}
              onMouseEnter={onCellMouseEnter}
              onMarkEmpty={onCellMarkEmpty}
              onFocusCell={(row, col) => setFocusedCell({ row, col })}
              onKeyDown={handleCellKeyDown}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
