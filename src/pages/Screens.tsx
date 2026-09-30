import { AppProvider } from '../state/useApp'
import { fromDemo } from '../state/store'
import { App } from '../shell/App'
import './pages.css'

/** Ключевые экраны в натуральную величину — одним листом для переноса в Figma */
const SCREENS: [string, string][] = [
  ['plan', '1 · План — место подобрано'],
  ['time', '1.1 · Дата и время'],
  ['conflict', '1.2 · Место заняли'],
  ['none', '1.3 · Мест нет'],
  ['error', '1.4 · Ошибка загрузки'],
  ['created', '2 · Бронь создана'],
  ['booked', '2.1 · Моя бронь — вечер накануне'],
  ['cancel', '2.2 · Отмена'],
  ['booked-open', '2.3 · Въезд открыт'],
  ['ticket', '2.4 · Пропуск — QR'],
  ['ticket-plate', '2.4-б · Пропуск — номер'],
  ['ticket-barrier', '2.4-в · Пропуск — шлагбаум'],
]

export function Screens() {
  return (
    <div className="page screens-page">
      <div className="screens">
        {SCREENS.map(([name, label]) => (
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
