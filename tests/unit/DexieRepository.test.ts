import { describe } from 'vitest'
import { DexieRepository } from '@/repositories/DexieRepository'
import { assertDbRepository } from '../helpers/assertDbRepository'
import { assertGetUpdateTime } from '../helpers/assertGetUpdateTime'

describe('DexieRepository', () => {
  assertDbRepository(() => new DexieRepository())
  assertGetUpdateTime(() => new DexieRepository())
})
