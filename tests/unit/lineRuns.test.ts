import { describe, expect, it } from 'vitest'
import { CellState } from '../../src/board/cellState'
import { isClueSatisfied, runsOfLine } from '../../src/board/lineRuns'

const { UNKNOWN, FILLED, MARKED_EMPTY } = CellState

describe('runsOfLine', () => {
  it('returns [0] for an all-empty line', () => {
    expect(runsOfLine([UNKNOWN, UNKNOWN, UNKNOWN])).toEqual([0])
  })

  it('returns [0] for a line with only marked-empty cells', () => {
    expect(runsOfLine([MARKED_EMPTY, MARKED_EMPTY])).toEqual([0])
  })

  it('encodes a single run', () => {
    expect(runsOfLine([UNKNOWN, FILLED, FILLED, FILLED, UNKNOWN])).toEqual([3])
  })

  it('encodes multiple runs separated by gaps', () => {
    expect(
      runsOfLine([FILLED, FILLED, UNKNOWN, FILLED, UNKNOWN, UNKNOWN, FILLED]),
    ).toEqual([2, 1, 1])
  })

  it('treats marked-empty as a gap between runs', () => {
    expect(runsOfLine([FILLED, MARKED_EMPTY, FILLED, FILLED])).toEqual([1, 2])
  })

  it('handles a run touching the end of the line', () => {
    expect(runsOfLine([UNKNOWN, FILLED, FILLED])).toEqual([2])
  })
})

describe('isClueSatisfied', () => {
  it('matches identical run arrays', () => {
    expect(isClueSatisfied([3, 1], [3, 1])).toBe(true)
  })

  it('does not match different runs', () => {
    expect(isClueSatisfied([2, 1], [3, 1])).toBe(false)
  })

  it('does not match a different number of runs', () => {
    expect(isClueSatisfied([3], [3, 1])).toBe(false)
  })

  it('treats [] (backend empty-clue encoding) as equal to [0] (actual empty line)', () => {
    expect(isClueSatisfied([0], [])).toBe(true)
  })

  it('treats an actual empty line as unsatisfied against a non-empty clue', () => {
    expect(isClueSatisfied([0], [2])).toBe(false)
  })
})
