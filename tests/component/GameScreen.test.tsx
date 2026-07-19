import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, http } from 'msw'
import { GameScreen } from '../../src/game/GameScreen'
import { server } from '../../src/mocks/server'

const EMPTY_5X5_CLUES = Array.from({ length: 5 }, () => [0])

function renderGameScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <GameScreen />
    </QueryClientProvider>,
  )
}

describe('GameScreen — manual puzzle creation (edit mode)', () => {
  beforeEach(() => {
    server.use(
      http.post('http://localhost:8000/puzzles/generate', () =>
        HttpResponse.json({
          row_clues: EMPTY_5X5_CLUES,
          col_clues: EMPTY_5X5_CLUES,
          difficulty: { score: 0.1, category: 'EASY', suitable_for_human: true },
          exact_match: true,
        }),
      ),
    )
  })

  afterEach(() => {
    server.resetHandlers()
  })

  it('draws a solution, derives clues, and starts a fresh playable board', async () => {
    const user = userEvent.setup()
    const { container } = renderGameScreen()

    await waitFor(() =>
      expect(container.querySelector('#ng-cell-0-0')).toBeInTheDocument(),
    )

    await user.click(screen.getByRole('button', { name: /צור ידנית/ }))
    expect(screen.getByText(/0.*מלאות/)).toBeInTheDocument()

    // Draw an L-shape: (0,0), (1,0), (2,0), (2,1)
    for (const [r, c] of [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
    ]) {
      await user.click(
        container.querySelector(`#ng-cell-${r}-${c}`) as HTMLElement,
      )
    }
    expect(screen.getByText(/4.*מלאות/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /סיים/ }))

    // Edit mode UI is gone; a fresh (all-unfilled) play board with derived clues appears.
    expect(screen.queryByText(/מצב עריכה/)).not.toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument() // row clue for the 3-tall column
    expect(screen.getByText('2')).toBeInTheDocument() // row clue for the bottom row

    // The newly drawn (0,0) is part of the solution — clicking it then checking should not
    // flag it wrong.
    const firstCell = container.querySelector('#ng-cell-0-0') as HTMLElement
    await user.click(firstCell)
    await user.click(screen.getByRole('button', { name: /^✓ בדיקה$/ }))
    await waitFor(() => expect(firstCell.className).toMatch(/filled/))
    expect(firstCell.className).not.toMatch(/wrong/)
  })

  it('cancel discards the draft and keeps the current puzzle', async () => {
    const user = userEvent.setup()
    const { container } = renderGameScreen()

    await waitFor(() =>
      expect(container.querySelector('#ng-cell-0-0')).toBeInTheDocument(),
    )

    await user.click(screen.getByRole('button', { name: /צור ידנית/ }))
    await user.click(container.querySelector('#ng-cell-0-0') as HTMLElement)
    await user.click(screen.getByRole('button', { name: /ביטול/ }))

    expect(screen.queryByText(/מצב עריכה/)).not.toBeInTheDocument()
    // Back to the play board from the mocked generate response.
    expect(container.querySelector('#ng-cell-0-0')).toBeInTheDocument()
  })
})

describe('GameScreen — difficulty-mismatch banner', () => {
  afterEach(() => {
    server.resetHandlers()
  })

  it('surfaces exact_match: false from the backend', async () => {
    server.use(
      http.post('http://localhost:8000/puzzles/generate', () =>
        HttpResponse.json({
          row_clues: EMPTY_5X5_CLUES,
          col_clues: EMPTY_5X5_CLUES,
          difficulty: { score: 0.1, category: 'EASY', suitable_for_human: true },
          exact_match: false,
        }),
      ),
    )
    renderGameScreen()

    expect(
      await screen.findByText(/לא נמצאה חידה בדיוק ברמת הקושי המבוקשת/),
    ).toBeInTheDocument()
  })
})
