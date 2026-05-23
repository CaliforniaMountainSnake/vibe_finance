import type { Ticker } from './Ticker'

export type SourceName = 'binance' | 'coingecko'

export type ExchangeRate = Ticker & {
  btcPrice: number // 205015.665
  updatedAt: number // 1739339558, unix timestamp
}
