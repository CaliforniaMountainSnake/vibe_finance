import { describe, it, expect, beforeEach } from 'vitest'
import type { ExchangeRate } from '@/entities/ExchangeRate'
import type { DbRepositoryInterface } from '@/repositories/DbRepositoryInterface'

function makeRate(overrides: Partial<ExchangeRate> = {}): ExchangeRate {
  return {
    source: 'binance',
    ticker: 'btc',
    btcPrice: 1,
    updatedAt: 1700000000,
    ...overrides,
  }
}

/**
 * Регистрирует тесты контракта метода getUpdateTime интерфейса DbRepositoryInterface.
 */
export function assertDbRepositoryGetUpdateTime(makeRepo: () => DbRepositoryInterface) {
  let repo: DbRepositoryInterface

  beforeEach(() => {
    repo = makeRepo()
    return repo.clearAll()
  })

  describe('getUpdateTime', () => {
    it('returns null for source with no data', async () => {
      expect(await repo.getUpdateTime('binance')).toBeNull()
    })

    it('returns null when only other source has data', async () => {
      await repo.updateDataForSource('coingecko', [
        makeRate({ source: 'coingecko', ticker: 'btc', btcPrice: 1, updatedAt: 1700000000 }),
      ])

      expect(await repo.getUpdateTime('binance')).toBeNull()
    })

    it('returns updatedAt from a row for the given source', async () => {
      await repo.updateDataForSource('binance', [
        makeRate({ source: 'binance', ticker: 'btc', btcPrice: 1, updatedAt: 1700000050 }),
      ])

      expect(await repo.getUpdateTime('binance')).toBe(1700000050)
    })

    it('returns updatedAt after data replacement', async () => {
      await repo.updateDataForSource('binance', [
        makeRate({ source: 'binance', ticker: 'btc', btcPrice: 1, updatedAt: 1700000000 }),
      ])
      await repo.updateDataForSource('binance', [
        makeRate({ source: 'binance', ticker: 'eth', btcPrice: 36.5, updatedAt: 1700000200 }),
      ])

      expect(await repo.getUpdateTime('binance')).toBe(1700000200)
    })

    it('differentiates sources', async () => {
      await repo.updateDataForSource('binance', [
        makeRate({ source: 'binance', ticker: 'btc', btcPrice: 1, updatedAt: 1700000000 }),
      ])
      await repo.updateDataForSource('coingecko', [
        makeRate({ source: 'coingecko', ticker: 'eth', btcPrice: 36.5, updatedAt: 1700000100 }),
      ])

      expect(await repo.getUpdateTime('binance')).toBe(1700000000)
      expect(await repo.getUpdateTime('coingecko')).toBe(1700000100)
    })

    it('returns null after clearAll', async () => {
      await repo.updateDataForSource('binance', [
        makeRate({ source: 'binance', ticker: 'btc', btcPrice: 1, updatedAt: 1700000000 }),
      ])
      await repo.clearAll()

      expect(await repo.getUpdateTime('binance')).toBeNull()
    })
  })
}
