import { describe } from 'vitest'
import { CoinGeckoRepository } from '@/repositories/coin-gecko-repository'
import { COINGECKO_MOCK_JSON } from '@/tests/mocks/coingecko-data'
import { assertFinanceApiRates } from '../helpers/assert-finance-api-rates'

describe('CoinGeckoRepository', () => {
  const repo = new CoinGeckoRepository()

  assertFinanceApiRates(() => repo.parseRates(COINGECKO_MOCK_JSON))
})
