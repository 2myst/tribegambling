/** Вид из-за руля: проезд с местами по сторонам, цель подсвечена. Статичный кадр — анимация потом */
export function POV({ width = 345, height = 230, side, depth, num }: { width?: number; height?: number; side: -1 | 1; depth: number; num: number }) {
  const y0 = height * 0.24
  const cx = width / 2
  const f = width * 0.56
  const P = (X: number, d: number) => `${cx + (X * f) / d},${y0 + (height - y0) / d}`
  const ds = Array.from({ length: 9 }, (_, k) => Math.pow(1.3, k))
  const Xr = 0.36
  const dMax = 9
  const spots = []
  for (let k = 7; k >= 0; k--) {
    const dn = ds[k] * 1.035
    const df = ds[k + 1] * 0.965
    for (const s of [-1, 1] as const) {
      const target = s === side && k === Math.min(7, depth)
      const cls = target ? 'pov-target' : (k + (s > 0 ? 1 : 0)) % 3 === 0 ? 'pov-free' : 'pov-busy'
      spots.push(<path key={`${k}${s}`} className={cls} d={`M${P(s * 0.44, dn)} L${P(s * 1.75, dn)} L${P(s * 1.75, df)} L${P(s * 0.44, df)} Z`} />)
      if (target) {
        const [tx, ty] = P(s * 1.05, (dn + df) / 2).split(',').map(Number)
        spots.push(<text key="t" x={tx} y={ty + 4} textAnchor="middle" className="pov-num">{num}</text>)
      }
    }
  }
  return (
    <svg className="pov" width="100%" viewBox={`0 0 ${width} ${height}`} aria-label={`Вид из-за руля: место ${num}`}>
      <rect width={width} height={y0 + 1} className="pov-sky" />
      <rect y={y0} width={width} height={height - y0} className="pov-floor" />
      <path className="pov-road" d={`M${P(-Xr, 1)} L${P(-Xr, dMax)} L${P(Xr, dMax)} L${P(Xr, 1)} Z`} />
      {spots}
      {[1, 2, 3, 4].map((k) => {
        const [x, y] = P(0, ds[k]).split(',').map(Number)
        const s = 4.2 / Math.sqrt(ds[k])
        return <path key={k} className="pov-arrow" d={`M${x - s} ${y + s * 0.6} L${x} ${y - s * 0.6} L${x + s} ${y + s * 0.6}`} />
      })}
    </svg>
  )
}
