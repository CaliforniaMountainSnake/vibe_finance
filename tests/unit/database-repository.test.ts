import { describe } from 'vitest'
import { DexieRepository } from '@/repositories/dexie-repository'
import { assertDatabaseRepository } from '../helpers/assert-database-repository'

describe('DexieRepository — контрактные тесты', () => {
  assertDatabaseRepository(() => new DexieRepository())
})
