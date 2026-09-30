export type Floor = -1 | -2
/** Минуты от начала суток */
export type Minutes = number
/** Полуинтервал [start, end) */
export interface TimeRange {
  start: Minutes
  end: Minutes
}
export interface Spot {
  id: string // «-1:17»
  floor: Floor
  num: number
  col: 0 | 1 | 2 | 3
  row: number
}
export interface Booking {
  id: string
  spotId: string
  date: string // YYYY-MM-DD
  range: TimeRange
  mine?: boolean
}
export interface Closure {
  spotId: string
  until: string // YYYY-MM-DD включительно
}
export type SpotState = 'free' | 'occupied' | 'closed'
export interface World {
  bookings: Booking[]
  closures: Closure[]
}
