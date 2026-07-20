import { formatElapsed } from './formatElapsed'
import { useModalA11y } from './useModalA11y'
import styles from './PlayArea.module.css'

interface WinModalProps {
  elapsedSeconds: number
  onDismiss: () => void
}

export function WinModal({ elapsedSeconds, onDismiss }: WinModalProps) {
  const containerRef = useModalA11y<HTMLDivElement>(onDismiss)

  return (
    <div className={styles.winOverlay}>
      <div
        ref={containerRef}
        className={styles.winCard}
        role="dialog"
        aria-modal="true"
        aria-label="פתרתם את החידה"
        tabIndex={-1}
      >
        <div className={styles.winEmoji}>🎉</div>
        <h2>פתרתם את החידה!</h2>
        <p className={styles.winTime}>
          זמן: <b>{formatElapsed(elapsedSeconds)}</b>
        </p>
        <button type="button" className={styles.winContinue} onClick={onDismiss}>
          המשך
        </button>
      </div>
    </div>
  )
}
