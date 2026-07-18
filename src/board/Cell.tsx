import type { KeyboardEvent, MouseEvent } from 'react'
import { CellState } from './cellState'
import { cellElementId } from './boardInteractions'
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
  tabbable: boolean
  onMouseDown: (row: number, col: number) => void
  onMouseEnter: (row: number, col: number) => void
  onMarkEmpty: (row: number, col: number) => void
  onFocusCell: (row: number, col: number) => void
  onKeyDown: (row: number, col: number, event: KeyboardEvent) => void
}

export function Cell({
  row,
  col,
  state,
  size,
  thickRight,
  thickBottom,
  tabbable,
  onMouseDown,
  onMouseEnter,
  onMarkEmpty,
  onFocusCell,
  onKeyDown,
}: CellProps) {
  const className = [
    styles.cell,
    state === CellState.FILLED ? styles.filled : '',
    thickRight ? styles.thickRight : '',
    thickBottom ? styles.thickBottom : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      id={cellElementId(row, col)}
      className={className}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.6) }}
      tabIndex={tabbable ? 0 : -1}
      aria-label={`שורה ${row + 1}, עמודה ${col + 1}, ${STATE_LABEL[state]}`}
      onMouseDown={() => onMouseDown(row, col)}
      onMouseEnter={() => onMouseEnter(row, col)}
      onContextMenu={(event: MouseEvent) => {
        event.preventDefault()
        onMarkEmpty(row, col)
      }}
      onFocus={() => onFocusCell(row, col)}
      onKeyDown={(event) => onKeyDown(row, col, event)}
    >
      {state === CellState.MARKED_EMPTY ? '✕' : ''}
    </button>
  )
}
