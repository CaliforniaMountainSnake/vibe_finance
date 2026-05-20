import { describe } from 'vitest'
import { CoinGeckoRepository } from '@/repositories/CoinGeckoRepository'
import { testRepositoryInterface } from './RepositoryInterfaceTest'

describe('CoinGeckoRepository', () => {
    testRepositoryInterface(new CoinGeckoRepository())
})
