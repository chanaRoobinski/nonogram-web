import { DIFFICULTY_OPTIONS, type DifficultyLevel } from './difficulty'
import { formatElapsed } from './formatElapsed'

const RECORDS_KEY = 'nonogram-records-v1'
const HISTORY_KEY = 'nonogram-history-v1'
const HISTORY_LIMIT = 10

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = Object.fromEntries(
  DIFFICULTY_OPTIONS.map((option) => [option.value, option.label]),
) as Record<DifficultyLevel, string>

export interface HistoryEntry {
  label: string
  time: string
  timestamp: number
}

export type BestTimes = Record<string, number>

function recordKey(size: number, difficulty: DifficultyLevel): string {
  return `${size}x${size}-${difficulty}`
}

export function loadBestTimes(): BestTimes {
  try {
    return JSON.parse(localStorage.getItem(RECORDS_KEY) ?? '{}') as BestTimes
  } catch {
    return {}
  }
}

export function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as HistoryEntry[]
  } catch {
    return []
  }
}

/** Records a completed puzzle: updates the best time for this size+difficulty (only if faster),
 * and always pushes a recent-games entry (capped at HISTORY_LIMIT). */
export function recordCompletion(
  size: number,
  difficulty: DifficultyLevel,
  elapsedSeconds: number,
): { isNewRecord: boolean } {
  const key = recordKey(size, difficulty)
  const bestTimes = loadBestTimes()
  const previousBest = bestTimes[key]
  const isNewRecord = previousBest === undefined || elapsedSeconds < previousBest
  if (isNewRecord) {
    bestTimes[key] = elapsedSeconds
    try {
      localStorage.setItem(RECORDS_KEY, JSON.stringify(bestTimes))
    } catch {
      // ignore
    }
  }

  const entry: HistoryEntry = {
    label: `${size}×${size} · ${DIFFICULTY_LABELS[difficulty]}`,
    time: formatElapsed(elapsedSeconds),
    timestamp: Date.now(),
  }
  const newHistory = [entry, ...loadHistory()].slice(0, HISTORY_LIMIT)
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
  } catch {
    // ignore
  }

  return { isNewRecord }
}

export function formatBestTimesList(
  bestTimes: BestTimes,
): { key: string; label: string; time: string }[] {
  return Object.entries(bestTimes).map(([key, seconds]) => {
    const [sizeLabel, difficulty] = key.split('-')
    const label = `${sizeLabel} · ${DIFFICULTY_LABELS[difficulty as DifficultyLevel] ?? difficulty}`
    return { key, label, time: formatElapsed(seconds) }
  })
}
