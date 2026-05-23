import { describe, beforeAll } from 'vitest'
import type { ExchangeRate } from '@/entities/ExchangeRate'
import { CoinGeckoRepository } from '@/repositories/CoinGeckoRepository'
import { assertFinanceApiRates } from '../helpers/assertFinanceApiRates'

describe('CoinGeckoRepository', () => {
  const repo = new CoinGeckoRepository()
  let rates: ExchangeRate[]

  beforeAll(async () => {
    rates = await repo.fetchRates()
  }, 5_000)

  assertFinanceApiRates(() => rates)
})
