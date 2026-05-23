import { describe, it, expect, beforeEach } from 'vitest'
import { type DbRepositoryInterface } from '@/repositories/DbRepositoryInterface'
import { makeRate, ticker, pair, sameSourcePair } from './dbRepositoryTestHelpers'

export function assertDbRepositoryGetRate(makeRepo: () => DbRepositoryInterface) {
  let repo: DbRepositoryInterface

  beforeEach(() => {
    repo = makeRepo()
    return repo.clearAll()
  })

  describe('getRate', () => {
    beforeEach(async () => {
      await repo.updateDataForSource('coingecko', [
        makeRate({ source: 'coingecko', ticker: 'btc', btcPrice: 1 }),
        makeRate({ source: 'coingecko', ticker: 'eth', btcPrice: 36.379 }),
        makeRate({ source: 'coingecko', ticker: 'usdt', btcPrice: 76808.44 }),
        makeRate({ source: 'coingecko', ticker: 'gel', btcPrice: 205015.665 }),
      ])
    })

    it('returns 1 for same ticker', async () => {
      const rate = await repo.getRate(sameSourcePair('coingecko', 'btc', 'btc'))
      expect(rate).toBeCloseTo(1, 5)
    })

    it('computes rate between two currencies', async () => {
      // btc → eth: btcPrice(eth) / btcPrice(btc) = 36.379 / 1 = 36.379
      const rate = await repo.getRate(sameSourcePair('coingecko', 'btc', 'eth'))
      expect(rate).toBeCloseTo(36.379, 5)
    })

    it('computes inverse rate', async () => {
      // eth → btc: btcPrice(btc) / btcPrice(eth) = 1 / 36.379 ≈ 0.027488
      const rate = await repo.getRate(sameSourcePair('coingecko', 'eth', 'btc'))
      expect(rate).toBeCloseTo(1 / 36.379, 5)
    })

    it('computes rate between two fiat-like currencies', async () => {
      // gel → usdt: btcPrice(usdt) / btcPrice(gel) = 76808.44 / 205015.665 ≈ 0.37461
      const rate = await repo.getRate(sameSourcePair('coingecko', 'gel', 'usdt'))
      expect(rate).toBeCloseTo(76808.44 / 205015.665, 5)
    })

    it('throws for unknown from-ticker', async () => {
      await expect(repo.getRate(sameSourcePair('coingecko', 'nonexistent', 'btc'))).rejects.toThrow()
    })

    it('throws for unknown to-ticker', async () => {
      await expect(repo.getRate(sameSourcePair('coingecko', 'btc', 'nonexistent'))).rejects.toThrow()
    })

    it('throws when from-ticker has zero or negative btcPrice', async () => {
      await repo.updateDataForSource('coingecko', [
        makeRate({ source: 'coingecko', ticker: 'broken', btcPrice: 0 }),
        makeRate({ source: 'coingecko', ticker: 'btc', btcPrice: 1 }),
      ])

      await expect(repo.getRate(sameSourcePair('coingecko', 'broken', 'btc'))).rejects.toThrow()
    })

    it('differentiates same ticker from different sources', async () => {
      await repo.updateDataForSource('binance', [
        makeRate({ source: 'binance', ticker: 'btc', btcPrice: 1 }),
        makeRate({ source: 'binance', ticker: 'gel', btcPrice: 200000 }),
      ])

      // coingecko gel → binance gel: should work cross-source
      const rate = await repo.getRate(pair(ticker('coingecko', 'gel'), ticker('binance', 'gel')))
      expect(rate).toBeCloseTo(200000 / 205015.665, 3)
    })
  })
}
