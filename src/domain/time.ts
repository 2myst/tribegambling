import type { Minutes, TimeRange } from './types'

export const STEP = 30
export const MIN_DURATION = 60
export const DAY_START: Minutes = 7 * 60
export const DAY_END: Minutes = 22 * 60
export const DAYS_AHEAD = 7
/**
 * Въезд — за 15 минут до начала брони. Поэтому брони одного места не ставятся встык:
 * между ними не меньше тех же 15 минут, иначе ранний въезд упрётся в чужую бронь
 */
export const EARLY_ENTRY = 15

export function overlaps(a: TimeRange, b: TimeRange): boolean {
  return a.start < b.end && b.start < a.end
}

export function dateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, n: number): string {
  const d = parseKey(key)
  d.setDate(d.getDate() + n)
  return dateKey(d)
}

export function toMinutes(d: Date): Minutes {
  return d.getHours() * 60 + d.getMinutes()
}

/** Сегодня — со следующего получаса, другие дни — с начала окна */
export function earliestStart(date: string, now: Date): Minutes {
  if (date !== dateKey(now)) return DAY_START
  return Math.max(DAY_START, (Math.floor(toMinutes(now) / STEP) + 1) * STEP)
}

export function isDayBookable(date: string, now: Date): boolean {
  return earliestStart(date, now) + MIN_DURATION <= DAY_END
}

export function clampRange(date: string, r: TimeRange, now: Date): TimeRange {
  const round = (m: Minutes) => Math.round(m / STEP) * STEP
  let start = Math.max(round(r.start), earliestStart(date, now))
  start = Math.min(start, DAY_END - MIN_DURATION)
  let end = Math.max(round(r.end), start + MIN_DURATION)
  end = Math.min(end, DAY_END)
  return { start, end }
}

export function bookableDays(now: Date): string[] {
  const today = dateKey(now)
  return Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i))
}
