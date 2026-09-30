import { useEffect, useState, type ReactNode } from 'react'

const H = 852

/** Рамка телефона 393 × 852. На компьютере масштабируется по высоте окна, на телефоне — во весь экран */
export function PhoneFrame({ children, fixed = false }: { children: ReactNode; fixed?: boolean }) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    if (fixed) return
    const fit = () => setScale(Math.min(1, (window.innerHeight - 48) / H))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [fixed])
  const style = fixed || scale === 1 ? undefined : { transform: `scale(${scale})`, transformOrigin: 'center center', margin: `${((scale - 1) * H) / 2}px ${((scale - 1) * 393) / 2}px` }
  return (
    <div className="phone-slot" style={style}>
      <div className="phone">{children}</div>
    </div>
  )
}
