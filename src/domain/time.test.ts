import { describe, it, expect } from 'vitest'
import { overlaps, clampRange, earliestStart, bookableDays, isDayBookable } from './time'
import { fmtRange, fmtDayLong, dayLabel, plural } from './format'

const NOW = new Date(2026, 8, 29, 20, 30) // вторник, 29 сентября 2026, 20:30

describe('time', () => {
  it('полуинтервалы, которые только касаются, не пересекаются', () => {
    expect(overlaps({ start: 540, end: 600 }, { start: 600, end: 660 })).toBe(false)
    expect(overlaps({ start: 540, end: 610 }, { start: 600, end: 660 })).toBe(true)
  })

  it('сегодня начать можно не раньше следующего получаса', () => {
    expect(earliestStart('2026-09-29', NOW)).toBe(21 * 60)
    expect(earliestStart('2026-09-30', NOW)).toBe(7 * 60)
  })

  it('clampRange держит минимум час', () => {
    expect(clampRange('2026-09-30', { start: 540, end: 570 }, NOW)).toEqual({ start: 540, end: 600 })
  })

  it('clampRange сдвигает прошедшее время сегодня и держит окно дня', () => {
    expect(clampRange('2026-09-29', { start: 540, end: 1080 }, NOW)).toEqual({ start: 1260, end: 1320 })
  })

  it('можно бронировать 7 дней, начиная с сегодня', () => {
    const d = bookableDays(NOW)
    expect(d).toHaveLength(7)
    expect(d[0]).toBe('2026-09-29')
    expect(d[6]).toBe('2026-10-05')
  })

  it('сегодня после 21:00 бронировать уже нельзя', () => {
    expect(isDayBookable('2026-09-29', NOW)).toBe(true)
    expect(isDayBookable('2026-09-29', new Date(2026, 8, 29, 21, 1))).toBe(false)
  })
})

describe('format', () => {
  it('время и день', () => {
    expect(fmtRange({ start: 540, end: 1080 })).toBe('9:00–18:00')
    expect(fmtDayLong('2026-09-30', NOW)).toBe('Завтра, ср 30 сен')
    expect(fmtDayLong('2026-10-01', NOW)).toBe('Чт, 1 окт')
    expect(dayLabel('2026-09-29', NOW)).toBe('Сегодня')
    expect(dayLabel('2026-10-02', NOW)).toBe('Пт')
  })

  it('склонение «место»', () => {
    expect(plural(1, ['место', 'места', 'мест'])).toBe('место')
    expect(plural(3, ['место', 'места', 'мест'])).toBe('места')
    expect(plural(11, ['место', 'места', 'мест'])).toBe('мест')
    expect(plural(23, ['место', 'места', 'мест'])).toBe('места')
  })
})
