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

    it('returns pairs ordered by order (first added first)', async () => {
      await repo.addFavoriteRate(sameSourcePair('coingecko', 'btc', 'usdt'))
      await repo.addFavoriteRate(sameSourcePair('coingecko', 'eth', 'usdt'))
      await repo.addFavoriteRate(sameSourcePair('coingecko', 'btc', 'eth'))

      const favorites = await repo.getFavoriteRates()
      expect(favorites).toHaveLength(3)
      expect(favorites[0].from).toEqual(ticker('coingecko', 'btc'))
      expect(favorites[0].to).toEqual(ticker('coingecko', 'usdt'))
      expect(favorites[1].from).toEqual(ticker('coingecko', 'eth'))
      expect(favorites[1].to).toEqual(ticker('coingecko', 'usdt'))
      expect(favorites[2].from).toEqual(ticker('coingecko', 'btc'))
      expect(favorites[2].to).toEqual(ticker('coingecko', 'eth'))
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

  // ---------------------------------------------------------------------------
  // moveFavoriteUp / moveFavoriteDown
  // ---------------------------------------------------------------------------

  describe('moveFavoriteUp / moveFavoriteDown', () => {
    it('moveFavoriteUp swaps the pair with its upper neighbor', async () => {
      const pair1 = sameSourcePair('coingecko', 'btc', 'usdt')
      const pair2 = sameSourcePair('coingecko', 'eth', 'usdt')
      const pair3 = sameSourcePair('coingecko', 'btc', 'eth')

      await repo.addFavoriteRate(pair1)
      await repo.addFavoriteRate(pair2)
      await repo.addFavoriteRate(pair3)

      // Исходный порядок: pair1, pair2, pair3
      // Двигаем pair2 вверх → должно стать: pair2, pair1, pair3
      await repo.moveFavoriteRateUp(pair2)

      const favorites = await repo.getFavoriteRates()
      expect(favorites).toHaveLength(3)
      expect(favorites[0].from).toEqual(ticker('coingecko', 'eth'))
      expect(favorites[0].to).toEqual(ticker('coingecko', 'usdt'))
      expect(favorites[1].from).toEqual(ticker('coingecko', 'btc'))
      expect(favorites[1].to).toEqual(ticker('coingecko', 'usdt'))
      expect(favorites[2].from).toEqual(ticker('coingecko', 'btc'))
      expect(favorites[2].to).toEqual(ticker('coingecko', 'eth'))
    })

    it('moveFavoriteUp on first pair is idempotent', async () => {
      const pair1 = sameSourcePair('coingecko', 'btc', 'usdt')
      const pair2 = sameSourcePair('coingecko', 'eth', 'usdt')

      await repo.addFavoriteRate(pair1)
      await repo.addFavoriteRate(pair2)
      await repo.moveFavoriteRateUp(pair1)

      const favorites = await repo.getFavoriteRates()
      expect(favorites).toHaveLength(2)
      expect(favorites[0].from).toEqual(ticker('coingecko', 'btc'))
      expect(favorites[1].from).toEqual(ticker('coingecko', 'eth'))
    })

    it('moveFavoriteDown swaps the pair with its lower neighbor', async () => {
      const pair1 = sameSourcePair('coingecko', 'btc', 'usdt')
      const pair2 = sameSourcePair('coingecko', 'eth', 'usdt')
      const pair3 = sameSourcePair('coingecko', 'btc', 'eth')

      await repo.addFavoriteRate(pair1)
      await repo.addFavoriteRate(pair2)
      await repo.addFavoriteRate(pair3)

      // Исходный порядок: pair1, pair2, pair3
      // Двигаем pair2 вниз → должно стать: pair1, pair3, pair2
      await repo.moveFavoriteRateDown(pair2)

      const favorites = await repo.getFavoriteRates()
      expect(favorites).toHaveLength(3)
      expect(favorites[0].from).toEqual(ticker('coingecko', 'btc'))
      expect(favorites[0].to).toEqual(ticker('coingecko', 'usdt'))
      expect(favorites[1].from).toEqual(ticker('coingecko', 'btc'))
      expect(favorites[1].to).toEqual(ticker('coingecko', 'eth'))
      expect(favorites[2].from).toEqual(ticker('coingecko', 'eth'))
      expect(favorites[2].to).toEqual(ticker('coingecko', 'usdt'))
    })

    it('moveFavoriteDown on last pair is idempotent', async () => {
      const pair1 = sameSourcePair('coingecko', 'btc', 'usdt')
      const pair2 = sameSourcePair('coingecko', 'eth', 'usdt')

      await repo.addFavoriteRate(pair1)
      await repo.addFavoriteRate(pair2)
      await repo.moveFavoriteRateDown(pair2)

      const favorites = await repo.getFavoriteRates()
      expect(favorites).toHaveLength(2)
      expect(favorites[0].from).toEqual(ticker('coingecko', 'btc'))
      expect(favorites[1].from).toEqual(ticker('coingecko', 'eth'))
    })

    it('both methods are idempotent with a single pair', async () => {
      const pair1 = sameSourcePair('coingecko', 'btc', 'usdt')

      await repo.addFavoriteRate(pair1)
      await repo.moveFavoriteRateUp(pair1)
      await repo.moveFavoriteRateDown(pair1)

      const favorites = await repo.getFavoriteRates()
      expect(favorites).toHaveLength(1)
      expect(favorites[0].from).toEqual(ticker('coingecko', 'btc'))
    })

    it('moveFavoriteUp then moveFavoriteDown returns original order', async () => {
      const pair1 = sameSourcePair('coingecko', 'btc', 'usdt')
      const pair2 = sameSourcePair('coingecko', 'eth', 'usdt')

      await repo.addFavoriteRate(pair1)
      await repo.addFavoriteRate(pair2)

      await repo.moveFavoriteRateUp(pair2)
      await repo.moveFavoriteRateDown(pair2)

      const favorites = await repo.getFavoriteRates()
      expect(favorites).toHaveLength(2)
      expect(favorites[0].from).toEqual(ticker('coingecko', 'btc'))
      expect(favorites[1].from).toEqual(ticker('coingecko', 'eth'))
    })

    it('moveFavoriteUp on a non-existent pair does not throw', async () => {
      const pair1 = sameSourcePair('coingecko', 'btc', 'usdt')
      await repo.addFavoriteRate(pair1)

      await expect(repo.moveFavoriteRateUp(sameSourcePair('coingecko', 'nonexistent', 'pair'))).resolves.toBeUndefined()

      const favorites = await repo.getFavoriteRates()
      expect(favorites).toHaveLength(1)
    })

    it('moveFavoriteDown on a non-existent pair does not throw', async () => {
      const pair1 = sameSourcePair('coingecko', 'btc', 'usdt')
      await repo.addFavoriteRate(pair1)

      await expect(
        repo.moveFavoriteRateDown(sameSourcePair('coingecko', 'nonexistent', 'pair'))
      ).resolves.toBeUndefined()

      const favorites = await repo.getFavoriteRates()
      expect(favorites).toHaveLength(1)
    })
  })
}
