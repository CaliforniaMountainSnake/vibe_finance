import { describe, beforeAll } from 'vitest'
import type { ExchangeRate } from '@/entities/ExchangeRate'
import { MoexRepository } from '@/repositories/MoexRepository'
import { assertFinanceApiRates } from '../helpers/assertFinanceApiRates'

describe('MoexRepository', () => {
  const repo = new MoexRepository()
  let rates: ExchangeRate[]

  beforeAll(async () => {
    rates = await repo.fetchRates()
  }, 30_000)

  assertFinanceApiRates(() => rates)
})
