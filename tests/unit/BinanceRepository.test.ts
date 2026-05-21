import { describe } from 'vitest'
import { BinanceRepository } from '@/repositories/BinanceRepository'
import { BINANCE_MOCK_JSON } from '@/tests/mocks/binance-data'
import { assertRates } from '../helpers/assertRates'

describe('BinanceRepository', () => {
  const repo = new BinanceRepository()

  assertRates(() => repo.parseRates(BINANCE_MOCK_JSON))
})
