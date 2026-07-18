import { http, HttpResponse } from 'msw'
import type { components } from '../api/generated/schema'

const BASE_URL = 'http://localhost:8000'

const defaultGenerateResponse: components['schemas']['GenerateResponse'] = {
  row_clues: [[1]],
  col_clues: [[1]],
  difficulty: { score: 0.1, category: 'EASY', suitable_for_human: true },
  exact_match: true,
}

const defaultSolveResponse: components['schemas']['SolveResponse'] = {
  status: 'SOLVED',
  solution: [[true]],
}

export const handlers = [
  http.post(`${BASE_URL}/puzzles/generate`, () =>
    HttpResponse.json(defaultGenerateResponse),
  ),
  http.post(`${BASE_URL}/puzzles/solve`, () =>
    HttpResponse.json(defaultSolveResponse),
  ),
]
