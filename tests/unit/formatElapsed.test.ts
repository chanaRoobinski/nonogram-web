import { describe, expect, it } from 'vitest'
import { formatElapsed } from '../../src/game/formatElapsed'

describe('formatElapsed', () => {
  it('formats zero as 00:00', () => {
    expect(formatElapsed(0)).toBe('00:00')
  })

  it('pads single-digit minutes and seconds', () => {
    expect(formatElapsed(65)).toBe('01:05')
  })

  it('formats over an hour as minutes rolling past 59', () => {
    expect(formatElapsed(3661)).toBe('61:01')
  })
})
