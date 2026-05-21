import { describe } from 'vitest'
import { DexieRepository } from '@/repositories/DexieRepository'
import { assertDbRepository } from '../helpers/assertDbRepository'

describe('DexieRepository', () => {
  assertDbRepository(() => new DexieRepository())
})
