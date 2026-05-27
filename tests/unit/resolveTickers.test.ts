import { describe, it, expect } from 'vitest'
import { resolveTickers } from '@/repositories/moex/resolve-tickers'
import type { ShareEntry } from '@/repositories/moex/parse-shares'
import type { IndexEntry } from '@/repositories/moex/parse-indexes'

function makeShare(overrides: Partial<ShareEntry>): ShareEntry {
  return { ticker: '', secId: '', boardId: '', priceInCurrency: 0, currency: 'RUB', name: '', ...overrides }
}

function makeIndex(overrides: Partial<IndexEntry>): IndexEntry {
  return { ticker: '', secId: '', boardId: '', priceInCurrency: 0, currency: 'RUB', name: '', ...overrides }
}

describe('resolveTickers', () => {
  it('returns empty array for empty input', () => {
    expect(resolveTickers([])).toEqual([])
  })

  it('returns entries unchanged when no collisions', () => {
    const entries = [
      makeShare({ ticker: 'sber', secId: 'sber', boardId: 'tqbr' }),
      makeShare({ ticker: 'enpg', secId: 'enpg', boardId: 'tqbr' }),
      makeShare({ ticker: 'sila', secId: 'sila', boardId: 'tqtf' }),
    ]
    const result = resolveTickers(entries)
    expect(result).toHaveLength(3)
    expect(result.map((r) => r.ticker)).toEqual(['sber', 'enpg', 'sila'])
  })

  it('first entry wins, second gets secid_boardid fallback', () => {
    const entries = [
      makeShare({ ticker: 'sber', secId: 'sber', boardId: 'tqbr' }),
      makeShare({ ticker: 'sber', secId: 'sber', boardId: 'tqtf' }),
    ]
    const result = resolveTickers(entries)
    expect(result).toHaveLength(2)
    expect(result[0].ticker).toBe('sber')
    expect(result[1].ticker).toBe('sber_tqtf')
  })

  it('reverse order — second gets secid_boardid fallback', () => {
    const entries = [
      makeShare({ ticker: 'sber', secId: 'sber', boardId: 'tqtf' }),
      makeShare({ ticker: 'sber', secId: 'sber', boardId: 'tqbr' }),
    ]
    const result = resolveTickers(entries)
    expect(result).toHaveLength(2)
    expect(result[0].ticker).toBe('sber')
    expect(result[1].ticker).toBe('sber_tqbr')
  })

  it('preserves entry fields besides ticker', () => {
    const entries = [
      makeShare({
        ticker: 'sber',
        secId: 'sber',
        boardId: 'tqbr',
        priceInCurrency: 285.1,
        currency: 'RUB',
        name: 'Сбербанк ПАО ао',
      }),
      makeShare({
        ticker: 'sber',
        secId: 'sber',
        boardId: 'tqtf',
        priceInCurrency: 290.5,
        currency: 'RUB',
        name: 'БПИФ Сбербанк',
      }),
    ]
    const result = resolveTickers(entries)
    expect(result).toHaveLength(2)

    const first = result.find((r) => r.ticker === 'sber')
    expect(first).toBeDefined()
    if (!first) throw new Error('unreachable: first ticker missing')
    expect(first.priceInCurrency).toBe(285.1)
    expect(first.name).toBe('Сбербанк ПАО ао')

    const second = result.find((r) => r.ticker === 'sber_tqtf')
    expect(second).toBeDefined()
    if (!second) throw new Error('unreachable: second ticker missing')
    expect(second.priceInCurrency).toBe(290.5)
    expect(second.name).toBe('БПИФ Сбербанк')
  })

  // Shares
  it('TQTY gets _cny suffix, no collision with TQTF secid', () => {
    const entries = [
      makeShare({ ticker: 'akmc', secId: 'akmc', boardId: 'tqtf' }),
      makeShare({ ticker: 'akmc_cny', secId: 'akmc', boardId: 'tqty' }),
    ]
    const result = resolveTickers(entries)
    expect(result).toHaveLength(2)
    expect(result[0].ticker).toBe('akmc')
    expect(result[1].ticker).toBe('akmc_cny')
  })

  it('TQTY vs TQTY _cny collision — identical primary tickers', () => {
    const entries = [
      makeShare({ ticker: 'akmc_cny', secId: 'akmc', boardId: 'tqty' }),
      makeShare({ ticker: 'akmc_cny', secId: 'akmc_2', boardId: 'tqty' }),
    ]
    const result = resolveTickers(entries)
    expect(result).toHaveLength(2)
    expect(result[0].ticker).toBe('akmc_cny')
    expect(result[1].ticker).toBe('akmc_2_tqty')
  })

  // Indexes
  it('no collisions — stays secid_currency', () => {
    const entries = [
      makeIndex({ ticker: 'imoex_rub', secId: 'imoex', boardId: 'sndx' }),
      makeIndex({ ticker: 'rtsi_usd', secId: 'rtsi', boardId: 'rtsi' }),
    ]
    const result = resolveTickers(entries)
    expect(result).toHaveLength(2)
    expect(result[0].ticker).toBe('imoex_rub')
    expect(result[1].ticker).toBe('rtsi_usd')
  })

  it('index collision — second falls back to secid_boardid', () => {
    const entries = [
      makeIndex({ ticker: 'moexbtc_usd', secId: 'moexbtc', boardId: 'rtsi' }),
      makeIndex({ ticker: 'moexbtc_usd', secId: 'moexbtc', boardId: 'sndx' }),
    ]
    const result = resolveTickers(entries)
    expect(result).toHaveLength(2)
    expect(result[0].ticker).toBe('moexbtc_usd')
    expect(result[1].ticker).toBe('moexbtc_sndx')
  })

  // Mixed
  it('no cross-type collision when tickers differ', () => {
    const entries = [
      makeShare({ ticker: 'sber', secId: 'sber', boardId: 'tqbr' }),
      makeIndex({ ticker: 'imoex_rub', secId: 'imoex', boardId: 'sndx' }),
    ]
    const result = resolveTickers(entries)
    expect(result).toHaveLength(2)
    expect(result[0].ticker).toBe('sber')
    expect(result[1].ticker).toBe('imoex_rub')
  })
})
