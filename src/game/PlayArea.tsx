import { useState } from 'react'
import { Board } from '../board/Board'
import type { CellState } from '../board/cellState'
import { useGameState } from './useGameState'
import type { SolutionSource } from './useGameState'
import type { DifficultyLevel } from './difficulty'
import { formatElapsed } from './formatElapsed'
import { RecordsModal } from './RecordsModal'
import { useFittedCellSize } from '../board/useFittedCellSize'
import styles from './PlayArea.module.css'

interface PlayAreaProps {
  rowClues: number[][]
  colClues: number[][]
  solutionSource: SolutionSource
  size: number
  difficulty: DifficultyLevel
  exactMatch?: boolean
  initialGrid?: CellState[][]
  initialElapsedSeconds?: number
  initialWon?: boolean
  onResetAll: () => void
}

export function PlayArea({
  rowClues,
  colClues,
  solutionSource,
  size,
  difficulty,
  exactMatch,
  initialGrid,
  initialElapsedSeconds,
  initialWon,
  onResetAll,
}: PlayAreaProps) {
  const {
    grid,
    canUndo,
    canRedo,
    startPaint,
    continuePaint,
    markEmpty,
    undo,
    redo,
    won,
    wrongCells,
    elapsedSeconds,
    isSolving,
    solveError,
    checkSolution,
    giveHint,
    dismissWin,
  } = useGameState(rowClues, colClues, solutionSource, {
    size,
    difficulty,
    initialGrid,
    initialElapsedSeconds,
    initialWon,
  })
  const [showRecords, setShowRecords] = useState(false)
  const { containerRef, cellSize, zoomIn, zoomOut } = useFittedCellSize(
    rowClues,
    colClues,
  )

  return (
    <>
      <aside className={styles.actionSidebar}>
        <div className={styles.statRow}>
          <span>⏱ זמן</span>
          <span className={styles.statValue}>
            {formatElapsed(elapsedSeconds)}
          </span>
        </div>

        <button
          type="button"
          className={styles.recordsButton}
          onClick={() => setShowRecords(true)}
        >
          שיאים והיסטוריה
        </button>

        <div className={styles.divider} />

        <span className={styles.sectionLabel}>פעולות</span>
        <button
          type="button"
          className={styles.checkButton}
          onClick={checkSolution}
          disabled={isSolving}
        >
          ✓ בדיקה
        </button>
        <button
          type="button"
          className={styles.hintButton}
          onClick={giveHint}
          disabled={isSolving}
        >
          💡 רמז
        </button>
        {solveError && <p role="alert">שגיאה בבדיקת הפתרון. נסו שוב.</p>}

        <div className={styles.undoRedoRow}>
          <button
            type="button"
            className={styles.undoRedoButton}
            onClick={undo}
            disabled={!canUndo}
          >
            ↩ בטל
          </button>
          <button
            type="button"
            className={styles.undoRedoButton}
            onClick={redo}
            disabled={!canRedo}
          >
            ↪ בצע שוב
          </button>
        </div>

        <button
          type="button"
          className={styles.resetButton}
          onClick={onResetAll}
        >
          🗑 אפס הכל
        </button>
      </aside>

      <main className={styles.main} ref={containerRef}>
        <div className={styles.zoomControls}>
          <button
            type="button"
            className={styles.zoomButton}
            onClick={zoomIn}
            aria-label="הגדל"
          >
            +
          </button>
          <div className={styles.zoomDivider} />
          <button
            type="button"
            className={styles.zoomButton}
            onClick={zoomOut}
            aria-label="הקטן"
          >
            −
          </button>
        </div>
        <button
          type="button"
          className={styles.printButton}
          onClick={() => window.print()}
        >
          🖨 הדפסה
        </button>

        <div className={styles.printArea}>
          {exactMatch === false && (
            <p className={styles.mismatchBanner}>
              לא נמצאה חידה בדיוק ברמת הקושי המבוקשת — זו החידה הקרובה ביותר
              שנמצאה.
            </p>
          )}
          <Board
            rowClues={rowClues}
            colClues={colClues}
            grid={grid}
            cellSize={cellSize}
            wrongCells={wrongCells}
            onCellMouseDown={startPaint}
            onCellMouseEnter={continuePaint}
            onCellMarkEmpty={markEmpty}
          />
        </div>
      </main>

      {won && (
        <div className={styles.winOverlay}>
          <div className={styles.winCard}>
            <div className={styles.winEmoji}>🎉</div>
            <h2>פתרתם את החידה!</h2>
            <p className={styles.winTime}>
              זמן: <b>{formatElapsed(elapsedSeconds)}</b>
            </p>
            <button
              type="button"
              className={styles.winContinue}
              onClick={dismissWin}
            >
              המשך
            </button>
          </div>
        </div>
      )}

      {showRecords && <RecordsModal onClose={() => setShowRecords(false)} />}
    </>
  )
}
