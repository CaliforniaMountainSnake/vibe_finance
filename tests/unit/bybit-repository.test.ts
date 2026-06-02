import { describe, it, expect } from 'vitest'
import { BybitRepository } from '@/repositories/bybit-repository'
import { BYBIT_MOCK_JSON } from '@/tests/mocks/bybit-data'
import { assertFinanceApiRates } from '../helpers/assert-finance-api-rates'

describe('BybitRepository — парсинг ответа', () => {
  const repo = new BybitRepository()

  assertFinanceApiRates(() => repo.parseRates(BYBIT_MOCK_JSON))

  it('включает USDT в результат', () => {
    const rates = repo.parseRates(BYBIT_MOCK_JSON)
    const usdt = rates.find((r) => r.ticker === 'usdt')
    expect(usdt).toBeDefined()
    if (!usdt) throw new Error('usdt not found')
    expect(usdt.btcPrice).toBeGreaterThan(0)
    expect(usdt.source).toBe('bybit')
  })
})
