import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, http } from 'msw'
import type { ReactNode } from 'react'
import { PuzzleSetupForm } from '../../src/game/PuzzleSetupForm'
import { server } from '../../src/mocks/server'

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

function renderForm(overrides: Partial<Parameters<typeof PuzzleSetupForm>[0]> = {}) {
  const onGenerated = vi.fn()
  const onSizeChange = vi.fn()
  const onToggleEditMode = vi.fn()
  const onFinishEdit = vi.fn()
  const onCancelEdit = vi.fn()
  const utils = render(
    <PuzzleSetupForm
      size={5}
      onSizeChange={onSizeChange}
      onGenerated={onGenerated}
      editMode={false}
      onToggleEditMode={onToggleEditMode}
      editFilledCount={0}
      onFinishEdit={onFinishEdit}
      onCancelEdit={onCancelEdit}
      {...overrides}
    />,
    { wrapper },
  )
  return {
    ...utils,
    onGenerated,
    onSizeChange,
    onToggleEditMode,
    onFinishEdit,
    onCancelEdit,
  }
}

describe('PuzzleSetupForm', () => {
  it('calls onGenerated with the response and the requested size on success', async () => {
    const user = userEvent.setup()
    const { onGenerated } = renderForm()

    await user.click(screen.getByRole('button', { name: /צור חידה חדשה/ }))

    await waitFor(() => expect(onGenerated).toHaveBeenCalledTimes(1))
    expect(onGenerated).toHaveBeenCalledWith(
      expect.objectContaining({ row_clues: [[1]], col_clues: [[1]] }),
      5,
    )
  })

  it('shows a loading state and disables the button while generating', async () => {
    server.use(
      http.post('http://localhost:8000/puzzles/generate', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return HttpResponse.json({
          row_clues: [[1]],
          col_clues: [[1]],
          difficulty: { score: 0.1, category: 'EASY', suitable_for_human: true },
          exact_match: true,
        })
      }),
    )
    const user = userEvent.setup()
    renderForm()

    const button = screen.getByRole('button', { name: /צור חידה חדשה/ })
    await user.click(button)

    expect(screen.getByRole('button', { name: /יוצר חידה/ })).toBeDisabled()
  })

  it('shows an error message when generation fails', async () => {
    server.use(
      http.post('http://localhost:8000/puzzles/generate', () =>
        HttpResponse.json({ detail: 'boom' }, { status: 500 }),
      ),
    )
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: /צור חידה חדשה/ }))

    expect(await screen.findByText(/שגיאה ביצירת החידה/)).toBeInTheDocument()
  })

  it('disables size/difficulty/generate controls while in edit mode', () => {
    renderForm({ editMode: true })

    expect(screen.getByLabelText('גודל הלוח')).toBeDisabled()
    expect(screen.getByRole('button', { name: /צור חידה חדשה/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'קל' })).toBeDisabled()
  })

  it('shows the edit-mode notice with the current filled count and finish/cancel buttons', async () => {
    const user = userEvent.setup()
    const { onFinishEdit, onCancelEdit } = renderForm({
      editMode: true,
      editFilledCount: 3,
    })

    expect(screen.getByText(/3.*מלאות/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /סיים/ }))
    expect(onFinishEdit).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: /ביטול/ }))
    expect(onCancelEdit).toHaveBeenCalledTimes(1)
  })
})
