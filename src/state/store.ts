import type { Booking, Floor, TimeRange, World } from '../domain/types'
import { autoPick, bookableFrom, closedUntil, nearestFree, spotState, type PickReason } from '../domain/availability'
import { spotById } from '../domain/layout'
import { addDays, clampRange, dateKey } from '../domain/time'
import { dayNum, fmtTime } from '../domain/format'
import { activeBooking, bookingStart, canCancel, entryOpen, canRelease } from '../domain/lifecycle'
import { baseWorld, DEMO_NOW, LAST_BOOKING, noSpotsWorld, TOMORROW } from '../domain/data'

/**
 * plan — корень модуля: и выбор места, и своя бронь (место зелёное, короткая шторка про бронь);
 * ticket — пропуск у ворот: QR, номер или шлагбаум, маршрут, отмена — один тап из шторки;
 * host — приложение БЦ вокруг модуля (один кадр «как встраивается»)
 */
export type Screen = 'host' | 'plan' | 'ticket'
/** Демо-время: вечер накануне, утро за 10 минут до начала (въезд открыт), бронь идёт */
export type DemoStage = 'upcoming' | 'open' | 'active'
export type Overlay = null | 'time' | 'cancel' | 'release' | 'route' | 'menu'
export type SheetMode = 'suggested' | 'sending' | 'checking' | 'failed' | 'conflict' | 'none'
export type Load = 'ready' | 'loading' | 'error'
export type Entry = 'qr' | 'plate' | 'barrier'
export type Reason = PickReason | 'manual'
export interface Scenario {
  conflict: boolean
  noSpots: boolean
  loadError: boolean
  submitFail: boolean
  lastTaken: boolean
}
export interface Toast { id: number; kind: 'success' | 'error' | 'info'; text: string }
export interface Hint { id: number; spotId: string; text: string }

export type FloorsAt = 'top' | 'bottom-left' | 'bottom-center'

export interface State {
  now: Date
  world: World
  screen: Screen
  overlay: Overlay
  date: string
  range: TimeRange
  /** Черновик шторки «Дата и время»: применяется только по «Показать места» */
  draft: { date: string; range: TimeRange } | null
  floor: Floor
  selectedId: string | null
  reason: Reason
  lastSpotId: string | null
  sheet: SheetMode
  conflict: { takenId: string; altId: string | null } | null
  load: Load
  hint: Hint | null
  toast: Toast | null
  entry: Entry
  scenario: Scenario
  demoStage: DemoStage
  /** Пробовали: всё о брони в шторке над планом, без отдельного экрана. Только вид — для сравнения */
  allInSheet: boolean
  /** Проба: места на плане наискосок */
  slant: boolean
  /** Проба: где переключатель этажей — сверху на всю ширину или маленький внизу карты */
  floorsAt: FloorsAt
  seq: number
}

export type Action =
  | { type: 'OPEN_BOOKING' }
  | { type: 'REPEAT_LAST' }
  | { type: 'SET_FLOOR'; floor: Floor }
  | { type: 'TAP_SPOT'; spotId: string }
  | { type: 'OPEN_TIME' }
  | { type: 'DRAFT_DATE'; date: string }
  | { type: 'DRAFT_RANGE'; range: TimeRange }
  | { type: 'APPLY_TIME'; date: string; range: TimeRange }
  | { type: 'CLOSE_OVERLAY' }
  | { type: 'SUBMIT' }
  | { type: 'SUBMIT_RESOLVED' }
  | { type: 'ACCEPT_ALT' }
  | { type: 'PICK_ON_PLAN' }
  | { type: 'RETRY_LOAD' }
  | { type: 'LOAD_RESOLVED' }
  | { type: 'OPEN_TICKET' }
  | { type: 'CLOSE_TICKET' }
  | { type: 'SET_ALL_IN_SHEET'; on: boolean }
  | { type: 'SET_SLANT'; on: boolean }
  | { type: 'SET_FLOORS_AT'; at: FloorsAt }
  | { type: 'OPEN_CANCEL' }
  | { type: 'CONFIRM_CANCEL' }
  | { type: 'OPEN_RELEASE' }
  | { type: 'CONFIRM_RELEASE' }
  | { type: 'OPEN_ROUTE' }
  | { type: 'OPEN_MENU' }
  | { type: 'GO_HOST' }
  | { type: 'BACK' }
  | { type: 'NOTIFY_ME' }
  | { type: 'SHOW_TOAST'; kind: Toast['kind']; text: string }
  | { type: 'DISMISS_TOAST'; id: number }
  | { type: 'DISMISS_HINT'; id: number }
  | { type: 'SET_SCENARIO'; patch: Partial<Scenario> }
  | { type: 'SET_ENTRY'; entry: Entry }
  | { type: 'SET_DEMO_STAGE'; stage: DemoStage }
  | { type: 'RESET' }

