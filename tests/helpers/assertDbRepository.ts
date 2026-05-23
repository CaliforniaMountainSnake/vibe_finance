import { describe, it, expect, beforeEach } from 'vitest'
import { type ExchangeRate } from '@/entities/ExchangeRate'
import { type Ticker } from '@/entities/Ticker'
import { type TickerPair } from '@/entities/TickerPair'
import { type DbRepositoryInterface } from '@/repositories/DbRepositoryInterface'

function makeRate(overrides: Partial<ExchangeRate> = {}): ExchangeRate {
  return {
    source: 'binance',
    ticker: 'btc',
    btcPrice: 1,
    updatedAt: 1700000000,
    ...overrides,
  }
}

function ticker(source: string, t: string): Ticker {
  return { source: source as Ticker['source'], ticker: t.toLowerCase() }
}

function pair(from: Ticker, to: Ticker): TickerPair {
  return { from, to }
}

/** Шорткат для пары тикеров с одинаковым source (для старых тестов). */
function sameSourcePair(source: string, fromTicker: string, toTicker: string): TickerPair {
  return pair(ticker(source, fromTicker), ticker(source, toTicker))
}

/**
 * Принимает фабрику, создающую экземпляр DbRepositoryInterface,
 * и регистрирует батарею тестов контракта этого интерфейса.
 *
 * Использование:
 *   describe('MyRepo', () => {
 *     assertDbRepository(() => new MyRepo())
 *   })
 */
export function assertDbRepository(makeRepo: () => DbRepositoryInterface) {
  let repo: DbRepositoryInterface

  beforeEach(() => {
    repo = makeRepo()
    return repo.clearAll()
  })

  // ---------------------------------------------------------------------------
  // updateDataForSource
  // ---------------------------------------------------------------------------

  describe('updateDataForSource', () => {
    it('writes rates for a source', async () => {
      await repo.updateDataForSource('binance', [
        makeRate({ source: 'binance', ticker: 'btc', btcPrice: 1 }),
        makeRate({ source: 'binance', ticker: 'eth', btcPrice: 36.5 }),
      ])

      const all = await repo.getAllRates()
      expect(all).toHaveLength(2)
    })

    it('replaces old data for the same source (delisting simulation)', async () => {
      // Первый заход: 3 монеты
      await repo.updateDataForSource('binance', [
        makeRate({ source: 'binance', ticker: 'btc', btcPrice: 1 }),
        makeRate({ source: 'binance', ticker: 'eth', btcPrice: 36.5 }),
        makeRate({ source: 'binance', ticker: 'xrp', btcPrice: 50000 }),
      ])

      // Второй заход: xrp убрали (делистинг), btc цена обновилась
      await repo.updateDataForSource('binance', [
        makeRate({ source: 'binance', ticker: 'btc', btcPrice: 1 }),
        makeRate({ source: 'binance', ticker: 'eth', btcPrice: 37.0 }),
      ])

      const all = await repo.getAllRates()
      expect(all).toHaveLength(2)

      const tickers = all.map((r) => r.ticker).sort()
      expect(tickers).toEqual(['btc', 'eth'])

      const eth = all.find((r) => r.ticker === 'eth')
      if (!eth) throw new Error('eth not found in rates')
      expect(eth.btcPrice).toBe(37.0)
    })

    it('does not affect other sources', async () => {
      await repo.updateDataForSource('binance', [makeRate({ source: 'binance', ticker: 'btc', btcPrice: 1 })])
      await repo.updateDataForSource('coingecko', [makeRate({ source: 'coingecko', ticker: 'eth', btcPrice: 36.5 })])

      const all = await repo.getAllRates()
      expect(all).toHaveLength(2)

      const sources = all.map((r) => r.source).sort()
      expect(sources).toEqual(['binance', 'coingecko'])
    })
  })

  // ---------------------------------------------------------------------------
  // getRate
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // getAllRates
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // clearAll
  // ---------------------------------------------------------------------------

  describe('clearAll', () => {
    it('removes all data — exchange rates and favorites', async () => {
      await repo.updateDataForSource('binance', [makeRate({ source: 'binance', ticker: 'btc', btcPrice: 1 })])
      await repo.addFavoriteRate(sameSourcePair('coingecko', 'eth', 'usdt'))

      await repo.clearAll()

      const rates = await repo.getAllRates()
      const favorites = await repo.getFavoriteRates()
      expect(rates).toHaveLength(0)
      expect(favorites).toHaveLength(0)
    })

    it('removes all data', async () => {
      await repo.updateDataForSource('binance', [
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
