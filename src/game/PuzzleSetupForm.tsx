import { useGeneratePuzzle } from '../api/hooks/useGeneratePuzzle'
import type { components } from '../api/generated/schema'
import { DIFFICULTY_OPTIONS, type DifficultyLevel } from './difficulty'
import styles from './PuzzleSetupForm.module.css'

type GenerateResponse = components['schemas']['GenerateResponse']

/** No backend default exists (max_attempts is a required param) — see PROGRESS.md. */
const MAX_GENERATE_ATTEMPTS = 200
/** The design's own slider goes to 50, but generation time explodes well before that — measured
 * directly against the backend: 15×15 ≈ 11.5s, 20×20 ≈ 45s, 25×25 didn't finish in 2 minutes.
 * Capped here so the UI can't trigger a multi-minute (or effectively hung) request; backend
 * generator performance at scale is tracked separately (see PROGRESS.md), not fixed by this cap. */
const MAX_SIZE = 20

interface PuzzleSetupFormProps {
  size: number
  onSizeChange: (size: number) => void
  difficulty: DifficultyLevel
  onDifficultyChange: (difficulty: DifficultyLevel) => void
  onGenerated: (response: GenerateResponse, size: number) => void
  editMode: boolean
  onToggleEditMode: () => void
  editFilledCount: number
  onFinishEdit: () => void
  onCancelEdit: () => void
}

export function PuzzleSetupForm({
  size,
  onSizeChange,
  difficulty,
  onDifficultyChange,
  onGenerated,
  editMode,
  onToggleEditMode,
  editFilledCount,
  onFinishEdit,
  onCancelEdit,
}: PuzzleSetupFormProps) {
  const generatePuzzle = useGeneratePuzzle()

  function handleGenerate() {
    generatePuzzle.mutate(
      {
        num_rows: size,
        num_cols: size,
        difficulty,
        max_attempts: MAX_GENERATE_ATTEMPTS,
      },
      { onSuccess: (response) => onGenerated(response, size) },
    )
  }

  return (
    <aside className={styles.sidebar} aria-label="הגדרות חידה">
      <div>
        <span className={styles.label}>
          גודל: {size}×{size}
        </span>
        <div className={styles.sizeRow}>
          <input
            type="range"
            min={5}
            max={MAX_SIZE}
            step={5}
            value={size}
            disabled={editMode}
            onChange={(event) => onSizeChange(Number(event.target.value))}
            aria-label="גודל הלוח"
          />
        </div>
      </div>

      <div>
        <span className={styles.label}>רמת קושי</span>
        <div className={styles.difficultyList}>
          {DIFFICULTY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                option.value === difficulty
                  ? styles.difficultyActive
                  : styles.difficultyButton
              }
              disabled={editMode}
              onClick={() => onDifficultyChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.divider} />

      <button
        type="button"
        className={styles.generateButton}
        onClick={handleGenerate}
        disabled={generatePuzzle.isPending || editMode}
      >
        {generatePuzzle.isPending ? '...יוצר חידה' : '✦ צור חידה חדשה'}
      </button>
      {generatePuzzle.isError && (
        <p className={styles.error}>שגיאה ביצירת החידה. נסו שוב.</p>
      )}

      <button
        type="button"
        className={
          editMode ? styles.editModeButtonActive : styles.editModeButton
        }
        onClick={onToggleEditMode}
      >
        {editMode ? '✎ עריכה פעילה' : '✎ צור ידנית'}
      </button>

      {editMode && (
        <div className={styles.editNotice}>
          <span>
            מצב עריכה: לחצו על משבצות כדי לצייר פתרון ({editFilledCount}{' '}
            מלאות)
          </span>
          <div className={styles.editNoticeButtons}>
            <button
              type="button"
              className={styles.finishEditButton}
              onClick={onFinishEdit}
            >
              סיים ▶
            </button>
            <button
              type="button"
              className={styles.cancelEditButton}
              onClick={onCancelEdit}
            >
              ביטול
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
