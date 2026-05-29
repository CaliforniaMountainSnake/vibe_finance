import { describe, it, expect } from 'vitest'
import { convert } from '@/lib/conversion'
import type { Holding } from '@/entities/Holding'
import type { Ticker } from '@/entities/Ticker'
import type { TickerPair } from '@/entities/TickerPair'

const ticker: Ticker = { source: 'coingecko', ticker: 'usd' }
const totalTicker: Ticker = { source: 'coingecko', ticker: 'rub' }

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

function inMemoryGetRate(rates: Record<string, number | undefined>): (pair: TickerPair) => Promise<number | undefined> {
  return (pair: TickerPair) => {
    const key = `${pair.from.ticker}:${pair.to.ticker}`
    return Promise.resolve(rates[key])
  }
}

function pickResult(results: Array<{ holdingId: string; converted: string | undefined; rate: number | undefined }>) {
  return {
    ids: results.map((r) => r.holdingId),
    converted: results.map((r) => r.converted),
    rates: results.map((r) => r.rate),
  }
}

describe('convert', () => {
  it('возвращает пустой массив для пустых holdings', async () => {
    const results = await convert([], inMemoryGetRate({}), totalTicker)
    expect(results).toEqual([])
  })

  it('возвращает undefined для всех holding если totalTicker=null', async () => {
    const holdings = [makeHolding({ id: '1', amount: 100 })]
    const results = await convert(holdings, inMemoryGetRate({ 'usd:rub': 90 }), null)
    expect(results).toHaveLength(1)
    expect(results[0].holdingId).toBe('1')
    expect(results[0].rate).toBeUndefined()
    expect(results[0].converted).toBeUndefined()
  })

  it('конвертирует holding с доступным курсом', async () => {
    const holdings = [makeHolding({ id: '1', amount: 100 })]
    const results = await convert(holdings, inMemoryGetRate({ 'usd:rub': 90 }), totalTicker)
    const r = pickResult(results)
    expect(r.ids).toEqual(['1'])
    expect(r.rates).toEqual([90])
    // formatAmount(9000) в ru-RU локали даёт "9 000" (неразрывный пробел)
    expect(r.converted[0]).toBeDefined()
  })

  it('возвращает rate=undefined и converted=undefined при недоступном курсе', async () => {
    const holdings = [makeHolding({ id: '1', amount: 100 })]
    const results = await convert(holdings, inMemoryGetRate({}), totalTicker)
    expect(results).toHaveLength(1)
    expect(results[0].rate).toBeUndefined()
    expect(results[0].converted).toBeUndefined()
  })

  it('конвертирует несколько холдингов', async () => {
    const holdings = [makeHolding({ id: 'a', amount: 100 }), makeHolding({ id: 'b', amount: 200 })]
    const results = await convert(holdings, inMemoryGetRate({ 'usd:rub': 90 }), totalTicker)
    const r = pickResult(results)
    expect(r.ids).toEqual(['a', 'b'])
    expect(r.rates).toEqual([90, 90])
    expect(r.converted[0]).toBeDefined()
    expect(r.converted[1]).toBeDefined()
  })

  it('смешанные: доступный и недоступный курс', async () => {
    const getRate = inMemoryGetRate({ 'usd:rub': 90 })
    const results = await convert(
      [
        makeHolding({ id: '1', amount: 100, ticker }),
        makeHolding({ id: '2', amount: 200, ticker: { source: 'binance', ticker: 'btc' } }),
      ],
      getRate,
      totalTicker
    )
    expect(results[0].rate).toBe(90)
    expect(results[0].converted).toBeDefined()
    expect(results[1].rate).toBeUndefined()
    expect(results[1].converted).toBeUndefined()
  })

  it('вычисляет converted через formatAmount (уважает форматирование)', async () => {
    const results = await convert(
      [makeHolding({ id: '1', amount: 1.5 })],
      inMemoryGetRate({ 'usd:rub': 2 }),
      totalTicker
    )
    expect(results[0].converted).toBe('3')
  })

  it('работает с rate=0', async () => {
    const results = await convert(
      [makeHolding({ id: '1', amount: 100 })],
      inMemoryGetRate({ 'usd:rub': 0 }),
      totalTicker
    )
    expect(results[0].rate).toBe(0)
    expect(results[0].converted).toBe('0')
  })
})
