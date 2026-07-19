import { useEffect, useState } from 'react'
import { Board } from '../board/Board'
import { CellState, createEmptyGrid } from '../board/cellState'
import { useGeneratePuzzle } from '../api/hooks/useGeneratePuzzle'
import type { components } from '../api/generated/schema'
import { PuzzleSetupForm } from './PuzzleSetupForm'
import type { DifficultyLevel } from './difficulty'
import { PlayArea } from './PlayArea'
import type { SolutionSource } from './useGameState'
import { deriveCluesFromSolution, isValidManualSolution } from './manualPuzzle'
import { loadSavedGame } from './persistence'
import styles from './GameScreen.module.css'

type GenerateResponse = components['schemas']['GenerateResponse']

interface Puzzle {
  rowClues: number[][]
  colClues: number[][]
  solutionSource: SolutionSource
  exactMatch?: boolean
}

interface RestoredPlayState {
  grid: CellState[][]
  elapsedSeconds: number
  won: boolean
}

const DEFAULT_SIZE = 5
const DEFAULT_DIFFICULTY: DifficultyLevel = 'EASY'
const DEFAULT_MAX_ATTEMPTS = 200

function noop() {}

export function GameScreen() {
  const [size, setSize] = useState(DEFAULT_SIZE)
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    DEFAULT_DIFFICULTY,
  )
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [restoredPlayState, setRestoredPlayState] =
    useState<RestoredPlayState | null>(null)
  const [puzzleKey, setPuzzleKey] = useState(0)
  const [resetNonce, setResetNonce] = useState(0)
  const [editMode, setEditMode] = useState(false)
  const [editDraft, setEditDraft] = useState<CellState[][]>(() =>
    createEmptyGrid(DEFAULT_SIZE, DEFAULT_SIZE),
  )

  const initialGenerate = useGeneratePuzzle()

  // Restore a saved game if one exists; otherwise auto-generate a default puzzle — the imported
  // design never shows an "no puzzle yet" state, it always has one to play.
  useEffect(() => {
    const saved = loadSavedGame()
    if (saved) {
      setPuzzle({
        rowClues: saved.rowClues,
        colClues: saved.colClues,
        solutionSource: saved.solutionSource,
      })
      setSize(saved.size)
      setDifficulty(saved.difficulty)
      setRestoredPlayState({
        grid: saved.grid,
        elapsedSeconds: saved.elapsedSeconds,
        won: saved.won,
      })
      setPuzzleKey((k) => k + 1)
      return
    }
    initialGenerate.mutate(
      {
        num_rows: DEFAULT_SIZE,
        num_cols: DEFAULT_SIZE,
        difficulty: DEFAULT_DIFFICULTY,
        max_attempts: DEFAULT_MAX_ATTEMPTS,
      },
      { onSuccess: (response) => handleGenerated(response, DEFAULT_SIZE) },
    )
    // Runs once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleGenerated(response: GenerateResponse, generatedSize: number) {
    setPuzzle({
      rowClues: response.row_clues,
      colClues: response.col_clues,
      solutionSource: { type: 'fetch' },
      exactMatch: response.exact_match,
    })
    setSize(generatedSize)
    setRestoredPlayState(null)
    setPuzzleKey((k) => k + 1)
    setEditMode(false)
  }

  function handleToggleEditMode() {
    if (editMode) {
      setEditMode(false)
      return
    }
    setEditDraft(createEmptyGrid(size, size))
    setEditMode(true)
  }

  function handleCancelEdit() {
    setEditMode(false)
  }

  function handleFinishEdit() {
    if (!isValidManualSolution(editDraft)) return
    const { rowClues, colClues } = deriveCluesFromSolution(editDraft)
    setPuzzle({
      rowClues,
      colClues,
      solutionSource: { type: 'known', solution: editDraft },
    })
    setRestoredPlayState(null)
    setPuzzleKey((k) => k + 1)
    setEditMode(false)
  }

  function handleResetAll() {
    setRestoredPlayState(null)
    setResetNonce((n) => n + 1)
  }

  function toggleDraftCell(row: number, col: number) {
    setEditDraft((prev) =>
      prev.map((line, r) =>
        r !== row
          ? line
          : line.map((cell, c) =>
              c !== col
                ? cell
                : cell === CellState.FILLED
                  ? CellState.UNKNOWN
                  : CellState.FILLED,
            ),
      ),
    )
  }

  const editClues = editMode ? deriveCluesFromSolution(editDraft) : null
  const editFilledCount = editDraft
    .flat()
    .filter((cell) => cell === CellState.FILLED).length

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>שחור ופתור</h1>
      <div className={styles.layout}>
        {editMode || !puzzle ? (
          <div className={styles.sidebarPlaceholder} />
        ) : (
          <PlayArea
            key={`${puzzleKey}-${resetNonce}`}
            rowClues={puzzle.rowClues}
            colClues={puzzle.colClues}
            solutionSource={puzzle.solutionSource}
            size={size}
            difficulty={difficulty}
            exactMatch={puzzle.exactMatch}
            initialGrid={restoredPlayState?.grid}
            initialElapsedSeconds={restoredPlayState?.elapsedSeconds}
            initialWon={restoredPlayState?.won}
            onResetAll={handleResetAll}
          />
        )}

        {editMode && editClues && (
          <main className={styles.main}>
            <Board
              rowClues={editClues.rowClues}
              colClues={editClues.colClues}
              grid={editDraft}
              onCellMouseDown={toggleDraftCell}
              onCellMouseEnter={noop}
              onCellMarkEmpty={noop}
            />
          </main>
        )}

        <PuzzleSetupForm
          size={size}
          onSizeChange={setSize}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          onGenerated={handleGenerated}
          editMode={editMode}
          onToggleEditMode={handleToggleEditMode}
          editFilledCount={editFilledCount}
          onFinishEdit={handleFinishEdit}
          onCancelEdit={handleCancelEdit}
        />
      </div>
    </div>
  )
}
