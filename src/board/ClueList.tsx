import { normalizeClue } from './lineRuns'
import styles from './ClueList.module.css'

interface ClueListProps {
  clue: number[]
  orientation: 'row' | 'column'
  /** Size, in px, of one cell along this strip's line-of-cells axis (drives font size too). */
  cellSize: number
  /** Shared cross-axis thickness for every strip on this axis (see Board's kW/kH computation). */
  stripSize: number
  satisfied: boolean
  /** This strip's 1-based aria-colindex within its parent role="row" (Board sets it: 1 for a
   * row's own leading clue-strip, or c+2 for a column-header strip). */
  ariaColIndex: number
}

export function ClueList({
  clue,
  orientation,
  cellSize,
  stripSize,
  satisfied,
  ariaColIndex,
}: ClueListProps) {
  const fontSize = Math.max(9, Math.round(cellSize * 0.32))
  const numberClassName = [styles.number, satisfied ? styles.satisfied : '']
    .filter(Boolean)
    .join(' ')

  const dimensionStyle =
    orientation === 'row'
      ? { height: cellSize, width: stripSize }
      : { width: cellSize, height: stripSize }

  const displayClue = normalizeClue(clue)
  const label = `${orientation === 'row' ? 'רמז שורה' : 'רמז עמודה'}: ${displayClue.join(', ')}${satisfied ? ' — הושלם' : ''}`

  return (
    <div
      className={`${styles.strip} ${styles[orientation]}`}
      style={dimensionStyle}
      role={orientation === 'row' ? 'rowheader' : 'columnheader'}
      aria-colindex={ariaColIndex}
      aria-label={label}
    >
      {displayClue.map((value, index) => (
        <span key={index} className={numberClassName} style={{ fontSize }}>
          {value}
        </span>
      ))}
    </div>
  )
}
