import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { maxClueLength } from './lineRuns'

export const MIN_CELL_PX = 8
export const MAX_CELL_PX = 140
export const MIN_ZOOM = 0.4
export const MAX_ZOOM = 2.5
const ZOOM_STEP = 0.15
const DEFAULT_CELL_PX = 32
/** Rough allowance for the board card's own padding/border, subtracted from the measured
 * container before fitting cells into it. */
const CARD_CHROME_PX = 40

export function clampZoomIn(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.round((zoom + ZOOM_STEP) * 100) / 100)
}

export function clampZoomOut(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.round((zoom - ZOOM_STEP) * 100) / 100)
}

/**
 * Computes a cell size that fits the given clue sets into the (measured) container, times the
 * current zoom level — the Stage 5 "zoom controls... within the fitted viewport size" decision.
 * Falls back to a fixed default before the container has been measured (e.g. jsdom in tests,
 * which has no ResizeObserver) rather than crashing or reading a bogus zero size.
 */
export function useFittedCellSize(rowClues: number[][], colClues: number[][]) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [zoom, setZoom] = useState(1)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      setContainerSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const numRows = rowClues.length
  const numCols = colClues.length
  const maxRowClueCount = maxClueLength(rowClues)
  const maxColClueCount = maxClueLength(colClues)
  const kW = maxRowClueCount * 0.42 + 0.3
  const kH = maxColClueCount * 0.42 + 0.3

  const hasMeasurement = containerSize.width > 0 && containerSize.height > 0
  let cellSize = DEFAULT_CELL_PX
  if (hasMeasurement && numRows > 0 && numCols > 0) {
    const availW = Math.max(120, containerSize.width - CARD_CHROME_PX)
    const availH = Math.max(120, containerSize.height - CARD_CHROME_PX)
    const rawCellPx = Math.min(availW / (numCols + kW), availH / (numRows + kH))
    cellSize = Math.max(
      MIN_CELL_PX,
      Math.min(MAX_CELL_PX, Math.floor(rawCellPx * zoom)),
    )
  }

  const zoomIn = useCallback(() => setZoom(clampZoomIn), [])
  const zoomOut = useCallback(() => setZoom(clampZoomOut), [])

  return { containerRef, cellSize, zoom, zoomIn, zoomOut }
}
