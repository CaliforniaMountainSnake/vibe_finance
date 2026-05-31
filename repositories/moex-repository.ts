import { MS_PER_SEC } from '@/lib/time-helpers'
import type { ExchangeRate } from '@/entities/exchange-rate'
import type { FinanceApiRepositoryInterface } from '@/repositories/finance-api-repository-interface'
import { parseCurrencyRates } from './moex/parse-currencies'
import type { IndexEntry } from './moex/parse-indexes'
import { parseIndexes } from './moex/parse-indexes'
import { parseShares } from './moex/parse-shares'
import { resolveTickers } from './moex/resolve-tickers'
import { buildCurrencyToRubMap, convertToBtcPrice } from './moex/price-converter'

/** URL API MOEX ISS для валют (CETS, WAPRICE). */
const CURRENCY_URL =
  'https://iss.moex.com/iss/engines/currency/markets/selt/boards/CETS/securities.json' +
  '?iss.meta=off&securities.columns=SECID,SECNAME,FACEVALUE,PREVPRICE&marketdata.columns=SECID,WAPRICE'

/** URL API MOEX ISS для индексов (CURRENTVALUE). */
const INDEX_URL =
  'https://iss.moex.com/iss/engines/stock/markets/index/securities.json' +
  '?iss.meta=off&securities.columns=SECID,BOARDID,CURRENCYID,NAME&marketdata.columns=SECID,CURRENTVALUE'

/** URL API MOEX ISS для акций (WAPRICE по BOARDID). */
const SHARES_URL =
  'https://iss.moex.com/iss/engines/stock/markets/shares/securities.json' +
  '?iss.meta=off&securities.columns=SECID,BOARDID,SECNAME&marketdata.columns=SECID,BOARDID,WAPRICE,MARKETPRICE'

/** Интервал между последовательными запросами к API (мс). */
const FETCH_INTERVAL_MS = 100

/**
 * Репозиторий для загрузки и парсинга курсов с МосБиржи (MOEX).
 *
 * Выполняет 3 последовательных запроса к MOEX ISS API:
 * 1. Валюты (USD/RUB, CNY/RUB и т.д.)
 * 2. Индексы (MOEXBTC, IMOEX, RTSI и т.д.)
 * 3. Акции/ETF (TQBR, TQTF, TQTY)
 *
 * Все цены конвертируются в формат «X per BTC».
 */
export class MoexRepository implements FinanceApiRepositoryInterface {
  readonly sourceName = 'moex' as const

  /**
   * Загружает курсы с MOEX ISS API (3 запроса с интервалом 100 мс).
   *
   * @throws Если любой из запросов завершился ошибкой
   *   или если обязательные курсы (USD/RUB, BTC/USD) отсутствуют.
   */
  async fetchRates(): Promise<ExchangeRate[]> {
    const [currencyRaw, indexRaw, sharesRaw] = await this.fetchAllResponses()
    return this.parseRatesFromRaw(currencyRaw, indexRaw, sharesRaw)
  }

  /**
   * Не поддерживается — MOEX требует 3 отдельных ответа.
   * Используйте fetchRates или parseRatesFromRaw.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  parseRates(_raw: string): ExchangeRate[] {
    throw new Error('MoexRepository.parseRates is not supported. Use fetchRates or parseRatesFromRaw.')
  }

  /**
   * Парсит три JSON-строки (валюты, индексы, акции) в ExchangeRate[].
   */
  parseRatesFromRaw(currencyRaw: string, indexRaw: string, sharesRaw: string): ExchangeRate[] {
    const currencyJson = parseJsonOrThrow(currencyRaw, 'currencies')
    const indexJson = parseJsonOrThrow(indexRaw, 'indexes')
    const sharesJson = parseJsonOrThrow(sharesRaw, 'shares')

    return this.buildExchangeRates(currencyJson, indexJson, sharesJson)
  }

  private async fetchAllResponses(): Promise<[string, string, string]> {
    const currencyResp = await this.fetchJson(CURRENCY_URL)
    await delay(FETCH_INTERVAL_MS)

    const indexResp = await this.fetchJson(INDEX_URL)
    await delay(FETCH_INTERVAL_MS)

    const sharesResp = await this.fetchJson(SHARES_URL)

    return [currencyResp, indexResp, sharesResp]
  }

