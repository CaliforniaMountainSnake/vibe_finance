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
    // BCSGA / RUB → bcsga_rub
    expect(tickers).toContain('bcsga_rub')
    // RTSI / USD → rtsi_usd
    expect(tickers).toContain('rtsi_usd')
    // IMOEX / RUB → imoex_rub
    expect(tickers).toContain('imoex_rub')
  })

  it('includes share entries with dedup tickers', () => {
    const rates = repo.parseRatesFromRaw(MOEX_MOCK_CURRENCIES, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES)
    const tickers = rates.map((r) => r.ticker)
    // TQBR: ENPG → enpg (no collision)
    expect(tickers).toContain('enpg')
    // TQBR: SBER → sber (first wins)
    expect(tickers).toContain('sber')
    // TQTF: SBER → sber_tqtf (collision fallback)
    expect(tickers).toContain('sber_tqtf')
    // TQTF: SILA → sila (no collision)
    expect(tickers).toContain('sila')
    // TQTF: AKMC → akmc (no collision)
    expect(tickers).toContain('akmc')
    // TQTY: AKMC → akmc_cny (no collision with primary, suffix prevents)
    expect(tickers).toContain('akmc_cny')
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
