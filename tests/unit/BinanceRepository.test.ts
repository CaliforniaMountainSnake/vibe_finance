import { describe } from 'vitest'
import { BinanceRepository } from '@/repositories/BinanceRepository'
import { BINANCE_MOCK_JSON } from '@/tests/mocks/binance-data'
import { assertFinanceApiRates } from '../helpers/assertFinanceApiRates'

describe('BinanceRepository', () => {
  const repo = new BinanceRepository()

  assertFinanceApiRates(() => repo.parseRates(BINANCE_MOCK_JSON))
})
