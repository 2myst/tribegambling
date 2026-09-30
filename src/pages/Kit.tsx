import type { ReactNode } from 'react'
import { AvailabilityBars, Button, Chip, FloorSwitch, Hint, PlanSkeleton, Tag, TimeField, Toast, WhenBox, FloorChips, type ButtonState, type ButtonVariant } from '../ui/controls'
import { FloorPlan, SpotCell, type SpotLook } from '../ui/FloorPlan'
import { SpotSheet, type MineProps, type SheetMode, type SpotSheetProps } from '../ui/SpotSheet'
import { EntryBlock, TicketView, type TicketProps } from '../ui/Ticket'
import { HomeWidget } from '../ui/HomeWidget'
import { Repeat } from '../ui/icons'
import { hourlyFree } from '../domain/availability'
import { baseWorld, PLATE, TOMORROW } from '../domain/data'
import './pages.css'

/** Подпись в формате Figma: «Компонент / свойство=значение» */
function V({ name, children, w }: { name: string; children: ReactNode; w?: number }) {
  return (
    <figure className="kv" style={w ? { width: w } : undefined}>
      <div className="kv-box">{children}</div>
      <figcaption>{name}</figcaption>
    </figure>
  )
}

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section className="ks" id={id}>
      <h2>{title}</h2>
      {note && <p className="ks-note">{note}</p>}
      <div className="ks-row">{children}</div>
    </section>
  )
}

const COLORS: [string, string, string][] = [
  ['accent', '#0055F2', 'выбор и действия: выбранное место, главная кнопка'],
  ['accent-soft', '#E4EEFF', 'свободное место, чипы, подложки'],
  ['text', '#171B20', 'основной текст'],
  ['text-secondary', '#51555C', 'второстепенный текст'],
  ['text-muted', '#83868C', 'подписи, иконки'],
  ['surface', '#F6F7F8', 'поля, фон брони'],
  ['segment', '#EBEDF0', 'подложка переключателей этажей'],
  ['line', '#E1E3E6', 'разделители, обводки'],
  ['spot-unavailable', '#E1E3E6', 'занято и закрыто'],
  ['spot-unavailable-num', '#6E7177', 'номер недоступного места'],
  ['spot-closed-hatch', '#C4C6CB', 'штриховка закрытого'],
  ['route', '#C4C6CB', 'путь по плану: линия, точка въезда, стрелка выезда'],
  ['route-flow', '#83868C', 'бегущая стрелка по пути'],
  ['mine', '#07BC57', '«твоё»: своё место на плане, бронь, фон пропуска'],
  ['on-mine', '#FFFFFF', 'текст и иконки на зелёном'],
  ['mine-soft', '#E1F7EA', 'подложка «ваша бронь»'],
  ['mine-ink', '#067A39', 'зелёный текст на светлом'],
  ['danger', '#D93A3A', 'отмена, ошибки'],
  ['danger-soft', '#FDECEC', 'подложка ошибки'],
]

const TYPE: [string, string, React.CSSProperties][] = [
  ['Lebowski 34 · обводка 1px', 'Место 17', { font: '400 34px/1.2 var(--font-head)', WebkitTextStroke: '1px currentColor', paintOrder: 'stroke fill' }],
  ['Lebowski 28 · обводка 1px', 'Место 17 только что заняли', { font: '400 28px/1.15 var(--font-head)', WebkitTextStroke: '1px currentColor', paintOrder: 'stroke fill' }],
  ['Display Semibold 24 · цифры', '9:00 → 18:00', { font: '600 24px/1.2 var(--font-display)' }],
  ['Text Semibold 17', 'Забронировать', { font: '600 17px/1.2 var(--font-text)' }],
  ['Text Semibold 15', 'Завтра, ср 30 сен', { font: '600 15px/1.3 var(--font-text)' }],
  ['Text Regular 15', 'Бронь не создана. Соседнее место 18 свободно', { font: '400 15px/1.4 var(--font-text)' }],
  ['Text Medium 13', 'Покажите охране или поднесите к считывателю', { font: '500 13px/1.3 var(--font-text)' }],
  ['Text Semibold 13 · цифры', '9:00–18:00 · 11 своб.', { font: '600 13px/1.3 var(--font-text)', fontVariantNumeric: 'tabular-nums' }],
]

