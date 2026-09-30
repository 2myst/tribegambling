import { describe, it, expect } from 'vitest'
import { reducer, initialState, fromDemo, autoStep, myBooking, type Action, type State } from './store'

const run = (s: State, ...as: Action[]) => as.reduce(reducer, s)
const mine = (s: State) => s.world.bookings.filter((b) => b.mine && b.id !== 'last')

describe('вход в модуль', () => {
  it('модуль сразу открывается планом: завтра, время и место прошлой брони', () => {
    const s = initialState()
    expect(s.screen).toBe('plan')
    expect(s.date).toBe('2026-09-30')
    expect(s.range).toEqual({ start: 540, end: 1080 })
    expect(s.selectedId).toBe('-1:17')
    expect(s.reason).toBe('last')
    expect(s.sheet).toBe('suggested')
  })

  it('если бронь уже есть — модуль открывается планом с этой бронью, а не новой бронью', () => {
    const s = run(fromDemo('host-booked'), { type: 'OPEN_BOOKING' })
    expect(s.screen).toBe('plan')
    expect(myBooking(s)?.spotId).toBe('-1:17')
    expect(s.date).toBe('2026-09-30')
  })

  it('с бронью план открывается на этаже своего места', () => {
    let s = run(initialState(), { type: 'SET_FLOOR', floor: -2 }, { type: 'TAP_SPOT', spotId: '-2:4' }, { type: 'SUBMIT' }, { type: 'SUBMIT_RESOLVED' })
    s = run(s, { type: 'SET_FLOOR', floor: -1 }, { type: 'GO_HOST' }, { type: 'OPEN_BOOKING' })
    expect(s.floor).toBe(-2)
  })

  it('при ошибке загрузки показывает ошибку, повтор грузит заново', () => {
    let s = run(initialState(), { type: 'SET_SCENARIO', patch: { loadError: true } })
    expect(s.load).toBe('error')
    s = run(s, { type: 'RETRY_LOAD' })
    expect(s.load).toBe('loading')
    s = run(s, { type: 'LOAD_RESOLVED' })
    expect(s.load).toBe('ready')
    expect(s.selectedId).toBe('-1:17')
  })
})

describe('повтор в один тап', () => {
  it('бронирует прошлое место на то же время завтра, без плана', () => {
    let s = run(initialState(), { type: 'REPEAT_LAST' })
    expect(s.sheet).toBe('sending')
    s = run(s, { type: 'SUBMIT_RESOLVED' })
    expect(s.screen).toBe('plan')
    expect(mine(s)).toEqual([expect.objectContaining({ spotId: '-1:17', date: '2026-09-30', range: { start: 540, end: 1080 } })])
  })

  it('если прошлое место занято — бронирует ближайшее, которое карточка показала с честной меткой', () => {
    let s = run(initialState(), { type: 'SET_SCENARIO', patch: { lastTaken: true } }, { type: 'REPEAT_LAST' })
    expect(s.reason).toBe('lastTaken')
    expect(s.sheet).toBe('sending')
    expect(s.selectedId).not.toBe('-1:17')
    s = run(s, { type: 'SUBMIT_RESOLVED' })
    expect(mine(s)).toEqual([expect.objectContaining({ spotId: s.selectedId, date: '2026-09-30' })])
  })

  it('если мест нет — открывает модуль с шторкой «мест нет»', () => {
    const s = run(initialState(), { type: 'SET_SCENARIO', patch: { noSpots: true } }, { type: 'REPEAT_LAST' })
    expect(s.screen).toBe('plan')
    expect(s.sheet).toBe('none')
  })
})

