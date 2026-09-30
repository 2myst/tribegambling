import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }
const base = (size = 24): SVGProps<SVGSVGElement> => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
})

export const Calendar = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="4" y="5.5" width="16" height="14" rx="3" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></svg>)
export const Clock = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></svg>)
export const Bars = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M5 19v-6M10 19V8M15 19v-9M20 19V5" /></svg>)
export const ChevronRight = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="m9 6 6 6-6 6" /></svg>)
export const ChevronLeft = ({ size, ...p }: P) => (<svg {...base(size)} {...p} strokeWidth={2.2}><path d="M15 5 8 12l7 7" /></svg>)
export const Close = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>)
export const Bell = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 2h-14z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></svg>)
export const Play = ({ size, ...p }: P) => (<svg {...base(size)} {...p} fill="currentColor" stroke="none"><path d="M8 5.5v13l10.5-6.5z" /></svg>)
export const Repeat = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M17 3.5 20 6.5l-3 3" /><path d="M4 12v-1a4.5 4.5 0 0 1 4.5-4.5H20" /><path d="M7 20.5 4 17.5l3-3" /><path d="M20 12v1a4.5 4.5 0 0 1-4.5 4.5H4" /></svg>)
export const More = ({ size, ...p }: P) => (<svg {...base(size)} {...p} fill="currentColor" stroke="none"><circle cx="5.5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="18.5" cy="12" r="1.8" /></svg>)
export const Plus = ({ size, ...p }: P) => (<svg {...base(size)} {...p} strokeWidth={2}><path d="M12 4v16M4 12h16" /></svg>)
export const Minus = ({ size, ...p }: P) => (<svg {...base(size)} {...p} strokeWidth={2}><path d="M4 12h16" /></svg>)
export const Check = ({ size, ...p }: P) => (<svg {...base(size)} {...p} strokeWidth={2.2}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>)
export const Alert = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M12 4 21 19.5H3z" /><path d="M12 10v4M12 17v.01" /></svg>)
export const CloudOff = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M7.5 18.5h9.5a3.5 3.5 0 0 0 1.4-6.7A6 6 0 0 0 8 8.2" /><path d="M5.2 10.3A4.2 4.2 0 0 0 7.5 18.5" /><path d="M3.5 3.5l17 17" /></svg>)
export const ParkingP = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="4" y="4" width="16" height="16" rx="4.5" /><path d="M10 16.5V7.5h3.2a2.8 2.8 0 0 1 0 5.6H10" /></svg>)
export const Home = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" /></svg>)
export const Pass = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><circle cx="9" cy="11" r="2" /><path d="M6.5 15.5c.6-1.2 1.5-1.8 2.5-1.8s1.9.6 2.5 1.8M14 10h4M14 13h3" /></svg>)
export const Grid = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="4.5" y="4.5" width="6" height="6" rx="1.5" /><rect x="13.5" y="4.5" width="6" height="6" rx="1.5" /><rect x="4.5" y="13.5" width="6" height="6" rx="1.5" /><rect x="13.5" y="13.5" width="6" height="6" rx="1.5" /></svg>)
export const User = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><circle cx="12" cy="9" r="3.5" /><path d="M5.5 19.5c1.3-3 3.8-4.5 6.5-4.5s5.2 1.5 6.5 4.5" /></svg>)
export const Door = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M6 20V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v15" /><path d="M4 20h16M13.5 12.5v.01" /></svg>)
export const Coffee = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" /><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8.5 3.5v2.5M12 3.5v2.5" /></svg>)
export const Meeting = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="4" y="9" width="16" height="6" rx="1.5" /><path d="M7 15v4M17 15v4M8 5.5h8" /></svg>)
export const CalendarPlus = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="4" y="5.5" width="16" height="14" rx="3" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4M12 12.5v5M9.5 15h5" /></svg>)
export const Share = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M12 15V4M8 7.5 12 4l4 3.5" /><path d="M7 11H6a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 18 11h-1" /></svg>)
export const Barrier = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="3.5" y="12" width="4" height="8" rx="1" /><path d="M7.5 14.5 20.5 8.5" strokeWidth={2.2} /><path d="M11 13l1.5-3.2M15 11.2l1.5-3.2" /></svg>)
export const Lock = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="5.5" y="10.5" width="13" height="9.5" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></svg>)
export const Qr = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="4" y="4" width="6" height="6" rx="1.2" /><rect x="14" y="4" width="6" height="6" rx="1.2" /><rect x="4" y="14" width="6" height="6" rx="1.2" /><path d="M14 14h2.5v2.5M20 14v.01M17.5 20H20v-3M14 18.5V20" /></svg>)
export const Sun = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><circle cx="12" cy="12" r="3.5" /><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M6 18l1.4-1.4M16.6 7.4 18 6" /></svg>)
