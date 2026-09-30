import type { ReactNode } from 'react'
import { useApp } from '../state/useApp'
import { myBooking, type Scenario } from '../state/store'
import { entryOpen, stage } from '../domain/lifecycle'
import { dateKey } from '../domain/time'
import { fmtTime } from '../domain/format'
import { dayShort } from '../screens/helpers'
import { isDev } from './dev'

const DEV = isDev()

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="dp-group">
      <div className="dp-title">{title}</div>
      <div className="dp-items">{children}</div>
    </div>
  )
}

const SCENARIOS: { key: keyof Scenario | 'none'; label: string; note: string }[] = [
  { key: 'none', label: 'Обычный', note: 'Всё проходит с первого раза' },
  { key: 'conflict', label: 'Место заняли', note: 'Пока подтверждал, место занял коллега' },
  { key: 'noSpots', label: 'Нет мест', note: 'Утро завтра выкуплено до 10:00' },
  { key: 'lastTaken', label: 'Обычное место занято', note: 'Подбор честно говорит, что взял другое' },
  { key: 'loadError', label: 'Не загрузилось', note: 'Места не пришли, дата и время сохранены' },
  { key: 'submitFail', label: 'Сбой при брони', note: 'Связь пропала после нажатия' },
]

/** Демо-панель справа от телефона: сценарии, способ въезда, стадия брони */
export function DemoPanel() {
  const { s, d } = useApp()
  // Стадия — по настоящей брони: после новой брони или отмены прошлое нажатие уже неправда
  const b = myBooking(s)
  const shownStage = !b ? s.demoStage : stage(b, s.now) === 'active' ? 'active' : entryOpen(b, s.now) ? 'open' : 'upcoming'
  const active = (Object.keys(s.scenario) as (keyof Scenario)[]).find((k) => s.scenario[k]) ?? 'none'
  const setScenario = (key: keyof Scenario | 'none') => {
    const patch: Partial<Scenario> = { conflict: false, noSpots: false, loadError: false, submitFail: false, lastTaken: false }
    if (key !== 'none') patch[key] = true
    d({ type: 'SET_SCENARIO', patch })
  }
  return (
    <aside className="demo">
      <div className="dp-head">
        <b>Демо</b>
        {/* Часы демо — живые: меняются с «Временем демо» и после новых броней */}
        <span>{dayShort(dateKey(s.now))}, {fmtTime(s.now.getHours() * 60 + s.now.getMinutes())}{b ? ` — ${shownStage === 'active' ? 'бронь идёт' : shownStage === 'open' ? 'въезд открыт' : 'бронь впереди'}` : ''}</span>
      </div>
      {/* Где открыт модуль: главная приложения БЦ с карточкой парковки или сам модуль */}
      <Group title="Экран">
        {([['host', 'Главная приложения'], ['plan', 'Парковка']] as const).map(([k, l]) => (
          <button key={k} type="button" className={`dp-btn ${(s.screen === 'host') === (k === 'host') ? 'on' : ''}`} onClick={() => d(k === 'host' ? { type: 'GO_HOST' } : { type: 'OPEN_BOOKING' })}>{l}</button>
        ))}
      </Group>
      <Group title="Сценарий">
        {SCENARIOS.map((x) => (
          <button key={x.key} type="button" className={`dp-btn ${active === x.key ? 'on' : ''}`} onClick={() => setScenario(x.key)} title={x.note}>
            {x.label}
          </button>
        ))}
        <p className="dp-note">{SCENARIOS.find((x) => x.key === active)?.note}</p>
      </Group>
      <Group title="Въезд в брони">
        {([['qr', 'QR'], ['plate', 'Номер машины'], ['barrier', 'Шлагбаум']] as const).map(([k, l]) => (
          <button key={k} type="button" className={`dp-btn ${s.entry === k ? 'on' : ''}`} onClick={() => d({ type: 'SET_ENTRY', entry: k })}>{l}</button>
        ))}
      </Group>
      <Group title="Время демо">
        {([['upcoming', 'Вечер накануне'], ['open', 'Въезд открыт'], ['active', 'Бронь идёт']] as const).map(([k, l]) => (
          <button key={k} type="button" className={`dp-btn ${shownStage === k ? 'on' : ''}`} onClick={() => d({ type: 'SET_DEMO_STAGE', stage: k })}>{l}</button>
        ))}
      </Group>
      <Group title="Места на плане">
        {([[false, 'Прямо'], [true, 'Наискосок']] as const).map(([k, l]) => (
          <button key={l} type="button" className={`dp-btn ${s.slant === k ? 'on' : ''}`} onClick={() => d({ type: 'SET_SLANT', on: k })}>{l}</button>
        ))}
      </Group>
      {DEV && (
      <Group title="Этажи">
        {([['top', 'Сверху'], ['bottom-left', 'Снизу слева'], ['bottom-center', 'Снизу по центру']] as const).map(([k, l]) => (
          <button key={k} type="button" className={`dp-btn ${s.floorsAt === k ? 'on' : ''}`} onClick={() => d({ type: 'SET_FLOORS_AT', at: k })}>{l}</button>
        ))}
      </Group>
      )}
      <div className="dp-links">
        <button type="button" className="dp-reset" onClick={() => d({ type: 'RESET' })}>Сбросить</button>
        {DEV && <a href="#/flows">Сценарии</a>}
        {DEV && <a href="#/frames">Все кадры</a>}
        {DEV && <a href="#/kit">Кит</a>}
        <a href="/case/index.html">Кейс</a>
      </div>
    </aside>
  )
}
