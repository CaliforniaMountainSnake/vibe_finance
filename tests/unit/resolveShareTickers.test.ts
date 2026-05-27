import { describe, it, expect } from 'vitest'
import { resolveShareTickers } from '@/repositories/moex/resolve-share-tickers'
import type { ShareEntry } from '@/repositories/moex/parse-shares'

function makeEntry(overrides: Partial<ShareEntry>): ShareEntry {
  return {
    ticker: '',
    secId: '',
    boardId: '',
    priceInCurrency: 0,
    currency: 'RUB',
    name: '',
    ...overrides,
  }
}

describe('resolveShareTickers', () => {
  it('returns empty array for empty input', () => {
    expect(resolveShareTickers([])).toEqual([])
  })

  it('returns entries unchanged when no collisions', () => {
    const entries = [
      makeEntry({ ticker: 'sber', secId: 'sber', boardId: 'tqbr' }),
      makeEntry({ ticker: 'enpg', secId: 'enpg', boardId: 'tqbr' }),
      makeEntry({ ticker: 'sila', secId: 'sila', boardId: 'tqtf' }),
    ]
    const result = resolveShareTickers(entries)
    expect(result).toHaveLength(3)
    expect(result.map((r) => r.ticker)).toEqual(['sber', 'enpg', 'sila'])
  })

  it('first entry wins, second gets secid_boardid fallback (TQBR vs TQTF)', () => {
    const entries = [
      makeEntry({ ticker: 'sber', secId: 'sber', boardId: 'tqbr' }),
      makeEntry({ ticker: 'sber', secId: 'sber', boardId: 'tqtf' }),
    ]
    const result = resolveShareTickers(entries)
    expect(result).toHaveLength(2)
    expect(result[0].ticker).toBe('sber')
    expect(result[1].ticker).toBe('sber_tqtf')
  })

  it('reverse order — TQTF first wins', () => {
    const entries = [
      makeEntry({ ticker: 'sber', secId: 'sber', boardId: 'tqtf' }),
      makeEntry({ ticker: 'sber', secId: 'sber', boardId: 'tqbr' }),
    ]
    const result = resolveShareTickers(entries)
    expect(result).toHaveLength(2)
    expect(result[0].ticker).toBe('sber')
    expect(result[1].ticker).toBe('sber_tqbr')
  })

  it('TQTF vs TQTY — akmc_cny vs akmc: different primary tickers, no collision', () => {
    const entries = [
      makeEntry({ ticker: 'akmc', secId: 'akmc', boardId: 'tqtf' }),
      makeEntry({ ticker: 'akmc_cny', secId: 'akmc', boardId: 'tqty' }),
    ]
    const result = resolveShareTickers(entries)
    expect(result).toHaveLength(2)
    expect(result[0].ticker).toBe('akmc')
    expect(result[1].ticker).toBe('akmc_cny')
  })

  it('TQTY vs TQTY _cny collision — both different SECIDs map to same primary ticker', () => {
    const entries = [
      makeEntry({ ticker: 'akmc_cny', secId: 'akmc', boardId: 'tqty' }),
      makeEntry({ ticker: 'akmc_cny', secId: 'akmc', boardId: 'tqty' }),
    ]
    const result = resolveShareTickers(entries)
    expect(result).toHaveLength(2)
    expect(result[0].ticker).toBe('akmc_cny')
    expect(result[1].ticker).toBe('akmc_tqty')
  })

  it('preserves entry fields besides ticker', () => {
    const entries = [
      makeEntry({
        ticker: 'sber',
        secId: 'sber',
        boardId: 'tqbr',
        priceInCurrency: 285.1,
        currency: 'RUB',
        name: 'Сбербанк ПАО ао',
      }),
      makeEntry({
        ticker: 'sber',
        secId: 'sber',
        boardId: 'tqtf',
        priceInCurrency: 290.5,
        currency: 'RUB',
        name: 'БПИФ Сбербанк',
      }),
    ]
    const result = resolveShareTickers(entries)
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
})
