import type { Booking, Floor, World } from './types'
import { addDays } from './time'

/** Демо-время: вторник, 29 сентября 2026, 20:30 — человек бронирует вечером на завтра */
export const DEMO_NOW = new Date(2026, 8, 29, 20, 30)
export const TODAY = '2026-09-29'
export const TOMORROW = '2026-09-30'
export const PLATE = 'А123ВС 777'

/** Прошлая бронь — для «как в прошлый раз» */
export const LAST_BOOKING: Booking = { id: 'last', spotId: '-1:17', date: '2026-09-22', range: { start: 540, end: 1080 }, mine: true }

const FULL: [number, number] = [510, 1110] // 8:30–18:30

/** Завтра, 9:00–18:00: на −1 свободно 11 мест, на −2 — 3 */
const FREE_TOMORROW: Record<Floor, number[]> = {
  [-1]: [3, 7, 9, 12, 17, 18, 22, 25, 29, 33, 38],
  [-2]: [4, 15, 27],
}
/** Частичные брони на завтра: освобождаются, если сдвинуть время */
const PARTIAL_TOMORROW: Record<Floor, Record<number, [number, number]>> = {
  [-1]: { 2: [480, 600], 13: [480, 600], 31: [480, 600], 14: [540, 780], 26: [840, 1140], 40: [720, 900] },
  [-2]: { 6: [480, 600], 16: [480, 600] },
}
const CLOSED: { spotId: string; until: string }[] = [
  { spotId: '-1:5', until: '2026-10-05' },
  { spotId: '-1:36', until: '2026-10-05' },
]

/** Номер брони — из места, дня и начала: один и тот же мир собирается одинаково */
const book = (spotId: string, date: string, [start, end]: [number, number]): Booking => ({ id: `b${spotId}@${date}@${start}`, spotId, date, range: { start, end } })

export function baseWorld(): World {
  const bookings: Booking[] = [LAST_BOOKING]
  const closed = new Set(CLOSED.map((c) => c.spotId))
  for (const floor of [-1, -2] as Floor[]) {
    for (let num = 1; num <= 40; num++) {
      const id = `${floor}:${num}`
      if (closed.has(id) || FREE_TOMORROW[floor].includes(num)) continue
      bookings.push(book(id, TOMORROW, PARTIAL_TOMORROW[floor][num] ?? FULL))
    }
    // Дальние дни загружены слабее: занято около 40 % мест
    for (let i = 2; i <= 6; i++) {
      const date = addDays(TODAY, i)
      for (let num = 1; num <= 40; num++) {
        if ((num * 7 + i * 3 + (floor === -1 ? 0 : 5)) % 10 < 4) bookings.push(book(`${floor}:${num}`, date, FULL))
      }
    }
  }
  return { bookings, closures: CLOSED.map((c) => ({ ...c })) }
}

/** Сценарий «нет мест»: утро завтра выкуплено до 10:00 на всех свободных местах */
export function noSpotsWorld(): World {
  const w = baseWorld()
  for (const floor of [-1, -2] as Floor[]) {
    for (const num of FREE_TOMORROW[floor]) w.bookings.push(book(`${floor}:${num}`, TOMORROW, [480, 600]))
  }
  return w
}
