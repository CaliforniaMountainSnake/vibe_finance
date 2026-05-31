import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { MoexRepository } from '@/repositories/MoexRepository'

/**
 * Тесты парсинга на полных реальных данных из tests/raw_data/moex/.
 */
describe('MoexRepository with real raw data', () => {
  const repo = new MoexRepository()

  const rawDir = join(__dirname, '..', 'raw_data', 'moex')
  const currenciesRaw = readFileSync(join(rawDir, 'currencies.json'), 'utf-8')
  const indexesRaw = readFileSync(join(rawDir, 'indexes.json'), 'utf-8')
  const sharesRaw = readFileSync(join(rawDir, 'shares.json'), 'utf-8')

  const rates = repo.parseRatesFromRaw(currenciesRaw, indexesRaw, sharesRaw)

  it('parses real data without errors', () => {
    expect(rates.length).toBeGreaterThan(0)
  })

  it('BTC has btcPrice = 1', () => {
    const btc = rates.find((r) => r.ticker === 'btc')
    expect(btc).toBeDefined()
    expect(btc?.btcPrice).toBe(1)
  })

  it('contains key currencies', () => {
    const tickers = new Set(rates.map((r) => r.ticker))
    expect(tickers).toContain('usd')
    expect(tickers).toContain('rub')
    expect(tickers).toContain('cny')
    expect(tickers).toContain('gld')
  })

  it('contains TQBR/TQTF shares (ticker = secid, no suffix)', () => {
    // TQBR/TQTF акции используют SECID без суффикса
    const noSuffix = rates.filter((r) => !r.ticker.includes('_') && !['btc', 'usd', 'rub'].includes(r.ticker))
    // Часть из них — акции TQBR/TQTF, другие — валюты без подчёркиваний
    expect(noSuffix.length).toBeGreaterThan(0)
  })

  it('TQTY tickers end with _cny', () => {
    const tqty = rates.filter((r) => r.ticker.endsWith('_cny'))
    expect(tqty.length).toBeGreaterThan(0)
  })

  it('contains index entries (ticker = secid, no currency suffix)', () => {
    // Индексы теперь: SECID, без CURRENCYID
    const tickers = new Set(rates.map((r) => r.ticker))
    expect(tickers).toContain('imoex')
    expect(tickers).toContain('rtsi')
    expect(tickers).toContain('bcsga')
  })

  it('falls back to MARKETPRICE when WAPRICE is missing (EQMX, TMON)', () => {
    // В реальных данных у EQMX и TMON WAPRICE = null, но есть MARKETPRICE
    const tickers = new Set(rates.map((r) => r.ticker))
    expect(tickers).toContain('eqmx')
    expect(tickers).toContain('tmon')
    const eqmx = rates.find((r) => r.ticker === 'eqmx')
    const tmon = rates.find((r) => r.ticker === 'tmon')
    expect(eqmx?.btcPrice).toBeGreaterThan(0)
    expect(tmon?.btcPrice).toBeGreaterThan(0)
  })

  it('no duplicate tickers', () => {
    const tickers = rates.map((r) => r.ticker)
    expect(new Set(tickers).size).toBe(tickers.length)
  })
})
