import { describe } from 'vitest'
import { CoinGeckoMockRepository } from '@/tests/mocks/CoinGeckoMockRepository'
import { testRepositoryInterface } from '../RepositoryInterfaceTest'

describe('CoinGeckoRepository', () => {
    testRepositoryInterface(new CoinGeckoMockRepository())
})
