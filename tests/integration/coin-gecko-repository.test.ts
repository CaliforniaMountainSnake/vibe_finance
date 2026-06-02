import { describe, beforeAll } from 'vitest'
import type { ExchangeRate } from '@/entities/exchange-rate'
import { CoinGeckoRepository } from '@/repositories/coin-gecko-repository'
import { assertFinanceApiRates } from '../helpers/assert-finance-api-rates'

describe('CoinGeckoRepository — интеграционный тест', () => {
  const repo = new CoinGeckoRepository()
  let rates: ExchangeRate[]

  beforeAll(async () => {
    rates = await repo.fetchRates()
  }, 5000)

  assertFinanceApiRates(() => rates)
})
