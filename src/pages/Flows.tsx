import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { AppProvider } from '../state/useApp'
import { autoStep, type State } from '../state/store'
import { App } from '../shell/App'
import { FLOWS, VARIANT_ROWS, flowStates, variantState, type Flow, type Go, type Target } from '../flows/flows'
import './pages.css'

const W = 393
const H = 852
const PER_ROW = 4
/** Стрелка между кадрами */
const GAP = 128
/** Поле слева: отсюда стрелка входит в строку-продолжение */
const EDGE = 56

const sec = (ms: number) => `${String(ms / 1000).replace('.', ',')} с`

/** Найти в кадре то, по чему тапают */
function findTarget(root: Element, t: Target): Element | null {
  const norm = (x: string | null) => (x ?? '').replace(/\s+/g, ' ').trim()
  for (const el of root.querySelectorAll(t.sel)) {
    const text = norm(el.textContent)
    if (t.text !== undefined && text !== t.text) continue
    if (t.has !== undefined && !text.includes(t.has)) continue
    return el
  }
  return null
}

interface Box { x: number; y: number; w: number; h: number; r: number }

/** Где в кадре цель тапа. План рисуется после замера области, поэтому ждём изменений в кадре */
function useTarget(slot: RefObject<HTMLDivElement | null>, phone: RefObject<HTMLDivElement | null>, target: Target | undefined, k: number) {
  const [box, setBox] = useState<Box | null>(null)
  const [lost, setLost] = useState(false)
  useLayoutEffect(() => {
    const root = slot.current
    const app = phone.current
    if (!root || !app || !target) return
    let raf = 0
    const measure = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = findTarget(app, target)
        if (!el) {
          setBox(null)
          setLost(true)
          return
        }
        const a = root.getBoundingClientRect()
        const b = el.getBoundingClientRect()
        const r = el instanceof HTMLElement ? parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0 : 6
        const next = { x: b.left - a.left, y: b.top - a.top, w: b.width, h: b.height, r: Math.min(r * k, b.height / 2) }
        setBox((prev) => (prev && prev.x === next.x && prev.y === next.y && prev.w === next.w && prev.h === next.h ? prev : next))
        setLost(false)
      })
    }
    measure()
    const mo = new MutationObserver(measure)
    mo.observe(app, { childList: true, subtree: true })
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    document.fonts?.ready.then(measure)
    return () => {
      cancelAnimationFrame(raf)
      mo.disconnect()
      ro.disconnect()
    }
  }, [slot, phone, target, k])
  return { box, lost }
}

/** Кадр: живой прототип в замороженном состоянии, цель тапа обведена */
function Frame({ state, k, target, onHot }: { state: State; k: number; target?: Target; onHot?: (y: number) => void }) {
  const slot = useRef<HTMLDivElement>(null)
  const phone = useRef<HTMLDivElement>(null)
  const { box, lost } = useTarget(slot, phone, target, k)
  useEffect(() => {
    if (box && onHot) onHot(box.y + box.h / 2)
  }, [box, onHot])
  return (
    <div className="fl-phone" ref={slot} style={{ width: W * k, height: H * k }}>
      <div className="fl-scale" style={k === 1 ? undefined : { transform: `scale(${k})` }}>
        <div className="phone" ref={phone}>
          <AppProvider initial={state} frozen>
            <App />
          </AppProvider>
        </div>
      </div>
      {box && <div className="fl-ring" style={{ left: box.x - 4, top: box.y - 4, width: box.w + 8, height: box.h + 8, borderRadius: box.r + 4 }} />}
      {target && lost && <div className="fl-lost">не нашёл, куда тапать</div>}
    </div>
  )
}

/** Стрелка: mid — между кадрами, out — уходит в правый край, in — выходит из левого края на следующей строке */
function Arrow({ go, delay, y, h, part }: { go: Go; delay?: number; y: number; h: number; part: 'mid' | 'out' | 'in' }) {
  const label = part === 'in' ? null : go.kind === 'auto' ? `сам · ${sec(delay ?? 0)}` : go.label
  const width = part === 'mid' ? GAP : part === 'in' ? EDGE : undefined
  return (
    <div className={`fl-arrow ${go.kind} ${part}`} style={{ height: h, width }}>
      {label && <span className="fl-label" style={{ top: y }}>{label}</span>}
      <i className="fl-line" style={{ top: y }} />
      {part !== 'in' && <i className="fl-dot" style={{ top: y }} />}
      {part !== 'out' && <i className="fl-tip" style={{ top: y }} />}
    </div>
  )
}

function Caption({ meta, frame, title, note, href }: { meta: string; frame: string; title: string; note: string; href?: string }) {
  return (
    <div className="fl-cap">
      <div className="fl-meta"><span>{meta}</span><span>кадр {frame}</span></div>
      <b>{title}</b>
      <p>{note}</p>
      {href && <a href={href} target="_blank" rel="noreferrer">Открыть живьём ↗</a>}
    </div>
  )
}

