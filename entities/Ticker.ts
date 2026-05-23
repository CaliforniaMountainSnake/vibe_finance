import type { SourceName } from './ExchangeRate'

export type Ticker = {
  source: SourceName // binance | coingecko
  ticker: string // gel
  name?: string // Georgian Lari
  unit?: string // ₾
}
