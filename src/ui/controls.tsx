import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Calendar, Check, ChevronRight, Alert, Bell, Minus, Plus } from './icons'
import { planGeometry } from './FloorPlan'

export function StatusBar({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  return (
    <div className={`statusbar ${tone}`}>
      <span className="sb-time">9:41</span>
      <span className="island" />
      <svg className="sb-icons" viewBox="0 0 64 12" aria-hidden="true">
        <rect x="0" y="7" width="3" height="5" rx="1" /><rect x="5" y="5" width="3" height="7" rx="1" /><rect x="10" y="2.5" width="3" height="9.5" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" />
        <path d="M27 4.2a8 8 0 0 1 11 0M29.3 6.6a4.6 4.6 0 0 1 6.4 0M31.5 9a1.5 1.5 0 0 1 2 0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <rect x="42" y=".5" width="20" height="11" rx="3" fill="none" stroke="currentColor" opacity=".4" /><rect x="44" y="2.5" width="14" height="7" rx="1.5" /><rect x="62.5" y="4" width="1.5" height="4" rx=".7" opacity=".4" />
      </svg>
    </div>
  )
}

export type ButtonVariant = 'primary' | 'mine' | 'secondary' | 'text' | 'destructive' | 'destructive-fill' | 'danger-text'
export type ButtonState = 'default' | 'pressed' | 'loading' | 'disabled'

export function Button({ variant = 'primary', state = 'default', full = true, icon, children, onClick }: { variant?: ButtonVariant; state?: ButtonState; full?: boolean; icon?: ReactNode; children: ReactNode; onClick?: () => void }) {
  const off = state === 'loading' || state === 'disabled'
  return (
    <button type="button" className={`btn ${variant} ${state} ${full ? 'full' : ''}`} onClick={off ? undefined : onClick} aria-disabled={off || undefined}>
      {state === 'loading' ? <span className="spinner" aria-label="Загрузка" /> : <>{icon}<span>{children}</span></>}
    </button>
  )
}

export type ChipState = 'default' | 'selected' | 'disabled'
export function Chip({ state = 'default', children, onClick }: { state?: ChipState; children: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" className={`chip ${state}`} onClick={state === 'disabled' ? undefined : onClick}>
      {children}
    </button>
  )
}

export function Tag({ tone = 'accent', children }: { tone?: 'accent' | 'warn' | 'mine'; children: ReactNode }) {
  return <span className={`tag ${tone}`}>{children}</span>
}

/** Строка времени над планом: «Завтра · 9:00–18:00 ›» */
export function TimePill({ day, range, onTap }: { day: string; range: string; onTap?: () => void }) {
  return (
    <button type="button" className="timepill" onClick={onTap}>
      <Calendar size={19} />
      <b>{day}</b>
      <span className="tp-range">{range}</span>
      <ChevronRight size={16} className="tp-chev" />
    </button>
  )
}

/** Этажи на всю ширину: «−1 этаж (11)», в кружке — сколько свободно */
export function FloorSwitch({ floor, counts, onChange }: { floor: -1 | -2; counts: Record<'-1' | '-2', number | null>; onChange?: (f: -1 | -2) => void }) {
  return (
    <div className="floorswitch" role="tablist">
      {([-1, -2] as const).map((f) => {
        const n = counts[String(f) as '-1' | '-2']
        return (
          <button key={f} type="button" role="tab" aria-selected={floor === f} className={floor === f ? 'on' : ''} onClick={() => onChange?.(f)}>
            <span>{f === -1 ? '−1' : '−2'} этаж</span>
            <span className={`fs-count ${n === 0 ? 'zero' : ''}`} aria-label={n === null ? 'загружаем' : `свободно ${n}`}>{n === null ? '…' : n}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Этажи маленькие, внизу карты: та же логика, что у большого переключателя, размер — как у чипов */
export function FloorChips({ floor, counts, onChange }: { floor: -1 | -2; counts: Record<'-1' | '-2', number | null>; onChange?: (f: -1 | -2) => void }) {
  return (
    <div className="floorchips" role="tablist">
      {([-1, -2] as const).map((f) => {
        const n = counts[String(f) as '-1' | '-2']
        return (
          <button key={f} type="button" role="tab" aria-selected={floor === f} className={floor === f ? 'on' : ''} onClick={() => onChange?.(f)}>
            <span>{f === -1 ? '−1' : '−2'} этаж</span>
            <span className={`fs-count ${n === 0 ? 'zero' : ''}`} aria-label={n === null ? 'загружаем' : `свободно ${n}`}>{n === null ? '…' : n}</span>
          </button>
        )
      })}
    </div>
  )
}

export function Toast({ kind, text }: { kind: 'success' | 'error' | 'info'; text: string }) {
  return (
    <div className={`toast ${kind}`} role="status">
      <span className="toast-ic">{kind === 'error' ? <Alert size={18} /> : kind === 'info' ? <Bell size={18} /> : <Check size={18} />}</span>
      <span>{text}</span>
    </div>
  )
}

/** Подсказка над местом. bound — ширина плана: у крайних мест подсказка сдвигается внутрь, хвостик остаётся над местом */
export function Hint({ text, left, top, bound }: { text: string; left: number; top: number; bound?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shift, setShift] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || bound === undefined) return
    const half = el.offsetWidth / 2
    const pad = 8
    setShift(Math.min(Math.max(left, pad + half), bound - pad - half) - left)
  }, [left, bound, text])
  return (
    <div className="hint" ref={ref} style={{ left: left + shift, top, ['--tail' as string]: `${-shift}px` }} role="tooltip">
      {text}
    </div>
  )
}

/** Время брони в шторке: «Завтра, ср 30 сен / 9:00–18:00». Тап — дата и время */
export function WhenBox({ day, range, onTap, disabled, readOnly }: { day: string; range: string; onTap?: () => void; disabled?: boolean; readOnly?: boolean }) {
  // Только показать — без рамки, на подложке: не выглядит нажимаемым
  if (readOnly) return <div className="whenbox ro"><span>{day}</span><b>{range}</b></div>
  return (
    <button type="button" className="whenbox" onClick={disabled ? undefined : onTap} aria-disabled={disabled || undefined} aria-label={`${day}, ${range}. Изменить дату и время`}>
      <span>{day}</span>
      <b>{range}</b>
    </button>
  )
}

/** Заголовок Lebowski: «Место 17 −1 этаж», вторая часть серая */
export function Title({ children, muted, sm, as = 'h3', className = 'sh-title' }: { children: ReactNode; muted?: ReactNode; sm?: boolean; as?: 'h2' | 'h3'; className?: string }) {
  const H = as
  return <H className={`${className} head ${sm ? 'sm' : ''}`}><span>{children}</span>{muted && <span className="head-muted">{muted}</span>}</H>
}

export function Divider() {
  return <div className="divider" />
}

/** Поле времени «С 9:00» с − / + */
export function TimeField({ label, value, onMinus, onPlus, minusOff, plusOff }: { label: string; value: string; onMinus?: () => void; onPlus?: () => void; minusOff?: boolean; plusOff?: boolean }) {
  return (
    <div className="timefield">
      <button type="button" className="tf-btn" onClick={minusOff ? undefined : onMinus} aria-disabled={minusOff || undefined} aria-label={`${label} раньше`}><Minus size={20} /></button>
      <div className="tf-val"><span>{label}</span><b>{value}</b></div>
      <button type="button" className="tf-btn" onClick={plusOff ? undefined : onPlus} aria-disabled={plusOff || undefined} aria-label={`${label} позже`}><Plus size={20} /></button>
    </div>
  )
}

/**
 * Столбики «свободно по часам», 7…21. Выбранное время — подложкой, в её углу — сколько мест свободно на всё время подряд
 * (меньше, чем в самый занятой час: место должно быть свободно без перерыва). Где низко — занято
 */
export function AvailabilityBars({ values, from, to, total }: { values: number[]; from: number; to: number; total?: number }) {
  const max = Math.max(1, ...values)
  const hours = values.map((_, i) => 7 + i)
  const inRange = (h: number) => h * 60 < to && (h + 1) * 60 > from
  const idx = hours.map((h, i) => (inRange(h) ? i : -1)).filter((i) => i >= 0)
  const n = values.length
  return (
    <div className="bars">
      <div className="bars-head">
        <span>Свободно мест по часам</span>
        <span className="bars-key"><i />ваше время</span>
      </div>
      <div className="bars-row">
        {idx.length > 0 && (
          <div className="bars-band" style={{ left: `calc(${(idx[0] / n) * 100}% - 3px)`, width: `calc(${(idx.length / n) * 100}% + 3px)` }}>
            {total !== undefined && <span className="bars-total">{total}</span>}
          </div>
        )}
        {values.map((v, i) => (
          <div key={i} className="bar-col">
            <div className={`bar ${idx.includes(i) ? 'in' : ''}`} style={{ height: `${Math.max(6, (v / max) * 100)}%` }} title={`${hours[i]}:00 — ${v}`} />
          </div>
        ))}
      </div>
      <div className="bars-axis">{[7, 10, 13, 16, 19, 22].map((h) => <span key={h}>{h}</span>)}</div>
    </div>
  )
}

export function PlanSkeleton({ width, height }: { width: number; height: number }) {
  const g = planGeometry(width, height)
  const cells = []
  for (let c = 0; c < 4; c++) for (let r = 0; r < 10; r++) cells.push(<rect key={`${c}-${r}`} x={g.colX[c] + 1.5} y={g.TOP + r * g.rowH + 2} width={g.COL - 3} height={g.rowH - 4} rx={6} />)
  return (
    <svg className="skeleton" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label="Загружаем места">
      <g className="sk-cells">{cells}</g>
    </svg>
  )
}
