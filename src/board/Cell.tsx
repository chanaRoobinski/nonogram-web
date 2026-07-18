import { CellState } from './cellState'
import styles from './Cell.module.css'

interface CellProps {
  state: CellState
  size: number
  thickRight?: boolean
  thickBottom?: boolean
}

export function Cell({ state, size, thickRight, thickBottom }: CellProps) {
  const className = [
    styles.cell,
    state === CellState.FILLED ? styles.filled : '',
    thickRight ? styles.thickRight : '',
    thickBottom ? styles.thickBottom : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={className}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.6) }}
    >
      {state === CellState.MARKED_EMPTY ? '✕' : ''}
    </div>
  )
}
