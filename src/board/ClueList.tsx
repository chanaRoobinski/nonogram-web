import styles from './ClueList.module.css'

interface ClueListProps {
  clue: number[]
  orientation: 'row' | 'column'
  /** Size, in px, of one cell along this strip's line-of-cells axis (drives font size too). */
  cellSize: number
  /** Shared cross-axis thickness for every strip on this axis (see Board's kW/kH computation). */
  stripSize: number
  satisfied: boolean
}

export function ClueList({
  clue,
  orientation,
  cellSize,
  stripSize,
  satisfied,
}: ClueListProps) {
  const fontSize = Math.max(9, Math.round(cellSize * 0.32))
  const numberClassName = [styles.number, satisfied ? styles.satisfied : '']
    .filter(Boolean)
    .join(' ')

  const dimensionStyle =
    orientation === 'row'
      ? { height: cellSize, width: stripSize }
      : { width: cellSize, height: stripSize }

  return (
    <div
      className={`${styles.strip} ${styles[orientation]}`}
      style={dimensionStyle}
    >
      {clue.map((value, index) => (
        <span key={index} className={numberClassName} style={{ fontSize }}>
          {value}
        </span>
      ))}
    </div>
  )
}