const sheetBase: SpotSheetProps = { mode: 'suggested', spotNum: 17, floorLabel: '−1 этаж', reason: 'last', lastNum: 17, dayLong: 'Завтра, ср 30 сен', range: '9:00–18:00' }
const SHEETS: [string, Partial<SpotSheetProps> & { mode: SheetMode }][] = [
  ['mode=suggested, reason=last', { mode: 'suggested' }],
  ['mode=suggested, reason=nearExit', { mode: 'suggested', reason: 'nearExit' }],
  ['mode=suggested, reason=lastTaken', { mode: 'suggested', reason: 'lastTaken', spotNum: 12 }],
  ['mode=sending', { mode: 'sending' }],
  ['mode=checking', { mode: 'checking' }],
  ['mode=failed', { mode: 'failed' }],
  ['mode=conflict', { mode: 'conflict', altNum: 18 }],
  ['mode=none', { mode: 'none', noneTitle: 'На завтра 9:00–18:00 мест нет', alternatives: [{ label: 'С 10:30 — 19 мест' }, { label: 'Чт 1 окт — 47 мест' }] }],
]

const mineBase: MineProps = { spotNum: 17, floorLabel: '−1 этаж', dayLong: 'Завтра, ср 30 сен', range: '9:00–18:00', stage: 'locked', endTime: '18:00', opensAt: '8:45', cancelNote: 'Отменить можно до 9:00 завтра' }
const MINE: [string, Partial<MineProps>][] = [
  ['stage=locked', {}],
  ['stage=open', { stage: 'open' }],
  ['stage=active', { stage: 'active', cancelNote: undefined }],
]

const ticketBase: TicketProps = { stage: 'open', statusText: 'до начала 10 мин', spotNum: 17, floorLabel: '−1 этаж', startTime: '9:00', endTime: '18:00', dayShort: 'ср 30 сен', entry: 'qr', plate: PLATE, cancelNote: 'Отменить можно до 9:00 сегодня', onBack: () => {} }


