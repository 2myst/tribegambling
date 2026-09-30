import { suggestAlternatives } from '../domain/availability'
import { autoStep, hostState, reducer, type Action, type State } from '../state/store'

/** Действие сценария: готовое или посчитанное из текущего кадра — так же, как его считает интерфейс */
export type Do = Action | ((s: State) => Action)
/** Куда тапнуть: селектор внутри кадра и, если нужно, текст элемента (text — целиком, has — часть) */
export interface Target { sel: string; text?: string; has?: string }
/** Переход к следующему шагу: по тапу, сам (ответ сервера, загрузка) или потому что прошло время */
export type Go =
  | { kind: 'tap'; label: string; target: Target; do: Do[] }
  | { kind: 'auto' }
  | { kind: 'time'; label: string; do: Do[] }
export interface FlowStep {
  title: string
  /** Кадр из скоупа Figma: 1, 1.1 … 2.5, «вход» */
  frame: string
  note: string
  go?: Go
}
export interface Flow {
  id: string
  n: number
  group: 'task' | 'extra'
  title: string
  goal: string
  /** Пункт задания, который закрывает сценарий */
  covers?: string
  start: Do[]
  steps: FlowStep[]
}

const tap = (label: string, target: Target, ...d: Do[]): Go => ({ kind: 'tap', label, target, do: d })
const auto: Go = { kind: 'auto' }
const morning: Go = { kind: 'time', label: 'утром, в 8:45 въезд открылся', do: [{ type: 'SET_DEMO_STAGE', stage: 'open' }] }

const BOOK: Target = { sel: '.sheet .btn', text: 'Забронировать' }
const spot = (n: number): Target => ({ sel: `[aria-label="Место ${n}"] .body` })
const sending = (note: string): FlowStep => ({ title: 'Отправка', frame: '1', note, go: auto })

/** Бронь на завтра уже есть, плашка «за вами» ушла: модуль открыт планом с зелёным местом */
const BOOKED: Do[] = [
  { type: 'OPEN_BOOKING' }, { type: 'SUBMIT' }, { type: 'SUBMIT_RESOLVED' },
  (s) => ({ type: 'DISMISS_TOAST', id: s.toast?.id ?? 0 }),
]
const scenario = (patch: Partial<State['scenario']>): Do[] => [{ type: 'SET_SCENARIO', patch }, { type: 'OPEN_BOOKING' }]

