import { describe, expect, it } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, http } from 'msw'
import type { ReactNode } from 'react'
import { useSolvePuzzle } from '../../src/api/hooks/useSolvePuzzle'
import { server } from '../../src/mocks/server'
import { ApiError } from '../../src/api/client'

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const request = {
  row_clues: [[1]],
  col_clues: [[1]],
}

describe('useSolvePuzzle', () => {
  it('returns the solved grid on success', async () => {
    const { result } = renderHook(() => useSolvePuzzle(), { wrapper })

    result.current.mutate(request)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.status).toBe('SOLVED')
    expect(result.current.data?.solution).toEqual([[true]])
  })

  it('surfaces a validation error (422) as an ApiError', async () => {
    server.use(
      http.post('http://localhost:8000/puzzles/solve', () =>
        HttpResponse.json(
          { detail: [{ loc: ['body', 'row_clues'], msg: 'invalid', type: 'value_error' }] },
          { status: 422 },
        ),
      ),
    )
    const { result } = renderHook(() => useSolvePuzzle(), { wrapper })

    result.current.mutate(request)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as ApiError).status).toBe(422)
  })

  it('surfaces a server error (500) as an ApiError', async () => {
    server.use(
      http.post('http://localhost:8000/puzzles/solve', () =>
        HttpResponse.json({ detail: 'boom' }, { status: 500 }),
      ),
    )
    const { result } = renderHook(() => useSolvePuzzle(), { wrapper })

    result.current.mutate(request)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as ApiError).status).toBe(500)
  })

  it('surfaces a network error/timeout as an ApiError with status 0', async () => {
    server.use(
      http.post('http://localhost:8000/puzzles/solve', () =>
        HttpResponse.error(),
      ),
    )
    const { result } = renderHook(() => useSolvePuzzle(), { wrapper })

    result.current.mutate(request)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as ApiError).status).toBe(0)
  })
})
