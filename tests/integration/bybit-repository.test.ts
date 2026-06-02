import { describe, beforeAll } from 'vitest'
import type { ExchangeRate } from '@/entities/exchange-rate'
import { BybitRepository } from '@/repositories/bybit-repository'
import { assertFinanceApiRates } from '../helpers/assert-finance-api-rates'

describe('BybitRepository — интеграционный тест', () => {
  const repo = new BybitRepository()
  let rates: ExchangeRate[]

  beforeAll(async () => {
    rates = await repo.fetchRates()
  }, 5000)

  assertFinanceApiRates(() => rates)
})
