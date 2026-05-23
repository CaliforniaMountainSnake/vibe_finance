import { describe, it, expect, beforeEach } from 'vitest'
import { type DbRepositoryInterface } from '@/repositories/DbRepositoryInterface'
import { ticker, pair, sameSourcePair } from './dbRepositoryTestHelpers'

export function assertDbRepositoryFavorites(makeRepo: () => DbRepositoryInterface) {
  let repo: DbRepositoryInterface

  beforeEach(() => {
    repo = makeRepo()
    return repo.clearAll()
  })

  // ---------------------------------------------------------------------------
  // addFavoriteRate
  // ---------------------------------------------------------------------------

  describe('addFavoriteRate', () => {
    it('adds a ticker pair to favorites', async () => {
      await repo.addFavoriteRate(sameSourcePair('coingecko', 'btc', 'usdt'))

      const favorites = await repo.getFavoriteRates()
      expect(favorites).toHaveLength(1)
      expect(favorites[0].from).toEqual(ticker('coingecko', 'btc'))
      expect(favorites[0].to).toEqual(ticker('coingecko', 'usdt'))
    })

    it('is idempotent — adding the same pair twice does not fail', async () => {
      const p = sameSourcePair('coingecko', 'btc', 'usdt')
      await repo.addFavoriteRate(p)
      await repo.addFavoriteRate(p)

      const favorites = await repo.getFavoriteRates()
      expect(favorites).toHaveLength(1)
    })

    it('treats different pairs independently', async () => {
      await repo.addFavoriteRate(sameSourcePair('coingecko', 'btc', 'usdt'))
      await repo.addFavoriteRate(sameSourcePair('coingecko', 'eth', 'usdt'))

      const favorites = await repo.getFavoriteRates()
      expect(favorites).toHaveLength(2)
    })

    it('differentiates same tickers from different sources', async () => {
      await repo.addFavoriteRate(sameSourcePair('coingecko', 'btc', 'usdt'))
      await repo.addFavoriteRate(sameSourcePair('binance', 'btc', 'usdt'))

      const favorites = await repo.getFavoriteRates()
      expect(favorites).toHaveLength(2)
    })

    it('supports cross-source pairs', async () => {
      await repo.addFavoriteRate(pair(ticker('coingecko', 'btc'), ticker('binance', 'usdt')))

      const favorites = await repo.getFavoriteRates()
      expect(favorites).toHaveLength(1)
      expect(favorites[0].from).toEqual(ticker('coingecko', 'btc'))
      expect(favorites[0].to).toEqual(ticker('binance', 'usdt'))
    })
  })

  // ---------------------------------------------------------------------------
  // removeFavoriteRate
  // ---------------------------------------------------------------------------

  describe('removeFavoriteRate', () => {
    it('removes a pair from favorites', async () => {
      await repo.addFavoriteRate(sameSourcePair('coingecko', 'btc', 'usdt'))
      await repo.addFavoriteRate(sameSourcePair('coingecko', 'eth', 'usdt'))
      await repo.removeFavoriteRate(sameSourcePair('coingecko', 'btc', 'usdt'))

      const favorites = await repo.getFavoriteRates()
      expect(favorites).toHaveLength(1)
      expect(favorites[0].from).toEqual(ticker('coingecko', 'eth'))
      expect(favorites[0].to).toEqual(ticker('coingecko', 'usdt'))
    })

    it('is idempotent — removing a non-existent pair does not fail', async () => {
      await repo.removeFavoriteRate(sameSourcePair('coingecko', 'nonexistent', 'pair'))
      // should not throw
      const favorites = await repo.getFavoriteRates()
      expect(favorites).toEqual([])
    })

    it('does not remove a different pair with shared ticker', async () => {
      await repo.addFavoriteRate(sameSourcePair('coingecko', 'btc', 'usdt'))
      await repo.addFavoriteRate(sameSourcePair('coingecko', 'btc', 'eth'))
      await repo.removeFavoriteRate(sameSourcePair('coingecko', 'btc', 'usdt'))

      const favorites = await repo.getFavoriteRates()
      expect(favorites).toHaveLength(1)
      expect(favorites[0].from).toEqual(ticker('coingecko', 'btc'))
      expect(favorites[0].to).toEqual(ticker('coingecko', 'eth'))
    })

    it('does not remove same ticker from different source', async () => {
      await repo.addFavoriteRate(sameSourcePair('coingecko', 'btc', 'usdt'))
      await repo.addFavoriteRate(sameSourcePair('binance', 'btc', 'usdt'))
      await repo.removeFavoriteRate(sameSourcePair('coingecko', 'btc', 'usdt'))

      const favorites = await repo.getFavoriteRates()
      expect(favorites).toHaveLength(1)
      expect(favorites[0].from).toEqual(ticker('binance', 'btc'))
    })
  })

  // ---------------------------------------------------------------------------
  // getFavoriteRates
  // ---------------------------------------------------------------------------

  describe('getFavoriteRates', () => {
    it('returns empty array when no favorites exist', async () => {
      const favorites = await repo.getFavoriteRates()
      expect(favorites).toEqual([])
    })

    it('returns pairs ordered by addedAt descending (newest first)', async () => {
      await repo.addFavoriteRate(sameSourcePair('coingecko', 'btc', 'usdt'))
      await new Promise((r) => setTimeout(r, 10))
      await repo.addFavoriteRate(sameSourcePair('coingecko', 'eth', 'usdt'))
      await new Promise((r) => setTimeout(r, 10))
      await repo.addFavoriteRate(sameSourcePair('coingecko', 'btc', 'eth'))

      const favorites = await repo.getFavoriteRates()
      expect(favorites).toHaveLength(3)
      expect(favorites[0].from).toEqual(ticker('coingecko', 'btc'))
      expect(favorites[0].to).toEqual(ticker('coingecko', 'eth'))
      expect(favorites[1].from).toEqual(ticker('coingecko', 'eth'))
      expect(favorites[1].to).toEqual(ticker('coingecko', 'usdt'))
      expect(favorites[2].from).toEqual(ticker('coingecko', 'btc'))
      expect(favorites[2].to).toEqual(ticker('coingecko', 'usdt'))
    })

    it('returns objects with Ticker-shaped from and to', async () => {
      await repo.addFavoriteRate(sameSourcePair('coingecko', 'btc', 'usdt'))

      const favorites = await repo.getFavoriteRates()
      expect(favorites.length).toBe(1)

      const fav = favorites[0]
      expect(fav.from).toHaveProperty('source')
      expect(fav.from).toHaveProperty('ticker')
      expect(typeof fav.from.source).toBe('string')
      expect(typeof fav.from.ticker).toBe('string')
      expect(fav.to).toHaveProperty('source')
      expect(fav.to).toHaveProperty('ticker')
      expect(typeof fav.to.source).toBe('string')
      expect(typeof fav.to.ticker).toBe('string')
    })
  })

  // ---------------------------------------------------------------------------
  // isFavoriteRate
  // ---------------------------------------------------------------------------

  describe('isFavoriteRate', () => {
    it('returns true for a favorited pair', async () => {
      await repo.addFavoriteRate(sameSourcePair('coingecko', 'btc', 'usdt'))

      const isFav = await repo.isFavoriteRate(sameSourcePair('coingecko', 'btc', 'usdt'))
      expect(isFav).toBe(true)
    })

    it('returns false for a non-favorited pair', async () => {
      const isFav = await repo.isFavoriteRate(sameSourcePair('coingecko', 'btc', 'usdt'))
      expect(isFav).toBe(false)
    })

    it('returns false for same tickers but different source', async () => {
      await repo.addFavoriteRate(sameSourcePair('coingecko', 'btc', 'usdt'))

      const isFav = await repo.isFavoriteRate(sameSourcePair('binance', 'btc', 'usdt'))
      expect(isFav).toBe(false)
    })

    it('returns false for reversed pair', async () => {
      await repo.addFavoriteRate(sameSourcePair('coingecko', 'btc', 'usdt'))

      const isFav = await repo.isFavoriteRate(sameSourcePair('coingecko', 'usdt', 'btc'))
      expect(isFav).toBe(false)
    })
  })
}
