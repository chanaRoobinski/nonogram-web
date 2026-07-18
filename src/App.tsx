import { Board } from './board/Board'
import { CellState } from './board/cellState'
import { runsOfLine } from './board/lineRuns'
import styles from './App.module.css'

// Temporary Stage-2 visual-fidelity check: a hand-computed diamond pattern standing in for a
// real puzzle. Replaced by GameScreen (Stage 4), which wires in an actual generated/solved
// puzzle instead of this hardcoded demo grid.
const SIZE = 10
const demoGrid: CellState[][] = Array.from({ length: SIZE }, (_, r) =>
  Array.from({ length: SIZE }, (_, c) =>
    Math.abs(r - 4.5) + Math.abs(c - 4.5) <= 4.5
      ? CellState.FILLED
      : CellState.UNKNOWN,
  ),
)
const rowClues = demoGrid.map((row) => runsOfLine(row))
const colClues = demoGrid[0].map((_, c) =>
  runsOfLine(demoGrid.map((row) => row[c])),
)

function App() {
  return (
    <div className={styles.placeholder}>
      <div>
        <h1 className={styles.title}>שחור ופתור</h1>
        <Board rowClues={rowClues} colClues={colClues} grid={demoGrid} />
      </div>
    </div>
  )
}

export default App
