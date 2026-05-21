import { describe } from 'vitest'
import { BinanceMockRepository } from '@/tests/mocks/BinanceMockRepository'
import { testRepositoryInterface } from '../RepositoryInterfaceTest'

describe('BinanceRepository', () => {
    testRepositoryInterface(new BinanceMockRepository())
})
