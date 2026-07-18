import { Board } from './board/Board'
import { CellState, createEmptyGrid } from './board/cellState'
import { runsOfLine } from './board/lineRuns'
import { useBoardState } from './board/boardInteractions'
import styles from './App.module.css'

// Temporary Stage-2/3 fidelity + interaction check: a hand-computed diamond pattern standing in
// for a real puzzle's solution (used only to derive fixed clues). Replaced by GameScreen
// (Stage 4), which wires in an actual generated puzzle instead of this hardcoded demo.
const SIZE = 10
const demoSolution: CellState[][] = Array.from({ length: SIZE }, (_, r) =>
  Array.from({ length: SIZE }, (_, c) =>
    Math.abs(r - 4.5) + Math.abs(c - 4.5) <= 4.5
      ? CellState.FILLED
      : CellState.UNKNOWN,
  ),
)
const rowClues = demoSolution.map((row) => runsOfLine(row))
const colClues = demoSolution[0].map((_, c) =>
  runsOfLine(demoSolution.map((row) => row[c])),
)

function App() {
  const { grid, canUndo, canRedo, startPaint, continuePaint, markEmpty, undo, redo } =
    useBoardState(createEmptyGrid(SIZE, SIZE))

  return (
    <div className={styles.placeholder}>
      <div>
        <h1 className={styles.title}>שחור ופתור</h1>
        <div className={styles.demoControls}>
          <button type="button" onClick={undo} disabled={!canUndo}>
            ↩ בטל
          </button>
          <button type="button" onClick={redo} disabled={!canRedo}>
            ↪ בצע שוב
          </button>
        </div>
        <Board
          rowClues={rowClues}
          colClues={colClues}
          grid={grid}
          onCellMouseDown={startPaint}
          onCellMouseEnter={continuePaint}
          onCellMarkEmpty={markEmpty}
        />
      </div>
    </div>
  )
}

export default App
