import { describe, it, expect } from 'vitest'
import { buildSpots, spotById, distanceToExit, gridDistance } from './layout'

describe('layout', () => {
  it('на этаже 40 мест с номерами 1–40', () => {
    const nums = buildSpots(-1).map((s) => s.num).sort((a, b) => a - b)
    expect(nums).toEqual(Array.from({ length: 40 }, (_, i) => i + 1))
  })

  it('номера идут по ходу движения: 1 — у въезда, 21 — после разворота', () => {
    expect(spotById('-1:1')).toMatchObject({ col: 3, row: 9 })
    expect(spotById('-1:10')).toMatchObject({ col: 3, row: 0 })
    expect(spotById('-1:17')).toMatchObject({ col: 2, row: 3 })
    expect(spotById('-1:21')).toMatchObject({ col: 1, row: 0 })
    expect(spotById('-2:40')).toMatchObject({ floor: -2, col: 0, row: 9 })
  })

  it('место у ворот ближе к выходу, чем в дальнем углу', () => {
    expect(distanceToExit(spotById('-1:1'))).toBeLessThan(distanceToExit(spotById('-1:10')))
    expect(distanceToExit(spotById('-1:1'))).toBeLessThan(distanceToExit(spotById('-1:31')))
  })

  it('соседнее по ряду место ближе, чем через проезд', () => {
    const s17 = spotById('-1:17')
    expect(gridDistance(s17, spotById('-1:18'))).toBeLessThan(gridDistance(s17, spotById('-1:7')))
  })
})
