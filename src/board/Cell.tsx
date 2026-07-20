import type { KeyboardEvent, MouseEvent } from 'react'
import { CellState } from './cellState'
import {
  cellElementId,
  isLikelyGhostMouseEvent,
  markTouchInteraction,
} from './boardInteractions'
import styles from './Cell.module.css'

const STATE_LABEL: Record<CellState, string> = {
  [CellState.UNKNOWN]: 'ריק',
  [CellState.FILLED]: 'מלא',
  [CellState.MARKED_EMPTY]: 'מסומן כריק',
}

interface CellProps {
  row: number
  col: number
  state: CellState
  size: number
  thickRight?: boolean
  thickBottom?: boolean
  wrong?: boolean
  lineComplete?: boolean
  tabbable: boolean
  onMouseDown: (row: number, col: number) => void
  onMouseEnter: (row: number, col: number) => void
  onMarkEmpty: (row: number, col: number) => void
  onFocusCell: (row: number, col: number) => void
  onKeyDown: (row: number, col: number, event: KeyboardEvent) => void
  onTouchStart: () => void
}

export function Cell({
  row,
  col,
  state,
  size,
  thickRight,
  thickBottom,
  wrong,
  lineComplete,
  tabbable,
  onMouseDown,
  onMouseEnter,
  onMarkEmpty,
  onFocusCell,
  onKeyDown,
  onTouchStart,
}: CellProps) {
  const className = [
    styles.cell,
    state === CellState.FILLED ? styles.filled : '',
    wrong ? styles.wrong : '',
    !wrong && lineComplete ? styles.lineComplete : '',
    thickRight ? styles.thickRight : '',
    thickBottom ? styles.thickBottom : '',
  ]
    .filter(Boolean)
    .join(' ')

  const stateLabel = wrong
    ? `${STATE_LABEL[CellState.FILLED]}, שגוי`
    : STATE_LABEL[state]

  return (
    <button
      type="button"
      id={cellElementId(row, col)}
      data-row={row}
      data-col={col}
      className={className}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.6) }}
      tabIndex={tabbable ? 0 : -1}
      role="gridcell"
      aria-colindex={col + 2}
      aria-label={`שורה ${row + 1}, עמודה ${col + 1}, ${stateLabel}`}
      onMouseDown={() => {
        if (isLikelyGhostMouseEvent()) return
        onMouseDown(row, col)
      }}
      onMouseEnter={() => {
        if (isLikelyGhostMouseEvent()) return
        onMouseEnter(row, col)
      }}
      onContextMenu={(event: MouseEvent) => {
        event.preventDefault()
        onMarkEmpty(row, col)
      }}
      onFocus={() => onFocusCell(row, col)}
      onKeyDown={(event) => onKeyDown(row, col, event)}
      onTouchStart={(event) => {
        event.preventDefault()
        markTouchInteraction()
        onTouchStart()
      }}
    >
      {state === CellState.MARKED_EMPTY ? '✕' : ''}
    </button>
  )
}
