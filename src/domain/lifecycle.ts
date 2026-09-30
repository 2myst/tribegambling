import type { Booking } from './types'
import { EARLY_ENTRY, parseKey } from './time'

export type Stage = 'upcoming' | 'active' | 'ended'

function at(date: string, minutes: number): Date {
  const d = parseKey(date)
  d.setMinutes(minutes)
  return d
}

export const bookingStart = (b: Booking) => at(b.date, b.range.start)
export const bookingEnd = (b: Booking) => at(b.date, b.range.end)

export function stage(b: Booking, now: Date): Stage {
  if (now < bookingStart(b)) return 'upcoming'
  if (now < bookingEnd(b)) return 'active'
  return 'ended'
}

/** Въезд открывается за EARLY_ENTRY минут до начала и открыт до конца брони */
export const entryOpensAt = (b: Booking) => new Date(bookingStart(b).getTime() - EARLY_ENTRY * 60_000)

export function entryOpen(b: Booking, now: Date): boolean {
  return now >= entryOpensAt(b) && now < bookingEnd(b)
}

export function canCancel(b: Booking, now: Date): boolean {
  return stage(b, now) === 'upcoming'
}

/**
 * Пока бронь идёт, отменить нельзя (правило задания): машина, скорее всего, стоит на месте.
 * Можно другое — освободить место раньше: человек сам подтверждает, что уехал, и остаток брони достаётся коллегам
 */
export function canRelease(b: Booking, now: Date): boolean {
  return stage(b, now) === 'active'
}

export function activeBooking(bookings: Booking[], now: Date): Booking | null {
  return bookings.find((b) => b.mine && stage(b, now) !== 'ended') ?? null
}
