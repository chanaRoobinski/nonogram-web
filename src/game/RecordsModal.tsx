import { formatBestTimesList, loadBestTimes, loadHistory } from './records'
import { useModalA11y } from './useModalA11y'
import styles from './RecordsModal.module.css'

interface RecordsModalProps {
  onClose: () => void
}

export function RecordsModal({ onClose }: RecordsModalProps) {
  const bestTimes = formatBestTimesList(loadBestTimes())
  const history = loadHistory()
  const containerRef = useModalA11y<HTMLDivElement>(onClose)

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={containerRef}
        className={styles.card}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="שיאים והיסטוריה"
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h2>שיאים והיסטוריה</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="סגור"
          >
            ✕
          </button>
        </div>

        <h3 className={styles.sectionTitle}>שיאים לפי גודל ורמה</h3>
        {bestTimes.length > 0 ? (
          <div className={styles.list}>
            {bestTimes.map((record) => (
              <div key={record.key} className={styles.recordRow}>
                <span>{record.label}</span>
                <span className={styles.recordTime}>{record.time}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>
            עדיין אין שיאים — פתרו חידה כדי לקבוע אחד!
          </p>
        )}

        <h3 className={styles.sectionTitle}>היסטוריית משחקים אחרונים</h3>
        {history.length > 0 ? (
          <div className={styles.list}>
            {history.map((entry) => (
              <div key={entry.timestamp} className={styles.historyRow}>
                <span>{entry.label}</span>
                <span>{entry.time}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>אין היסטוריה עדיין.</p>
        )}
      </div>
    </div>
  )
}
