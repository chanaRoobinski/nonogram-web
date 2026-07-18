import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Board } from '../../src/board/Board'
import { CellState, createEmptyGrid } from '../../src/board/cellState'
import cellStyles from '../../src/board/Cell.module.css'

function makeClues(size: number): { rowClues: number[][]; colClues: number[][] } {
  const clue = [1]
  return {
    rowClues: Array.from({ length: size }, () => clue),
    colClues: Array.from({ length: size }, () => clue),
  }
}

describe('Board', () => {
  it.each([5, 10, 15])('renders a %ix%i grid with the right cell count', (size) => {
    const { rowClues, colClues } = makeClues(size)
    const grid = createEmptyGrid(size, size)
    const { container } = render(
      <Board rowClues={rowClues} colClues={colClues} grid={grid} />,
    )
    expect(container.querySelectorAll(`.${cellStyles.cell}`)).toHaveLength(
      size * size,
    )
  })

  it('renders an empty puzzle with all cells unfilled', () => {
    const { rowClues, colClues } = makeClues(3)
    const grid = createEmptyGrid(3, 3)
    const { container } = render(
      <Board rowClues={rowClues} colClues={colClues} grid={grid} />,
    )
    expect(container.querySelectorAll(`.${cellStyles.filled}`)).toHaveLength(0)
  })

  it('renders a fully-filled puzzle with every cell filled', () => {
    const { rowClues, colClues } = makeClues(3)
    const grid = createEmptyGrid(3, 3).map((row) =>
      row.map(() => CellState.FILLED),
    )
    const { container } = render(
      <Board rowClues={rowClues} colClues={colClues} grid={grid} />,
    )
    expect(container.querySelectorAll(`.${cellStyles.filled}`)).toHaveLength(9)
  })

  it('renders row and column clue numbers matching the clue arrays exactly', () => {
    const rowClues = [[3, 1], [0], [2]]
    const colClues = [[1], [1, 1], [3]]
    const grid = createEmptyGrid(3, 3)
    render(<Board rowClues={rowClues} colClues={colClues} grid={grid} />)

    // Every clue value should appear exactly as many times as it's listed across both axes.
    const allValues = [...rowClues, ...colClues].flat()
    const counts = new Map<number, number>()
    for (const v of allValues) counts.set(v, (counts.get(v) ?? 0) + 1)
    for (const [value, count] of counts) {
      expect(screen.getAllByText(String(value))).toHaveLength(count)
    }
  })

  it('marks a satisfied row clue as such', () => {
    const rowClues = [[3]]
    const colClues = [[1], [1], [1]]
    const grid = [[CellState.FILLED, CellState.FILLED, CellState.FILLED]]
    render(<Board rowClues={rowClues} colClues={colClues} grid={grid} />)

    const rowClueEl = screen.getAllByText('3')[0]
    expect(rowClueEl.className).toMatch(/satisfied/)
  })
})
