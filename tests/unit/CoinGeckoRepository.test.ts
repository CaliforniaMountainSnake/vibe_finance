import { describe } from 'vitest'
import { CoinGeckoRepository } from '@/repositories/CoinGeckoRepository'
import { COINGECKO_MOCK_JSON } from '@/tests/mocks/coingecko-data'
import { assertFinanceApiRates } from '../helpers/assertFinanceApiRates'

describe('CoinGeckoRepository', () => {
  const repo = new CoinGeckoRepository()

  assertFinanceApiRates(() => repo.parseRates(COINGECKO_MOCK_JSON))
})
