import { useId } from 'react'
import type { Floor } from '../domain/types'
import { buildSpots } from '../domain/layout'

export type SpotLook = 'free' | 'selected' | 'unavailable' | 'closed' | 'taken' | 'suggested' | 'mine' | 'muted'

/** Геометрия плана в пикселях под фактический размер области */
export function planGeometry(width: number, height: number) {
  const M = 12
  const LANE = Math.round(width * 0.117) // ≈ 46 при 393
  const COL = (width - 2 * M - 2 * LANE) / 4
  const TOP = 30
  const BOTTOM = 26
  const rowH = (height - TOP - BOTTOM) / 10
  const x = { c0: M, l1: M + COL, c1: M + COL + LANE, c2: M + 2 * COL + LANE, l2: M + 3 * COL + LANE, c3: M + 3 * COL + 2 * LANE }
  const colX = [x.c0, x.c1, x.c2, x.c3]
  return { M, LANE, COL, TOP, BOTTOM, rowH, x, colX }
}

/**
 * Путь по парковке — одна линия по центру проездов: въезд внизу справа (точка),
 * вверх, разворот по перемычке, вниз к выезду слева (стрелка).
 * По линии раз в несколько секунд пробегает стрелка — показывает, куда ехать
 */
function Route({ a1, a2, top, bottom }: { a1: number; a2: number; top: number; bottom: number }) {
  const R = 10
  const d = `M${a2} ${bottom} V${top + R} Q${a2} ${top} ${a2 - R} ${top} H${a1 + R} Q${a1} ${top} ${a1} ${top + R} V${bottom}`
  // Цикл 4.2 с: 1.9 с ход — плавный разгон и мягкое торможение, дальше пауза 2.3 с
  const times = '0;0.45;1'
  const ease = '0.6 0 0.25 1;0 0 1 1'
  return (
    <g className="route" aria-hidden="true">
      <path className="route-line" d={d} />
      <circle className="route-start" cx={a2} cy={bottom} r={3} />
      <path className="route-end" d={`M${a1 - 4.5} ${bottom - 5} L${a1} ${bottom} L${a1 + 4.5} ${bottom - 5}`} />
      <g className="route-flow">
        <path className="route-dash" d={d} pathLength={100} strokeDasharray="16 120">
          <animate attributeName="stroke-dashoffset" values="16;-84;-84" keyTimes={times} calcMode="spline" keySplines={ease} dur="4.2s" repeatCount="indefinite" />
        </path>
        <path className="route-head" d="M-5 -5 L0 0 L-5 5">
          <animateMotion path={d} keyPoints="0;1;1" keyTimes={times} calcMode="spline" keySplines={ease} rotate="auto" dur="4.2s" repeatCount="indefinite" />
        </path>
        <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.03;0.41;0.5;1" dur="4.2s" repeatCount="indefinite" />
      </g>
    </g>
  )
}

/** Одно место на плане. Зона тапа — вся ячейка вместе с зазорами */
export function SpotCell({ x, y, w, h, num, look, onTap, hatchId, skew = 0 }: { x: number; y: number; w: number; h: number; num: number; look: SpotLook; onTap?: () => void; hatchId: string; skew?: number }) {
  const r = 5
  const cx = x + w / 2
  const cy = y + h / 2
  return (
    <g className={`spot ${look}`} onClick={onTap} role={onTap ? 'button' : undefined} aria-label={`Место ${num}`}>
      <g transform={skew ? `translate(${cx} ${cy}) skewY(${skew}) translate(${-cx} ${-cy})` : undefined}>
      <rect className="hit" x={x - 1.5} y={y - 2} width={w + 3} height={h + 4} />
      {(look === 'selected' || look === 'mine') && <rect className="ring" x={x - 3.5} y={y - 3.5} width={w + 7} height={h + 7} rx={r + 3} />}
      <rect className="body" x={x} y={y} width={w} height={h} rx={r} style={look === 'closed' ? { fill: `url(#${hatchId})` } : undefined} />
      </g>
      <text x={x + w / 2} y={y + h / 2 + 4.5} textAnchor="middle">{num}</text>
    </g>
  )
}

/**
 * Наискосок: места «ёлочкой» по ходу движения — въезд в место смотрит навстречу машине.
 * Вверх по правому проезду: колонки 2 и 3 поднимаются от проезда; вниз по левому: 0 и 1 опускаются
 */
const SLANT: Record<number, number> = { 0: -10, 1: 10, 2: 10, 3: -10 }

export function FloorPlan({ floor, looks, width, height, onTap, slant = false }: { floor: Floor; looks: Record<string, SpotLook>; width: number; height: number; onTap?: (spotId: string) => void; slant?: boolean }) {
  const hatchId = `hatch-${useId().replace(/:/g, '')}`
  const g = planGeometry(width, height)
  const { LANE, TOP, rowH, x, colX } = g
  const a1 = x.l1 + LANE / 2
  const a2 = x.l2 + LANE / 2
  const rowY = (r: number) => TOP + r * rowH
  return (
    <svg className="floorplan" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <pattern id={hatchId} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="var(--spot-unavailable)" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--spot-closed-hatch)" strokeWidth="2.2" />
        </pattern>
      </defs>
      {/* Концы пути — чуть ниже последнего ряда, не у края плана */}
      <Route a1={a1} a2={a2} top={(TOP - 4) / 2} bottom={rowY(10) + 8} />
      {buildSpots(floor).map((s) => {
        const back = s.col === 1 ? -1 : s.col === 2 ? 1 : 0 // двойной ряд — спиной к спине с зазором 2px
        const sx = colX[s.col] + 1.5 + (back > 0 ? 1 : 0)
        const w = g.COL - 3 - (back !== 0 ? 1 : 0)
        return (
          <SpotCell key={s.id} x={sx} y={rowY(s.row) + 2} w={w} h={rowH - 4} num={s.num} look={looks[s.id] ?? 'unavailable'} hatchId={hatchId} skew={slant ? SLANT[s.col] : 0} onTap={onTap ? () => onTap(s.id) : undefined} />
        )
      })}
    </svg>
  )
}