export function Kit() {
  const LOOKS: SpotLook[] = ['free', 'selected', 'unavailable', 'closed', 'taken', 'suggested', 'mine', 'muted']
  const VARIANTS: ButtonVariant[] = ['primary', 'mine', 'secondary', 'text', 'destructive', 'destructive-fill', 'danger-text']
  const STATES: ButtonState[] = ['default', 'pressed', 'loading', 'disabled']
  const looks = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`-1:${i + 1}`, ([3, 7, 9, 12, 18, 22, 25, 29, 33, 38].includes(i + 1) ? 'free' : [5, 36].includes(i + 1) ? 'closed' : i + 1 === 17 ? 'selected' : 'unavailable') as SpotLook]))
  return (
    <div className="page kit">
      <header className="page-head">
        <a href="#/" className="page-back">← Прототип</a>
        <h1>Кит</h1>
        <p>Компоненты прототипа со всеми вариантами. Подписи — как будущие компоненты и свойства в Figma: «Компонент / свойство=значение». Цвета — переменные с теми же именами.</p>
        <nav className="kit-nav">
          {[['tokens', 'Токены'], ['type', 'Текст'], ['spot', 'Место'], ['plan', 'План'], ['buttons', 'Кнопки'], ['chips', 'Чипы'], ['top', 'Время и этажи'], ['sheet', 'Шторка места'], ['mine', 'Своя бронь'], ['entry', 'Въезд'], ['pass', 'Пропуск'], ['widget', 'Вход в модуль'], ['feedback', 'Плашки']].map(([id, t]) => <a key={id} href={`#/kit`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }}>{t}</a>)}
        </nav>
      </header>

      <Section id="tokens" title="Токены — цвет" note="Имена по функции, не по виду. Свободное место = accent-soft, выбранное = accent: «можно взять» и «твоё» из одного цвета.">
        {COLORS.map(([n, hex, use]) => (
          <div key={n} className="swatch"><i style={{ background: hex }} /><b>{n}</b><code>{hex}</code><span>{use}</span></div>
        ))}
      </Section>
      <Section id="radii" title="Токены — скругления">
        {[['r', 12, 'кнопки, поля'], ['r-card', 16, 'карточка брони'], ['r-sheet', 24, 'шторка'], ['r-spot', 5, 'место на плане']].map(([n, v, use]) => (
          <div key={n as string} className="radius"><i style={{ borderRadius: v as number }} /><b>{n} · {v}</b><span>{use}</span></div>
        ))}
      </Section>
      <Section id="type" title="Текстовые стили — Lebowski и SF Pro">
        <div className="type-list">
          {TYPE.map(([n, sample, st]) => <div key={n}><span style={st}>{sample}</span><code>{n}</code></div>)}
        </div>
      </Section>

      <Section id="spot" title="Spot — место на плане" note="Зона тапа — вся ячейка вместе с зазорами. Занято и закрыто — одна серая семья, у закрытого штриховка.">
        {LOOKS.map((l) => (
          <V key={l} name={`Spot / look=${l}`}>
            <svg width="96" height="62" viewBox="0 0 96 62">
              <defs><pattern id={`h-${l}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--spot-unavailable)" /><line x1="0" y1="0" x2="0" y2="6" stroke="var(--spot-closed-hatch)" strokeWidth="2.2" /></pattern></defs>
              <SpotCell x={13} y={12} w={70} h={38} num={17} look={l} hatchId={`h-${l}`} />
            </svg>
          </V>
        ))}
      </Section>

      <Section id="plan" title="FloorPlan — план этажа" note="Дорога — одна фигура: вверх по правому проезду, влево по перемычке, вниз по левому. Направление — только стрелками, без подписей.">
        <V name="FloorPlan / floor=-1" w={425}><div style={{ background: '#fff' }}><FloorPlan floor={-1} looks={looks} width={393} height={480} /></div></V>
        <V name="PlanSkeleton" w={425}><div style={{ background: '#fff' }}><PlanSkeleton width={393} height={480} /></div></V>
      </Section>

      <Section id="buttons" title="Button" note="variant × state. Высота 54, скругление 12.">
        <div className="btn-grid">
          {VARIANTS.map((v) => STATES.map((s) => (
            <V key={`${v}-${s}`} name={`Button / variant=${v}, state=${s}`} w={250}>
              <Button variant={v} state={s}>{v.startsWith('destructive') || v === 'danger-text' ? 'Отменить бронь' : v === 'mine' ? 'Пропуск' : 'Забронировать'}</Button>
            </V>
          )))}
        </div>
      </Section>

      <Section id="chips" title="Chip и Tag">
        <V name="Chip / state=default"><Chip>С 10:00 — 19 мест</Chip></V>
        <V name="Chip / state=selected"><Chip state="selected">Завтра</Chip></V>
        <V name="Chip / state=disabled"><Chip state="disabled">мест нет</Chip></V>
        <V name="Tag / tone=accent"><Tag>как в прошлый раз</Tag></V>
        <V name="Tag / tone=warn"><Tag tone="warn">ваше место 17 занято — это ближайшее</Tag></V>
        <V name="Tag / tone=mine"><Tag tone="mine">ваша бронь</Tag></V>
      </Section>

      <Section id="top" title="WhenBox, FloorSwitch, TimeField, AvailabilityBars">
        <V name="WhenBox" w={172}><WhenBox day="Завтра, ср 30 сен" range="9:00–18:00" /></V>
        <V name="FloorChips / floor=-1"><FloorChips floor={-1} counts={{ '-1': 11, '-2': 3 }} /></V>
        <V name="FloorChips / floor=-2"><FloorChips floor={-2} counts={{ '-1': 11, '-2': 3 }} /></V>
        <V name="FloorSwitch / floor=-1" w={361}><FloorSwitch floor={-1} counts={{ '-1': 11, '-2': 3 }} /></V>
        <V name="FloorSwitch / floor=-2" w={361}><FloorSwitch floor={-2} counts={{ '-1': 11, '-2': 3 }} /></V>
        <V name="FloorSwitch / state=none" w={361}><FloorSwitch floor={-1} counts={{ '-1': 0, '-2': 0 }} /></V>
        <V name="FloorSwitch / state=loading" w={361}><FloorSwitch floor={-1} counts={{ '-1': null, '-2': null }} /></V>
        <V name="TimeField / state=default" w={170}><TimeField label="С" value="9:00" /></V>
        <V name="TimeField / minus=off" w={170}><TimeField label="До" value="10:00" minusOff /></V>
        <V name="AvailabilityBars" w={385}><AvailabilityBars values={hourlyFree('all', TOMORROW, baseWorld())} from={540} to={1080} /></V>
      </Section>

      <Section id="sheet" title="SpotSheet — шторка места" note="Устройство Паркли: заголовок → разделитель → сводка в две колонки → кнопка.">
        {SHEETS.map(([n, p]) => (
          <V key={n} name={`SpotSheet / ${n}`} w={425}><div className="sheet-host"><SpotSheet {...sheetBase} {...p} /></div></V>
        ))}
      </Section>

      <Section id="mine" title="SpotSheet / mode=mine — своя бронь" note="Короткая шторка над планом: место зелёное, остальные приглушены. До окна въезда пропуск заперт и видно, во сколько откроется.">
        {MINE.map(([n, p]) => (
          <V key={n} name={`SpotSheet / mode=mine, ${n}`} w={425}><div className="sheet-host"><SpotSheet mode="mine" dayLong="" range="" mine={{ ...mineBase, ...p }} /></div></V>
        ))}
      </Section>

      <Section id="entry" title="EntryBlock — въезд на пропуске" note="QR — основной. Номер и шлагбаум отличаются только этим блоком.">
        <V name="EntryBlock / method=qr" w={320}><EntryBlock method="qr" plate={PLATE} /></V>
        <V name="EntryBlock / method=plate" w={320}><EntryBlock method="plate" plate={PLATE} /></V>
        <V name="EntryBlock / method=barrier" w={320}><EntryBlock method="barrier" plate={PLATE} /></V>
      </Section>

      <Section id="pass" title="Ticket — пропуск" note="Отдельный экран, один тап из шторки. Шапка зелёная — это «твоё». На экране с QR яркость — на максимум; QR сохранён на телефоне, у ворот связь не нужна.">
        <V name="Ticket / entry=qr, stage=open" w={425}><div className="ticket-host"><TicketView {...ticketBase} /></div></V>
        <V name="Ticket / entry=qr, stage=active" w={425}><div className="ticket-host"><TicketView {...ticketBase} stage="active" statusText="Бронь активна · 8 ч 19 мин" cancelNote={undefined} /></div></V>
      </Section>

      <Section id="widget" title="HomeWidget — вход в модуль" note="Карточка парковки на главной приложения БЦ — шторка модуля в миниатюре: место, метка, один ряд «когда + действие».">
        <V name="HomeWidget / state=free" w={425}><div className="widget-host"><HomeWidget state="free" spotNum={17} floorLabel="−1 этаж" tag={<Tag>как в прошлый раз</Tag>} dayLong="Завтра, ср 30 сен" range="9:00–18:00" /></div></V>
        <V name="HomeWidget / state=free, reason=lastTaken" w={425}><div className="widget-host"><HomeWidget state="free" spotNum={18} floorLabel="−1 этаж" tag={<Tag tone="warn">ваше место 17 занято — это ближайшее</Tag>} dayLong="Завтра, ср 30 сен" range="9:00–18:00" /></div></V>
        <V name="HomeWidget / state=none" w={425}><div className="widget-host"><HomeWidget state="none" noneText="На завтра 9:00–18:00 мест нет" dayLong="Завтра, ср 30 сен" range="9:00–18:00" /></div></V>
        <V name="HomeWidget / state=booked, stage=locked" w={425}><div className="widget-host"><HomeWidget state="booked" spotNum={17} floorLabel="−1 этаж" tag={<Tag tone="mine">ваша бронь</Tag>} dayLong="Завтра, ср 30 сен" range="9:00–18:00" passLocked opensAt="8:45" /></div></V>
        <V name="HomeWidget / state=booked, stage=active" w={425}><div className="widget-host"><HomeWidget state="booked" spotNum={17} floorLabel="−1 этаж" tag={<Tag tone="mine">Бронь активна · 7 ч 45 мин</Tag>} dayLong="Сегодня, ср 30 сен" range="9:00–18:00" /></div></V>
      </Section>

      <Section id="feedback" title="Toast и Hint">
        <V name="Toast / kind=success" w={361}><div className="toast-host"><Toast kind="success" text="Место 17 за вами" /></div></V>
        <V name="Toast / kind=info" w={361}><div className="toast-host"><Toast kind="info" text="Сообщим, как только место освободится" /></div></V>
        <V name="Toast / kind=error" w={361}><div className="toast-host"><Toast kind="error" text="Не получилось отменить" /></div></V>
        <V name="Hint / kind=occupied" w={320}><div className="hint-host"><Hint text="Занято на это время — можно взять с 13:30" left={160} top={56} /></div></V>
        <V name="Hint / kind=one-booking" w={320}><div className="hint-host"><Hint text="Бронь может быть одна — ваша на месте 17" left={160} top={56} /></div></V>
      </Section>
    </div>
  )
}
