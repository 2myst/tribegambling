import type { ReactNode } from 'react'
import { Bell, ChevronRight, ParkingP } from './icons'
import { Button, Title, WhenBox } from './controls'

/** free — место подобрано, можно бронировать; none — на привычное время мест нет; booked — бронь есть */
export type WidgetState = 'free' | 'none' | 'booked'

export interface HomeWidgetProps {
  state: WidgetState
  /** «Завтра на 9:00–18:00 мест нет» — только для none */
  noneText?: string
  spotNum?: number
  floorLabel?: string
  /** Метка под местом: почему подобрано или стадия брони */
  tag?: ReactNode
  dayLong: string
  range: string
  loading?: boolean
  passLocked?: boolean
  opensAt?: string
  onOpen?: () => void
  onTime?: () => void
  onBook?: () => void
  onNotify?: () => void
  onTicket?: () => void
}

/**
 * Карточка парковки на главной приложения БЦ — та же шторка модуля в миниатюре:
 * место с этажом и меткой, ниже один ряд — слева когда, справа главное действие.
 * Бронь на завтра — в один тап отсюда; «Выбрать место» в шапке открывает план
 */
export function HomeWidget(p: HomeWidgetProps) {
  return (
    <div className="widget">
      <button type="button" className="w-head" onClick={p.onOpen}>
        <span className="w-ic"><ParkingP size={22} /></span>
        <b>Парковка</b>
        <span className={`w-link ${p.state === 'free' ? '' : 'muted'}`}>
          {p.state === 'free' && 'Выбрать место'}
          <ChevronRight size={16} />
        </span>
      </button>
      {p.state === 'none' ? (
        <p className="w-note">{p.noneText}</p>
      ) : (
        <>
          <Title className="w-title" muted={p.floorLabel}>Место {p.spotNum}</Title>
          {p.tag && <div className="w-tag">{p.tag}</div>}
        </>
      )}
      <div className="sh-row w-row">
        <WhenBox day={p.dayLong} range={p.range} onTap={p.onTime} readOnly={p.state === 'booked'} disabled={p.loading} />
        {p.state === 'free' && <Button state={p.loading ? 'loading' : 'default'} onClick={p.onBook}>Забронировать</Button>}
        {p.state === 'none' && <Button variant="secondary" icon={<Bell size={20} />} onClick={p.onNotify}>Уведомить</Button>}
        {p.state === 'booked' && (
          <Button variant="mine" state={p.passLocked ? 'disabled' : 'default'} onClick={p.onTicket}>
            {p.passLocked ? `Пропуск с ${p.opensAt}` : 'Пропуск'}
          </Button>
        )}
      </div>
    </div>
  )
}
