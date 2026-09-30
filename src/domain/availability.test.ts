import { describe, it, expect } from 'vitest'
import { spotState, freeCount, hourlyFree, autoPick, nearestFree, suggestAlternatives, bookableFrom } from './availability'
import { spotById } from './layout'
import { baseWorld, noSpotsWorld, DEMO_NOW, TOMORROW } from './data'

const DAY = { start: 540, end: 1080 }

describe('availability', () => {
  it('на завтра 9–18: на −1 этаже 11 свободных, на −2 — 3', () => {
    const w = baseWorld()
    expect(freeCount(-1, TOMORROW, DAY, w)).toBe(11)
    expect(freeCount(-2, TOMORROW, DAY, w)).toBe(3)
  })

  it('закрытое место закрыто в любое время', () => {
    expect(spotState(spotById('-1:5'), TOMORROW, { start: 1200, end: 1260 }, baseWorld())).toBe('closed')
  })

  it('занятое утром место свободно, если начать позже', () => {
    const w = baseWorld()
    expect(spotState(spotById('-1:2'), TOMORROW, DAY, w)).toBe('occupied')
    expect(spotState(spotById('-1:2'), TOMORROW, { start: 630, end: 1080 }, w)).toBe('free')
  })

  it('брони одного места не встык: после чужой брони место занято ещё 15 минут — на ранний въезд', () => {
    // −1:2 занято 8:00–10:00
    expect(spotState(spotById('-1:2'), TOMORROW, { start: 600, end: 1080 }, baseWorld())).toBe('occupied')
  })

  it('и перед чужой бронью — тоже 15 минут: её хозяин въезжает раньше', () => {
    // −1:26 занято 14:00–19:00
    const w = baseWorld()
    expect(spotState(spotById('-1:26'), TOMORROW, { start: 540, end: 840 }, w)).toBe('occupied')
    expect(spotState(spotById('-1:26'), TOMORROW, { start: 540, end: 810 }, w)).toBe('free')
  })

  it('подсказка по занятому: с какого времени место можно взять — с учётом зазора и шага 30 минут', () => {
    // −1:14 занято 9:00–13:00 → 13:15 → по шагу 13:30
    expect(bookableFrom(spotById('-1:14'), TOMORROW, DAY, baseWorld())).toBe(13 * 60 + 30)
  })

  it('автоподбор берёт прошлое место, если оно свободно', () => {
    const p = autoPick(TOMORROW, DAY, '-1:17', baseWorld())
    expect(p?.reason).toBe('last')
    expect(p?.spot.id).toBe('-1:17')
  })

  it('если прошлое занято — ближайшее к выходу, причина lastTaken', () => {
    const w = baseWorld()
    w.bookings.push({ id: 'x', spotId: '-1:17', date: TOMORROW, range: DAY })
    const p = autoPick(TOMORROW, DAY, '-1:17', w)
    expect(p?.reason).toBe('lastTaken')
    expect(p?.spot.id).toBe('-1:12')
  })

  it('без истории — ближайшее к выходу, причина nearExit', () => {
    expect(autoPick(TOMORROW, DAY, null, baseWorld())?.reason).toBe('nearExit')
  })

  it('для конфликта — соседнее свободное на том же этаже', () => {
    expect(nearestFree(spotById('-1:17'), TOMORROW, DAY, baseWorld())?.id).toBe('-1:18')
  })

  it('мест нет: предлагает начать позже и другой день', () => {
    const w = noSpotsWorld()
    expect(freeCount('all', TOMORROW, DAY, w)).toBe(0)
    const a = suggestAlternatives(TOMORROW, DAY, DEMO_NOW, w)
    expect(a.later?.range).toEqual({ start: 630, end: 1080 })
    expect(a.later?.count).toBe(19)
    expect(a.day?.date).toBe('2026-10-01')
    expect(a.day?.count).toBeGreaterThan(0)
  })

  it('столбики — 15 часов, с 7 до 21', () => {
    const h = hourlyFree('all', TOMORROW, baseWorld())
    expect(h).toHaveLength(15)
    expect(h[2]).toBeLessThan(h[10]) // в 9 утра свободных меньше, чем в 17
  })
})

describe('демо-данные', () => {
  it('мир собирается одинаково при каждом создании — кадр по ссылке совпадает с кадром на доске', () => {
    expect(baseWorld()).toEqual(baseWorld())
    expect(noSpotsWorld()).toEqual(noSpotsWorld())
  })

  it('у каждой брони свой номер', () => {
    const ids = noSpotsWorld().bookings.map((b) => b.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