export const FLOWS: Flow[] = [
  {
    id: 'main', n: 1, group: 'task',
    title: 'Бронь на завтра в два тапа',
    goal: 'Обычный день: то же место, что в прошлый раз.',
    covers: 'бронирование успешно создано',
    start: [{ type: 'OPEN_BOOKING' }],
    steps: [
      { title: 'План — место подобрано', frame: '1', note: 'Модуль открывается сразу планом. Завтра, 9:00–18:00 и место 17 подставлены из прошлой брони — выбирать ничего не нужно.', go: tap('«Забронировать»', BOOK, { type: 'SUBMIT' }) },
      sending('Кнопка сразу уходит в загрузку — второй тап не создаст вторую бронь.'),
      { title: 'Бронь создана', frame: '2', note: 'Никуда не уходим: место зеленеет прямо на плане, остальные гаснут, шторка становится короткой карточкой брони. Зелёный = твоё.' },
    ],
  },
  {
    id: 'entry', n: 2, group: 'task',
    title: 'Утром — въезд по QR',
    goal: 'Бронировал вчера или неделю назад — утром подъехал к воротам.',
    covers: 'активное бронирование',
    start: BOOKED,
    steps: [
      { title: 'Вечер накануне', frame: '2.1', note: 'С бронью модуль открывается планом: своё место зелёное — сразу видно, куда ехать. Пропуск заперт до 8:45: заехать можно за 15 минут до начала.', go: morning },
      { title: 'Въезд открыт', frame: '2.3', note: 'Кнопка ожила сама, по часам телефона. До пропуска — один тап, и перед ним человек ещё раз видит, где его место.', go: tap('«Показать пропуск»', { sel: '.sheet .btn', text: 'Показать пропуск' }, { type: 'OPEN_TICKET' }) },
      { title: 'Пропуск', frame: '2.4', note: 'Отдельный спокойный экран: QR крупно, яркость — на максимум. QR сохранён на телефоне в момент брони — под землёй связь не нужна.', go: tap('«Как доехать до места»', { sel: '.tk-card .btn', has: 'Как доехать' }, { type: 'OPEN_ROUTE' }) },
      { title: 'Как доехать', frame: '2.4', note: 'Место обычно находят сами — номер написан на полу. Не нашёл — вид из-за руля, только по кнопке.' },
    ],
  },
  {
    id: 'other', n: 3, group: 'task',
    title: 'Другой день и другое место',
    goal: 'Нужен не завтрашний день и не привычное место.',
    covers: 'выбор даты и времени, выбор места на плане',
    start: [{ type: 'OPEN_BOOKING' }],
    steps: [
      { title: 'План', frame: '1', note: 'Дата и время — одной строкой над планом. Тап открывает шторку.', go: tap('«Завтра 9:00–18:00»', { sel: '.timepill' }, { type: 'OPEN_TIME' }) },
      { title: 'Дата и время', frame: '1.1', note: '7 дней лентой, под каждым — сколько мест свободно. Время шагом 30 минут, не меньше часа.', go: tap('«Чт 1 окт»', { sel: '.day', has: '1 окт' }, { type: 'DRAFT_DATE', date: '2026-10-01' }) },
      { title: 'Выбран четверг', frame: '1.1', note: 'Сводка внизу пересчитана сразу. План не тронут, пока не нажата кнопка.', go: tap('«Показать места»', { sel: '.overlay .btn', text: 'Показать места' }, (s) => ({ type: 'APPLY_TIME', date: s.draft?.date ?? s.date, range: s.draft?.range ?? s.range })) },
      { title: 'План на четверг', frame: '1', note: 'Место 17 свободно и в четверг — выбор сохранился. Нужно другое — тап по любому голубому.', go: tap('место 29', spot(29), { type: 'TAP_SPOT', spotId: '-1:29' }) },
      { title: 'Выбрано место 29', frame: '1', note: 'Выбранное — тёмно-синее. Метка «как в прошлый раз» ушла: место выбрано вручную.', go: tap('«Забронировать»', BOOK, { type: 'SUBMIT' }) },
      sending('Как в сценарии 1.'),
      { title: 'Бронь создана', frame: '2', note: 'Место 29 зеленеет, шторка — бронь на четверг, 1 октября.' },
    ],
  },
  {
    id: 'conflict', n: 4, group: 'task',
    title: 'Место заняли, пока подтверждал',
    goal: 'Коллега забрал место за секунду до тебя.',
    covers: 'место стало недоступно перед подтверждением',
    start: scenario({ conflict: true }),
    steps: [
      { title: 'План', frame: '1', note: 'Всё как обычно. Что место сейчас бронирует коллега, выясняется только при отправке.', go: tap('«Забронировать»', BOOK, { type: 'SUBMIT' }) },
      sending('Сервер отвечает: место уже занято.'),
      { title: 'Место заняли', frame: '1.2', note: 'Бронь не создана — никаких галочек. На плане 17 стало занятым, соседнее 18 подсвечено. «Выбрать вручную» — если соседнее не подходит.', go: tap('«Забронировать 18»', { sel: '.sheet .btn', text: 'Забронировать 18' }, { type: 'ACCEPT_ALT' }) },
      sending('Сразу бронируем 18 — без второго подтверждения.'),
      { title: 'Бронь создана — место 18', frame: '2', note: 'Зеленеет 18. Плашка «Место 18 за вами».' },
    ],
  },
  {
    id: 'none', n: 5, group: 'task',
    title: 'Мест нет',
    goal: 'На нужное время всё занято.',
    covers: 'нет доступных мест',
    start: scenario({ noSpots: true }),
    steps: [
      {
        title: 'Мест нет', frame: '1.3',
        note: 'Не тупик: чипами — ближайшее время и ближайший день, когда места есть. Второй выход — «Сообщить, когда освободится», сценарий 12.',
        go: tap('«С 10:30»', { sel: '.chip', has: 'С 10:30' }, (s) => {
          const later = suggestAlternatives(s.date, s.range, s.now, s.world).later
          return later ? { type: 'APPLY_TIME', date: s.date, range: later.range } : { type: 'CLOSE_OVERLAY' }
        }),
      },
      { title: 'Место на 10:30', frame: '1', note: 'Утренние брони кончаются в 10:00, но брони одного места не встык: между ними 15 минут на ранний въезд. Поэтому с 10:30.', go: tap('«Забронировать»', BOOK, { type: 'SUBMIT' }) },
      sending('Как в сценарии 1.'),
      { title: 'Бронь создана', frame: '2', note: 'Бронь с 10:30 до 18:00, въезд — с 10:15.' },
    ],
  },
  {
    id: 'error', n: 6, group: 'task',
    title: 'Места не загрузились',
    goal: 'Пропал интернет, пока открывался план.',
    covers: 'ошибка загрузки',
    start: scenario({ loadError: true }),
    steps: [
      { title: 'Ошибка загрузки', frame: '1.4', note: 'Строка времени и этажи на месте — дата и время не пропадают. Вместо плана — что случилось и «Повторить».', go: tap('«Повторить»', { sel: '.load-error .btn' }, { type: 'RETRY_LOAD' }) },
      { title: 'Загрузка', frame: '1.4', note: 'Скелетон повторяет форму плана — после загрузки ничего не прыгает.', go: auto },
      { title: 'План', frame: '1', note: 'Место подобрано заново, как при обычном входе.' },
    ],
  },
  {
    id: 'cancel', n: 7, group: 'task',
    title: 'Отмена брони',
    goal: 'Планы поменялись — освободить место для коллег.',
    covers: 'отмена до начала',
    start: BOOKED,
    steps: [
      { title: 'Моя бронь', frame: '2.1', note: 'Правило — в той же строке, что и кнопка: до какого момента можно отменить.', go: tap('«Отменить бронь»', { sel: '.sheet .btn', text: 'Отменить бронь' }, { type: 'OPEN_CANCEL' }) },
      { title: 'Подтверждение', frame: '2.2', note: 'Шторка называет, что именно отменяется: место, день, время. Красная — отменить, «Оставить» — передумать.', go: tap('«Отменить бронь»', { sel: '.overlay .btn', text: 'Отменить бронь' }, { type: 'CONFIRM_CANCEL' }) },
      { title: 'Бронь отменена', frame: '2.2', note: 'План снова для выбора — можно сразу забронировать заново. Плашка «Бронь отменена, место свободно для коллег».' },
    ],
  },
  {
    id: 'hint', n: 8, group: 'task',
    title: 'Почему место серое',
    goal: 'Отличить занятое, закрытое и выбранное.',
    covers: 'как понять разницу между занятым, недоступным и выбранным местом',
    start: [{ type: 'OPEN_BOOKING' }],
    steps: [
      { title: 'План', frame: '1', note: 'Голубые — свободны, тёмно-синее — выбрано. Серые взять нельзя: занятые — сплошные, закрытые — со штриховкой.', go: tap('место 13', spot(13), { type: 'TAP_SPOT', spotId: '-1:13' }) },
      { title: 'Подсказка: занято', frame: '1', note: 'Тап по серому не меняет выбор. Подсказка говорит, с какого времени место можно взять.', go: tap('место 36', spot(36), { type: 'TAP_SPOT', spotId: '-1:36' }) },
      { title: 'Подсказка: закрыто', frame: '1', note: 'Закрытое — до конкретной даты.' },
    ],
  },
  {
    id: 'second', n: 9, group: 'task',
    title: 'Вторую бронь не взять',
    goal: 'Бронь уже есть, а человек тыкает в другое место.',
    covers: 'одна активная бронь',
    start: BOOKED,
    steps: [
      { title: 'Моя бронь', frame: '2.1', note: 'С бронью план — карта к своему месту: остальные места приглушены и не зовут к выбору.', go: tap('место 29', spot(29), { type: 'TAP_SPOT', spotId: '-1:29' }) },
      { title: 'Бронь может быть одна', frame: '2.1', note: 'Правило «одна активная бронь» видно там, где его нарушают. Другое место — через отмену текущей брони.' },
    ],
  },
  {
    id: 'failed', n: 10, group: 'extra',
    title: 'Связь пропала после нажатия',
    goal: 'Нажал «Забронировать» — ответа нет. Бронь есть или нет?',
    start: scenario({ submitFail: true }),
    steps: [
      { title: 'План', frame: '1', note: 'Самый опасный случай: человек нажал и не знает, создалась ли бронь.', go: tap('«Забронировать»', BOOK, { type: 'SUBMIT' }) },
      sending('Ответа нет.'),
      { title: 'Проверяем бронь', frame: '1', note: 'Не пишем «ошибка» сразу — сначала проверяем, дошла ли бронь.', go: auto },
      { title: 'Не получилось', frame: '1', note: 'Честно: брони нет, место 17 всё ещё свободно. Повтор не создаст вторую бронь.', go: tap('«Повторить»', { sel: '.sheet .btn', text: 'Повторить' }, { type: 'SUBMIT' }) },
      sending('Вторая попытка.'),
      { title: 'Бронь создана', frame: '2', note: 'Одна бронь, не две.' },
    ],
  },
  {
    id: 'last-taken', n: 11, group: 'extra',
    title: 'Обычное место занято',
    goal: 'Место 17 на завтра уже у коллеги.',
    start: scenario({ lastTaken: true }),
    steps: [
      { title: 'Подобрано другое место', frame: '1', note: 'Подбор не делает вид, что это «как в прошлый раз»: метка честно говорит, что 17 занято и это ближайшее.', go: tap('«Забронировать»', BOOK, { type: 'SUBMIT' }) },
      sending('Как в сценарии 1.'),
      { title: 'Бронь создана — место 12', frame: '2', note: 'Зеленеет 12. Плашка «Место 12 за вами».' },
    ],
  },
  {
    id: 'notify', n: 12, group: 'extra',
    title: 'Мест нет — подождать',
    goal: 'Ни другое время, ни другой день не подходят.',
    start: scenario({ noSpots: true }),
    steps: [
      { title: 'Мест нет', frame: '1.3', note: 'Если чипы не подходят — подписаться на освобождение.', go: tap('«Сообщить, когда освободится»', { sel: '.btn', has: 'Сообщить' }, { type: 'NOTIFY_ME' }) },
      { title: 'Подписка оформлена', frame: '1.3', note: 'Плашка «Сообщим, как только место освободится». Само уведомление — за границей прототипа.' },
    ],
  },
  {
    id: 'barrier', n: 13, group: 'extra',
    title: 'Въезд через шлагбаум',
    goal: 'Дополнительный вариант въезда: шлагбаум открывается из приложения.',
    start: [...BOOKED, { type: 'SET_ENTRY', entry: 'barrier' }],
    steps: [
      { title: 'Вечер накануне', frame: '2.1', note: 'Шторка та же, что при QR: способ въезда виден только на пропуске.', go: morning },
      { title: 'Въезд открыт', frame: '2.3', note: 'Пропуск открылся по часам телефона.', go: tap('«Показать пропуск»', { sel: '.sheet .btn', text: 'Показать пропуск' }, { type: 'OPEN_TICKET' }) },
      { title: 'Пропуск — шлагбаум', frame: '2.4-в', note: 'Вместо QR — кнопка. Нажать у ворот — шлагбаум поднимется.', go: tap('«Открыть шлагбаум»', { sel: '.entry .btn', has: 'Открыть шлагбаум' }, { type: 'SHOW_TOAST', kind: 'success', text: 'Шлагбаум открывается' }) },
      { title: 'Шлагбаум открывается', frame: '2.4-в', note: 'Плашка подтверждает, что команда ушла.' },
    ],
  },
  {
    id: 'menu', n: 14, group: 'extra',
    title: 'В календарь и поделиться',
    goal: 'Редкие действия с бронью.',
    start: BOOKED,
    steps: [
      { title: 'Моя бронь', frame: '2.1', note: 'Редкие действия спрятаны в «···», чтобы не спорить с въездом и маршрутом.', go: tap('«···»', { sel: '.sheet [aria-label="Ещё"]' }, { type: 'OPEN_MENU' }) },
      { title: 'Меню', frame: '2.1', note: 'Два пункта: добавить в календарь и поделиться.', go: tap('«Добавить в календарь»', { sel: '.menu-list button', has: 'календарь' }, { type: 'SHOW_TOAST', kind: 'success', text: 'Добавлено в календарь' }) },
      { title: 'Добавлено', frame: '2.1', note: 'Плашка «Добавлено в календарь».' },
    ],
  },
  {
    id: 'host', n: 15, group: 'extra',
    title: 'Вход из приложения БЦ',
    goal: 'Необязательный: как модуль встраивается. Приложение БЦ не проектируем — серые заглушки.',
    start: [],
    steps: [
      { title: 'Главная приложения', frame: 'вход', note: 'Карточка парковки — шторка модуля в миниатюре: место, метка, «когда» и «Забронировать». Бронь на завтра — одним тапом, без плана.', go: tap('«Забронировать»', { sel: '.widget .btn', has: 'Забронировать' }, { type: 'REPEAT_LAST' }) },
      { title: 'Отправка', frame: 'вход', note: 'Загрузка — прямо в кнопке.', go: auto },
      { title: 'Бронь создана', frame: '2', note: 'Сразу план с зелёным местом, как в сценарии 1.' },
    ],
  },
]

