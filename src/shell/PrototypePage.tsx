import { useEffect, useRef } from 'react'
import { AppProvider, useApp } from '../state/useApp'
import { fromDemo, initialState } from '../state/store'
import { flowStepState } from '../flows/flows'
import { App } from './App'
import { DemoPanel } from './DemoPanel'
import { PhoneFrame } from './PhoneFrame'

/** Кнопка «назад» браузера и жест назад: каждый экран и шторка — запись в истории */
function HistorySync() {
  const { s, d } = useApp()
  const depth = (s.screen === 'host' ? 0 : 1) + (s.overlay || s.screen === 'ticket' ? 1 : 0)
  const prev = useRef(depth)
  useEffect(() => {
    if (depth > prev.current) history.pushState({ depth }, '')
    prev.current = depth
  }, [depth])
  useEffect(() => {
    const on = () => d({ type: 'BACK' })
    window.addEventListener('popstate', on)
    return () => window.removeEventListener('popstate', on)
  }, [d])
  return null
}

/** ?flow=<сценарий>&step=<шаг> — шаг со страницы сценариев, ?demo=<кадр> — кадр из галереи */
function startState() {
  const q = new URLSearchParams(location.search)
  const flow = q.get('flow')
  if (flow) return flowStepState(flow, Number(q.get('step') ?? 0)) ?? initialState()
  const demo = q.get('demo')
  return demo ? fromDemo(demo) : initialState()
}

export function PrototypePage() {
  return (
    <AppProvider initial={startState()}>
      <HistorySync />
      <div className="stage">
        <PhoneFrame>
          <App />
        </PhoneFrame>
        <DemoPanel />
      </div>
    </AppProvider>
  )
}