describe('бронирование', () => {
  it('создаёт бронь: остаёмся на плане, место становится твоим, плашка успеха', () => {
    let s = run(initialState(), { type: 'OPEN_BOOKING' }, { type: 'SUBMIT' })
    expect(s.sheet).toBe('sending')
    s = run(s, { type: 'SUBMIT_RESOLVED' })
    expect(s.screen).toBe('plan')
    expect(myBooking(s)?.spotId).toBe('-1:17')
    expect(s.toast?.kind).toBe('success')
    expect(mine(s).map((b) => b.spotId)).toEqual(['-1:17'])
  })

  it('конфликт: бронь не создана, предложено соседнее, согласие бронирует его', () => {
    let s = run(initialState(), { type: 'SET_SCENARIO', patch: { conflict: true } }, { type: 'OPEN_BOOKING' }, { type: 'SUBMIT' }, { type: 'SUBMIT_RESOLVED' })
    expect(s.sheet).toBe('conflict')
    expect(s.conflict).toEqual({ takenId: '-1:17', altId: '-1:18' })
    expect(mine(s)).toHaveLength(0)
    s = run(s, { type: 'ACCEPT_ALT' })
    expect(s.selectedId).toBe('-1:18')
    expect(s.sheet).toBe('sending')
    s = run(s, { type: 'SUBMIT_RESOLVED' })
    expect(mine(s).map((b) => b.spotId)).toEqual(['-1:18'])
  })

  it('сбой отправки: сначала проверка, потом «не получилось», повтор без дубля', () => {
    let s = run(initialState(), { type: 'SET_SCENARIO', patch: { submitFail: true } }, { type: 'OPEN_BOOKING' }, { type: 'SUBMIT' }, { type: 'SUBMIT_RESOLVED' })
    expect(s.sheet).toBe('checking')
    s = run(s, { type: 'SUBMIT_RESOLVED' })
    expect(s.sheet).toBe('failed')
    expect(mine(s)).toHaveLength(0)
    s = run(s, { type: 'SUBMIT' }, { type: 'SUBMIT_RESOLVED' })
    expect(mine(s)).toHaveLength(1)
  })

  it('нет мест: шторка none, ничего не выбрано', () => {
    const s = run(initialState(), { type: 'SET_SCENARIO', patch: { noSpots: true } }, { type: 'OPEN_BOOKING' })
    expect(s.sheet).toBe('none')
    expect(s.selectedId).toBeNull()
  })
})

describe('план и время', () => {
  it('тап по закрытому — подсказка, выбор не меняется', () => {
    const s = run(initialState(), { type: 'OPEN_BOOKING' }, { type: 'TAP_SPOT', spotId: '-1:5' })
    expect(s.selectedId).toBe('-1:17')
    expect(s.hint?.text).toMatch(/закрыто до 5 окт/)
  })

  it('тап по занятому — подсказка, с какого времени свободно', () => {
    const s = run(initialState(), { type: 'OPEN_BOOKING' }, { type: 'TAP_SPOT', spotId: '-1:14' })
    expect(s.hint?.text).toBe('Занято на это время — можно взять с 13:30')
  })

  it('тап по свободному выбирает его', () => {
    const s = run(initialState(), { type: 'OPEN_BOOKING' }, { type: 'TAP_SPOT', spotId: '-1:3' })
    expect(s.selectedId).toBe('-1:3')
    expect(s.reason).toBe('manual')
  })

  it('новое время, на которое прошлое место занято, — подбирает другое', () => {
    const s = run(initialState(), { type: 'OPEN_BOOKING' }, { type: 'APPLY_TIME', date: '2026-10-03', range: { start: 540, end: 1080 } })
    expect(s.date).toBe('2026-10-03')
    expect(s.selectedId).not.toBe('-1:17')
    expect(s.reason).toBe('lastTaken')
  })

  it('время сегодня сдвигается на ближайшее возможное', () => {
    const s = run(initialState(), { type: 'OPEN_BOOKING' }, { type: 'APPLY_TIME', date: '2026-09-29', range: { start: 540, end: 1080 } })
    expect(s.range).toEqual({ start: 1260, end: 1320 })
  })
})

describe('плашки', () => {
  it('действие из меню брони показывает плашку и закрывает меню', () => {
    const s = run(fromDemo('booked'), { type: 'OPEN_MENU' }, { type: 'SHOW_TOAST', kind: 'success', text: 'Добавлено в календарь' })
    expect(s.toast?.text).toBe('Добавлено в календарь')
    expect(s.overlay).toBeNull()
  })
})

