import { describe, beforeAll } from 'vitest'
import type { ExchangeRate } from '@/entities/exchange-rate'
import { BinanceRepository } from '@/repositories/binance-repository'
import { assertFinanceApiRates } from '../helpers/assert-finance-api-rates'

describe('BinanceRepository — интеграционный тест', () => {
  const repo = new BinanceRepository()
  let rates: ExchangeRate[]

  beforeAll(async () => {
    rates = await repo.fetchRates()
  }, 5000)

  assertFinanceApiRates(() => rates)
})
