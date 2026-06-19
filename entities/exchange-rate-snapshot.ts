import type { TickerBaseInfo } from './ticker'

export type ExchangeRateSnapshot = TickerBaseInfo & {
  date: string
  btcPrice: number
}
