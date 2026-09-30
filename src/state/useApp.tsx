import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import { autoStep, initialState, reducer, type Action, type State } from './store'

const Ctx = createContext<{ s: State; d: (a: Action) => void } | null>(null)

/**
 * Состояние одного экземпляра прототипа. frozen — для галереи кадров:
 * таймеры не двигают состояние, кадр стоит как нарисованный.
 */
export function AppProvider({ initial, frozen = false, children }: { initial?: State; frozen?: boolean; children: ReactNode }) {
  const [s, d] = useReducer(reducer, initial ?? initialState())

  useEffect(() => {
    const next = frozen ? null : autoStep(s)
    if (!next) return
    const t = setTimeout(() => d(next.action), next.delay)
    return () => clearTimeout(t)
    // s читаем только ради sheet и load — они и есть зависимости
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.sheet, s.load, frozen])

  useEffect(() => {
    if (frozen || !s.toast) return
    const id = s.toast.id
    const t = setTimeout(() => d({ type: 'DISMISS_TOAST', id }), 2800)
    return () => clearTimeout(t)
  }, [s.toast, frozen])

  useEffect(() => {
    if (frozen || !s.hint) return
    const id = s.hint.id
    const t = setTimeout(() => d({ type: 'DISMISS_HINT', id }), 2600)
    return () => clearTimeout(t)
  }, [s.hint, frozen])

  return <Ctx.Provider value={{ s, d }}>{children}</Ctx.Provider>
}

export function useApp() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp вне AppProvider')
  return v
}
