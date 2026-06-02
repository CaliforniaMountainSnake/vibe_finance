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
      throw new Error(`Binance API error: ${String(response.status)} ${response.statusText}`)
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
    const data = JSON.parse(raw) as BinanceTicker[]
    const usdtPriceMap = buildUsdtPriceMap(data)

    const btcUsdtPrice = usdtPriceMap.get('btc')
    if (btcUsdtPrice === undefined) {
      throw new Error('Binance API did not return BTCUSDT pair')
    }

    return buildExchangeRates(usdtPriceMap, btcUsdtPrice)
  }
}

function buildUsdtPriceMap(data: BinanceTicker[]): Map<string, number> {
  const usdtPairs = data.filter((t) => t.symbol.toLowerCase().endsWith('usdt'))
  const map = new Map<string, number>()
  for (const t of usdtPairs) {
    const ticker = t.symbol.toLowerCase().replace(/usdt$/, '')
    const price = Number.parseFloat(t.price)
    if (price > 0) {
      map.set(ticker, price)
    }
  }
  return map
}

function buildExchangeRates(usdtPriceMap: Map<string, number>, btcUsdtPrice: number): ExchangeRate[] {
  const now = Math.floor(Date.now() / MS_PER_SEC)
  const result: ExchangeRate[] = []
  for (const [ticker, usdtPrice] of usdtPriceMap) {
    result.push({
      source: 'binance' as const,
      ticker,
      btcPrice: btcUsdtPrice / usdtPrice,
      updatedAt: now,
    })
  }
  result.push({
    source: 'binance' as const,
    ticker: 'usdt',
    btcPrice: btcUsdtPrice,
    updatedAt: now,
  })
  return result
}
