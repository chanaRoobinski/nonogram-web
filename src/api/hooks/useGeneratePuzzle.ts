import { useMutation } from '@tanstack/react-query'
import { postJson } from '../client'
import type { components } from '../generated/schema'

type GenerateRequest = components['schemas']['GenerateRequest']

export function useGeneratePuzzle() {
  return useMutation({
    mutationFn: (request: GenerateRequest) =>
      postJson('/puzzles/generate', request),
  })
}
