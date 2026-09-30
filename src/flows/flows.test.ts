import { describe, it, expect } from 'vitest'
import { FLOWS, VARIANT_ROWS, flowStates, flowStepState, variantState } from './flows'
import { autoStep, myBooking, type State } from '../state/store'
import { entryOpen } from '../domain/lifecycle'

const mine = (s: State) => s.world.bookings.filter((b) => b.mine && b.id !== 'last')
const flow = (id: string) => {
  const f = FLOWS.find((x) => x.id === id)
  if (!f) throw new Error(`нет сценария ${id}`)
  return f
}
const last = (id: string) => flowStates(flow(id)).at(-1)!

describe('сценарии', () => {
  it('жёсткая цепочка: у каждого шага, кроме последнего, ровно один переход', () => {
    for (const f of FLOWS) {
      f.steps.forEach((st, i) => expect(Boolean(st.go), `${f.id}, шаг ${i + 1}`).toBe(i < f.steps.length - 1))
    }
  })

  it('каждый переход меняет кадр', () => {
    for (const f of FLOWS) {
      const ss = flowStates(f)
      for (let i = 1; i < ss.length; i++) expect(ss[i], `${f.id}, шаг ${i + 1}`).not.toEqual(ss[i - 1])
    }
  })

  it('«сам» стоит только там, где прототип и правда идёт дальше без тапа', () => {
    for (const f of FLOWS) {
      const ss = flowStates(f)
      f.steps.forEach((st, i) => {
        if (st.go?.kind === 'auto') expect(autoStep(ss[i]), `${f.id}, шаг ${i + 1}`).not.toBeNull()
        if (st.go?.kind === 'tap') expect(autoStep(ss[i]), `${f.id}, шаг ${i + 1}`).toBeNull()
      })
    }
  })

  it('сценарии по заданию приходят туда, куда обещают', () => {
    expect(last('main')).toMatchObject({ screen: 'plan', overlay: null })
    expect(last('main').toast?.text).toBe('Место 17 за вами')
    expect(myBooking(last('main'))?.spotId).toBe('-1:17')
    expect(last('entry')).toMatchObject({ screen: 'ticket', overlay: 'route' })
    expect(mine(last('other'))).toEqual([expect.objectContaining({ spotId: '-1:29', date: '2026-10-01' })])
    expect(mine(last('conflict')).map((b) => b.spotId)).toEqual(['-1:18'])
    expect(mine(last('none'))).toEqual([expect.objectContaining({ range: expect.objectContaining({ start: 630 }) })])
    expect(last('error')).toMatchObject({ screen: 'plan', load: 'ready', selectedId: '-1:17' })
    const c = last('cancel')
    expect(c.screen).toBe('plan')
    expect(mine(c)).toHaveLength(0)
    expect(c.toast?.text).toMatch(/отменена/)
    expect(flowStates(flow('hint'))[1].hint?.text).toBe('Занято на это время — можно взять с 10:30')
    expect(last('hint').hint?.text).toMatch(/закрыто/)
    expect(last('second').hint?.text).toBe('Бронь может быть одна — ваша на месте 17')
  })

  it('въезд: вечером пропуск заперт, утром открыт, по тапу — экран пропуска', () => {
    const [evening, morning] = flowStates(flow('entry'))
    const b = myBooking(evening)!
    expect(entryOpen(b, evening.now)).toBe(false)
    expect(entryOpen(b, morning.now)).toBe(true)
  })

  it('дополнительные сценарии тоже доходят до конца', () => {
    expect(mine(last('failed'))).toHaveLength(1)
    expect(mine(last('last-taken')).map((b) => b.spotId)).toEqual(['-1:12'])
    expect(last('notify').toast?.text).toMatch(/Сообщим/)
    expect(last('barrier').toast?.text).toBe('Шлагбаум открывается')
    expect(last('menu').toast?.text).toBe('Добавлено в календарь')
    expect(last('host').screen).toBe('plan')
    expect(myBooking(last('host'))?.spotId).toBe('-1:17')
  })

  it('у тапа есть цель и подпись, у шага — кадр из скоупа', () => {
    for (const f of FLOWS) {
      for (const st of f.steps) {
        if (st.go?.kind === 'tap') {
          expect(st.go.target.sel).toBeTruthy()
          expect(st.go.label).toBeTruthy()
        }
        expect(st.frame, `${f.id}: ${st.title}`).toMatch(/^(\d(\.\d)?(-[бв])?|вход)$/)
      }
    }
  })

  it('ссылка на шаг открывает тот же кадр, что на доске', () => {
    for (const f of FLOWS) flowStates(f).forEach((s, i) => expect(flowStepState(f.id, i)).toEqual(s))
    expect(flowStepState('нет-такого', 0)).toBeNull()
    expect(flowStepState('main', 99)).toBeNull()
  })
})

describe('варианты без переходов', () => {
  it('пропуск — один экран, три способа въезда', () => {
    const row = VARIANT_ROWS.findIndex((r) => r.id === 'entry')
    const states = VARIANT_ROWS[row].items.map((_, i) => variantState(row, i)!)
    expect(states.map((s) => s.entry)).toEqual(['qr', 'plate', 'barrier'])
    expect(states.every((s) => s.screen === 'ticket' && myBooking(s))).toBe(true)
  })

  it('пробовали: всё о брони в шторке, без отдельного экрана', () => {
    const row = VARIANT_ROWS.findIndex((r) => r.id === 'tried')
    const states = VARIANT_ROWS[row].items.map((_, i) => variantState(row, i)!)
    expect(states.length).toBeGreaterThan(0)
    expect(states.every((s) => s.allInSheet && s.screen === 'plan')).toBe(true)
  })

  it('стадии брони — вечер накануне, въезд открыт, бронь идёт', () => {
    const row = VARIANT_ROWS.findIndex((r) => r.id === 'stages')
    const states = VARIANT_ROWS[row].items.map((_, i) => variantState(row, i)!)
    expect(states.map((s) => s.demoStage)).toEqual(['upcoming', 'open', 'active'])
  })
})