const apply = (s: State, list: Do[]) => list.reduce((x, a) => reducer(x, typeof a === 'function' ? a(x) : a), s)

/** Состояние прототипа на каждом шаге — той же логикой, что работает в живом прототипе */
export function flowStates(f: Flow): State[] {
  const out: State[] = []
  let s = apply(hostState(), f.start)
  f.steps.forEach((st, i) => {
    out.push(s)
    const go = st.go
    if (!go) return
    if (go.kind === 'auto') {
      const next = autoStep(s)
      if (!next) throw new Error(`${f.id}: шаг ${i + 1} сам дальше не идёт`)
      s = reducer(s, next.action)
    } else {
      s = apply(s, go.do)
    }
  })
  return out
}

/** Для ссылки ?flow=<сценарий>&step=<шаг>: открыть живой прототип на этом шаге */
export function flowStepState(id: string, step: number): State | null {
  const f = FLOWS.find((x) => x.id === id)
  return f ? flowStates(f)[step] ?? null : null
}

/** Варианты без переходов: кладутся рядом для сравнения */
export interface VariantRow {
  id: string
  title: string
  note: string
  items: { title: string; frame: string; note: string; start: Do[] }[]
}

export const VARIANT_ROWS: VariantRow[] = [
  {
    id: 'entry',
    title: 'Пропуск: три способа въезда',
    note: 'Один экран, отличается только блок въезда. QR — основной, номер и шлагбаум — дополнительные.',
    items: [
      { title: 'QR — основной', frame: '2.4', note: 'Крупно, яркость на максимум. Поднести к считывателю или показать охране.', start: [...BOOKED, { type: 'SET_DEMO_STAGE', stage: 'open' }, { type: 'OPEN_TICKET' }] },
      { title: 'Номер машины', frame: '2.4-б', note: 'Камера у ворот узнает номер — доставать телефон не нужно.', start: [...BOOKED, { type: 'SET_ENTRY', entry: 'plate' }, { type: 'SET_DEMO_STAGE', stage: 'open' }, { type: 'OPEN_TICKET' }] },
      { title: 'Шлагбаум из приложения', frame: '2.4-в', note: 'Кнопка вместо QR. Как нажимают — сценарий 13.', start: [...BOOKED, { type: 'SET_ENTRY', entry: 'barrier' }, { type: 'SET_DEMO_STAGE', stage: 'open' }, { type: 'OPEN_TICKET' }] },
    ],
  },
  {
    id: 'stages',
    title: 'Шторка брони по времени',
    note: 'Зелёный не меняется — это «твоё». Стадию показывают текст и замок.',
    items: [
      { title: 'Вечер накануне', frame: '2.1', note: 'Пропуск заперт до 8:45, отменить можно до 9:00.', start: BOOKED },
      { title: 'Въезд открыт', frame: '2.3', note: 'За 15 минут до начала: пропуск доступен, отменить ещё можно.', start: [...BOOKED, { type: 'SET_DEMO_STAGE', stage: 'open' }] },
      { title: 'Бронь идёт', frame: '2.5', note: '«Идёт · до 18:00». Отмены нет, пропуск открыт до конца брони.', start: [...BOOKED, { type: 'SET_DEMO_STAGE', stage: 'active' }] },
    ],
  },
  {
    id: 'tried',
    title: 'Пробовали: всё о брони в шторке',
    note: 'Без экрана пропуска: номер строкой, шлагбаум кнопкой, QR — отдельно. Отказались: пять действий в шторке спорят с планом и читаются кашей. Лишний тап до спокойного экрана дешевле.',
    items: [
      { title: 'QR — заперт в шторке', frame: 'пробовали', note: 'Кнопка QR, маршрут и отмена — всё в одной шторке.', start: [...BOOKED, { type: 'SET_ALL_IN_SHEET', on: true }] },
      { title: 'Номер — строкой в шторке', frame: 'пробовали', note: 'Номер машины прямо над кнопкой маршрута.', start: [...BOOKED, { type: 'SET_ALL_IN_SHEET', on: true }, { type: 'SET_ENTRY', entry: 'plate' }] },
    ],
  },
]

export function variantState(row: number, i: number): State | null {
  const v = VARIANT_ROWS[row]?.items[i]
  return v ? apply(hostState(), v.start) : null
}
