import { describe, expect, it } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, http } from 'msw'
import type { ReactNode } from 'react'
import { useGeneratePuzzle } from '../../src/api/hooks/useGeneratePuzzle'
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
  num_rows: 5,
  num_cols: 5,
  difficulty: 'EASY' as const,
  max_attempts: 10,
}

describe('useGeneratePuzzle', () => {
  it('returns the generated puzzle on success', async () => {
    const { result } = renderHook(() => useGeneratePuzzle(), { wrapper })

    result.current.mutate(request)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.exact_match).toBe(true)
    expect(result.current.data?.row_clues).toEqual([[1]])
  })

  it('surfaces a validation error (422) as an ApiError', async () => {
    server.use(
      http.post('http://localhost:8000/puzzles/generate', () =>
        HttpResponse.json(
          { detail: [{ loc: ['body', 'num_rows'], msg: 'invalid', type: 'value_error' }] },
          { status: 422 },
        ),
      ),
    )
    const { result } = renderHook(() => useGeneratePuzzle(), { wrapper })

    result.current.mutate(request)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ApiError)
    expect((result.current.error as ApiError).status).toBe(422)
  })

  it('surfaces a server error (500) as an ApiError', async () => {
    server.use(
      http.post('http://localhost:8000/puzzles/generate', () =>
        HttpResponse.json({ detail: 'boom' }, { status: 500 }),
      ),
    )
    const { result } = renderHook(() => useGeneratePuzzle(), { wrapper })

    result.current.mutate(request)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as ApiError).status).toBe(500)
  })

  it('surfaces a network error/timeout as an ApiError with status 0', async () => {
    server.use(
      http.post('http://localhost:8000/puzzles/generate', () =>
        HttpResponse.error(),
      ),
    )
    const { result } = renderHook(() => useGeneratePuzzle(), { wrapper })

    result.current.mutate(request)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as ApiError).status).toBe(0)
  })
})
