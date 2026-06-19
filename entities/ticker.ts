import type { SourceName } from './exchange-rate'

export type Ticker = TickerBaseInfo & TickerExtraInfo

export type TickerBaseInfo = {
  source: SourceName // binance | coingecko
  ticker: string // gel
}

export type TickerExtraInfo = {
  name?: string // Georgian Lari
  unit?: string // ₾
}
