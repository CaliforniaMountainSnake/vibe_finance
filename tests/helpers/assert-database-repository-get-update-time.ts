import { describe, it, expect, beforeEach } from 'vitest'
import type { ExchangeRate } from '@/entities/exchange-rate'
import type { DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'

function makeRate(overrides: Partial<ExchangeRate> = {}): ExchangeRate {
  return {
    source: 'binance',
    ticker: 'btc',
    btcPrice: 1,
    updatedAt: 1_700_000_000,
    ...overrides,
  }
}

/**
 * Регистрирует тесты контракта метода getUpdateTime интерфейса DatabaseRepositoryInterface.
 */
export function assertDatabaseRepositoryGetUpdateTime(makeRepo: () => DatabaseRepositoryInterface) {
  let repo: DatabaseRepositoryInterface

  beforeEach(() => {
    repo = makeRepo()
    return repo.clearAll()
  })

  describe('getUpdateTime — время обновления источника', () => {
    it('returns null for source with no data', async () => {
      expect(await repo.getUpdateTime('binance')).toBeNull()
    })

    it('returns null when only other source has data', async () => {
      await repo.updateRatesForSource('coingecko', [
        makeRate({ source: 'coingecko', ticker: 'btc', btcPrice: 1, updatedAt: 1_700_000_000 }),
      ])

      expect(await repo.getUpdateTime('binance')).toBeNull()
    })

    it('returns updatedAt from a row for the given source', async () => {
      await repo.updateRatesForSource('binance', [
        makeRate({ source: 'binance', ticker: 'btc', btcPrice: 1, updatedAt: 1_700_000_050 }),
      ])

      expect(await repo.getUpdateTime('binance')).toBe(1_700_000_050)
    })

    it('returns updatedAt after data replacement', async () => {
      await repo.updateRatesForSource('binance', [
        makeRate({ source: 'binance', ticker: 'btc', btcPrice: 1, updatedAt: 1_700_000_000 }),
      ])
      await repo.updateRatesForSource('binance', [
        makeRate({ source: 'binance', ticker: 'eth', btcPrice: 36.5, updatedAt: 1_700_000_200 }),
      ])

      expect(await repo.getUpdateTime('binance')).toBe(1_700_000_200)
    })

    it('differentiates sources', async () => {
      await repo.updateRatesForSource('binance', [
        makeRate({ source: 'binance', ticker: 'btc', btcPrice: 1, updatedAt: 1_700_000_000 }),
      ])
      await repo.updateRatesForSource('coingecko', [
        makeRate({ source: 'coingecko', ticker: 'eth', btcPrice: 36.5, updatedAt: 1_700_000_100 }),
      ])

      expect(await repo.getUpdateTime('binance')).toBe(1_700_000_000)
      expect(await repo.getUpdateTime('coingecko')).toBe(1_700_000_100)
    })

    it('returns null after clearAll', async () => {
      await repo.updateRatesForSource('binance', [
        makeRate({ source: 'binance', ticker: 'btc', btcPrice: 1, updatedAt: 1_700_000_000 }),
      ])
      await repo.clearAll()

      expect(await repo.getUpdateTime('binance')).toBeNull()
    })
  })
}
