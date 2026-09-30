import type { ReactNode } from 'react'
import { Button, Chip, Divider, Tag, Title, WhenBox } from './controls'
import { Alert, Bell, Lock, More } from './icons'

export type SheetMode = 'suggested' | 'sending' | 'checking' | 'failed' | 'conflict' | 'none' | 'mine'

/**
 * Своя бронь в короткой шторке над планом: место, время, пропуск и отмена.
 * Пропуск — отдельный экран в один тап; до окна въезда кнопка заперта и видно, во сколько откроется
 */
export interface MineProps {
  spotNum: number
  floorLabel: string
  dayLong: string
  range: string
  /** locked — до окна въезда, open — въезд открыт (ещё до начала), active — бронь идёт */
  stage: 'locked' | 'open' | 'active'
  endTime: string
  /** Сколько осталось, пока бронь идёт: «8 ч 19 мин» */
  left?: string
  opensAt: string
  cancelNote?: string
  onTicket?: () => void
  onCancel?: () => void
  /** Бронь идёт — «Освободить место раньше» вместо отмены */
  onRelease?: () => void
  onMenu?: () => void
}
export type Reason = 'last' | 'lastTaken' | 'nearExit' | 'manual'

export interface SpotSheetProps {
  mode: SheetMode
  spotNum?: number
  floorLabel?: string
  reason?: Reason
  lastNum?: number
  dayLong: string
  range: string
  altNum?: number
  noneTitle?: string
  alternatives?: { label: string; onPick?: () => void }[]
  onSubmit?: () => void
  onAcceptAlt?: () => void
  onPickOnPlan?: () => void
  onNotify?: () => void
  onTime?: () => void
  mine?: MineProps
}

export function Sheet({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`sheet ${className}`}>
      <div className="grabber" />
      {children}
    </div>
  )
}

/** Сводка по устройству Паркли: две колонки по центру над кнопкой */
export function Summary({ dayLong, range }: { dayLong: string; range: string }) {
  return (
    <div className="summary">
      <div><span>Когда</span><b>{dayLong}</b></div>
      <div><span>Время</span><b className="num">{range}</b></div>
    </div>
  )
}

function ReasonTag({ reason, lastNum }: { reason?: Reason; lastNum?: number }) {
  if (reason === 'last') return <Tag>как в прошлый раз</Tag>
  if (reason === 'nearExit') return <Tag>ближе к выходу</Tag>
  if (reason === 'lastTaken') return <Tag tone="warn">ваше место {lastNum} занято — это ближайшее</Tag>
  return null
}

function MineSheet(p: MineProps) {
  const locked = p.stage === 'locked'
  return (
    <Sheet className="sheet-mine">
      <div className="sh-head">
        <div className="sh-top">
          <Title muted={p.floorLabel}>Место {p.spotNum}</Title>
          <button type="button" className="sh-more" onClick={p.onMenu} aria-label="Ещё"><More size={18} /></button>
        </div>
        <div className="sh-meta">
          <Tag tone="mine">{p.stage === 'active' ? `Бронь активна · ${p.left ?? ''}` : 'ваша бронь'}</Tag>
        </div>
      </div>
      <div className="sh-gap" />
      {/* Тот же ряд, что при бронировании: слева когда, справа действие. До окна въезда кнопка заперта и говорит, с какого времени */}
      <div className="sh-row">
        <WhenBox day={p.dayLong} range={p.range} readOnly />
        <Button variant="mine" state={locked ? 'disabled' : 'default'} onClick={p.onTicket}>
          {locked ? `Пропуск с ${p.opensAt}` : 'Пропуск'}
        </Button>
      </div>
      {p.cancelNote && <Button variant="danger-text" onClick={p.onCancel}>Отменить бронь</Button>}
      {p.stage === 'active' && p.onRelease && <Button variant="text" onClick={p.onRelease}>Освободить место раньше</Button>}
    </Sheet>
  )
}

export function SpotSheet(p: SpotSheetProps) {
  if (p.mode === 'mine' && p.mine) return <MineSheet {...p.mine} />

  if (p.mode === 'none') {
    return (
      <Sheet className="sheet-none">
        <Title sm>{p.noneTitle}</Title>
        <p className="sh-sub">Места есть в другое время:</p>
        <div className="chips">
          {p.alternatives?.map((a) => <Chip key={a.label} onClick={a.onPick}>{a.label}</Chip>)}
        </div>
        {/* Тот же ряд, что при выборе места: слева своё время (тап — выбрать другое), справа — ждать освобождения */}
        <div className="sh-row">
          <WhenBox day={p.dayLong} range={p.range} onTap={p.onTime} />
          <Button variant="secondary" icon={<Bell size={20} />} onClick={p.onNotify}>Уведомить</Button>
        </div>
      </Sheet>
    )
  }

  if (p.mode === 'conflict') {
    return (
      <Sheet className="sheet-conflict">
        <div className="sh-head">
          <Title sm>Место {p.spotNum} только что заняли</Title>
          <p className="sh-sub">Бронь не создана. Соседнее место {p.altNum} свободно на это же время.</p>
        </div>
        <div className="sh-gap" />
        {/* Время то же, что выбрано, — оно уже названо в тексте, кнопке нужна вся ширина */}
        <div className="sh-actions">
          <Button onClick={p.onAcceptAlt}>Забронировать {p.altNum}</Button>
          <Button variant="text" onClick={p.onPickOnPlan}>Выбрать вручную</Button>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet>
      <div className="sh-head">
        <Title muted={p.floorLabel}>Место {p.spotNum}</Title>
        {p.reason && p.reason !== 'manual' && (
          <div className="sh-meta"><ReasonTag reason={p.reason} lastNum={p.lastNum} /></div>
        )}
      </div>
      <div className="sh-gap" />
      {p.mode === 'checking' && <div className="checking"><span className="spinner dark" />Проверяем, создалась ли бронь…</div>}
      {p.mode === 'failed' && (
        <div className="failbox"><Alert size={18} /><span>Не получилось забронировать. Место {p.spotNum} всё ещё свободно.</span></div>
      )}
      <div className="sh-row">
        <WhenBox day={p.dayLong} range={p.range} onTap={p.onTime} disabled={p.mode === 'sending' || p.mode === 'checking'} />
        <Button
          state={p.mode === 'sending' ? 'loading' : p.mode === 'checking' ? 'disabled' : 'default'}
          onClick={p.onSubmit}
        >
          {p.mode === 'failed' ? 'Повторить' : 'Забронировать'}
        </Button>
      </div>
    </Sheet>
  )
}
