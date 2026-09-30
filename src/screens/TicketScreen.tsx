import { useEffect } from 'react'
import { useApp } from '../state/useApp'
import { myBooking } from '../state/store'
import { bookingEnd, bookingStart, canCancel, stage } from '../domain/lifecycle'
import { dayInText, fmtTime } from '../domain/format'
import { spotById } from '../domain/layout'
import { PLATE } from '../domain/data'
import { StatusBar } from '../ui/controls'
import { TicketView } from '../ui/Ticket'
import { dayShort, floorLabel, fmtDuration } from './helpers'

/** Пропуск: один тап из шторки брони, открывается, когда въезд открыт */
export function TicketScreen() {
  const { s, d } = useApp()
  const b = myBooking(s)
  useEffect(() => {
    if (!b) d({ type: 'CLOSE_TICKET' })
  }, [b, d])
  if (!b) return null
  const st = stage(b, s.now) === 'active' ? 'active' : 'open'
  const spot = spotById(b.spotId)
  return (
    <div className="screen ticket-screen" style={{ overflowY: 'auto', display: 'block' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}><StatusBar /></div>
      <TicketView
        stage={st}
        statusText={st === 'active' ? `Бронь активна · ${fmtDuration(bookingEnd(b).getTime() - s.now.getTime())}` : `до начала ${fmtDuration(bookingStart(b).getTime() - s.now.getTime())}`}
        spotNum={spot.num}
        floorLabel={floorLabel(spot.floor)}
        startTime={fmtTime(b.range.start)}
        endTime={fmtTime(b.range.end)}
        dayShort={dayShort(b.date)}
        entry={s.entry}
        plate={PLATE}
        cancelNote={canCancel(b, s.now) ? `Отменить можно до ${fmtTime(b.range.start)} ${dayInText(b.date, s.now)}` : undefined}
        onBack={() => d({ type: 'CLOSE_TICKET' })}
        onMore={() => d({ type: 'OPEN_MENU' })}
        onRoute={() => d({ type: 'OPEN_ROUTE' })}
        onCancel={() => d({ type: 'OPEN_CANCEL' })}
        onRelease={st === 'active' ? () => d({ type: 'OPEN_RELEASE' }) : undefined}
        onOpenBarrier={() => d({ type: 'SHOW_TOAST', kind: 'success', text: 'Шлагбаум открывается' })}
      />
    </div>
  )
}
