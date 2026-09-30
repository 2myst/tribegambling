import type { ReactNode } from 'react'
import { AppProvider } from '../state/useApp'
import { fromDemo } from '../state/store'
import { App } from '../shell/App'
import { AvailabilityBars, Button, FloorChips, StatusBar, Tag, TimeField, Toast, WhenBox } from '../ui/controls'
import { SpotSheet, type MineProps } from '../ui/SpotSheet'
import { TicketView, type TicketProps } from '../ui/Ticket'
import { HomeWidget } from '../ui/HomeWidget'
import { HostTabBar } from '../ui/HostTabBar'
import { ChevronLeft } from '../ui/icons'
import { hourlyFree } from '../domain/availability'
import { baseWorld, PLATE, TOMORROW } from '../domain/data'
import './pages.css'

/**
 * ?page=flow — основной путь для переноса в Figma: 9 кадров подряд, в натуральную величину.
 * Бегущая стрелка на плане на время захвата спрятана — в Figma путь статичный
 */
const FLOW: [string, string][] = [
  ['host', '01 · Главная приложения'],
  ['plan', '02 · План — место подобрано'],
  ['time', '03 · Дата и время'],
  ['created', '04 · Бронь создана'],
  ['booked-open', '05 · Утром — въезд открыт'],
  ['ticket', '06 · Пропуск'],
  ['route', '07 · Как доехать'],
  ['cancel', '08 · Отменить бронь?'],
  ['cancelled', '09 · Бронь отменена'],
]

export function Flow() {
  return (
    <div className="page capture flow-page">
      <div className="flow-row">
        {FLOW.map(([name, label]) => (
          <figure key={name} className="screen-cell">
            <figcaption>{label}</figcaption>
            <div className="phone">
              <AppProvider initial={fromDemo(name)} frozen>
                <App />
              </AppProvider>
            </div>
          </figure>
        ))}
      </div>
    </div>
  )
}

/** Вариант компонента: подпись «Компонент / свойство=значение» и сам компонент в рамке-хосте */
function K({ name, children }: { name: string; children: ReactNode }) {
  return (
    <figure className="fk" data-component={name}>
      <figcaption>{name}</figcaption>
      <div className="fk-box">{children}</div>
    </figure>
  )
}

const mine: MineProps = { spotNum: 17, floorLabel: '−1 этаж', dayLong: 'Завтра, ср 30 сен', range: '9:00–18:00', stage: 'locked', endTime: '18:00', opensAt: '8:45', cancelNote: 'Отменить можно до 9:00 завтра' }
const ticket: TicketProps = { stage: 'open', statusText: 'до начала 10 мин', spotNum: 17, floorLabel: '−1 этаж', startTime: '9:00', endTime: '18:00', dayShort: 'ср 30 сен', entry: 'qr', plate: PLATE, cancelNote: 'Отменить можно до 9:00 сегодня', onBack: () => {} }

/** ?page=flowkit — новые и изменённые компоненты основного пути, для сборки наборов в Figma */
export function FlowKit() {
  return (
    <div className="page capture flowkit">
      <div className="fk-grid">
        <K name="StatusBar / tone=dark"><div className="fk-w393"><StatusBar /></div></K>
        <K name="BackButton"><button type="button" className="plan-back" aria-label="На главную"><ChevronLeft size={20} /></button></K>
        <K name="FloorChips / floor=-1"><FloorChips floor={-1} counts={{ '-1': 11, '-2': 3 }} /></K>
        <K name="FloorChips / floor=-2"><FloorChips floor={-2} counts={{ '-1': 11, '-2': 3 }} /></K>
        <K name="WhenBox / state=default"><div className="fk-w172 sh-row"><WhenBox day="Завтра, ср 30 сен" range="9:00–18:00" /></div></K>
        <K name="WhenBox / state=readonly"><div className="fk-w172 sh-row"><WhenBox day="Завтра, ср 30 сен" range="9:00–18:00" readOnly /></div></K>
        <K name="Button / variant=mine, state=default"><div className="fk-w250"><Button variant="mine">Пропуск</Button></div></K>
        <K name="Button / variant=mine, state=disabled"><div className="fk-w250"><Button variant="mine" state="disabled">Пропуск с 8:45</Button></div></K>
        <K name="Tag / tone=mine"><Tag tone="mine">ваша бронь</Tag></K>
        <K name="TimeField / state=default"><div className="fk-w172"><TimeField label="С" value="9:00" /></div></K>
        <K name="AvailabilityBars"><div className="fk-w353"><AvailabilityBars values={hourlyFree('all', TOMORROW, baseWorld())} from={540} to={1080} total={14} /></div></K>
        <K name="SpotSheet / mode=suggested"><div className="fk-w393"><SpotSheet mode="suggested" spotNum={17} floorLabel="−1 этаж" reason="last" lastNum={17} dayLong="Завтра, ср 30 сен" range="9:00–18:00" /></div></K>
        <K name="SpotSheet / mode=mine, stage=locked"><div className="fk-w393"><SpotSheet mode="mine" dayLong="" range="" mine={mine} /></div></K>
        <K name="SpotSheet / mode=mine, stage=open"><div className="fk-w393"><SpotSheet mode="mine" dayLong="" range="" mine={{ ...mine, stage: 'open', dayLong: 'Сегодня, ср 30 сен', cancelNote: 'Отменить можно до 9:00 сегодня' }} /></div></K>
        <K name="SpotSheet / mode=mine, stage=active"><div className="fk-w393"><SpotSheet mode="mine" dayLong="" range="" mine={{ ...mine, stage: 'active', dayLong: 'Сегодня, ср 30 сен', left: '7 ч 45 мин', cancelNote: undefined, onRelease: () => {} }} /></div></K>
        <K name="HomeWidget / state=free"><div className="fk-w393 fk-surface"><HomeWidget state="free" spotNum={17} floorLabel="−1 этаж" tag={<Tag>как в прошлый раз</Tag>} dayLong="Завтра, ср 30 сен" range="9:00–18:00" /></div></K>
        <K name="HomeWidget / state=booked"><div className="fk-w393 fk-surface"><HomeWidget state="booked" spotNum={17} floorLabel="−1 этаж" tag={<Tag tone="mine">ваша бронь</Tag>} dayLong="Завтра, ср 30 сен" range="9:00–18:00" passLocked opensAt="8:45" /></div></K>
        <K name="TabBar"><div className="fk-tabbar"><HostTabBar /></div></K>
        <K name="Ticket / entry=qr"><div className="fk-w393 fk-ticket"><TicketView {...ticket} /></div></K>
        <K name="Ticket / entry=plate"><div className="fk-w393 fk-ticket"><TicketView {...ticket} entry="plate" /></div></K>
        <K name="Ticket / entry=barrier"><div className="fk-w393 fk-ticket"><TicketView {...ticket} entry="barrier" /></div></K>
        <K name="Toast / kind=success"><div className="fk-toast"><Toast kind="success" text="Место 17 за вами" /></div></K>
      </div>
    </div>
  )
}
