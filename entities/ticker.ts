import type { SourceName } from './exchange-rate'

export type Ticker = {
  source: SourceName // binance | coingecko
  ticker: string // gel
  name?: string // Georgian Lari
  unit?: string // ₾
}
