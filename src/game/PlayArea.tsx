import { Board } from '../board/Board'
import { useGameState } from './useGameState'
import type { SolutionSource } from './useGameState'
import { formatElapsed } from './formatElapsed'
import styles from './PlayArea.module.css'

interface PlayAreaProps {
  rowClues: number[][]
  colClues: number[][]
  solutionSource: SolutionSource
  exactMatch?: boolean
  onResetAll: () => void
}

export function PlayArea({
  rowClues,
  colClues,
  solutionSource,
  exactMatch,
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
  } = useGameState(rowClues, colClues, solutionSource)

  return (
    <>
      <aside className={styles.actionSidebar}>
        <div className={styles.statRow}>
          <span>⏱ זמן</span>
          <span className={styles.statValue}>
            {formatElapsed(elapsedSeconds)}
          </span>
        </div>

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
        {solveError && (
          <p role="alert">שגיאה בבדיקת הפתרון. נסו שוב.</p>
        )}

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

      <main className={styles.main}>
        <div>
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
    </>
  )
}
