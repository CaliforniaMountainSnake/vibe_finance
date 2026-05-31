import { MS_PER_SEC } from '@/lib/time-helpers'
import type { ExchangeRate } from '@/entities/exchange-rate'
import type { FinanceApiRepositoryInterface } from '@/repositories/finance-api-repository-interface'

type BinanceTicker = {
  symbol: string
  price: string
}

export class BinanceRepository implements FinanceApiRepositoryInterface {
  readonly sourceName = 'binance' as const

  private readonly baseUrl = 'https://api.binance.com/api/v3/ticker/price'

  /**
   * Получить курсы валют.
   */
  async fetchRates(): Promise<ExchangeRate[]> {
    const response = await fetch(this.baseUrl)
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status} ${response.statusText}`)
    }

    const text = await response.text()
    return this.parseRates(text)
  }

  /**
   * Распарсить сырой ответ API в ExchangeRate[].
   *
   * @example Формат входной строки.
   * ```json
   * [
   *  {
   *      "symbol": "BTCUSDT",
   *      "price": "76808.44000000"
   *  }
   * ]
   * ```
   */
  parseRates(raw: string): ExchangeRate[] {
    const data: BinanceTicker[] = JSON.parse(raw)

    // Keep only pairs to USDT
    const usdtPairs = data.filter((t) => t.symbol.toLowerCase().endsWith('usdt'))

    // Build a price map: ticker -> USDT price (base currency -> how many USDT per 1 unit)
    const usdtPriceMap = new Map<string, number>()
    for (const t of usdtPairs) {
      const ticker = t.symbol.toLowerCase().replace(/usdt$/, '')
      const price = Number.parseFloat(t.price)
      if (price > 0) {
        usdtPriceMap.set(ticker, price)
      }
    }

    // Need BTCUSDT price to compute btcPrice for all tickers
    const btcUsdtPrice = usdtPriceMap.get('btc')
    if (btcUsdtPrice === undefined) {
      throw new Error('Binance API did not return BTCUSDT pair')
    }

    const result: ExchangeRate[] = []
    for (const [ticker, usdtPrice] of usdtPriceMap) {
      // btcPrice = how much 1 BTC costs in this currency
      // All prices are in USDT, so btcPrice = btcUsdtPrice / usdtPrice
      const btcPrice = btcUsdtPrice / usdtPrice
      result.push({
        source: 'binance',
        ticker,
        btcPrice,
        updatedAt: Math.floor(Date.now() / MS_PER_SEC),
      })
    }

    // USDT is the quote currency in all pairs, so it doesn't appear as a base
    // ticker in the API response. Add it explicitly: btcPrice = how many USDT per 1 BTC.
    result.push({
      source: 'binance',
      ticker: 'usdt',
      btcPrice: btcUsdtPrice,
      updatedAt: Math.floor(Date.now() / MS_PER_SEC),
    })

    return result
  }
}
