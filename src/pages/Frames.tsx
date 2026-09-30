import { AppProvider } from '../state/useApp'
import { fromDemo } from '../state/store'
import { App } from '../shell/App'
import './pages.css'

/** Порядок и подписи — по скоупу Figma */
const FRAMES: [string, string][] = [
  ['plan', '1 · План, место подобрано'],
  ['last-taken', '1 · Обычное место занято'],
  ['hint', '1 · Подсказка по тапу'],
  ['time', '1.1 · Дата и время'],
  ['sending', '1 · Отправка брони'],
  ['checking', '1 · Проверяем, создалась ли бронь'],
  ['failed', '1 · Не получилось'],
  ['conflict', '1.2 · Место заняли'],
  ['none', '1.3 · Нет мест'],
  ['error', '1.4 · Ошибка загрузки'],
  ['loading', '1.4 · Загрузка'],
  ['created', '2 · Бронь создана — место зеленеет на плане'],
  ['booked', '2.1 · Моя бронь — вечер накануне, пропуск заперт'],
  ['second', '2.1 · Вторую бронь не взять'],
  ['cancel', '2.2 · Отмена'],
  ['cancelled', '2.2 · Бронь отменена — снова выбор'],
  ['booked-open', '2.3 · Въезд открыт'],
  ['ticket', '2.4 · Пропуск — QR'],
  ['ticket-plate', '2.4-б · Пропуск — номер'],
  ['ticket-barrier', '2.4-в · Пропуск — шлагбаум'],
  ['route', '2.4 · Как доехать'],
  ['booked-active', '2.5 · Бронь идёт'],
  ['ticket-active', '2.5 · Пропуск, бронь идёт'],
  ['release', '2.6 · Уехал раньше — освободить место'],
  ['released', '2.6 · Место освобождено — план на завтра'],
  ['alt-sheet', 'Пробовали: всё о брони в шторке'],
  ['host', 'Вход в модуль из приложения БЦ — один кадр, как встраивается'],
]

export function Frames() {
  return (
    <div className="page">
      <header className="page-head">
        <a href="#/" className="page-back">← Прототип</a>
        <h1>Все кадры</h1>
        <p>Каждый кадр открывается отдельной ссылкой — живым прототипом в этом состоянии. Удобно импортировать в Figma по одному. Те же кадры цепочками со стрелками — на странице <a href="#/flows" className="page-back">«Сценарии»</a>.</p>
      </header>
      <div className="frames">
        {FRAMES.map(([name, label]) => (
          <a key={name} className="frame-cell" href={`/?demo=${name}`}>
            <div className="frame-box">
              <div className="phone-slot">
                <div className="phone">
                  <AppProvider initial={fromDemo(name)} frozen>
                    <App />
                  </AppProvider>
                </div>
              </div>
            </div>
            <span className="frame-label">{label}</span>
            <span className="frame-link">?demo={name}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
