import { Button, Divider, Tag, Title } from './controls'
import { Barrier, Lock, More, Play, Qr } from './icons'
import { Plate, type Entry } from './Ticket'
import { Sheet, Summary, type MineProps } from './SpotSheet'

/*
 * ПРОБОВАЛИ И ОТКАЗАЛИСЬ (30.09): всё о брони — в шторке над планом, без отдельного экрана.
 * Номер — строкой, шлагбаум — кнопкой в шторке, QR — отдельным экраном только для него.
 * Вышла каша: пять действий в шторке спорят с планом. Лишний тап до спокойного экрана пропуска дешевле.
 * Оставлено для сравнения: ряд «Пробовали» на странице сценариев и в альтернативах ресерча.
 */

export type EntryStage = 'locked' | 'open' | 'active'

function EntryAction({ method, stage, plate, opensAt, onTicket, onBarrier }: { method: Entry; stage: EntryStage; plate: string; opensAt: string; onTicket?: () => void; onBarrier?: () => void }) {
  const locked = stage === 'locked'
  if (method === 'plate') {
    return (
      <div className="entry-plate">
        <Plate plate={plate} />
        <p className="entry-cap">{locked ? `Камера у ворот пропустит с ${opensAt}` : 'Камера у ворот узнает номер — ничего доставать не нужно'}</p>
      </div>
    )
  }
  if (method === 'barrier') {
    return (
      <div className="entry-act">
        <Button state={locked ? 'disabled' : 'default'} icon={locked ? <Lock size={20} /> : <Barrier size={22} />} onClick={onBarrier}>Открыть шлагбаум</Button>
        <p className="entry-cap">{locked ? `Откроется в ${opensAt} — за 15 минут до начала` : 'Нажмите у ворот — шлагбаум поднимется'}</p>
      </div>
    )
  }
  return (
    <div className="entry-act">
      <Button state={locked ? 'disabled' : 'default'} icon={locked ? <Lock size={20} /> : <Qr size={20} />} onClick={onTicket}>
        {locked ? `QR для въезда — с ${opensAt}` : 'Показать QR для въезда'}
      </Button>
      {locked && <p className="entry-cap">Въезд открывается за 15 минут до начала брони</p>}
    </div>
  )
}

export function AllInSheet(p: MineProps & { entry: Entry; plate: string; onBarrier?: () => void; onRoute?: () => void }) {
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
      <Divider />
      <Summary dayLong={p.dayLong} range={p.range} />
      <EntryAction method={p.entry} stage={p.stage} plate={p.plate} opensAt={p.opensAt} onTicket={p.onTicket} onBarrier={p.onBarrier} />
      <div className="sh-route">
        <Button variant="secondary" icon={<Play size={16} />} onClick={p.onRoute}>Как доехать до места</Button>
      </div>
      {p.cancelNote && (
        <div className="sh-cancel">
          <span>{p.cancelNote}</span>
          <Button variant="danger-text" full={false} onClick={p.onCancel}>Отменить бронь</Button>
        </div>
      )}
    </Sheet>
  )
}
