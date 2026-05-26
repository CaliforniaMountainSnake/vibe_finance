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

  it('contains TQBR shares', () => {
    const tqbr = rates.filter((r) => r.ticker.includes('_tqbr'))
    expect(tqbr.length).toBeGreaterThan(0)
  })

  it('contains TQTF ETFs', () => {
    const tqtf = rates.filter((r) => r.ticker.includes('_tqtf'))
    expect(tqtf.length).toBeGreaterThan(0)
  })

  it('contains TQTY ETFs in CNY', () => {
    const tqty = rates.filter((r) => r.ticker.includes('_tqty'))
    expect(tqty.length).toBeGreaterThan(0)
  })

  it('contains RTSI indexes', () => {
    const rtsi = rates.filter((r) => r.ticker.includes('_rtsi_'))
    expect(rtsi.length).toBeGreaterThan(0)
  })

  it('contains INAV indexes', () => {
    const inav = rates.filter((r) => r.ticker.includes('_inav_'))
    expect(inav.length).toBeGreaterThan(0)
  })

  it('no duplicate tickers', () => {
    const tickers = rates.map((r) => r.ticker)
    expect(new Set(tickers).size).toBe(tickers.length)
  })
})
