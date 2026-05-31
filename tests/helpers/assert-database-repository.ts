/**
 * Полная батарея тестов контракта DatabaseRepositoryInterface.
 *
 * Использование:
 *   describe('MyRepo', () => {
 *     assertDatabaseRepository(() => new MyRepo())
 *   })
 *
 * Для выборочного запуска импортируй нужную тему напрямую:
 *   import { assertDatabaseRepositoryGetRate } from '../helpers/assert-database-repository-get-rate'
 */

import { type DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'
import { assertDatabaseRepositoryClearAll } from './assert-database-repository-clear-all'
import { assertDatabaseRepositoryFavorites } from './assert-database-repository-favorites'
import { assertDatabaseRepositoryGetAllRates } from './assert-database-repository-get-all-rates'
import { assertDatabaseRepositoryGetRate } from './assert-database-repository-get-rate'
import { assertDatabaseRepositoryGetUpdateTime } from './assert-database-repository-get-update-time'
import { assertDatabaseRepositoryUpdateData } from './assert-database-repository-update-data'
import { assertDatabaseRepositoryHoldings } from './assert-database-repository-holdings'
import { assertDatabaseRepositorySettings } from './assert-database-repository-settings'

export function assertDatabaseRepository(makeRepo: () => DatabaseRepositoryInterface) {
  assertDatabaseRepositoryUpdateData(makeRepo)
  assertDatabaseRepositoryGetRate(makeRepo)
  assertDatabaseRepositoryGetAllRates(makeRepo)
  assertDatabaseRepositoryFavorites(makeRepo)
  assertDatabaseRepositoryHoldings(makeRepo)
  assertDatabaseRepositorySettings(makeRepo)
  assertDatabaseRepositoryClearAll(makeRepo)
  assertDatabaseRepositoryGetUpdateTime(makeRepo)
}
