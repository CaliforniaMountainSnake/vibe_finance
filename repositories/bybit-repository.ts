import { MS_PER_SEC } from '@/lib/time-helpers'
import type { ExchangeRate } from '@/entities/exchange-rate'
import type { FinanceApiRepositoryInterface } from '@/repositories/finance-api-repository-interface'

type BybitTicker = {
  symbol: string
  bid1Price: string
  ask1Price: string
}

type BybitResponse = {
  retCode: number
  retMsg: string
  result: {
    category: string
    list: BybitTicker[]
  }
}

export class BybitRepository implements FinanceApiRepositoryInterface {
  readonly sourceName = 'bybit' as const

  private readonly baseUrl = 'https://api.bybit.com/v5/market/tickers?category=spot'

  async fetchRates(): Promise<ExchangeRate[]> {
    const response = await fetch(this.baseUrl)
    if (!response.ok) {
      throw new Error(`Bybit API error: ${String(response.status)} ${response.statusText}`)
    }

    const text = await response.text()
    return this.parseRates(text)
  }

  parseRates(raw: string): ExchangeRate[] {
    const data = JSON.parse(raw) as BybitResponse

    if (data.retCode !== 0) {
      throw new Error(`Bybit API error: ${data.retMsg}`)
    }

    const usdtPriceMap = buildUsdtPriceMap(data.result.list)

    const btcUsdtPrice = usdtPriceMap.get('btc')
    if (btcUsdtPrice === undefined) {
      throw new Error('Bybit API did not return BTCUSDT pair')
    }

    return buildExchangeRates(usdtPriceMap, btcUsdtPrice)
  }
}

const MID_PRICE_DIVISOR = 2

function buildUsdtPriceMap(data: BybitTicker[]): Map<string, number> {
  const usdtPairs = data.filter((t) => t.symbol.endsWith('USDT'))
  const map = new Map<string, number>()
  for (const t of usdtPairs) {
    const ticker = t.symbol.replace(/USDT$/, '').toLowerCase()
    const bid = Number.parseFloat(t.bid1Price)
    const ask = Number.parseFloat(t.ask1Price)
    const price = (bid + ask) / MID_PRICE_DIVISOR
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
      source: 'bybit' as const,
      ticker,
      btcPrice: btcUsdtPrice / usdtPrice,
      updatedAt: now,
    })
  }
  result.push({
    source: 'bybit' as const,
    ticker: 'usdt',
    btcPrice: btcUsdtPrice,
    updatedAt: now,
  })
  return result
}
