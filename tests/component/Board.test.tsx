import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Board } from '../../src/board/Board'
import { CellState, createEmptyGrid } from '../../src/board/cellState'
import { cellElementId, useBoardState } from '../../src/board/boardInteractions'
import cellStyles from '../../src/board/Cell.module.css'

function noop() {}

function makeClues(size: number): { rowClues: number[][]; colClues: number[][] } {
  const clue = [1]
  return {
    rowClues: Array.from({ length: size }, () => clue),
    colClues: Array.from({ length: size }, () => clue),
  }
}

/** Wires the real reducer/hook to Board, so tests can simulate real user gestures. */
function InteractiveHarness({
  rowClues,
  colClues,
  size,
}: {
  rowClues: number[][]
  colClues: number[][]
  size: number
}) {
  const { grid, canUndo, canRedo, startPaint, continuePaint, markEmpty, undo, redo } =
    useBoardState(createEmptyGrid(size, size))
  return (
    <div>
      <button type="button" onClick={undo} disabled={!canUndo}>
        undo
      </button>
      <button type="button" onClick={redo} disabled={!canRedo}>
        redo
      </button>
      <Board
        rowClues={rowClues}
        colClues={colClues}
        grid={grid}
        onCellMouseDown={startPaint}
        onCellMouseEnter={continuePaint}
        onCellMarkEmpty={markEmpty}
      />
    </div>
  )
}

function getCell(container: HTMLElement, row: number, col: number) {
  const el = container.querySelector(`#${cellElementId(row, col)}`)
  if (!el) throw new Error(`cell ${row},${col} not found`)
  return el as HTMLElement
}

describe('Board (static rendering)', () => {
  it.each([5, 10, 15])('renders a %ix%i grid with the right cell count', (size) => {
    const { rowClues, colClues } = makeClues(size)
    const grid = createEmptyGrid(size, size)
    const { container } = render(
      <Board
        rowClues={rowClues}
        colClues={colClues}
        grid={grid}
        onCellMouseDown={noop}
        onCellMouseEnter={noop}
        onCellMarkEmpty={noop}
      />,
    )
    expect(container.querySelectorAll(`.${cellStyles.cell}`)).toHaveLength(
      size * size,
    )
  })

  it('renders an empty puzzle with all cells unfilled', () => {
    const { rowClues, colClues } = makeClues(3)
    const grid = createEmptyGrid(3, 3)
    const { container } = render(
      <Board
        rowClues={rowClues}
        colClues={colClues}
        grid={grid}
        onCellMouseDown={noop}
        onCellMouseEnter={noop}
        onCellMarkEmpty={noop}
      />,
    )
    expect(container.querySelectorAll(`.${cellStyles.filled}`)).toHaveLength(0)
  })

  it('renders a fully-filled puzzle with every cell filled', () => {
    const { rowClues, colClues } = makeClues(3)
    const grid = createEmptyGrid(3, 3).map((row) => row.map(() => CellState.FILLED))
    const { container } = render(
      <Board
        rowClues={rowClues}
        colClues={colClues}
        grid={grid}
        onCellMouseDown={noop}
        onCellMouseEnter={noop}
        onCellMarkEmpty={noop}
      />,
    )
    expect(container.querySelectorAll(`.${cellStyles.filled}`)).toHaveLength(9)
  })

  it('renders row and column clue numbers matching the clue arrays exactly', () => {
    const rowClues = [[3, 1], [0], [2]]
    const colClues = [[1], [1, 1], [3]]
    const grid = createEmptyGrid(3, 3)
    render(
      <Board
        rowClues={rowClues}
        colClues={colClues}
        grid={grid}
        onCellMouseDown={noop}
        onCellMouseEnter={noop}
        onCellMarkEmpty={noop}
      />,
    )

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
    render(
      <Board
        rowClues={rowClues}
        colClues={colClues}
        grid={grid}
        onCellMouseDown={noop}
        onCellMouseEnter={noop}
        onCellMarkEmpty={noop}
      />,
    )

    const rowClueEl = screen.getAllByText('3')[0]
    expect(rowClueEl.className).toMatch(/satisfied/)
  })
})

describe('Board (interaction, Stage 3)', () => {
  it('click toggles a cell to FILLED', () => {
    const { rowClues, colClues } = makeClues(3)
    const { container } = render(
      <InteractiveHarness rowClues={rowClues} colClues={colClues} size={3} />,
    )
    const cell = getCell(container, 1, 1)
    fireEvent.mouseDown(cell)
    fireEvent.mouseUp(cell)
    expect(cell.className).toMatch(/filled/)
  })

  it('drag-paints a run of cells and undoes the whole run in one step', () => {
    const { rowClues, colClues } = makeClues(3)
    const { container } = render(
      <InteractiveHarness rowClues={rowClues} colClues={colClues} size={3} />,
    )
    const a = getCell(container, 0, 0)
    const b = getCell(container, 0, 1)
    const c = getCell(container, 0, 2)

    fireEvent.mouseDown(a)
    fireEvent.mouseEnter(b)
    fireEvent.mouseEnter(c)
    fireEvent.mouseUp(c)

    expect(a.className).toMatch(/filled/)
    expect(b.className).toMatch(/filled/)
    expect(c.className).toMatch(/filled/)

    fireEvent.click(screen.getByText('undo'))

    expect(a.className).not.toMatch(/filled/)
    expect(b.className).not.toMatch(/filled/)
    expect(c.className).not.toMatch(/filled/)
  })

  it('right-click (context menu) marks a cell as MARKED_EMPTY directly', () => {
    const { rowClues, colClues } = makeClues(3)
    const { container } = render(
      <InteractiveHarness rowClues={rowClues} colClues={colClues} size={3} />,
    )
    const cell = getCell(container, 0, 0)
    fireEvent.contextMenu(cell)
    expect(cell.textContent).toBe('✕')
  })

  it('Enter key toggles the focused cell like a click', () => {
    const { rowClues, colClues } = makeClues(3)
    const { container } = render(
      <InteractiveHarness rowClues={rowClues} colClues={colClues} size={3} />,
    )
    const cell = getCell(container, 0, 0)
    cell.focus()
    fireEvent.keyDown(cell, { key: 'Enter' })
    expect(cell.className).toMatch(/filled/)
  })

  it('ArrowRight moves focus to the next cell', () => {
    const { rowClues, colClues } = makeClues(3)
    const { container } = render(
      <InteractiveHarness rowClues={rowClues} colClues={colClues} size={3} />,
    )
    const first = getCell(container, 0, 0)
    const second = getCell(container, 0, 1)
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(second)
  })

  it('undo/redo buttons are disabled with no history/future', () => {
    const { rowClues, colClues } = makeClues(3)
    render(<InteractiveHarness rowClues={rowClues} colClues={colClues} size={3} />)
    expect(screen.getByText('undo')).toBeDisabled()
    expect(screen.getByText('redo')).toBeDisabled()
  })
})
