import { beforeEach, describe, expect, it } from 'vitest'
import {
  formatBestTimesList,
  loadBestTimes,
  loadHistory,
  recordCompletion,
} from '../../src/game/records'

beforeEach(() => {
  localStorage.clear()
})

describe('recordCompletion', () => {
  it('records the first completion as a new record', () => {
    const { isNewRecord } = recordCompletion(5, 'EASY', 42)
    expect(isNewRecord).toBe(true)
    expect(loadBestTimes()).toEqual({ '5x5-EASY': 42 })
  })

  it('treats a slower repeat completion as not a new record, and keeps the faster time', () => {
    recordCompletion(5, 'EASY', 42)
    const { isNewRecord } = recordCompletion(5, 'EASY', 100)
    expect(isNewRecord).toBe(false)
    expect(loadBestTimes()['5x5-EASY']).toBe(42)
  })

  it('updates the record when a faster completion happens', () => {
    recordCompletion(5, 'EASY', 42)
    const { isNewRecord } = recordCompletion(5, 'EASY', 10)
    expect(isNewRecord).toBe(true)
    expect(loadBestTimes()['5x5-EASY']).toBe(10)
  })

  it('keeps separate records per size+difficulty combination', () => {
    recordCompletion(5, 'EASY', 42)
    recordCompletion(10, 'HARD', 200)
    expect(loadBestTimes()).toEqual({ '5x5-EASY': 42, '10x10-HARD': 200 })
  })

  it('pushes a history entry for every completion, newest first', () => {
    recordCompletion(5, 'EASY', 42)
    recordCompletion(5, 'EASY', 30)
    const history = loadHistory()
    expect(history).toHaveLength(2)
    expect(history[0].time).toBe('00:30')
    expect(history[1].time).toBe('00:42')
  })

  it('caps history at 10 entries', () => {
    for (let i = 0; i < 12; i++) recordCompletion(5, 'EASY', i)
    expect(loadHistory()).toHaveLength(10)
  })
})

describe('formatBestTimesList', () => {
  it('formats a best-times record into a readable list', () => {
    const list = formatBestTimesList({ '5x5-EASY': 65 })
    expect(list).toEqual([{ key: '5x5-EASY', label: '5x5 · קל', time: '01:05' }])
  })
})
