import { describe, it, expect } from 'vitest'
import { BinanceRepository } from '@/repositories/binance-repository'
import { BINANCE_MOCK_JSON } from '@/tests/mocks/binance-data'
import { assertFinanceApiRates } from '../helpers/assert-finance-api-rates'

describe('BinanceRepository', () => {
  const repo = new BinanceRepository()

  assertFinanceApiRates(() => repo.parseRates(BINANCE_MOCK_JSON))

  it('включает USDT в результат', () => {
    const rates = repo.parseRates(BINANCE_MOCK_JSON)
    const usdt = rates.find((r) => r.ticker === 'usdt')
    expect(usdt).toBeDefined()
    if (!usdt) throw new Error('usdt not found')
    expect(usdt.btcPrice).toBeGreaterThan(0)
    expect(usdt.source).toBe('binance')
  })
})
