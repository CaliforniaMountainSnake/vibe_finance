import { describe, it, expect, beforeEach } from 'vitest'
import { type DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'
import { makeRate, sameSourcePair } from './database-repository-test-helpers'

export function assertDatabaseRepositoryClearAll(makeRepo: () => DatabaseRepositoryInterface) {
  let repo: DatabaseRepositoryInterface

  beforeEach(() => {
    repo = makeRepo()
    return repo.clearAll()
  })

  describe('clearAll — очистка всех данных', () => {
    it('removes all data — exchange rates and favorites', async () => {
      await repo.updateRatesForSource('binance', [makeRate({ source: 'binance', ticker: 'btc', btcPrice: 1 })])
      await repo.addFavoriteRate(sameSourcePair('coingecko', 'eth', 'usdt'))

      await repo.clearAll()

      const rates = await repo.getAllRates()
      const favorites = await repo.getFavoriteRates()
      expect(rates).toHaveLength(0)
      expect(favorites).toHaveLength(0)
    })

    it('removes all data', async () => {
      await repo.updateRatesForSource('binance', [
        makeRate({ source: 'binance', ticker: 'btc', btcPrice: 1 }),
        makeRate({ source: 'binance', ticker: 'eth', btcPrice: 36.5 }),
      ])

      await repo.clearAll()

      const rates = await repo.getAllRates()
      expect(rates).toHaveLength(0)
    })

    it('is idempotent', async () => {
      await repo.clearAll()
      await repo.clearAll()

      const rates = await repo.getAllRates()
      expect(rates).toHaveLength(0)
    })
  })
}
