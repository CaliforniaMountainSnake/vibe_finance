import { describe, beforeAll } from 'vitest'
import { ExchangeRate } from '@/entities/ExchangeRate'
import { CoinGeckoRepository } from '@/repositories/CoinGeckoRepository'
import { assertRates } from '../helpers/assertRates'

describe('CoinGeckoRepository', () => {
  const repo = new CoinGeckoRepository()
  let rates: ExchangeRate[]

  beforeAll(async () => {
    rates = await repo.fetchRates()
  }, 5_000)

  assertRates(() => rates)
})
