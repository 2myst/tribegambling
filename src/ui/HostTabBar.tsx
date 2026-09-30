import { Home } from './icons'

/**
 * Таббар приложения БЦ — заглушка. Настоящая только «Главная»: там живёт карточка парковки.
 * Остальные разделы приложения не проектируем, поэтому вместо них серые формы
 */
export function HostTabBar() {
  return (
    <nav className="tabbar" aria-label="Разделы приложения">
      <span className="tb-item on"><Home size={26} /><span>Главная</span></span>
      {[1, 2, 3].map((i) => (
        <span key={i} className="tb-item" aria-hidden="true"><span className="tb-ic" /><span className="tb-l" /></span>
      ))}
    </nav>
  )
}