const NO_SCENARIO: Scenario = { conflict: false, noSpots: false, loadError: false, submitFail: false, lastTaken: false }

/** Состояние до входа в модуль — экран приложения БЦ */
export function hostState(): State {
  return {
    now: DEMO_NOW,
    world: baseWorld(),
    screen: 'host',
    overlay: null,
    date: TOMORROW,
    range: LAST_BOOKING.range,
    draft: null,
    floor: -1,
    selectedId: null,
    reason: 'last',
    lastSpotId: LAST_BOOKING.spotId,
    sheet: 'suggested',
    conflict: null,
    load: 'ready',
    hint: null,
    toast: null,
    entry: 'qr',
    scenario: { ...NO_SCENARIO },
    demoStage: 'upcoming',
    allInSheet: false,
    slant: false,
    floorsAt: 'bottom-center',
    seq: 0,
  }
}

/** Прототип стартует сразу в модуле: нет брони — план с подобранным местом, есть — бронь */
export function initialState(): State {
  return reducer(hostState(), { type: 'OPEN_BOOKING' })
}

const toast = (s: State, kind: Toast['kind'], text: string): Partial<State> => ({ toast: { id: s.seq + 1, kind, text }, seq: s.seq + 1 })

/** Подобрать место под текущие дату и время: прошлое или ближе к выходу */
function pick(s: State): State {
  const p = autoPick(s.date, s.range, s.lastSpotId, s.world)
  if (!p) return { ...s, selectedId: null, sheet: 'none', conflict: null }
  return { ...s, selectedId: p.spot.id, reason: p.reason, floor: p.spot.floor, sheet: 'suggested', conflict: null }
}

/** Мир для сценария: «нет мест» и «прошлое место занято» меняют занятость на завтра */
function worldFor(sc: Scenario, keepMine: Booking[]): World {
  const w = sc.noSpots ? noSpotsWorld() : baseWorld()
  if (sc.lastTaken) w.bookings.push({ id: 'taken-last', spotId: LAST_BOOKING.spotId, date: TOMORROW, range: { start: 510, end: 1110 } })
  w.bookings.push(...keepMine)
  return w
}

const myBookings = (w: World) => w.bookings.filter((b) => b.mine && b.id !== LAST_BOOKING.id)

/** Своя бронь, которая ещё не закончилась. Пока она есть, план — карта к своему месту, а не выбор */
export function myBooking(s: State): Booking | null {
  return activeBooking(myBookings(s.world), s.now)
}

