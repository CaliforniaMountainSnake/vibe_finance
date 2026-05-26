import { MS_PER_SEC } from '@/lib/time-helpers'
import type { ExchangeRate } from '@/entities/ExchangeRate'
import type { FinanceApiRepositoryInterface } from '@/repositories/FinanceApiRepositoryInterface'
import { parseCurrencyRates } from './moex/parse-currencies'
import type { IndexEntry } from './moex/parse-indexes'
import { parseIndexes } from './moex/parse-indexes'
import type { ShareEntry } from './moex/parse-shares'
import { parseShares } from './moex/parse-shares'
import { buildCurrencyToRubMap, convertToBtcPrice } from './moex/price-converter'

/** URL API MOEX ISS для валют (CETS, WAPRICE). */
const CURRENCY_URL =
  'https://iss.moex.com/iss/engines/currency/markets/selt/boards/CETS/securities.json' +
  '?iss.meta=off&marketdata.columns=SECID,WAPRICE&securities.columns=SECID,SECNAME'

/** URL API MOEX ISS для индексов (CURRENTVALUE). */
const INDEX_URL =
  'https://iss.moex.com/iss/engines/stock/markets/index/securities.json' +
  '?iss.meta=off&securities.columns=SECID,BOARDID,CURRENCYID,NAME&marketdata.columns=SECID,CURRENTVALUE'

/** URL API MOEX ISS для акций (WAPRICE по BOARDID). */
const SHARES_URL =
  'https://iss.moex.com/iss/engines/stock/markets/shares/securities.json' +
  '?iss.meta=off&securities.columns=SECID,BOARDID,SECNAME&marketdata.columns=SECID,BOARDID,WAPRICE'

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

    // BTC — из индексов
    const btcUsdPrice = extractBtcPrice(indexJson)
    const btcRubPrice = btcUsdPrice * usdRub

    const updatedAt = Math.floor(Date.now() / MS_PER_SEC)
    const currencyToRub = buildCurrencyToRubMap(currencyRates)
    // Добавляем USD/RUB, чтобы конвертер мог работать с USD
    currencyToRub.set('USD', usdRub)

    const result: ExchangeRate[] = []

    // BTC
    result.push({
      source: 'moex',
      ticker: 'btc',
      btcPrice: 1,
      updatedAt,
    })

    // Валюты
    for (const rate of currencyRates) {
      if (rate.ticker === 'rub') {
        result.push({
          source: 'moex',
          ticker: 'rub',
          btcPrice: btcRubPrice,
          unit: rate.unit,
          updatedAt,
        })
        continue
      }
      if (rate.ticker === 'usd') {
        result.push({
          source: 'moex',
          ticker: 'usd',
          btcPrice: btcRubPrice / usdRub,
          unit: rate.unit,
          updatedAt,
        })
        continue
      }

      const btcPrice = convertToBtcPrice({
        priceInCurrency: rate.priceInRub,
        currency: 'RUB',
        currencyToRub,
        btcRub: btcRubPrice,
      })
      if (btcPrice !== null) {
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

    // Индексы
    const indexEntries = parseIndexes(indexJson)
    const convertCtx = { currencyToRub, btcRub: btcRubPrice, updatedAt }
    appendEntries(result, indexEntries, convertCtx)

    // Акции
    const shareEntries = parseShares(sharesJson)
    appendEntries(result, shareEntries, convertCtx)

    return result
  }
}

/** Извлекает цену BTC/USD из ответа индексов. Бросает ошибку, если отсутствует. */
function extractBtcPrice(indexJson: ReturnType<typeof parseJsonOrThrow>): number {
  const entries = parseIndexes(indexJson)
  const btcEntry = entries.find((e) => e.ticker === 'moexbtc_rtsi_usd')
  if (!btcEntry || btcEntry.priceInCurrency <= 0) {
    throw new Error('MOEX: BTC/USD price (MOEXBTC) is missing or zero')
  }
  return btcEntry.priceInCurrency
}

/** Общий тип для индексов и акций — оба имеют priceInCurrency, currency, name. */
type PricedEntry = IndexEntry | ShareEntry

/** Контекст конвертации: курсы валют, BTC/RUB и таймстамп. */
type ConvertContext = {
  currencyToRub: Map<string, number>
  btcRub: number
  updatedAt: number
}

/** Конвертирует массив PricedEntry в ExchangeRate и добавляет в результат. */
function appendEntries(result: ExchangeRate[], entries: PricedEntry[], ctx: ConvertContext): void {
  for (const entry of entries) {
    // Пропускаем MOEXBTC — уже добавлен как базовый тикер 'btc'
    if ('currency' in entry && entry.ticker === 'moexbtc_rtsi_usd') continue

    const btcPrice = convertToBtcPrice({
      priceInCurrency: entry.priceInCurrency,
      currency: entry.currency,
      currencyToRub: ctx.currencyToRub,
      btcRub: ctx.btcRub,
    })
    if (btcPrice === null) continue

    result.push({
      source: 'moex',
      ticker: entry.ticker,
      btcPrice,
      name: entry.name,
      updatedAt: ctx.updatedAt,
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
