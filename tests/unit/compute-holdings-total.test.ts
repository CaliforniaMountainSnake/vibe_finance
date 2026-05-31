import { describe, it, expect } from 'vitest'
import { computeHoldingsTotal } from '@/lib/compute-holdings-total'
import type { Holding } from '@/entities/holding'
import type { Ticker } from '@/entities/ticker'

function makeTicker(overrides: Partial<Ticker> = {}): Ticker {
  return {
    source: 'binance',
    ticker: 'BTC',
    unit: 'BTC',
    name: 'Bitcoin',
    ...overrides,
  }
}

function makeHolding(overrides: Partial<Holding> & { id: string }): Holding {
  return {
    ticker: makeTicker(),
    amount: 1,
    label: '',
    order: 0,
    enabled: true,
    ...overrides,
  }
}

describe('computeHoldingsTotal', () => {
  describe('пустой список', () => {
    it('возвращает нулевую сумму, 0 contributed, 0 skipped', () => {
      const result = computeHoldingsTotal([], {})
      expect(result).toEqual({ totalAmount: 0, contributedCount: 0, skippedCount: 0 })
    })
  })

  describe('один холдинг — курс доступен', () => {
    it('пересчитывает сумму и не пропускает', () => {
      const holdings: Holding[] = [makeHolding({ id: 'h1', amount: 100 })]
      const rates = { h1: 0.5 }

      const result = computeHoldingsTotal(holdings, rates)
      expect(result).toEqual({ totalAmount: 50, contributedCount: 1, skippedCount: 0 })
    })
  })

  describe('один холдинг — курс не найден', () => {
    it('пропускает холдинг — сумма 0, skippedCount 1', () => {
      const holdings: Holding[] = [makeHolding({ id: 'h1', amount: 100 })]
      const rates: Record<string, number | undefined> = {}

      const result = computeHoldingsTotal(holdings, rates)
      expect(result).toEqual({ totalAmount: 0, contributedCount: 0, skippedCount: 1 })
    })
  })

  describe('один холдинг — курс NaN', () => {
    it('считает NaN как недоступный', () => {
      const holdings: Holding[] = [makeHolding({ id: 'h1', amount: 100 })]
      const rates = { h1: Number.NaN }

      const result = computeHoldingsTotal(holdings, rates)
      expect(result).toEqual({ totalAmount: 0, contributedCount: 0, skippedCount: 1 })
    })
  })

  describe('смешанный: часть с курсом, часть без', () => {
    it('суммирует только доступные, считает пропущенные', () => {
      const holdings: Holding[] = [
        makeHolding({ id: 'btc', amount: 2, ticker: makeTicker({ ticker: 'BTC', unit: 'BTC' }) }),
        makeHolding({ id: 'eth', amount: 10, ticker: makeTicker({ ticker: 'ETH', unit: 'ETH' }) }),
        makeHolding({ id: 'xrp', amount: 1000, ticker: makeTicker({ ticker: 'XRP', unit: 'XRP' }) }),
      ]
      // BTC: курс есть, ETH: курс undefined, XRP: курс есть
      const rates = { btc: 50_000, eth: undefined, xrp: 0.5 }

      const result = computeHoldingsTotal(holdings, rates)
      // 2 * 50000 + 1000 * 0.5 = 100000 + 500 = 100500
      expect(result).toEqual({ totalAmount: 100_500, contributedCount: 2, skippedCount: 1 })
    })
  })

  describe('все курсы недоступны', () => {
    it('сумма 0, все skipping', () => {
      const holdings: Holding[] = [makeHolding({ id: 'a', amount: 1 }), makeHolding({ id: 'b', amount: 2 })]
      const rates = { a: undefined, b: undefined }

      const result = computeHoldingsTotal(holdings, rates)
      expect(result).toEqual({ totalAmount: 0, contributedCount: 0, skippedCount: 2 })
    })
  })

  describe('отключённые (enabled: false) холдинги', () => {
    it('не учитывает отключённые ни в contributed, ни в skipped', () => {
      const holdings: Holding[] = [
        makeHolding({ id: 'on', amount: 5, enabled: true }),
        makeHolding({ id: 'off', amount: 100, enabled: false }),
      ]
      // У отключённого курс доступен, но он не должен участвовать
      const rates = { on: 10, off: 999 }

      const result = computeHoldingsTotal(holdings, rates)
      expect(result).toEqual({ totalAmount: 50, contributedCount: 1, skippedCount: 0 })
    })

    it('отключённый с недоступным курсом тоже не учитывает', () => {
      const holdings: Holding[] = [
        makeHolding({ id: 'on', amount: 5, enabled: true }),
        makeHolding({ id: 'off', amount: 100, enabled: false }),
      ]
      const rates = { on: 10, off: undefined }

      const result = computeHoldingsTotal(holdings, rates)
      expect(result).toEqual({ totalAmount: 50, contributedCount: 1, skippedCount: 0 })
    })

    it('все отключены — всё по нулям', () => {
      const holdings: Holding[] = [
        makeHolding({ id: 'a', amount: 1, enabled: false }),
        makeHolding({ id: 'b', amount: 2, enabled: false }),
      ]
      const rates = { a: 10, b: 20 }

      const result = computeHoldingsTotal(holdings, rates)
      expect(result).toEqual({ totalAmount: 0, contributedCount: 0, skippedCount: 0 })
    })
  })

  describe('все включены, но у всех курс недоступен', () => {
    it('сумма 0, все skipped', () => {
      const holdings: Holding[] = [makeHolding({ id: 'x', amount: 1 }), makeHolding({ id: 'y', amount: 2 })]
      const rates = { x: undefined, y: undefined }

      const result = computeHoldingsTotal(holdings, rates)
      expect(result).toEqual({ totalAmount: 0, contributedCount: 0, skippedCount: 2 })
    })
  })
})