/** Модуль с бронью: план на этаже своего места, строка времени показывает время брони */
function toMine(s: State, b: Booking): State {
  return { ...s, screen: 'plan', overlay: null, draft: null, hint: null, floor: spotById(b.spotId).floor, date: b.date, range: b.range, selectedId: b.spotId }
}

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'OPEN_BOOKING': {
      const mine = myBooking(s)
      if (mine) return toMine(s, mine)
      const base: State = { ...s, screen: 'plan', overlay: null, date: addDays(dateKey(s.now), 1), range: clampRange(addDays(dateKey(s.now), 1), LAST_BOOKING.range, s.now), hint: null }
      if (s.scenario.loadError) return { ...base, load: 'error', selectedId: null }
      return pick({ ...base, load: 'ready' })
    }
    case 'REPEAT_LAST': {
      const mine = myBooking(s)
      if (mine) return toMine(s, mine)
      const date = addDays(dateKey(s.now), 1)
      const range = clampRange(date, LAST_BOOKING.range, s.now)
      // Карточка на главной показывает подобранное место с меткой — его и бронируем. Мест нет — открываем модуль
      const p = autoPick(date, range, s.lastSpotId, s.world)
      if (!p) return reducer(s, { type: 'OPEN_BOOKING' })
      return { ...s, date, range, selectedId: p.spot.id, reason: p.reason, floor: p.spot.floor, sheet: 'sending', conflict: null }
    }
    case 'SET_FLOOR':
      return { ...s, floor: a.floor }
    case 'TAP_SPOT': {
      const spot = spotById(a.spotId)
      const mine = myBooking(s)
      if (mine) {
        if (mine.spotId === spot.id) return s
        return { ...s, hint: { id: s.seq + 1, spotId: spot.id, text: `Бронь может быть одна — ваша на месте ${spotById(mine.spotId).num}` }, seq: s.seq + 1 }
      }
      if (s.sheet === 'sending' || s.sheet === 'checking') return s
      const st = spotState(spot, s.date, s.range, s.world)
      if (st === 'free') return { ...s, selectedId: spot.id, reason: 'manual', floor: spot.floor, sheet: 'suggested', conflict: null, hint: null }
      let text: string
      if (s.conflict?.takenId === spot.id) text = 'Это место только что заняли'
      else if (st === 'closed') text = `Место закрыто до ${dayNum(closedUntil(spot, s.world) ?? s.date)}`
      else {
        const from = bookableFrom(spot, s.date, s.range, s.world)
        text = from < s.range.end ? `Занято на это время — можно взять с ${fmtTime(from)}` : 'Занято на всё выбранное время'
      }
      return { ...s, hint: { id: s.seq + 1, spotId: spot.id, text }, seq: s.seq + 1 }
    }
    case 'OPEN_TIME':
      if (myBooking(s)) return s
      return { ...s, overlay: 'time', hint: null, draft: { date: s.date, range: s.range } }
    case 'DRAFT_DATE':
      if (!s.draft) return s
      return { ...s, draft: { date: a.date, range: clampRange(a.date, s.draft.range, s.now) } }
    case 'DRAFT_RANGE':
      if (!s.draft) return s
      return { ...s, draft: { ...s.draft, range: a.range } }
    case 'APPLY_TIME': {
      const range = clampRange(a.date, a.range, s.now)
      const next: State = { ...s, date: a.date, range, draft: null, overlay: null, conflict: null, hint: null }
      const sel = next.selectedId ? spotById(next.selectedId) : null
      if (sel && spotState(sel, next.date, range, next.world) === 'free') return { ...next, sheet: 'suggested' }
      return pick(next)
    }
    case 'CLOSE_OVERLAY':
      return { ...s, overlay: null, draft: null }
    case 'SUBMIT':
      if (!s.selectedId || s.sheet === 'sending' || s.sheet === 'checking') return s
      return { ...s, sheet: 'sending', hint: null }
    case 'SUBMIT_RESOLVED': {
      if (!s.selectedId) return s
      if (s.sheet === 'checking') return { ...s, sheet: 'failed', scenario: { ...s.scenario, submitFail: false } }
      if (s.sheet !== 'sending') return s
      if (s.scenario.conflict) {
        const taken: Booking = { id: `taken-${s.seq + 1}`, spotId: s.selectedId, date: s.date, range: s.range }
        const world = { ...s.world, bookings: [...s.world.bookings, taken] }
        const alt = nearestFree(spotById(s.selectedId), s.date, s.range, world)
        if (!alt) return { ...s, world, seq: s.seq + 1, screen: 'plan', selectedId: null, sheet: 'none', scenario: { ...s.scenario, conflict: false } }
        return { ...s, world, seq: s.seq + 1, screen: 'plan', sheet: 'conflict', conflict: { takenId: s.selectedId, altId: alt.id }, scenario: { ...s.scenario, conflict: false } }
      }
      if (s.scenario.submitFail) return { ...s, screen: 'plan', sheet: 'checking' }
      const mine: Booking = { id: `mine-${s.seq + 1}`, spotId: s.selectedId, date: s.date, range: s.range, mine: true }
      const spot = spotById(s.selectedId)
      return {
        ...s,
        world: { ...s.world, bookings: [...s.world.bookings, mine] },
        seq: s.seq + 1,
        screen: 'plan',
        overlay: null,
        sheet: 'suggested',
        conflict: null,
        hint: null,
        lastSpotId: s.selectedId,
        ...toast({ ...s, seq: s.seq + 1 }, 'success', `Место ${spot.num} за вами`),
      }
    }
    case 'ACCEPT_ALT':
      if (!s.conflict?.altId) return s
      return { ...s, selectedId: s.conflict.altId, reason: 'manual', floor: spotById(s.conflict.altId).floor, conflict: null, sheet: 'sending' }
    case 'PICK_ON_PLAN':
      if (!s.conflict) return s
      return { ...s, selectedId: s.conflict.altId, reason: 'manual', conflict: null, sheet: s.conflict.altId ? 'suggested' : 'none' }
    case 'RETRY_LOAD':
      return { ...s, load: 'loading', scenario: { ...s.scenario, loadError: false } }
    case 'LOAD_RESOLVED':
      return pick({ ...s, load: 'ready' })
    case 'OPEN_TICKET': {
      const mine = myBooking(s)
      if (!mine || !entryOpen(mine, s.now)) return s
      return { ...s, screen: 'ticket', overlay: null, hint: null }
    }
    case 'CLOSE_TICKET':
      return s.screen === 'ticket' ? { ...s, screen: 'plan', overlay: null } : s
    case 'SET_ALL_IN_SHEET':
      return { ...s, allInSheet: a.on }
    case 'SET_SLANT':
      return { ...s, slant: a.on }
    case 'SET_FLOORS_AT':
      return { ...s, floorsAt: a.at }
    case 'OPEN_CANCEL': {
      const b = myBooking(s)
      if (!b || !canCancel(b, s.now)) return s
      return { ...s, overlay: 'cancel' }
    }
    case 'CONFIRM_CANCEL': {
      const b = myBooking(s)
      if (!b || !canCancel(b, s.now)) return { ...s, overlay: null }
      const world = { ...s.world, bookings: s.world.bookings.filter((x) => x.id !== b.id) }
      return pick({ ...s, world, screen: 'plan', overlay: null, load: 'ready', ...toast(s, 'info', 'Бронь отменена, место свободно для коллег') })
    }
    case 'OPEN_RELEASE': {
      const b = myBooking(s)
      if (!b || !canRelease(b, s.now)) return s
      return { ...s, overlay: 'release' }
    }
    case 'CONFIRM_RELEASE': {
      const b = myBooking(s)
      if (!b || !canRelease(b, s.now)) return { ...s, overlay: null }
      // Бронь заканчивается сейчас: остаток дня место свободно для других
      const nowMin = s.now.getHours() * 60 + s.now.getMinutes()
      const world = { ...s.world, bookings: s.world.bookings.map((x) => (x.id === b.id ? { ...x, range: { ...x.range, end: nowMin } } : x)) }
      // Человек уехал — сегодня ему место уже не нужно: план сразу на завтра, то же время, что было
      const tomorrow = addDays(dateKey(s.now), 1)
      return pick({ ...s, world, screen: 'plan', overlay: null, load: 'ready', date: tomorrow, range: clampRange(tomorrow, b.range, s.now), floor: spotById(b.spotId).floor, hint: null, ...toast(s, 'success', `Место свободно до ${fmtTime(b.range.end)} — его увидят коллеги`) })
    }
    case 'OPEN_ROUTE':
      return { ...s, overlay: 'route' }
    case 'OPEN_MENU':
      return { ...s, overlay: 'menu' }
    case 'GO_HOST':
      return { ...s, screen: 'host', overlay: null, hint: null }
    case 'BACK':
      // Сначала шторка, потом пропуск, потом с плана — на главную приложения БЦ, откуда модуль открыли
      if (s.overlay) return { ...s, overlay: null, draft: null }
      if (s.screen === 'ticket') return { ...s, screen: 'plan' }
      if (s.screen === 'plan') return { ...s, screen: 'host', hint: null }
      return s
    case 'NOTIFY_ME':
      return { ...s, ...toast(s, 'info', 'Сообщим, как только место освободится') }
    case 'SHOW_TOAST':
      return { ...s, overlay: null, ...toast(s, a.kind, a.text) }
    case 'DISMISS_TOAST':
      return s.toast?.id === a.id ? { ...s, toast: null } : s
    case 'DISMISS_HINT':
      return s.hint?.id === a.id ? { ...s, hint: null } : s
    case 'SET_SCENARIO': {
      const scenario = { ...s.scenario, ...a.patch }
      let next: State = { ...s, scenario }
      if ('noSpots' in a.patch || 'lastTaken' in a.patch) next = { ...next, world: worldFor(scenario, myBookings(s.world)) }
      if (next.screen === 'plan') {
        if (scenario.loadError) return { ...next, load: 'error', selectedId: null }
        return pick({ ...next, load: 'ready' })
      }
      return next
    }
    case 'SET_ENTRY':
      return { ...s, entry: a.entry }
    case 'SET_DEMO_STAGE': {
      const b = myBooking(s)
      const start = b ? bookingStart(b).getTime() : 0
      // «Вечер накануне» — 20:30 дня перед бронью: так время демо не уезжает назад за другие, уже прошедшие брони
      const eve = b ? start - b.range.start * 60_000 - 210 * 60_000 : 0
      const now = !b ? DEMO_NOW : a.stage === 'upcoming' ? new Date(eve) : new Date(start + (a.stage === 'open' ? -10 : 75) * 60_000)
      const next: State = { ...s, demoStage: a.stage, now, overlay: null, hint: null }
      const mine = myBooking(next)
      if (next.screen === 'ticket' && !(mine && entryOpen(mine, now))) return { ...next, screen: 'plan' }
      return next
    }
    case 'RESET':
      return initialState()
  }
}

