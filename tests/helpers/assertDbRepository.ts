/**
 * Полная батарея тестов контракта DbRepositoryInterface.
 *
 * Использование:
 *   describe('MyRepo', () => {
 *     assertDbRepository(() => new MyRepo())
 *   })
 *
 * Для выборочного запуска импортируй нужную тему напрямую:
 *   import { assertDbRepositoryGetRate } from '../helpers/assertDbRepositoryGetRate'
 */

import { type DbRepositoryInterface } from '@/repositories/DbRepositoryInterface'
import { assertDbRepositoryClearAll } from './assertDbRepositoryClearAll'
import { assertDbRepositoryFavorites } from './assertDbRepositoryFavorites'
import { assertDbRepositoryGetAllRates } from './assertDbRepositoryGetAllRates'
import { assertDbRepositoryGetRate } from './assertDbRepositoryGetRate'
import { assertDbRepositoryGetUpdateTime } from './assertDbRepositoryGetUpdateTime'
import { assertDbRepositoryUpdateData } from './assertDbRepositoryUpdateData'

export function assertDbRepository(makeRepo: () => DbRepositoryInterface) {
  assertDbRepositoryUpdateData(makeRepo)
  assertDbRepositoryGetRate(makeRepo)
  assertDbRepositoryGetAllRates(makeRepo)
  assertDbRepositoryFavorites(makeRepo)
  assertDbRepositoryClearAll(makeRepo)
  assertDbRepositoryGetUpdateTime(makeRepo)
}
