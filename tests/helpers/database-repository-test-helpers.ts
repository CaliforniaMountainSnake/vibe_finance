import { type ExchangeRate } from '@/entities/exchange-rate'
import { type ExchangeRateSnapshot } from '@/entities/exchange-rate-snapshot'
import { type Ticker } from '@/entities/ticker'
import { type TickerPair } from '@/entities/ticker-pair'

export function makeRate(overrides: Partial<ExchangeRate> = {}): ExchangeRate {
  return {
    source: 'binance',
    ticker: 'btc',
    btcPrice: 1,
    updatedAt: 1_700_000_000,
    ...overrides,
  }
}

export function makeSnapshot(overrides: Partial<ExchangeRateSnapshot> & { date: string }): ExchangeRateSnapshot {
  return {
    source: 'binance',
    ticker: 'btc',
    btcPrice: 1,
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
