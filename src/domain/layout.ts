import type { Floor, Spot } from './types'

/**
 * План повёрнут на 90° без зеркала: 4 колонки по 10 рядов.
 * Номера идут по ходу движения: вверх по правому проезду (колонки 3 и 2, ряды 9→0),
 * после разворота — вниз по левому (колонки 1 и 0, ряды 0→9).
 */
function numAt(col: Spot['col'], row: number): number {
  if (col === 3) return 10 - row
  if (col === 2) return 20 - row
  if (col === 1) return 21 + row
  return 31 + row
}

export function buildSpots(floor: Floor): Spot[] {
  const spots: Spot[] = []
  for (const col of [0, 1, 2, 3] as const) {
    for (let row = 0; row < 10; row++) {
      const num = numAt(col, row)
      spots.push({ id: `${floor}:${num}`, floor, num, col, row })
    }
  }
  return spots
}

export const ALL_SPOTS: Spot[] = [...buildSpots(-1), ...buildSpots(-2)]
const BY_ID = new Map(ALL_SPOTS.map((s) => [s.id, s]))

export function spotById(id: string): Spot {
  const s = BY_ID.get(id)
  if (!s) throw new Error(`Нет места ${id}`)
  return s
}

/** Выход в здание — у ворот, внизу правого проезда (допущение) */
const LATERAL: Record<Spot['col'], number> = { 3: 0, 2: 0.6, 1: 1.6, 0: 2.2 }
export function distanceToExit(s: Spot): number {
  return 9 - s.row + LATERAL[s.col]
}

/** Близость мест для замены при конфликте: по ряду ближе, чем через проезд */
export function gridDistance(a: Spot, b: Spot): number {
  const floorPenalty = a.floor === b.floor ? 0 : 20
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) * 1.5 + floorPenalty
}
