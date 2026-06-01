/* eslint-disable unicorn/no-useless-undefined, unicorn/no-null */
import { vi } from 'vitest'
import type { DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'

export function createMockDatabaseRepo(): DatabaseRepositoryInterface {
  return {
    updateRatesForSource: vi.fn().mockResolvedValue(undefined),
    getRate: vi.fn().mockResolvedValue(1),
    getAllRates: vi.fn().mockResolvedValue([]),
    getUpdateTime: vi.fn().mockResolvedValue(null),
    getFavoriteRates: vi.fn().mockResolvedValue([]),
    addFavoriteRate: vi.fn().mockResolvedValue(undefined),
    removeFavoriteRate: vi.fn().mockResolvedValue(undefined),
    moveFavoriteRateUp: vi.fn().mockResolvedValue(undefined),
    moveFavoriteRateDown: vi.fn().mockResolvedValue(undefined),
    isFavoriteRate: vi.fn().mockResolvedValue(false),
    getHoldings: vi.fn().mockResolvedValue([]),
    addHolding: vi.fn().mockResolvedValue(undefined),
    updateHolding: vi.fn().mockResolvedValue(undefined),
    removeHolding: vi.fn().mockResolvedValue(undefined),
    moveHoldingUp: vi.fn().mockResolvedValue(undefined),
    moveHoldingDown: vi.fn().mockResolvedValue(undefined),
    getSetting: vi.fn().mockResolvedValue(undefined),
    setSetting: vi.fn().mockResolvedValue(undefined),
    removeSetting: vi.fn().mockResolvedValue(undefined),
    clearAll: vi.fn().mockResolvedValue(undefined),
  }
}
