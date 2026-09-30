import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './tokens.css'
import './app.css'
import './ui/ui.css'
import { PrototypePage } from './shell/PrototypePage'
import { Kit } from './pages/Kit'
import { Frames } from './pages/Frames'
import { Flows } from './pages/Flows'
import { Screens } from './pages/Screens'
import { Shot } from './pages/Shot'
import { Flow, FlowKit } from './pages/Flow'
import { isDev } from './shell/dev'

// ?page=kit — запасной вход без # (захват в Figma занимает # своими параметрами)
const route = () => {
  const page = new URLSearchParams(location.search).get('page')
  if (page) return `/${page}`
  return location.hash.replace(/^#/, '').split('?')[0] || '/'
}

function Root() {
  const [r, setR] = useState(route)
  useEffect(() => {
    const on = () => setR(route())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  // Служебные страницы автора — только в режиме ?dev, проверяющие видят прототип
  if (isDev()) {
    if (r.startsWith('/kit')) return <Kit />
    if (r.startsWith('/frames')) return <Frames />
    if (r.startsWith('/flows')) return <Flows />
    if (r.startsWith('/screens')) return <Screens />
    if (r.startsWith('/shot')) return <Shot />
    if (r.startsWith('/flowkit')) return <FlowKit />
    if (r.startsWith('/flow')) return <Flow />
  }
  return <PrototypePage />
}

createRoot(document.getElementById('root')!).render(<Root />)
