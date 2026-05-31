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
type SecMap = Map<string, Record<string, string | number | undefined>>

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

  const usdRub = extractUsdRub(marketdataMap, securitiesMap)

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

/**
 * Извлекает цену валюты: пробует WAPRICE из marketdata,
 * при отсутствии — PREVPRICE из securities, затем делит на FACEVALUE.
 */
function getCurrencyPrice(
  md: Record<string, string | number | undefined> | undefined,
  sec: Record<string, string | number | undefined> | undefined
): number | undefined {
  const waprice = md ? (getNumericField(md, 'WAPRICE') ?? undefined) : undefined
  if (waprice !== undefined) return adjustForFaceValue(waprice, sec)

  const previousPrice = sec ? (getNumericField(sec, 'PREVPRICE') ?? undefined) : undefined
  if (previousPrice !== undefined) return adjustForFaceValue(previousPrice, sec)

  return undefined
}

/** Делит цену на FACEVALUE. Возвращает цену за 1 единицу валюты. */
function adjustForFaceValue(price: number, sec: Record<string, string | number | undefined> | undefined): number {
  const faceValue = getFaceValue(sec)
  return price / faceValue
}

/**
 * Извлекает FACEVALUE из записи securities.
 * Возвращает 1, если поле отсутствует, null, 0 или отрицательное.
 */
function getFaceValue(sec: Record<string, string | number | undefined> | undefined): number {
  if (!sec) return 1
  const number_ = Number(sec['FACEVALUE'])
  return Number.isFinite(number_) && number_ > 0 ? number_ : 1
}

/** Извлекает обязательный курс USD/RUB. Бросает ошибку, если цена отсутствует. */
function extractUsdRub(marketdataMap: SecMap, securitiesMap: SecMap): number {
  const secId = 'USD000UTSTOM'
  const md = marketdataMap.get(secId)
  const sec = securitiesMap.get(secId)
  const price = getCurrencyPrice(md, sec)
  if (price === undefined) {
    throw new Error('MOEX: required USD/RUB price (USD000UTSTOM) is missing or zero')
  }
  return price
}

/** Параметры для tryAddCurrency: что искать и куда складывать. */
type CurrencyParameters = {
  marketdataMap: SecMap
  securitiesMap: SecMap
  secId: string
  ticker: string
  rates: CurrencyRateInfo[]
}

/** Пытается найти и добавить валюту с заданным SECID. Молча пропускает, если нет цены. */
function tryAddCurrency(parameters: CurrencyParameters): void {
  const { marketdataMap, securitiesMap, secId, ticker, rates } = parameters
  const md = marketdataMap.get(secId)
  const sec = securitiesMap.get(secId)

  const price = getCurrencyPrice(md, sec)
  if (price === undefined) return

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
type BuildEntryParameters = {
  marketdataMap: SecMap
  secId: string
  sec: Record<string, string | number | undefined>
  ticker: string
}

/** Строит CurrencyRateInfo для одной RUB_TOM-валюты. Возвращает undefined, если цены нет. */
function tryBuildCurrencyEntry(parameters: BuildEntryParameters): CurrencyRateInfo | undefined {
  const { marketdataMap, secId, sec, ticker } = parameters
  const md = marketdataMap.get(secId)

  const price = getCurrencyPrice(md, sec)
  if (price === undefined) return undefined

  const name = getStringField(sec, 'SECNAME')
  const unit = CURRENCY_UNITS[ticker.toUpperCase()] ?? ticker.toUpperCase()

  return { ticker, priceInRub: price, unit, name }
}