/** Сценарий строками по 4 кадра */
function FlowBoard({ flow, k }: { flow: Flow; k: number }) {
  const states = useMemo(() => flowStates(flow), [flow])
  const [hot, setHot] = useState<Record<number, number>>({})
  const report = useCallback((i: number, y: number) => setHot((m) => (m[i] === y ? m : { ...m, [i]: y })), [])
  const reporters = useMemo(() => flow.steps.map((_, i) => (y: number) => report(i, y)), [flow, report])
  const h = H * k
  // Стрелка выходит на высоте цели тапа; «сам» и «прошло время» продолжают линию входящей стрелки
  const yOut = (i: number): number => {
    const go = flow.steps[i].go
    if (go?.kind === 'tap') return hot[i] ?? h / 2
    return i > 0 ? yOut(i - 1) : h / 2
  }
  const rows: number[][] = []
  for (let i = 0; i < flow.steps.length; i += PER_ROW) rows.push(flow.steps.slice(i, i + PER_ROW).map((_, j) => i + j))
  return (
    <>
      {rows.map((row, r) => (
        <div className="fl-row" key={r}>
          {r === 0 ? <div className="fl-edge" /> : <Arrow part="in" go={flow.steps[row[0] - 1].go!} y={yOut(row[0] - 1)} h={h} />}
          {row.map((i, j) => {
            const st = flow.steps[i]
            const go = st.go
            return (
              <Fragment key={i}>
                <div className="fl-step" style={{ width: W * k }}>
                  <Frame state={states[i]} k={k} target={go?.kind === 'tap' ? go.target : undefined} onHot={reporters[i]} />
                  <Caption meta={`Шаг ${i + 1}`} frame={st.frame} title={st.title} note={st.note} href={`/?flow=${flow.id}&step=${i}`} />
                </div>
                {go && <Arrow part={j < row.length - 1 ? 'mid' : 'out'} go={go} delay={go.kind === 'auto' ? autoStep(states[i])?.delay : undefined} y={yOut(i)} h={h} />}
              </Fragment>
            )
          })}
        </div>
      ))}
    </>
  )
}

const GROUPS = [['task', 'По заданию'], ['extra', 'Дополнительно']] as const

/** Доска сценариев для переноса в Figma: жёсткие цепочки кадров, один тап на кадр */
export function Flows() {
  const [k, setK] = useState(() => ((new URLSearchParams(location.hash.split('?')[1] ?? '').get('k') ?? new URLSearchParams(location.search).get('k')) === '1' ? 1 : 0.55))
  const scale = (v: number) => {
    setK(v)
    history.replaceState(null, '', v === 1 ? '#/flows?k=1' : '#/flows')
  }
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  const variants = useMemo(() => VARIANT_ROWS.map((row, r) => row.items.map((_, i) => variantState(r, i)!)), [])
  return (
    <div className="page flows-page">
      <header className="page-head fl-pad">
        <a href="#/" className="page-back">← Прототип</a>
        <h1>Сценарии</h1>
        <p>Жёсткие цепочки для прототипа в Figma: на каждом кадре один тап, он обведён. Стрелка ведёт на следующий кадр. Не влез в строку — стрелка уходит в край и продолжается из края строкой ниже.</p>
        <div className="fl-legend">
          <span><i className="lg-ring" />куда тапнуть</span>
          <span><i className="lg-line" />по тапу · On tap</span>
          <span><i className="lg-line auto" />сам, через N секунд · After delay</span>
          <span><i className="lg-line time" />прошло время</span>
        </div>
        <div className="fl-tools">
          <div className="fl-switch">
            <button type="button" className={k !== 1 ? 'on' : ''} onClick={() => scale(0.55)}>55%</button>
            <button type="button" className={k === 1 ? 'on' : ''} onClick={() => scale(1)}>100% — для импорта в Figma</button>
          </div>
          <a href="#/frames">Все кадры</a>
          <a href="#/kit">Кит</a>
        </div>
        {GROUPS.map(([g, title]) => (
          <nav className="kit-nav fl-toc" key={g}>
            <span>{title}</span>
            {FLOWS.filter((f) => f.group === g).map((f) => (
              <a key={f.id} href="#/flows" onClick={(e) => { e.preventDefault(); jump(`flow-${f.id}`) }}>{f.n} · {f.title}</a>
            ))}
          </nav>
        ))}
      </header>

      {GROUPS.map(([g, title]) => (
        <Fragment key={g}>
          <h2 className="fl-group fl-pad">{title}</h2>
          {FLOWS.filter((f) => f.group === g).map((f) => (
            <section className="fl" id={`flow-${f.id}`} key={f.id}>
              <div className="fl-head fl-pad">
                <span className="fl-n">{f.n}</span>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.goal}{f.covers && <> <em>По заданию: {f.covers}.</em></>}</p>
                </div>
              </div>
              <FlowBoard flow={f} k={k} />
            </section>
          ))}
        </Fragment>
      ))}

      <h2 className="fl-group fl-pad">Варианты без переходов</h2>
      {VARIANT_ROWS.map((row, r) => (
        <section className="fl" id={`flow-v-${row.id}`} key={row.id}>
          <div className="fl-head fl-pad">
            <span className="fl-n">В{r + 1}</span>
            <div>
              <h3>{row.title}</h3>
              <p>{row.note}</p>
            </div>
          </div>
          <div className="fl-row">
            <div className="fl-edge" />
            {row.items.map((v, i) => (
              <Fragment key={v.title}>
                <div className="fl-step" style={{ width: W * k }}>
                  <Frame state={variants[r][i]} k={k} />
                  <Caption meta={`Вариант ${i + 1}`} frame={v.frame} title={v.title} note={v.note} />
                </div>
                {i < row.items.length - 1 && <div className="fl-gap" style={{ width: GAP }} />}
              </Fragment>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
