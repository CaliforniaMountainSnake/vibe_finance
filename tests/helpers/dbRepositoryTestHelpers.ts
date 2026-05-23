import { type ExchangeRate } from '@/entities/ExchangeRate'
import { type Ticker } from '@/entities/Ticker'
import { type TickerPair } from '@/entities/TickerPair'

export function makeRate(overrides: Partial<ExchangeRate> = {}): ExchangeRate {
  return {
    source: 'binance',
    ticker: 'btc',
    btcPrice: 1,
    updatedAt: 1700000000,
    ...overrides,
  }
}

export function ticker(source: string, t: string): Ticker {
  return { source: source as Ticker['source'], ticker: t.toLowerCase() }
}

export function pair(from: Ticker, to: Ticker): TickerPair {
  return { from, to }
}

/** Шорткат для пары тикеров с одинаковым source (для старых тестов). */
export function sameSourcePair(source: string, fromTicker: string, toTicker: string): TickerPair {
  return pair(ticker(source, fromTicker), ticker(source, toTicker))
}
