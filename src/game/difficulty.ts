import type { components } from '../api/generated/schema'

export type DifficultyLevel = components['schemas']['DifficultyLevel']

export const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string }[] = [
  { value: 'EASY', label: 'קל' },
  { value: 'MEDIUM', label: 'בינוני' },
  { value: 'HARD', label: 'קשה' },
  { value: 'VERY_HARD', label: 'קשה מאוד' },
]
