import { describe, beforeAll } from 'vitest'
import type { ExchangeRate } from '@/entities/ExchangeRate'
import { BinanceRepository } from '@/repositories/BinanceRepository'
import { assertRates } from '../helpers/assertRates'

describe('BinanceRepository', () => {
  const repo = new BinanceRepository()
  let rates: ExchangeRate[]

  beforeAll(async () => {
    rates = await repo.fetchRates()
  }, 5_000)

  assertRates(() => rates)
})
