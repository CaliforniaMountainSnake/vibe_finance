import type { MoexResponse, CurrencyRateInfo } from './types'
import { buildRowMap, getNumericField, getStringField } from './row-helpers'

/** Маппинг тикеров валют на символы единиц измерения. */
const CURRENCY_UNITS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  CNY: '¥',
  KZT: '₸',
  TRY: '₺',
  AMD: '֏',
  BTC: '₿',
  GLD: 'Au',
  SLV: 'Ag',
  PLD: 'Pd',
  PLT: 'Pt',
}

export { CURRENCY_UNITS }

/** Map от SECID к разобранной записи. */
type SecMap = Map<string, Record<string, string | number | null>>

/**
 * Парсит ответ валют MOEX (валюты, торгуемые на СЕЛТ/CETS).
 *
 * Извлекает обязательный курс USD/RUB (SECID = USD000UTSTOM),
 * затем собирает дополнительные валюты: EUR (специальный SECID)
 * и все SECID, оканчивающиеся на RUB_TOM.
 *
 * @returns Объект с курсом USD/RUB и массивом валютных курсов в RUB.
 */
export function parseCurrencyRates(currencyJson: MoexResponse): {
  usdRub: number
  rates: CurrencyRateInfo[]
} {
  const securitiesMap = buildRowMap(currencyJson.securities)
  const marketdataMap = buildRowMap(currencyJson.marketdata)

  const usdRub = extractUsdRub(marketdataMap)

  const rates: CurrencyRateInfo[] = [
    { ticker: 'usd', priceInRub: usdRub, unit: CURRENCY_UNITS['USD'] ?? 'USD' },
    { ticker: 'rub', priceInRub: 1, unit: CURRENCY_UNITS['RUB'] ?? 'RUB' },
  ]

  // EUR (специальный SECID)
  tryAddCurrency({ marketdataMap, securitiesMap, secId: 'EUR_RUB__TOM', ticker: 'eur', rates })

  // Остальные валюты, оканчивающиеся на RUB_TOM
  addRubTomCurrencies(securitiesMap, marketdataMap, rates)

  return { usdRub, rates }
}

/** Извлекает обязательный курс USD/RUB. Бросает ошибку, если цена отсутствует. */
function extractUsdRub(marketdataMap: SecMap): number {
  const md = marketdataMap.get('USD000UTSTOM')
  const price = md ? getNumericField(md, 'WAPRICE') : null
  if (price === null) {
    throw new Error('MOEX: required USD/RUB price (USD000UTSTOM) is missing or zero')
  }
  return price
}

/** Параметры для tryAddCurrency: что искать и куда складывать. */
type CurrencyParams = {
  marketdataMap: SecMap
  securitiesMap: SecMap
  secId: string
  ticker: string
  rates: CurrencyRateInfo[]
}

/** Пытается найти и добавить валюту с заданным SECID. Молча пропускает, если нет цены. */
function tryAddCurrency(params: CurrencyParams): void {
  const { marketdataMap, securitiesMap, secId, ticker, rates } = params
  const md = marketdataMap.get(secId)
  if (!md) return

  const price = getNumericField(md, 'WAPRICE')
  if (price === null) return

  const sec = securitiesMap.get(secId)
  const name = sec ? getStringField(sec, 'SECNAME') : undefined
  const unit = CURRENCY_UNITS[ticker.toUpperCase()] ?? ticker.toUpperCase()

  rates.push({ ticker, priceInRub: price, unit, name })
}

/** Перебирает securities с суффиксом RUB_TOM и добавляет их как валюты. */
function addRubTomCurrencies(securitiesMap: SecMap, marketdataMap: SecMap, rates: CurrencyRateInfo[]): void {
  const known = new Set(rates.map((r) => r.ticker.toUpperCase()))

  for (const [secId, sec] of securitiesMap) {
    if (!secId.endsWith('RUB_TOM')) continue

    const ticker = secId.replace(/RUB_TOM$/, '').toLowerCase()
    if (known.has(ticker.toUpperCase())) continue

    const entry = tryBuildCurrencyEntry({ marketdataMap, secId, sec, ticker })
    if (!entry) continue

    known.add(ticker.toUpperCase())
    rates.push(entry)
  }
}

/** Параметры для tryBuildCurrencyEntry. */
type BuildEntryParams = {
  marketdataMap: SecMap
  secId: string
  sec: Record<string, string | number | null>
  ticker: string
}

/** Строит CurrencyRateInfo для одной RUB_TOM-валюты. Возвращает null, если цены нет. */
function tryBuildCurrencyEntry(params: BuildEntryParams): CurrencyRateInfo | null {
  const { marketdataMap, secId, sec, ticker } = params
  const md = marketdataMap.get(secId)
  if (!md) return null

  const price = getNumericField(md, 'WAPRICE')
  if (price === null) return null

  const name = getStringField(sec, 'SECNAME')
  const unit = CURRENCY_UNITS[ticker.toUpperCase()] ?? ticker.toUpperCase()

  return { ticker, priceInRub: price, unit, name }
}
