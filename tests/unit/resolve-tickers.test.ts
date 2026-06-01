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
  it('возвращает пустой массив для пустого входа', () => {
    expect(resolveTickers([])).toEqual([])
  })

  it('возвращает записи без изменений, когда нет коллизий', () => {
    const entries = [
      makeShare({ ticker: 'sber', secId: 'sber', boardId: 'tqbr' }),
      makeShare({ ticker: 'enpg', secId: 'enpg', boardId: 'tqbr' }),
      makeShare({ ticker: 'sila', secId: 'sila', boardId: 'tqtf' }),
    ]
    const result = resolveTickers(entries)
    expect(result).toHaveLength(3)
    expect(result.map((r) => r.ticker)).toEqual(['sber', 'enpg', 'sila'])
  })

  it('первая запись выигрывает, вторая получает secid_boardid', () => {
    const entries = [
      makeShare({ ticker: 'sber', secId: 'sber', boardId: 'tqbr' }),
      makeShare({ ticker: 'sber', secId: 'sber', boardId: 'tqtf' }),
    ]
    const result = resolveTickers(entries)
    expect(result).toHaveLength(2)
    expect(result[0].ticker).toBe('sber')
    expect(result[1].ticker).toBe('sber_tqtf')
  })

  it('обратный порядок — вторая получает secid_boardid', () => {
    const entries = [
      makeShare({ ticker: 'sber', secId: 'sber', boardId: 'tqtf' }),
      makeShare({ ticker: 'sber', secId: 'sber', boardId: 'tqbr' }),
    ]
    const result = resolveTickers(entries)
    expect(result).toHaveLength(2)
    expect(result[0].ticker).toBe('sber')
    expect(result[1].ticker).toBe('sber_tqbr')
  })

  it('сохраняет поля записи, кроме ticker', () => {
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
  it('TQTY получает суффикс _cny, без коллизии с TQTF secid', () => {
    const entries = [
      makeShare({ ticker: 'akmc', secId: 'akmc', boardId: 'tqtf' }),
      makeShare({ ticker: 'akmc_cny', secId: 'akmc', boardId: 'tqty' }),
    ]
    const result = resolveTickers(entries)
    expect(result).toHaveLength(2)
    expect(result[0].ticker).toBe('akmc')
    expect(result[1].ticker).toBe('akmc_cny')
  })

  it('TQTY vs TQTY _cny коллизия — одинаковые первичные тикеры', () => {
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
  it('без коллизий — остаётся secid', () => {
    const entries = [
      makeIndex({ ticker: 'imoex', secId: 'imoex', boardId: 'sndx' }),
      makeIndex({ ticker: 'rtsi', secId: 'rtsi', boardId: 'rtsi' }),
    ]
    const result = resolveTickers(entries)
    expect(result).toHaveLength(2)
    expect(result[0].ticker).toBe('imoex')
    expect(result[1].ticker).toBe('rtsi')
  })

  it('коллизия индексов — вторая получает secid_boardid', () => {
    const entries = [
      makeIndex({ ticker: 'moexbtc', secId: 'moexbtc', boardId: 'rtsi' }),
      makeIndex({ ticker: 'moexbtc', secId: 'moexbtc', boardId: 'sndx' }),
    ]
    const result = resolveTickers(entries)
    expect(result).toHaveLength(2)
    expect(result[0].ticker).toBe('moexbtc')
    expect(result[1].ticker).toBe('moexbtc_sndx')
  })

  // Mixed
  it('нет кросс-тип коллизии, когда тикеры различаются', () => {
    const entries = [
      makeShare({ ticker: 'sber', secId: 'sber', boardId: 'tqbr' }),
      makeIndex({ ticker: 'imoex', secId: 'imoex', boardId: 'sndx' }),
    ]
    const result = resolveTickers(entries)
    expect(result).toHaveLength(2)
    expect(result[0].ticker).toBe('sber')
    expect(result[1].ticker).toBe('imoex')
  })
})