describe('назад', () => {
  it('сначала закрывает шторку поверх экрана', () => {
    const s = run(fromDemo('route'), { type: 'BACK' })
    expect(s.overlay).toBeNull()
    expect(s.screen).toBe('ticket')
  })

  it('с экрана пропуска возвращает на план', () => {
    expect(run(fromDemo('ticket'), { type: 'BACK' }).screen).toBe('plan')
  })

  it('с плана возвращает на главную приложения, откуда модуль открыли', () => {
    expect(run(fromDemo('plan'), { type: 'BACK' }).screen).toBe('host')
    const booked = run(fromDemo('booked'), { type: 'BACK' })
    expect(booked.screen).toBe('host')
    expect(myBooking(booked)?.spotId).toBe('-1:17')
  })

  it('на главной — ничего не делает', () => {
    expect(run(fromDemo('host'), { type: 'BACK' })).toEqual(fromDemo('host'))
  })
})

describe('отмена', () => {
  it('до начала — отменяет и возвращает на план с плашкой', () => {
    const s = run(fromDemo('booked'), { type: 'OPEN_CANCEL' }, { type: 'CONFIRM_CANCEL' })
    expect(s.screen).toBe('plan')
    expect(s.sheet).toBe('suggested')
    expect(mine(s)).toHaveLength(0)
    expect(s.toast?.text).toMatch(/отменена/)
  })

  it('когда бронь идёт — отменить нельзя', () => {
    const s = run(fromDemo('booked'), { type: 'SET_DEMO_STAGE', stage: 'active' }, { type: 'OPEN_CANCEL' })
    expect(s.overlay).toBeNull()
  })
})

describe('освободить место раньше', () => {
  it('до начала брони — нельзя, для этого есть отмена', () => {
    const s = run(fromDemo('booked'), { type: 'OPEN_RELEASE' })
    expect(s.overlay).toBeNull()
  })

  it('когда бронь идёт — бронь заканчивается сейчас, место свободно для коллег', () => {
    const s = run(fromDemo('booked'), { type: 'SET_DEMO_STAGE', stage: 'active' }, { type: 'OPEN_RELEASE' })
    expect(s.overlay).toBe('release')
    const after = run(s, { type: 'CONFIRM_RELEASE' })
    expect(after.screen).toBe('plan')
    expect(after.overlay).toBeNull()
    expect(myBooking(after)).toBeNull()
    expect(after.toast?.text).toMatch(/свободно до 18:00/)
    expect(after.date).toBe('2026-10-01')
    expect(after.selectedId).toBe('-1:17')
  })

  it('освободил, забронировал на завтра, «Бронь идёт» — демо берёт новую бронь, а не прошедшую', () => {
    const released = fromDemo('released')
    const rebooked = run(released, { type: 'SUBMIT' }, { type: 'SUBMIT_RESOLVED' })
    expect(myBooking(rebooked)?.date).toBe('2026-10-01')
    const active = run(rebooked, { type: 'SET_DEMO_STAGE', stage: 'active' }, { type: 'OPEN_RELEASE' })
    expect(active.overlay).toBe('release')
    const eve = run(active, { type: 'CLOSE_OVERLAY' }, { type: 'SET_DEMO_STAGE', stage: 'upcoming' })
    expect(myBooking(eve)?.date).toBe('2026-10-01')
  })
})

