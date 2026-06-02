import { it, expect } from 'vitest'
import type { ExchangeRate } from '@/entities/exchange-rate'

function assertRateShape(rate: ExchangeRate) {
  // source
  expect(typeof rate.source).toBe('string')
  expect(['binance', 'bybit', 'coingecko', 'moex']).toContain(rate.source)

  // ticker
  expect(typeof rate.ticker).toBe('string')
  expect(rate.ticker).toBe(rate.ticker.toLowerCase())

  // name (optional)
  if (rate.name !== undefined) {
    expect(typeof rate.name).toBe('string')
    expect(rate.name.length).toBeGreaterThan(0)
  }

  // unit (optional)
  if (rate.unit !== undefined) {
    expect(typeof rate.unit).toBe('string')
    expect(rate.unit.length).toBeGreaterThan(0)
  }

  // btcPrice
  expect(typeof rate.btcPrice).toBe('number')
  expect(Number.isFinite(rate.btcPrice)).toBe(true)
  expect(rate.btcPrice).toBeGreaterThan(0)

  // updatedAt
  expect(typeof rate.updatedAt).toBe('number')
  expect(Number.isFinite(rate.updatedAt)).toBe(true)
  expect(rate.updatedAt).toBeGreaterThanOrEqual(0)
  const date = new Date(rate.updatedAt * 1000)
  expect(date.getTime()).toBeGreaterThan(0)
}

export function assertFinanceApiRates(getRates: () => ExchangeRate[]) {
  it('returns a non-empty list', () => {
    const rates = getRates()
    expect(rates.length).toBeGreaterThan(0)
  })

  it('every rate has valid shape', () => {
    const rates = getRates()
    for (const rate of rates) {
      assertRateShape(rate)
    }
  })

  it('has no duplicate tickers', () => {
    const rates = getRates()
    const tickers = rates.map((r) => r.ticker)
    expect(new Set(tickers).size).toBe(tickers.length)
  })

  it('has BTC with btcPrice strictly 1', () => {
    const rates = getRates()
    const btc = rates.find((r) => r.ticker === 'btc')
    expect(btc).toBeDefined()
    if (!btc) throw new Error('btc not found in rates')
    expect(btc.btcPrice).toBe(1)
  })
}
