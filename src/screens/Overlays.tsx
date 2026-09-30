import { useApp } from '../state/useApp'
import { activeBooking } from '../domain/lifecycle'
import { dayInText, fmtRange, fmtTime } from '../domain/format'
import { LAST_BOOKING } from '../domain/data'
import { Button, Title } from '../ui/controls'
import { CalendarPlus, Close, Share } from '../ui/icons'
import { Sheet } from '../ui/SpotSheet'
import { POV } from '../ui/POV'
import { routeFor } from './helpers'

function useMine() {
  const { s } = useApp()
  return activeBooking(s.world.bookings.filter((b) => b.id !== LAST_BOOKING.id), s.now)
}

function Overlay({ children }: { children: React.ReactNode }) {
  const { d } = useApp()
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && d({ type: 'CLOSE_OVERLAY' })}>
      {children}
    </div>
  )
}

export function CancelSheet() {
  const { s, d } = useApp()
  const b = useMine()
  if (!b) return null
  const r = routeFor(b)
  return (
    <Overlay>
      <Sheet>
        <Title sm>Отменить бронь?</Title>
        <p className="sh-sub">Место {r.spot.num} {dayInText(b.date, s.now)}, {fmtRange(b.range)} освободится для коллег.</p>
        <div className="sh-actions" style={{ marginTop: 20 }}>
          <Button variant="destructive-fill" onClick={() => d({ type: 'CONFIRM_CANCEL' })}>Отменить бронь</Button>
          <Button variant="text" onClick={() => d({ type: 'CLOSE_OVERLAY' })}>Оставить</Button>
        </div>
      </Sheet>
    </Overlay>
  )
}

/** Бронь идёт: отменить нельзя, но можно освободить место раньше — человек подтверждает, что уехал */
export function ReleaseSheet() {
  const { d } = useApp()
  const b = useMine()
  if (!b) return null
  const r = routeFor(b)
  return (
    <Overlay>
      <Sheet>
        <Title sm>Уже уехали?</Title>
        <p className="sh-sub">Место {r.spot.num} станет свободно до {fmtTime(b.range.end)}, его смогут взять коллеги. Вернуть бронь не получится.</p>
        <div className="sh-actions" style={{ marginTop: 20 }}>
          <Button onClick={() => d({ type: 'CONFIRM_RELEASE' })}>Освободить место</Button>
          <Button variant="text" onClick={() => d({ type: 'CLOSE_OVERLAY' })}>Я ещё на месте</Button>
        </div>
      </Sheet>
    </Overlay>
  )
}

export function RouteSheet() {
  const { d } = useApp()
  const b = useMine()
  if (!b) return null
  const r = routeFor(b)
  return (
    <Overlay>
      <Sheet>
        <div className="ov-head">
          <Title sm muted={`до места ${r.spot.num}`}>Как доехать</Title>
          <button type="button" className="ov-close" onClick={() => d({ type: 'CLOSE_OVERLAY' })} aria-label="Закрыть"><Close size={18} /></button>
        </div>
        <div className="route-pic"><POV side={r.povSide} depth={r.povDepth} num={r.spot.num} /></div>
        <ol className="steps">
          <li>Въезд — через ворота у охраны{r.spot.floor === -2 ? ', дальше по пандусу на −2 этаж' : ''}.</li>
          <li>{r.firstLane ? 'Держитесь правого проезда — он ведёт вверх по плану.' : 'Проезжайте правый проезд до конца и разворачивайтесь налево.'}</li>
          <li>Место <b>{r.spot.num}</b> — <b>{r.n}-е {r.side}</b>. Номер написан на полу.</li>
        </ol>
        <Button onClick={() => d({ type: 'CLOSE_OVERLAY' })}>Понятно</Button>
      </Sheet>
    </Overlay>
  )
}

export function MenuSheet() {
  const { d } = useApp()
  return (
    <Overlay>
      <Sheet>
        <div className="menu-list">
          <button type="button" onClick={() => d({ type: 'SHOW_TOAST', kind: 'success', text: 'Добавлено в календарь' })}><CalendarPlus size={22} />Добавить в календарь</button>
          <button type="button" onClick={() => d({ type: 'SHOW_TOAST', kind: 'success', text: 'Ссылка на бронь скопирована' })}><Share size={22} />Поделиться</button>
        </div>
        <Button variant="text" onClick={() => d({ type: 'CLOSE_OVERLAY' })}>Закрыть</Button>
      </Sheet>
    </Overlay>
  )
}
