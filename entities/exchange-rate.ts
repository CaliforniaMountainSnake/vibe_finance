import type { Ticker } from './ticker'

export type SourceName = 'binance' | 'bybit' | 'coingecko' | 'moex'

export type ExchangeRate = Ticker & {
  btcPrice: number // 205015.665
  updatedAt: number // 1739339558, unix timestamp
}
