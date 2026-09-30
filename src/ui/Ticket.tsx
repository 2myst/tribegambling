import type { ReactNode } from 'react'
import { Barrier, ChevronLeft, More, Play } from './icons'
import { Button, Title } from './controls'

/** Детерминированный «QR» для макета: три поисковых квадрата и шум */
export function QR({ size = 148, seed = 17 }: { size?: number; seed?: number }) {
  const N = 25
  let x = seed * 9301 + 49297
  const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280)
  const cells: ReactNode[] = []
  const finder = (r: number, c: number) => r < 7 && c < 7 ? true : r < 7 && c >= N - 7 ? true : r >= N - 7 && c < 7
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (finder(r, c)) continue
      if (rnd() > 0.52) cells.push(<rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" />)
    }
  }
  const Finder = ({ r, c }: { r: number; c: number }) => (
    <g transform={`translate(${c} ${r})`}>
      <rect width="7" height="7" rx="1.2" />
      <rect x="1" y="1" width="5" height="5" rx=".8" fill="#fff" />
      <rect x="2" y="2" width="3" height="3" rx=".5" />
    </g>
  )
  return (
    <svg className="qr" width={size} height={size} viewBox={`-1 -1 ${N + 2} ${N + 2}`} aria-label="QR-код для въезда">
      <rect x="-1" y="-1" width={N + 2} height={N + 2} fill="#fff" />
      <g fill="var(--text)">
        {cells}
        <Finder r={0} c={0} /><Finder r={0} c={N - 7} /><Finder r={N - 7} c={0} />
      </g>
    </svg>
  )
}

/** Российский номер: «А123ВС 777» */
export function Plate({ plate }: { plate: string }) {
  const [main, region] = plate.split(' ')
  const m = main.match(/^(\S)(\d{3})(\S{2})$/)
  return (
    <div className="plate" aria-label={`Номер ${plate}`}>
      <span className="pl-main">{m ? <>{m[1]}<b>{m[2]}</b>{m[3]}</> : main}</span>
      <span className="pl-region"><b>{region}</b><small>RUS</small></span>
    </div>
  )
}

export type Entry = 'qr' | 'plate' | 'barrier'

/** Блок въезда на пропуске. Экран открывается, только когда въезд открыт, поэтому здесь всё активно */
export function EntryBlock({ method, plate, onOpenBarrier }: { method: Entry; plate: string; onOpenBarrier?: () => void }) {
  if (method === 'plate') {
    return (
      <div className="entry">
        <Plate plate={plate} />
        <p className="entry-cap">Камера у ворот узнает номер — ничего доставать не нужно</p>
      </div>
    )
  }
  if (method === 'barrier') {
    return (
      <div className="entry">
        <Button icon={<Barrier size={22} />} onClick={onOpenBarrier}>Открыть шлагбаум</Button>
        <p className="entry-cap">Нажмите у ворот — шлагбаум поднимется</p>
      </div>
    )
  }
  return (
    <div className="entry">
      <QR />
      <p className="entry-cap">Поднесите к считывателю или покажите охране</p>
    </div>
  )
}

export type Stage = 'open' | 'active'
export interface TicketProps {
  stage: Stage
  statusText: string
  spotNum: number
  floorLabel: string
  startTime: string
  endTime: string
  dayShort: string
  entry: Entry
  plate: string
  cancelNote?: string
  onBack?: () => void
  onMore?: () => void
  onRoute?: () => void
  onCancel?: () => void
  /** Бронь идёт — освободить место раньше */
  onRelease?: () => void
  onOpenBarrier?: () => void
}

/**
 * Пропуск — отдельный экран, один тап из шторки над планом. Весь экран зелёный: это «твоё», узнаётся издалека.
 * Карточка — билет с линией отрыва между въездом и временем.
 * Здесь ничего не нужно искать: QR, номер или шлагбаум, время, маршрут и отмена
 */
export function TicketView(p: TicketProps) {
  return (
    <div className={`ticket stage-${p.stage}`}>
      <div className="tk-band">
        <div className="tk-nav">
          {p.onBack ? <button type="button" className="tk-icon" onClick={p.onBack} aria-label="Назад"><ChevronLeft size={24} /></button> : <span className="tk-icon" />}
          <div className="tk-title"><b>Пропуск</b><span>{p.statusText}</span></div>
          <button type="button" className="tk-icon" onClick={p.onMore} aria-label="Ещё"><More size={22} /></button>
        </div>
      </div>
      <div className="tk-card">
        <Title as="h2" className="tk-head" muted={p.floorLabel}>Место {p.spotNum}</Title>
        <EntryBlock method={p.entry} plate={p.plate} onOpenBarrier={p.onOpenBarrier} />
        <div className="tk-tear" aria-hidden="true" />
        <div className="tk-times">
          <div><span>С</span><b className="num">{p.startTime}</b><small>{p.dayShort}</small></div>
          <span className="tk-arrow">→</span>
          <div><span>До</span><b className="num">{p.endTime}</b><small>{p.dayShort}</small></div>
        </div>
        <Button variant="secondary" icon={<Play size={16} />} onClick={p.onRoute}>Как доехать до места</Button>
      </div>
      {p.cancelNote && (
        <div className="tk-cancel">
          <p>{p.cancelNote}</p>
          <Button variant="destructive" onClick={p.onCancel}>Отменить бронь</Button>
        </div>
      )}
      {!p.cancelNote && p.onRelease && (
        <div className="tk-cancel">
          <p>Уехали раньше? Место достанется коллегам</p>
          <Button variant="secondary" onClick={p.onRelease}>Освободить место</Button>
        </div>
      )}
    </div>
  )
}
