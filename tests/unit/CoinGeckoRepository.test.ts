import { describe } from 'vitest'
import { CoinGeckoRepository } from '@/repositories/CoinGeckoRepository'
import { COINGECKO_MOCK_JSON } from '@/tests/mocks/coingecko-data'
import { assertRates } from '../helpers/assertRates'

describe('CoinGeckoRepository', () => {
    const repo = new CoinGeckoRepository()

    assertRates(() => repo.parseRates(COINGECKO_MOCK_JSON))
})
