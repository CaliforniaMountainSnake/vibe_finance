import { describe, it, expect, beforeEach } from 'vitest'
import { type DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'
import { makeSnapshot } from './database-repository-test-helpers'

export function assertDatabaseRepositorySnapshots(makeRepo: () => DatabaseRepositoryInterface) {
  let repo: DatabaseRepositoryInterface

  beforeEach(() => {
    repo = makeRepo()
    return repo.clearAll()
  })

  describe('saveSnapshot / getSnapshots — дневные снимки', () => {
    it('сохраняет снапшоты и возвращает их', async () => {
      await repo.saveSnapshot([
        makeSnapshot({ date: '2026-06-15', source: 'binance', ticker: 'btc', btcPrice: 1 }),
        makeSnapshot({ date: '2026-06-15', source: 'binance', ticker: 'eth', btcPrice: 0.05 }),
      ])

      const results = await repo.getSnapshots({
        source: 'binance',
        ticker: 'btc',
        fromDate: '2026-06-15',
        toDate: '2026-06-15',
      })
      expect(results).toHaveLength(1)
      expect(results[0].btcPrice).toBe(1)
      expect(results[0].date).toBe('2026-06-15')
    })

    it('перезаписывает данные за ту же дату', async () => {
      await repo.saveSnapshot([makeSnapshot({ date: '2026-06-15', btcPrice: 1 })])
      await repo.saveSnapshot([makeSnapshot({ date: '2026-06-15', btcPrice: 2 })])

      const results = await repo.getSnapshots({
        source: 'binance',
        ticker: 'btc',
        fromDate: '2026-06-15',
        toDate: '2026-06-15',
      })
      expect(results).toHaveLength(1)
      expect(results[0].btcPrice).toBe(2)
    })

    it('хранит снапшоты за разные даты', async () => {
      await repo.saveSnapshot([makeSnapshot({ date: '2026-06-15', btcPrice: 1 })])
      await repo.saveSnapshot([makeSnapshot({ date: '2026-06-18', btcPrice: 2 })])

      const results = await repo.getSnapshots({
        source: 'binance',
        ticker: 'btc',
        fromDate: '2026-06-15',
        toDate: '2026-06-18',
      })
      expect(results).toHaveLength(2)
      expect(results[0].btcPrice).toBe(1)
      expect(results[0].date).toBe('2026-06-15')
      expect(results[1].btcPrice).toBe(2)
      expect(results[1].date).toBe('2026-06-18')
    })

    it('всегда возвращает снапшоты отсортированными по дате', async () => {
      await repo.saveSnapshot([makeSnapshot({ date: '2026-06-20', btcPrice: 3 })])
      await repo.saveSnapshot([makeSnapshot({ date: '2026-06-10', btcPrice: 1 })])
      await repo.saveSnapshot([makeSnapshot({ date: '2026-06-15', btcPrice: 2 })])

      const results = await repo.getSnapshots({
        source: 'binance',
        ticker: 'btc',
        fromDate: '2026-06-01',
        toDate: '2026-06-30',
      })
      expect(results).toHaveLength(3)
      expect(results[0].date).toBe('2026-06-10')
      expect(results[0].btcPrice).toBe(1)
      expect(results[1].date).toBe('2026-06-15')
      expect(results[1].btcPrice).toBe(2)
      expect(results[2].date).toBe('2026-06-20')
      expect(results[2].btcPrice).toBe(3)
    })

    it('фильтрует по диапазону дат (fromDate и toDate включены)', async () => {
      await repo.saveSnapshot([makeSnapshot({ date: '2026-06-10', btcPrice: 1 })])
      await repo.saveSnapshot([makeSnapshot({ date: '2026-06-15', btcPrice: 2 })])
      await repo.saveSnapshot([makeSnapshot({ date: '2026-06-20', btcPrice: 3 })])

      const middle = await repo.getSnapshots({
        source: 'binance',
        ticker: 'btc',
        fromDate: '2026-06-12',
        toDate: '2026-06-18',
      })
      expect(middle).toHaveLength(1)
      expect(middle[0].btcPrice).toBe(2)

      const before = await repo.getSnapshots({
        source: 'binance',
        ticker: 'btc',
        fromDate: '2000-01-01',
        toDate: '2026-06-09',
      })
      expect(before).toHaveLength(0)

      const all = await repo.getSnapshots({
        source: 'binance',
        ticker: 'btc',
        fromDate: '2026-06-10',
        toDate: '2026-06-20',
      })
      expect(all).toHaveLength(3)
    })

    it('изолирует данные по источнику и тикеру', async () => {
      await repo.saveSnapshot([
        makeSnapshot({ date: '2026-06-15', source: 'binance', ticker: 'btc', btcPrice: 1 }),
        makeSnapshot({ date: '2026-06-15', source: 'binance', ticker: 'eth', btcPrice: 0.05 }),
        makeSnapshot({ date: '2026-06-15', source: 'coingecko', ticker: 'btc', btcPrice: 1.1 }),
      ])

      expect(
        await repo.getSnapshots({ source: 'binance', ticker: 'btc', fromDate: '2026-06-15', toDate: '2026-06-15' })
      ).toHaveLength(1)

      const coingeckoResult = await repo.getSnapshots({
        source: 'coingecko',
        ticker: 'btc',
        fromDate: '2026-06-15',
        toDate: '2026-06-15',
      })
      expect(coingeckoResult).toHaveLength(1)
      expect(coingeckoResult[0].btcPrice).toBe(1.1)

      expect(
        await repo.getSnapshots({ source: 'binance', ticker: 'eth', fromDate: '2026-06-15', toDate: '2026-06-15' })
      ).toHaveLength(1)

      expect(
        await repo.getSnapshots({ source: 'bybit', ticker: 'btc', fromDate: '2026-06-15', toDate: '2026-06-15' })
      ).toHaveLength(0)

      expect(
        await repo.getSnapshots({ source: 'binance', ticker: 'xrp', fromDate: '2026-06-15', toDate: '2026-06-15' })
      ).toHaveLength(0)
    })

    it('возвращает пустой массив когда данных нет', async () => {
      const results = await repo.getSnapshots({
        source: 'binance',
        ticker: 'btc',
        fromDate: '2026-06-15',
        toDate: '2026-06-15',
      })
      expect(results).toEqual([])
    })

    it('работает с граничными датами (век XX, XXI, XXII)', async () => {
      await repo.saveSnapshot([makeSnapshot({ date: '2000-01-01', btcPrice: 0.1 })])
      await repo.saveSnapshot([makeSnapshot({ date: '2026-12-31', btcPrice: 100 })])
      await repo.saveSnapshot([makeSnapshot({ date: '2099-12-31', btcPrice: 999 })])

      const results = await repo.getSnapshots({
        source: 'binance',
        ticker: 'btc',
        fromDate: '1999-01-01',
        toDate: '2099-12-31',
      })
      expect(results).toHaveLength(3)
    })
  })
}
