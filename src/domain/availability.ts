import type { Floor, Minutes, Spot, SpotState, TimeRange, World } from './types'
import { ALL_SPOTS, distanceToExit, gridDistance, spotById } from './layout'
import { bookableDays, EARLY_ENTRY, isDayBookable, MIN_DURATION, STEP } from './time'

function isClosed(spot: Spot, date: string, w: World): boolean {
  return w.closures.some((c) => c.spotId === spot.id && date <= c.until)
}

function bookingsOn(spot: Spot, date: string, w: World) {
  return w.bookings.filter((b) => b.spotId === spot.id && b.date === date)
}

/** Брони одного места мешают друг другу, если между ними меньше EARLY_ENTRY: следующий водитель въезжает раньше */
function clash(a: TimeRange, b: TimeRange): boolean {
  return a.start < b.end + EARLY_ENTRY && b.start < a.end + EARLY_ENTRY
}

export function spotState(spot: Spot, date: string, r: TimeRange, w: World): SpotState {
  if (isClosed(spot, date, w)) return 'closed'
  return bookingsOn(spot, date, w).some((b) => clash(b.range, r)) ? 'occupied' : 'free'
}

/** С какого времени место можно взять: после чужих броней, зазора и по шагу — для подсказки «можно взять с 13:30» */
export function bookableFrom(spot: Spot, date: string, r: TimeRange, w: World): Minutes {
  const hits = bookingsOn(spot, date, w).filter((b) => clash(b.range, r))
  const end = hits.reduce((m, b) => Math.max(m, b.range.end + EARLY_ENTRY), r.start)
  return Math.ceil(end / STEP) * STEP
}

export function closedUntil(spot: Spot, w: World): string | null {
  return w.closures.find((c) => c.spotId === spot.id)?.until ?? null
}

const spotsOf = (floor: Floor | 'all') => (floor === 'all' ? ALL_SPOTS : ALL_SPOTS.filter((s) => s.floor === floor))

export function freeCount(floor: Floor | 'all', date: string, r: TimeRange, w: World): number {
  return spotsOf(floor).filter((s) => spotState(s, date, r, w) === 'free').length
}

/** Свободных мест в каждый час с 7 до 21 — для столбиков */
export function hourlyFree(floor: Floor | 'all', date: string, w: World): number[] {
  return Array.from({ length: 15 }, (_, i) => {
    const start = (7 + i) * 60
    return freeCount(floor, date, { start, end: start + 60 }, w)
  })
}

export type PickReason = 'last' | 'lastTaken' | 'nearExit'

export function autoPick(date: string, r: TimeRange, lastSpotId: string | null, w: World): { spot: Spot; reason: PickReason } | null {
  const isFree = (s: Spot) => spotState(s, date, r, w) === 'free'
  const last = lastSpotId ? spotById(lastSpotId) : null
  if (last && isFree(last)) return { spot: last, reason: 'last' }
  const preferred: Floor = last?.floor ?? -1
  const rank = (s: Spot) => (s.floor === preferred ? 0 : 100) + distanceToExit(s)
  const best = ALL_SPOTS.filter(isFree).sort((a, b) => rank(a) - rank(b))[0]
  if (!best) return null
  return { spot: best, reason: last ? 'lastTaken' : 'nearExit' }
}

/** Замена при конфликте: ближайшее свободное, сначала на том же этаже */
export function nearestFree(spot: Spot, date: string, r: TimeRange, w: World): Spot | null {
  const cands = ALL_SPOTS.filter((s) => s.id !== spot.id && spotState(s, date, r, w) === 'free')
  cands.sort((a, b) => gridDistance(spot, a) - gridDistance(spot, b))
  return cands[0] ?? null
}

export interface Alternatives {
  later?: { range: TimeRange; count: number }
  day?: { date: string; count: number }
}

/** «Нет мест»: позже в тот же день (с тем же концом) и ближайший другой день */
export function suggestAlternatives(date: string, r: TimeRange, now: Date, w: World): Alternatives {
  const out: Alternatives = {}
  for (let start = r.start + STEP; start <= r.end - MIN_DURATION; start += STEP) {
    const range = { start, end: r.end }
    const count = freeCount('all', date, range, w)
    if (count > 0) {
      out.later = { range, count }
      break
    }
  }
  for (const d of bookableDays(now)) {
    if (d <= date || !isDayBookable(d, now)) continue
    const count = freeCount('all', d, r, w)
    if (count > 0) {
      out.day = { date: d, count }
      break
    }
  }
  return out
}
