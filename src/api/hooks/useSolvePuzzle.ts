import { useMutation } from '@tanstack/react-query'
import { postJson } from '../client'
import type { components } from '../generated/schema'

type SolveRequest = components['schemas']['SolveRequest']

export function useSolvePuzzle() {
  return useMutation({
    mutationFn: (request: SolveRequest) => postJson('/puzzles/solve', request),
  })
}
