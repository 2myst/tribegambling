const KEY = 'parking-dev'

/**
 * Служебный режим автора: этажи, сценарии, все кадры и кит в демо-панели.
 * Проверяющие видят только то, что нужно для проверки. Включить — ?dev, браузер запоминает; выключить — ?dev=0
 */
export function isDev(): boolean {
  const q = new URLSearchParams(location.search).get('dev')
  try {
    if (q === '0') localStorage.removeItem(KEY)
    else if (q !== null) localStorage.setItem(KEY, '1')
    return localStorage.getItem(KEY) === '1'
  } catch {
    return q !== null && q !== '0'
  }
}
