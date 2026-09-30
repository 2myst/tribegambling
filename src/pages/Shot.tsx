import { AppProvider } from '../state/useApp'
import { fromDemo } from '../state/store'
import { App } from '../shell/App'

/** ?page=shot&demo=<кадр> — один экран 393 × 852 в левом верхнем углу, без рамки: для скриншотов на страницу кейса */
export function Shot() {
  const demo = new URLSearchParams(location.search).get('demo') ?? 'plan'
  return (
    <div style={{ position: 'fixed', left: 0, top: 0, width: 393, height: 852, overflow: 'hidden', background: 'var(--bg)' }}>
      <div className="phone" style={{ borderRadius: 0, boxShadow: 'none', width: 393, height: 852 }}>
        <AppProvider initial={fromDemo(demo)} frozen>
          <App />
        </AppProvider>
      </div>
    </div>
  )
}
