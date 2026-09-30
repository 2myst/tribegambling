import { useApp } from '../state/useApp'
import { HostScreen } from '../screens/Host'
import { PlanScreen } from '../screens/Plan'
import { TicketScreen } from '../screens/TicketScreen'
import { TimeSheet } from '../screens/TimeSheet'
import { CancelSheet, MenuSheet, ReleaseSheet, RouteSheet } from '../screens/Overlays'
import { Toast } from '../ui/controls'

/** Один экземпляр приложения внутри рамки телефона */
export function App() {
  const { s } = useApp()
  return (
    <>
      {s.screen === 'host' && <HostScreen />}
      {s.screen === 'plan' && <PlanScreen />}
      {s.screen === 'ticket' && <TicketScreen />}
      {s.overlay === 'time' && <TimeSheet />}
      {s.overlay === 'cancel' && <CancelSheet />}
      {s.overlay === 'release' && <ReleaseSheet />}
      {s.overlay === 'route' && <RouteSheet />}
      {s.overlay === 'menu' && <MenuSheet />}
      {s.toast && <Toast key={s.toast.id} kind={s.toast.kind} text={s.toast.text} />}
      <div className="homebar" />
    </>
  )
}