/** Что прототип делает сам, без тапа: ответ сервера на бронь, проверка брони, загрузка мест */
export function autoStep(s: State): { delay: number; action: Action } | null {
  if (s.sheet === 'sending') return { delay: 900, action: { type: 'SUBMIT_RESOLVED' } }
  if (s.sheet === 'checking') return { delay: 1400, action: { type: 'SUBMIT_RESOLVED' } }
  if (s.load === 'loading') return { delay: 1000, action: { type: 'LOAD_RESOLVED' } }
  return null
}

/** Кадры для галереи и прямых ссылок ?demo=<кадр> */
export const DEMO_FRAMES = [
  'plan', 'time', 'conflict', 'none', 'error', 'loading', 'sending', 'checking', 'failed', 'last-taken', 'hint',
  'created', 'booked', 'booked-open', 'booked-active', 'second', 'ticket', 'ticket-plate', 'ticket-barrier', 'ticket-active',
  'route', 'cancel', 'cancelled', 'release', 'released', 'alt-sheet', 'alt-sheet-plate', 'slant', 'floors-left', 'floors-center', 'floors-left-booked', 'host', 'host-booked',
] as const
export type DemoFrame = (typeof DEMO_FRAMES)[number]

export function fromDemo(name: string): State {
  const s0 = hostState()
  const run = (s: State, ...as: Action[]) => as.reduce(reducer, s)
  const plan = run(s0, { type: 'OPEN_BOOKING' })
  const booked = { ...run(plan, { type: 'SUBMIT' }, { type: 'SUBMIT_RESOLVED' }), toast: null }
  switch (name as DemoFrame) {
    case 'host': return s0
    case 'plan': return plan
    case 'time': return run(plan, { type: 'OPEN_TIME' })
    case 'conflict': return run(s0, { type: 'SET_SCENARIO', patch: { conflict: true } }, { type: 'OPEN_BOOKING' }, { type: 'SUBMIT' }, { type: 'SUBMIT_RESOLVED' })
    case 'none': return run(s0, { type: 'SET_SCENARIO', patch: { noSpots: true } }, { type: 'OPEN_BOOKING' })
    case 'error': return run(s0, { type: 'SET_SCENARIO', patch: { loadError: true } }, { type: 'OPEN_BOOKING' })
    case 'loading': return run(s0, { type: 'SET_SCENARIO', patch: { loadError: true } }, { type: 'OPEN_BOOKING' }, { type: 'RETRY_LOAD' })
    case 'sending': return run(plan, { type: 'SUBMIT' })
    case 'checking': return run(s0, { type: 'SET_SCENARIO', patch: { submitFail: true } }, { type: 'OPEN_BOOKING' }, { type: 'SUBMIT' }, { type: 'SUBMIT_RESOLVED' })
    case 'failed': return run(s0, { type: 'SET_SCENARIO', patch: { submitFail: true } }, { type: 'OPEN_BOOKING' }, { type: 'SUBMIT' }, { type: 'SUBMIT_RESOLVED' }, { type: 'SUBMIT_RESOLVED' })
    case 'last-taken': return run(s0, { type: 'SET_SCENARIO', patch: { lastTaken: true } }, { type: 'OPEN_BOOKING' })
    case 'hint': return run(plan, { type: 'TAP_SPOT', spotId: '-1:14' })
    case 'created': return run(plan, { type: 'SUBMIT' }, { type: 'SUBMIT_RESOLVED' })
    case 'booked': return booked
    case 'booked-open': return run(booked, { type: 'SET_DEMO_STAGE', stage: 'open' })
    case 'booked-active': return run(booked, { type: 'SET_DEMO_STAGE', stage: 'active' })
    case 'second': return run(booked, { type: 'TAP_SPOT', spotId: '-1:29' })
    case 'ticket': return run(booked, { type: 'SET_DEMO_STAGE', stage: 'open' }, { type: 'OPEN_TICKET' })
    case 'ticket-plate': return run(booked, { type: 'SET_ENTRY', entry: 'plate' }, { type: 'SET_DEMO_STAGE', stage: 'open' }, { type: 'OPEN_TICKET' })
    case 'ticket-barrier': return run(booked, { type: 'SET_ENTRY', entry: 'barrier' }, { type: 'SET_DEMO_STAGE', stage: 'open' }, { type: 'OPEN_TICKET' })
    case 'ticket-active': return run(booked, { type: 'SET_DEMO_STAGE', stage: 'active' }, { type: 'OPEN_TICKET' })
    case 'route': return run(booked, { type: 'SET_DEMO_STAGE', stage: 'open' }, { type: 'OPEN_TICKET' }, { type: 'OPEN_ROUTE' })
    case 'cancel': return run(booked, { type: 'OPEN_CANCEL' })
    case 'release': return run(booked, { type: 'SET_DEMO_STAGE', stage: 'active' }, { type: 'OPEN_RELEASE' })
    case 'released': return run(booked, { type: 'SET_DEMO_STAGE', stage: 'active' }, { type: 'OPEN_RELEASE' }, { type: 'CONFIRM_RELEASE' })
    case 'slant': return run(plan, { type: 'SET_SLANT', on: true })
    case 'floors-left': return run(plan, { type: 'SET_FLOORS_AT', at: 'bottom-left' })
    case 'floors-center': return run(plan, { type: 'SET_FLOORS_AT', at: 'bottom-center' })
    case 'floors-left-booked': return run(booked, { type: 'SET_FLOORS_AT', at: 'bottom-left' })
    case 'alt-sheet': return run(booked, { type: 'SET_ALL_IN_SHEET', on: true })
    case 'alt-sheet-plate': return run(booked, { type: 'SET_ALL_IN_SHEET', on: true }, { type: 'SET_ENTRY', entry: 'plate' })
    case 'host-booked': return run(booked, { type: 'GO_HOST' })
    case 'cancelled': return run(booked, { type: 'OPEN_CANCEL' }, { type: 'CONFIRM_CANCEL' })
    default: return plan
  }
}
