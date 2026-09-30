import { describe, it, expect } from 'vitest'
import { stage, canCancel, activeBooking, entryOpensAt, entryOpen } from './lifecycle'
import type { Booking } from './types'

const b: Booking = { id: 'm', spotId: '-1:17', date: '2026-09-30', range: { start: 540, end: 1080 }, mine: true }

describe('lifecycle', () => {
  it('до начала, идёт, закончилась', () => {
    expect(stage(b, new Date(2026, 8, 29, 20, 30))).toBe('upcoming')
    expect(stage(b, new Date(2026, 8, 30, 10, 0))).toBe('active')
    expect(stage(b, new Date(2026, 8, 30, 18, 0))).toBe('ended')
  })

  it('въезд открывается за 15 минут до начала и открыт до конца брони', () => {
    expect(entryOpensAt(b)).toEqual(new Date(2026, 8, 30, 8, 45))
    expect(entryOpen(b, new Date(2026, 8, 30, 8, 44))).toBe(false)
    expect(entryOpen(b, new Date(2026, 8, 30, 8, 45))).toBe(true)
    expect(entryOpen(b, new Date(2026, 8, 30, 17, 59))).toBe(true)
    expect(entryOpen(b, new Date(2026, 8, 30, 18, 0))).toBe(false)
  })

  it('отменить можно только до начала', () => {
    expect(canCancel(b, new Date(2026, 8, 30, 8, 59))).toBe(true)
    expect(canCancel(b, new Date(2026, 8, 30, 9, 0))).toBe(false)
  })

  it('активная бронь — своя и не закончившаяся', () => {
    const other: Booking = { ...b, id: 'o', mine: false }
    expect(activeBooking([other, b], new Date(2026, 8, 29, 20, 30))?.id).toBe('m')
    expect(activeBooking([b], new Date(2026, 8, 30, 19, 0))).toBeNull()
  })
})
