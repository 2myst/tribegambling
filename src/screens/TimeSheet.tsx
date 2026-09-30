import { useApp } from '../state/useApp'
import { bookableDays, clampRange, DAY_END, earliestStart, isDayBookable, MIN_DURATION, STEP } from '../domain/time'
import { freeCount, hourlyFree } from '../domain/availability'
import { dayLabel, dayNum, fmtTime, spotsWord } from '../domain/format'
import { AvailabilityBars, Button, Divider, TimeField, Title } from '../ui/controls'
import { Close } from '../ui/icons'
import { Sheet } from '../ui/SpotSheet'

/** Шторка даты и времени: дни, время, свободно по часам, сводка, одна кнопка. Секции разделены воздухом, без подписей */
export function TimeSheet() {
  const { s, d } = useApp()
  // Черновик живёт в состоянии прототипа — поэтому любой шаг шторки можно открыть ссылкой и показать в сценарии
  const date = s.draft?.date ?? s.date
  const range = s.draft?.range ?? s.range
  const pickDate = (x: string) => d({ type: 'DRAFT_DATE', date: x })
  const setRange = (r: typeof range) => d({ type: 'DRAFT_RANGE', range: r })
  const min = earliestStart(date, s.now)
  const count = freeCount('all', date, range, s.world)
  const hours = (range.end - range.start) / 60
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && d({ type: 'CLOSE_OVERLAY' })}>
      <Sheet className="timesheet">
        <div className="ov-head">
          <Title>Дата и время</Title>
          <button type="button" className="ov-close" onClick={() => d({ type: 'CLOSE_OVERLAY' })} aria-label="Закрыть"><Close size={18} /></button>
        </div>
        <div className="days">
          {bookableDays(s.now).map((x) => {
            const ok = isDayBookable(x, s.now)
            const n = ok ? freeCount('all', x, clampRange(x, range, s.now), s.world) : 0
            return (
              <button key={x} type="button" className={`day ${x === date ? 'on' : ''} ${ok ? '' : 'off'}`} onClick={ok ? () => pickDate(x) : undefined}>
                <span className="d-wd">{dayLabel(x, s.now)}</span>
                <span className="d-num">{dayNum(x)}</span>
                <span className={`d-free ${n === 0 ? 'zero' : ''}`}>{ok ? (n ? `${n} ${spotsWord(n)}` : 'мест нет') : 'поздно'}</span>
              </button>
            )
          })}
        </div>
        <div className="times">
          <TimeField label="С" value={fmtTime(range.start)}
            minusOff={range.start - STEP < min} plusOff={range.start + STEP > range.end - MIN_DURATION}
            onMinus={() => setRange({ ...range, start: range.start - STEP })} onPlus={() => setRange({ ...range, start: range.start + STEP })} />
          <TimeField label="До" value={fmtTime(range.end)}
            minusOff={range.end - STEP < range.start + MIN_DURATION} plusOff={range.end + STEP > DAY_END}
            onMinus={() => setRange({ ...range, end: range.end - STEP })} onPlus={() => setRange({ ...range, end: range.end + STEP })} />
        </div>
        <AvailabilityBars values={hourlyFree('all', date, s.world)} from={range.start} to={range.end} total={count} />
        <Divider />
        <div className="summary">
          <div><span>Длительность</span><b className="num">{String(hours).replace('.', ',')} ч</b></div>
          <div><span>Свободно</span><b className="num">{count ? `${count} ${spotsWord(count)}` : 'мест нет'}</b></div>
        </div>
        <Button onClick={() => d({ type: 'APPLY_TIME', date, range })}>Показать места</Button>
      </Sheet>
    </div>
  )
}
