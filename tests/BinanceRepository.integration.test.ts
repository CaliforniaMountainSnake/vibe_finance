import { describe } from 'vitest'
import { BinanceRepository } from '@/repositories/BinanceRepository'
import { testRepositoryInterface } from './RepositoryInterfaceTest'

describe('BinanceRepository', () => {
    testRepositoryInterface(new BinanceRepository())
})