  private async fetchJson(url: string): Promise<string> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`MOEX API error: ${response.status} ${response.statusText}`)
    }
    return response.text()
  }

  private buildExchangeRates(
    currencyJson: ReturnType<typeof parseJsonOrThrow>,
    indexJson: ReturnType<typeof parseJsonOrThrow>,
    sharesJson: ReturnType<typeof parseJsonOrThrow>
  ): ExchangeRate[] {
    const { usdRub, rates: currencyRates } = parseCurrencyRates(currencyJson)

    const btcUsdPrice = extractBtcPrice(indexJson)
    const btcRubPrice = btcUsdPrice * usdRub

    const updatedAt = Math.floor(Date.now() / MS_PER_SEC)
    const currencyToRub = buildCurrencyToRubMap(currencyRates)
    currencyToRub.set('USD', usdRub)

    // BTC
    const result: ExchangeRate[] = [{ source: 'moex', ticker: 'btc', btcPrice: 1, updatedAt }]

    // Валюты
    appendCurrencyRates(result, currencyRates, { usdRub, btcRub: btcRubPrice, currencyToRub, updatedAt })

    // Индексы
    const indexEntries = parseIndexes(indexJson)
    const convertContext = { currencyToRub, btcRub: btcRubPrice, updatedAt }
    appendIndexEntries(result, indexEntries, convertContext)

    // Акции
    appendShareEntries(result, sharesJson, { btcRub: btcRubPrice, currencyToRub, updatedAt })

    return result
  }
}

/** Извлекает цену BTC/USD из ответа индексов. Бросает ошибку, если отсутствует. */
function extractBtcPrice(indexJson: ReturnType<typeof parseJsonOrThrow>): number {
  const entries = parseIndexes(indexJson)
  const btcEntry = entries.find((entry) => entry.secId === 'moexbtc')
  if (!btcEntry || btcEntry.priceInCurrency <= 0) {
    throw new Error('MOEX: BTC/USD price (MOEXBTC) is missing or zero')
  }
  return btcEntry.priceInCurrency
}

/** Контекст конвертации: курсы валют, BTC/RUB и таймстамп. */
type ConvertContext = {
  currencyToRub: Map<string, number>
  btcRub: number
  updatedAt: number
}

/** Конвертирует массив индексов в ExchangeRate и добавляет в результат. */
function appendIndexEntries(result: ExchangeRate[], entries: IndexEntry[], context: ConvertContext): void {
  const deduped = resolveTickers(entries)

  for (const entry of deduped) {
    // Пропускаем MOEXBTC — уже добавлен как базовый тикер 'btc'
    if (entry.secId === 'moexbtc') continue

    const btcPrice = convertToBtcPrice({
      priceInCurrency: entry.priceInCurrency,
      currency: entry.currency,
      currencyToRub: context.currencyToRub,
      btcRub: context.btcRub,
    })
    if (btcPrice === undefined) continue

    result.push({
      source: 'moex',
      ticker: entry.ticker,
      btcPrice,
      name: entry.name,
      updatedAt: context.updatedAt,
    })
  }
}

/** Параметры для appendCurrencyRates. */
type CurrencyRateContext = {
  usdRub: number
  btcRub: number
  currencyToRub: Map<string, number>
  updatedAt: number
}

/** Добавляет курсы валют в result. */
function appendCurrencyRates(
  result: ExchangeRate[],
  rates: ReturnType<typeof parseCurrencyRates>['rates'],
  context: CurrencyRateContext
): void {
  const { usdRub, btcRub, currencyToRub, updatedAt } = context

  for (const rate of rates) {
    if (rate.ticker === 'rub') {
      result.push({
        source: 'moex',
        ticker: 'rub',
        btcPrice: btcRub,
        unit: rate.unit,
        updatedAt,
      })
      continue
    }
    if (rate.ticker === 'usd') {
      result.push({
        source: 'moex',
        ticker: 'usd',
        btcPrice: btcRub / usdRub,
        unit: rate.unit,
        updatedAt,
      })
      continue
    }

    const btcPrice = convertToBtcPrice({
      priceInCurrency: rate.priceInRub,
      currency: 'RUB',
      currencyToRub,
      btcRub,
    })
    if (btcPrice !== undefined) {
      result.push({
        source: 'moex',
        ticker: rate.ticker,
        btcPrice,
        unit: rate.unit,
        name: rate.name,
        updatedAt,
      })
    }
  }
}

/** Добавляет акции в result после дедупликации тикеров. */
function appendShareEntries(
  result: ExchangeRate[],
  sharesJson: ReturnType<typeof parseJsonOrThrow>,
  context: { btcRub: number; currencyToRub: Map<string, number>; updatedAt: number }
): void {
  const shareEntries = resolveTickers(parseShares(sharesJson))

  for (const entry of shareEntries) {
    const btcPrice = convertToBtcPrice({
      priceInCurrency: entry.priceInCurrency,
      currency: entry.currency,
      currencyToRub: context.currencyToRub,
      btcRub: context.btcRub,
    })
    if (btcPrice === undefined) continue

    result.push({
      source: 'moex',
      ticker: entry.ticker,
      btcPrice,
      name: entry.name,
      updatedAt: context.updatedAt,
    })
  }
}

/** Парсит JSON-строку, бросает ошибку с именем секции при неудаче. */
function parseJsonOrThrow(raw: string, label: string) {
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error(`MOEX: failed to parse ${label} JSON`)
  }
}

/** Возвращает Promise, который резолвится через указанное кол-во миллисекунд. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