describe('шторка даты и времени', () => {
  it('открытие копирует дату и время в черновик', () => {
    const s = run(initialState(), { type: 'OPEN_TIME' })
    expect(s.draft).toEqual({ date: '2026-09-30', range: { start: 540, end: 1080 } })
  })

  it('выбор дня меняет только черновик, план ещё на старой дате', () => {
    const s = run(initialState(), { type: 'OPEN_TIME' }, { type: 'DRAFT_DATE', date: '2026-10-01' })
    expect(s.draft?.date).toBe('2026-10-01')
    expect(s.date).toBe('2026-09-30')
  })

  it('«сегодня» поздно вечером сдвигает время черновика на ближайшее возможное', () => {
    const s = run(initialState(), { type: 'OPEN_TIME' }, { type: 'DRAFT_DATE', date: '2026-09-29' })
    expect(s.draft?.range).toEqual({ start: 1260, end: 1320 })
  })

  it('шаг времени меняет черновик', () => {
    const s = run(initialState(), { type: 'OPEN_TIME' }, { type: 'DRAFT_RANGE', range: { start: 570, end: 1080 } })
    expect(s.draft?.range).toEqual({ start: 570, end: 1080 })
  })

  it('«Показать места» применяет и выбрасывает черновик, закрытие — просто выбрасывает', () => {
    const open = run(initialState(), { type: 'OPEN_TIME' }, { type: 'DRAFT_DATE', date: '2026-10-01' })
    const applied = run(open, { type: 'APPLY_TIME', date: '2026-10-01', range: { start: 540, end: 1080 } })
    expect(applied.date).toBe('2026-10-01')
    expect(applied.draft).toBeNull()
    const closed = run(open, { type: 'CLOSE_OVERLAY' })
    expect(closed.date).toBe('2026-09-30')
    expect(closed.draft).toBeNull()
  })
})

describe('переходы без тапа', () => {
  it('отправка, проверка и загрузка идут дальше сами — со своей задержкой', () => {
    expect(autoStep(fromDemo('sending'))).toEqual({ delay: 900, action: { type: 'SUBMIT_RESOLVED' } })
    expect(autoStep(fromDemo('checking'))).toEqual({ delay: 1400, action: { type: 'SUBMIT_RESOLVED' } })
    expect(autoStep(fromDemo('loading'))).toEqual({ delay: 1000, action: { type: 'LOAD_RESOLVED' } })
  })

  it('обычный кадр стоит и ждёт человека', () => {
    expect(autoStep(fromDemo('plan'))).toBeNull()
    expect(autoStep(fromDemo('ticket'))).toBeNull()
  })
})

describe('с бронью', () => {
  it('план — карта к своему месту: тап по другому месту напоминает, что бронь одна', () => {
    const s = run(fromDemo('booked'), { type: 'TAP_SPOT', spotId: '-1:25' })
    expect(s.hint?.text).toBe('Бронь может быть одна — ваша на месте 17')
    expect(myBooking(s)?.spotId).toBe('-1:17')
  })

  it('тап по своему месту ничего не меняет', () => {
    expect(run(fromDemo('booked'), { type: 'TAP_SPOT', spotId: '-1:17' })).toEqual(fromDemo('booked'))
  })

  it('строка времени не открывает выбор — бронь уже есть', () => {
    expect(run(fromDemo('booked'), { type: 'OPEN_TIME' }).overlay).toBeNull()
  })

  it('«въезд открыт» — утро дня брони, за 10 минут до начала', () => {
    expect(run(fromDemo('booked'), { type: 'SET_DEMO_STAGE', stage: 'open' }).now).toEqual(new Date(2026, 8, 30, 8, 50))
  })

  it('экран пропуска открывается, только когда въезд открыт', () => {
    expect(run(fromDemo('booked'), { type: 'OPEN_TICKET' }).screen).toBe('plan')
    expect(run(fromDemo('booked'), { type: 'SET_DEMO_STAGE', stage: 'open' }, { type: 'OPEN_TICKET' }).screen).toBe('ticket')
  })

  it('пропуск — отдельный экран для любого способа въезда: QR, номер, шлагбаум', () => {
    for (const entry of ['qr', 'plate', 'barrier'] as const) {
      const s = run(fromDemo('booked'), { type: 'SET_ENTRY', entry }, { type: 'SET_DEMO_STAGE', stage: 'open' }, { type: 'OPEN_TICKET' })
      expect(s.screen).toBe('ticket')
    }
  })

  it('если въезд снова закрылся — экран пропуска закрывается', () => {
    expect(run(fromDemo('ticket'), { type: 'SET_DEMO_STAGE', stage: 'upcoming' }).screen).toBe('plan')
  })

  it('вариант «всё в шторке» — только вид, логика та же', () => {
    const s = run(fromDemo('booked'), { type: 'SET_ALL_IN_SHEET', on: true })
    expect(s.allInSheet).toBe(true)
    expect(s.screen).toBe('plan')
  })
})
