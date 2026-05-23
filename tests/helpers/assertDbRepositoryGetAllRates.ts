import { describe, it, expect, beforeEach } from 'vitest'
import { type DbRepositoryInterface } from '@/repositories/DbRepositoryInterface'
import { makeRate } from './dbRepositoryTestHelpers'

export function assertDbRepositoryGetAllRates(makeRepo: () => DbRepositoryInterface) {
  let repo: DbRepositoryInterface

  beforeEach(() => {
    repo = makeRepo()
    return repo.clearAll()
  })

  describe('getAllRates', () => {
    it('returns empty array when DB is empty', async () => {
      const rates = await repo.getAllRates()
      expect(rates).toEqual([])
    })

    it('returns all stored rates', async () => {
      await repo.updateDataForSource('binance', [
        makeRate({ source: 'binance', ticker: 'btc', btcPrice: 1 }),
        makeRate({ source: 'binance', ticker: 'eth', btcPrice: 36.5 }),
      ])
      await repo.updateDataForSource('coingecko', [
        makeRate({ source: 'coingecko', ticker: 'usdt', btcPrice: 76808.44 }),
      ])

      const rates = await repo.getAllRates()
      expect(rates).toHaveLength(3)

      // Check all fields are correctly mapped
      for (const rate of rates) {
        expect(typeof rate.source).toBe('string')
        expect(typeof rate.ticker).toBe('string')
        expect(typeof rate.btcPrice).toBe('number')
        expect(Number.isFinite(rate.btcPrice)).toBe(true)
        expect(rate.btcPrice).toBeGreaterThan(0)
        expect(typeof rate.updatedAt).toBe('number')
        expect(rate.updatedAt).toBeGreaterThan(0)
      }
    })
  })
}
