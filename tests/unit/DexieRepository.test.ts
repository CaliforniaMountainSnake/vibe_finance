import { describe, it, expect, beforeEach } from 'vitest'
import { DexieRepository } from '@/repositories/DexieRepository'
import { type ExchangeRate } from '@/entities/ExchangeRate'

function makeRate(overrides: Partial<ExchangeRate> = {}): ExchangeRate {
  return {
    source: 'binance',
    ticker: 'btc',
    btcPrice: 1,
    updatedAt: 1700000000,
    ...overrides,
  }
}

describe('DexieRepository', () => {
  let repo: DexieRepository

  beforeEach(() => {
    repo = new DexieRepository()
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

      const eth = all.find((r) => r.ticker === 'eth')!
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
      const rate = await repo.getRate('btc', 'btc')
      expect(rate).toBeCloseTo(1, 5)
    })

    it('computes rate between two currencies', async () => {
      // btc → eth: btcPrice(eth) / btcPrice(btc) = 36.379 / 1 = 36.379
      const rate = await repo.getRate('btc', 'eth')
      expect(rate).toBeCloseTo(36.379, 5)
    })

    it('computes inverse rate', async () => {
      // eth → btc: btcPrice(btc) / btcPrice(eth) = 1 / 36.379 ≈ 0.027488
      const rate = await repo.getRate('eth', 'btc')
      expect(rate).toBeCloseTo(1 / 36.379, 5)
    })

    it('computes rate between two fiat-like currencies', async () => {
      // gel → usdt: btcPrice(usdt) / btcPrice(gel) = 76808.44 / 205015.665 ≈ 0.37461
      const rate = await repo.getRate('gel', 'usdt')
      expect(rate).toBeCloseTo(76808.44 / 205015.665, 5)
    })

    it('is case-insensitive', async () => {
      const lower = await repo.getRate('eth', 'btc')
      const upper = await repo.getRate('ETH', 'BTC')
      expect(lower).toBeCloseTo(upper, 5)
    })

    it('throws for unknown from-ticker', async () => {
      await expect(repo.getRate('nonexistent', 'btc')).rejects.toThrow('Unknown ticker: nonexistent')
    })

    it('throws for unknown to-ticker', async () => {
      await expect(repo.getRate('btc', 'nonexistent')).rejects.toThrow('Unknown ticker: nonexistent')
    })

    it('throws when from-ticker has zero or negative btcPrice', async () => {
      await repo.updateDataForSource('coingecko', [
        makeRate({ source: 'coingecko', ticker: 'broken', btcPrice: 0 }),
        makeRate({ source: 'coingecko', ticker: 'btc', btcPrice: 1 }),
      ])

      await expect(repo.getRate('broken', 'btc')).rejects.toThrow('Invalid btcPrice for ticker broken: 0')
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
      for (const r of rates) {
        expect(typeof r.source).toBe('string')
        expect(typeof r.ticker).toBe('string')
        expect(typeof r.btcPrice).toBe('number')
        expect(Number.isFinite(r.btcPrice)).toBe(true)
        expect(r.btcPrice).toBeGreaterThan(0)
        expect(typeof r.updatedAt).toBe('number')
        expect(r.updatedAt).toBeGreaterThan(0)
      }
    })
  })

  // ---------------------------------------------------------------------------
  // clearAll
  // ---------------------------------------------------------------------------

  describe('clearAll', () => {
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
})
