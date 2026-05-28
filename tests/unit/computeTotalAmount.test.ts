import { describe, it, expect } from 'vitest'
import { computeTotalAmount } from '@/lib/compute-total'
import type { Holding } from '@/entities/Holding'
import type { Ticker } from '@/entities/Ticker'

const ticker: Ticker = { source: 'coingecko', ticker: 'usd' }

function makeHolding(overrides: Partial<Holding> = {}): Holding {
  return {
    id: crypto.randomUUID(),
    ticker,
    amount: 100,
    label: 'test',
    order: 0,
    enabled: true,
    ...overrides,
  }
}

describe('computeTotalAmount', () => {
  it('возвращает 0 для пустого массива', () => {
    expect(computeTotalAmount([], {})).toBe(0)
  })

  it('возвращает 0 когда все holding disabled', () => {
    const holdings = [makeHolding({ id: '1', enabled: false }), makeHolding({ id: '2', enabled: false })]
    const rates = { '1': 2.5, '2': 3 }
    expect(computeTotalAmount(holdings, rates)).toBe(0)
  })

  it('суммирует только enabled holding с валидным rate', () => {
    const holdings = [makeHolding({ id: '1', amount: 10 }), makeHolding({ id: '2', amount: 20 })]
    const rates = { '1': 2, '2': 3 }
    expect(computeTotalAmount(holdings, rates)).toBe(10 * 2 + 20 * 3)
  })

  it('пропускает holding с rate=undefined', () => {
    const holdings = [makeHolding({ id: '1', amount: 10 }), makeHolding({ id: '2', amount: 20 })]
    const rates = { '1': 2, '2': undefined }
    expect(computeTotalAmount(holdings, rates)).toBe(10 * 2)
  })

  it('пропускает holding с rate=NaN', () => {
    const holdings = [makeHolding({ id: '1', amount: 10 }), makeHolding({ id: '2', amount: 20 })]
    const rates = { '1': 2, '2': NaN }
    expect(computeTotalAmount(holdings, rates)).toBe(10 * 2)
  })

  it('пропускает holding с отсутствующим rate в объекте', () => {
    const holdings = [makeHolding({ id: '1', amount: 10 }), makeHolding({ id: '2', amount: 20 })]
    const rates = { '1': 2 }
    expect(computeTotalAmount(holdings, rates)).toBe(10 * 2)
  })

  it('корректно считает с rate=0', () => {
    const holdings = [makeHolding({ id: '1', amount: 10 })]
    const rates = { '1': 0 }
    expect(computeTotalAmount(holdings, rates)).toBe(0)
  })

  it('смешанные: enabled, disabled, undefined rate, NaN rate', () => {
    const holdings = [
      makeHolding({ id: 'a', amount: 10, enabled: true }),
      makeHolding({ id: 'b', amount: 20, enabled: false }),
      makeHolding({ id: 'c', amount: 30, enabled: true }),
      makeHolding({ id: 'd', amount: 40, enabled: true }),
    ]
    const rates = { a: 2, b: 99, c: NaN, d: undefined }
    expect(computeTotalAmount(holdings, rates)).toBe(10 * 2)
  })
})
