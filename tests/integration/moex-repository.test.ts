import { describe, beforeAll } from 'vitest'
import type { ExchangeRate } from '@/entities/exchange-rate'
import { MoexRepository } from '@/repositories/moex-repository'
import { assertFinanceApiRates } from '../helpers/assert-finance-api-rates'

describe('MoexRepository', () => {
  const repo = new MoexRepository()
  let rates: ExchangeRate[]

  beforeAll(async () => {
    rates = await repo.fetchRates()
  }, 30_000)

  assertFinanceApiRates(() => rates)
})
