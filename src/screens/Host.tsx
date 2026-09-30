import { useApp } from '../state/useApp'
import { myBooking } from '../state/store'
import { bookingEnd, entryOpen, stage } from '../domain/lifecycle'
import { autoPick } from '../domain/availability'
import { addDays, clampRange, dateKey, EARLY_ENTRY } from '../domain/time'
import { fmtDayLong, fmtRange, fmtTime } from '../domain/format'
import { spotById } from '../domain/layout'
import { LAST_BOOKING } from '../domain/data'
import { StatusBar, Tag } from '../ui/controls'
import { HomeWidget } from '../ui/HomeWidget'
import { HostTabBar } from '../ui/HostTabBar'
import { floorLabel, fmtDuration, onDay } from './helpers'

/**
 * Главная приложения БЦ — как модуль встраивается. Приложение не проектируем: всё заглушками,
 * настоящие только карточка парковки и вкладка «Главная»
 */
export function HostScreen() {
  const { s, d } = useApp()
  const mine = myBooking(s)
  const tomorrow = addDays(dateKey(s.now), 1)
  const usual = clampRange(tomorrow, LAST_BOOKING.range, s.now)
  // Карточка показывает то же место, что подобрал бы модуль: прошлое или ближайшее к выходу
  const pick = mine ? null : autoPick(tomorrow, usual, s.lastSpotId, s.world)
  const lastNum = s.lastSpotId ? spotById(s.lastSpotId).num : undefined
  const open = () => d({ type: 'OPEN_BOOKING' })

  let widget
  if (mine) {
    const spot = spotById(mine.spotId)
    const st = stage(mine, s.now)
    widget = (
      <HomeWidget
        state="booked"
        spotNum={spot.num}
        floorLabel={floorLabel(spot.floor)}
        tag={<Tag tone="mine">{st === 'active' ? `Бронь активна · ${fmtDuration(bookingEnd(mine).getTime() - s.now.getTime())}` : 'ваша бронь'}</Tag>}
        dayLong={fmtDayLong(mine.date, s.now)}
        range={fmtRange(mine.range)}
        passLocked={!entryOpen(mine, s.now)}
        opensAt={fmtTime(mine.range.start - EARLY_ENTRY)}
        onOpen={open}
        onTicket={() => { open(); d({ type: 'OPEN_TICKET' }) }}
      />
    )
  } else if (pick) {
    const tag = pick.reason === 'last' ? <Tag>как в прошлый раз</Tag>
      : pick.reason === 'nearExit' ? <Tag>ближе к выходу</Tag>
      : <Tag tone="warn">ваше место {lastNum} занято — это ближайшее</Tag>
    widget = (
      <HomeWidget
        state="free"
        spotNum={pick.spot.num}
        floorLabel={floorLabel(pick.spot.floor)}
        tag={tag}
        dayLong={fmtDayLong(tomorrow, s.now)}
        range={fmtRange(usual)}
        loading={s.screen === 'host' && s.sheet === 'sending'}
        onOpen={open}
        onTime={() => { open(); d({ type: 'OPEN_TIME' }) }}
        onBook={() => d({ type: 'REPEAT_LAST' })}
      />
    )
  } else {
    const on = onDay(tomorrow, s.now)
    widget = (
      <HomeWidget
        state="none"
        noneText={`${on[0].toUpperCase()}${on.slice(1)} ${fmtRange(usual)} мест нет`}
        dayLong={fmtDayLong(tomorrow, s.now)}
        range={fmtRange(usual)}
        onOpen={open}
        onTime={() => { open(); d({ type: 'OPEN_TIME' }) }}
        onNotify={() => d({ type: 'NOTIFY_ME' })}
      />
    )
  }

  return (
    <div className="screen host-screen">
      <StatusBar />
      <div className="host-scroll">
        {/* Приложение БЦ — заглушками: приветствие, быстрые действия, карточки. Настоящая только карточка парковки */}
        <div className="h-top">
          <div><div className="ph ph-title" /><div className="ph ph-sub" /></div>
          <div className="ph ph-avatar" />
        </div>
        <div className="h-quick" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-q"><div className="ph ph-q" /><div className="ph ph-ql" /></div>)}
        </div>
        {widget}
        <div className="ph ph-h" />
        <div className="ph ph-block" />
        <div className="ph ph-block" />
      </div>
      <HostTabBar />
    </div>
  )
}
