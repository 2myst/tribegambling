import type { Minutes, TimeRange } from './types'
import { addDays, dateKey, parseKey } from './time'

const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']
const MON = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

export function fmtTime(m: Minutes): string {
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
}

export function fmtRange(r: TimeRange): string {
  return `${fmtTime(r.start)}–${fmtTime(r.end)}`
}

/** «Сегодня», «Завтра» или «Пт» */
export function dayLabel(date: string, now: Date): string {
  const today = dateKey(now)
  if (date === today) return 'Сегодня'
  if (date === addDays(today, 1)) return 'Завтра'
  return cap(WD[parseKey(date).getDay()])
}

/** «30 сен» */
export function dayNum(date: string): string {
  const d = parseKey(date)
  return `${d.getDate()} ${MON[d.getMonth()]}`
}

/** «Завтра, ср 30 сен» или «Чт, 1 окт» */
export function fmtDayLong(date: string, now: Date): string {
  const d = parseKey(date)
  const rel = dayLabel(date, now)
  const wd = WD[d.getDay()]
  if (rel === 'Сегодня' || rel === 'Завтра') return `${rel}, ${wd} ${dayNum(date)}`
  return `${cap(wd)}, ${dayNum(date)}`
}

/** «завтра» / «сегодня» / «в четверг» — для подписей в тексте */
const WD_ACC = ['в воскресенье', 'в понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу']
export function dayInText(date: string, now: Date): string {
  const rel = dayLabel(date, now)
  if (rel === 'Сегодня' || rel === 'Завтра') return rel.toLowerCase()
  return WD_ACC[parseKey(date).getDay()]
}

export function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return forms[2]
  if (b > 1 && b < 5) return forms[1]
  if (b === 1) return forms[0]
  return forms[2]
}

export const spotsWord = (n: number) => plural(n, ['место', 'места', 'мест'])
