import { describe, it, expect } from 'vitest'
import { MoexRepository } from '@/repositories/MoexRepository'
import { MOEX_MOCK_CURRENCIES, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES } from '@/tests/mocks/moex-data'
import { assertFinanceApiRates } from '../helpers/assertFinanceApiRates'

describe('MoexRepository', () => {
  const repo = new MoexRepository()

  assertFinanceApiRates(() => repo.parseRatesFromRaw(MOEX_MOCK_CURRENCIES, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES))

  it('includes BTC with btcPrice = 1', () => {
    const rates = repo.parseRatesFromRaw(MOEX_MOCK_CURRENCIES, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES)
    const btc = rates.find((r) => r.ticker === 'btc')
    expect(btc).toBeDefined()
    expect(btc?.btcPrice).toBe(1)
  })

  it('includes USD rate', () => {
    const rates = repo.parseRatesFromRaw(MOEX_MOCK_CURRENCIES, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES)
    const usd = rates.find((r) => r.ticker === 'usd')
    expect(usd).toBeDefined()
    expect(usd?.btcPrice).toBeGreaterThan(0)
  })

  it('includes RUB rate', () => {
    const rates = repo.parseRatesFromRaw(MOEX_MOCK_CURRENCIES, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES)
    const rub = rates.find((r) => r.ticker === 'rub')
    expect(rub).toBeDefined()
    expect(rub?.btcPrice).toBeGreaterThan(0)
  })

  it('includes RUB_TOM currencies (CNY, KZT, GLD, SLV, etc)', () => {
    const rates = repo.parseRatesFromRaw(MOEX_MOCK_CURRENCIES, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES)
    const tickers = rates.map((r) => r.ticker)
    expect(tickers).toContain('cny')
    expect(tickers).toContain('kzt')
    expect(tickers).toContain('gld')
    expect(tickers).toContain('slv')
    expect(tickers).toContain('byn')
    expect(tickers).toContain('try')
  })

  it('includes index entries', () => {
    const rates = repo.parseRatesFromRaw(MOEX_MOCK_CURRENCIES, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES)
    const tickers = rates.map((r) => r.ticker)
    // BCSGA_INAV_RUB from indexes
    expect(tickers).toContain('bcsga_inav_rub')
    // RTSI_RTSI_USD
    expect(tickers).toContain('rtsi_rtsi_usd')
    // IMOEX_SNDX_RUB
    expect(tickers).toContain('imoex_sndx_rub')
  })

  it('includes share entries with correct board tickers', () => {
    const rates = repo.parseRatesFromRaw(MOEX_MOCK_CURRENCIES, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES)
    const tickers = rates.map((r) => r.ticker)
    expect(tickers).toContain('enpg_tqbr')
    expect(tickers).toContain('sber_tqbr')
    expect(tickers).toContain('sila_tqtf')
    expect(tickers).toContain('akmc_tqty')
  })

  it('throws if USD/RUB is missing', () => {
    const badCurrencies = JSON.stringify({
      securities: { columns: ['SECID', 'SECNAME'], data: [] },
      marketdata: { columns: ['SECID', 'WAPRICE'], data: [] },
    })
    expect(() => repo.parseRatesFromRaw(badCurrencies, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES)).toThrow('USD/RUB')
  })

  it('throws if BTC/USD (MOEXBTC) is missing from indexes', () => {
    const badIndexes = JSON.stringify({
      securities: {
        columns: ['SECID', 'BOARDID', 'CURRENCYID', 'NAME'],
        data: [],
      },
      marketdata: { columns: ['SECID', 'CURRENTVALUE'], data: [] },
    })
    expect(() => repo.parseRatesFromRaw(MOEX_MOCK_CURRENCIES, badIndexes, MOEX_MOCK_SHARES)).toThrow('MOEXBTC')
  })

  it('all currencies have correct units', () => {
    const rates = repo.parseRatesFromRaw(MOEX_MOCK_CURRENCIES, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES)
    const unitMap: Record<string, string> = {
      rub: '₽',
      usd: '$',
      cny: '¥',
      kzt: '₸',
      gld: 'Au',
      slv: 'Ag',
      byn: 'BYN',
      try: '₺',
    }
    for (const [ticker, expectedUnit] of Object.entries(unitMap)) {
      const rate = rates.find((r) => r.ticker === ticker)
      expect(rate).toBeDefined()
      expect(rate?.unit).toBe(expectedUnit)
    }
  })
})
