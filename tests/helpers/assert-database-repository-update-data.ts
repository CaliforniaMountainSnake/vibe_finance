import { describe, it, expect, beforeEach } from 'vitest'
import { type DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'
import { makeRate } from './database-repository-test-helpers'

export function assertDatabaseRepositoryUpdateData(makeRepo: () => DatabaseRepositoryInterface) {
  let repo: DatabaseRepositoryInterface

  beforeEach(() => {
    repo = makeRepo()
    return repo.clearAll()
  })

  describe('updateDataForSource', () => {
    it('writes rates for a source', async () => {
      await repo.updateRatesForSource('binance', [
        makeRate({ source: 'binance', ticker: 'btc', btcPrice: 1 }),
        makeRate({ source: 'binance', ticker: 'eth', btcPrice: 36.5 }),
      ])

      const all = await repo.getAllRates()
      expect(all).toHaveLength(2)
    })

    it('replaces old data for the same source (delisting simulation)', async () => {
      // Первый заход: 3 монеты
      await repo.updateRatesForSource('binance', [
        makeRate({ source: 'binance', ticker: 'btc', btcPrice: 1 }),
        makeRate({ source: 'binance', ticker: 'eth', btcPrice: 36.5 }),
        makeRate({ source: 'binance', ticker: 'xrp', btcPrice: 50_000 }),
      ])

      // Второй заход: xrp убрали (делистинг), btc цена обновилась
      await repo.updateRatesForSource('binance', [
        makeRate({ source: 'binance', ticker: 'btc', btcPrice: 1 }),
        makeRate({ source: 'binance', ticker: 'eth', btcPrice: 37 }),
      ])

      const all = await repo.getAllRates()
      expect(all).toHaveLength(2)

      const tickers = all.map((r) => r.ticker).toSorted()
      expect(tickers).toEqual(['btc', 'eth'])

      const eth = all.find((r) => r.ticker === 'eth')
      if (!eth) throw new Error('eth not found in rates')
      expect(eth.btcPrice).toBe(37)
    })

    it('does not affect other sources', async () => {
      await repo.updateRatesForSource('binance', [makeRate({ source: 'binance', ticker: 'btc', btcPrice: 1 })])
      await repo.updateRatesForSource('coingecko', [makeRate({ source: 'coingecko', ticker: 'eth', btcPrice: 36.5 })])

      const all = await repo.getAllRates()
      expect(all).toHaveLength(2)

      const sources = all.map((r) => r.source).toSorted()
      expect(sources).toEqual(['binance', 'coingecko'])
    })
  })
}
