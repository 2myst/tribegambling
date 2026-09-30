import { useLayoutEffect, useRef, useState } from 'react'
import type { Booking } from '../domain/types'
import { addDays, dateKey, parseKey } from '../domain/time'
import { dayLabel, dayNum, fmtTime } from '../domain/format'
import { spotById } from '../domain/layout'

/** Размер элемента в CSS-пикселях (без учёта масштаба рамки) */
export function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setSize({ w: el.clientWidth, h: el.clientHeight })
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

/** Для строки времени: «Завтра» / «Сегодня» / «Чт 1 окт» */
export function pillDay(date: string, now: Date): string {
  const rel = dayLabel(date, now)
  if (rel === 'Сегодня' || rel === 'Завтра') return rel
  return `${rel} ${dayNum(date)}`
}

/** «на завтра» / «на сегодня» / «на чт 1 окт» */
export function onDay(date: string, now: Date): string {
  const today = dateKey(now)
  if (date === today) return 'на сегодня'
  if (date === addDays(today, 1)) return 'на завтра'
  return `на ${WD[parseKey(date).getDay()]} ${dayNum(date)}`
}

/** «ср 30 сен» */
export function dayShort(date: string): string {
  return `${WD[parseKey(date).getDay()]} ${dayNum(date)}`
}

export const floorLabel = (f: number) => `${f === -1 ? '−1' : '−2'} этаж`

/** «12 ч 30 мин» */
export function fmtDuration(ms: number): string {
  const m = Math.max(0, Math.round(ms / 60000))
  const h = Math.floor(m / 60)
  const mm = m % 60
  if (h === 0) return `${mm} мин`
  return mm ? `${h} ч ${mm} мин` : `${h} ч`
}

/** Где место относительно водителя: сторона, порядковый номер и проезд */
export function routeFor(b: Booking) {
  const s = spotById(b.spotId)
  const firstLane = s.col >= 2
  const n = firstLane ? 10 - s.row : s.row + 1
  const side: 'справа' | 'слева' = s.col === 3 || s.col === 0 ? 'справа' : 'слева'
  // На превью цель стоит на средней дистанции, чтобы номер читался; порядковый номер — в тексте шагов
  return { spot: s, firstLane, n, side, povSide: (side === 'справа' ? 1 : -1) as 1 | -1, povDepth: Math.min(n - 1, 2), start: fmtTime(b.range.start) }
}
