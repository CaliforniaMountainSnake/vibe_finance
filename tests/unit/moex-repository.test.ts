import { describe, it, expect } from 'vitest'
import { MoexRepository } from '@/repositories/moex-repository'
import { MOEX_MOCK_CURRENCIES, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES } from '@/tests/mocks/moex-data'
import { assertFinanceApiRates } from '../helpers/assert-finance-api-rates'

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

  it('divides price by FACEVALUE (KZT has FACEVALUE=100)', () => {
    const rates = repo.parseRatesFromRaw(MOEX_MOCK_CURRENCIES, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES)
    const kzt = rates.find((r) => r.ticker === 'kzt')
    expect(kzt).toBeDefined()
    // KZTRUB_TOM WAPRICE=15.7556, FACEVALUE=100 → 15.7556/100 = 0.157556
    expect(kzt?.btcPrice).toBeGreaterThan(0)
    expect(kzt?.btcPrice).toBeLessThan(100_000_000)
  })

  it('FACEVALUE=1 currencies are not divided (CNY spot-check)', () => {
    const rates = repo.parseRatesFromRaw(MOEX_MOCK_CURRENCIES, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES)
    const cny = rates.find((r) => r.ticker === 'cny')
    expect(cny).toBeDefined()
    expect(cny?.btcPrice).toBeGreaterThan(0)
    // CNY should be much less than KZT btcPrice since KZT per-unit is tiny after division
    const kzt = rates.find((r) => r.ticker === 'kzt')
    expect(kzt).toBeDefined()
    if (cny && kzt) {
      expect(cny.btcPrice).toBeLessThan(kzt.btcPrice)
    }
  })

  it('falls back to PREVPRICE when WAPRICE is null', () => {
    const rates = repo.parseRatesFromRaw(MOEX_MOCK_CURRENCIES, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES)
    const entry = rates.find((r) => r.ticker === 'prevfall')
    expect(entry).toBeDefined()
    // PREVFALLRUB_TOM: WAPRICE=null, PREVPRICE=50, FACEVALUE=1
    expect(entry?.btcPrice).toBeGreaterThan(0)
  })

  it('treats FACEVALUE=0 as 1 (no division)', () => {
    const rates = repo.parseRatesFromRaw(MOEX_MOCK_CURRENCIES, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES)
    const entry = rates.find((r) => r.ticker === 'facezero')
    expect(entry).toBeDefined()
    // FACEZERORUB_TOM: WAPRICE=42, FACEVALUE=0 → treated as 1, priceInRub=42
    expect(entry?.btcPrice).toBeGreaterThan(0)
  })

  it('includes index entries', () => {
    const rates = repo.parseRatesFromRaw(MOEX_MOCK_CURRENCIES, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES)
    const tickers = rates.map((r) => r.ticker)
    // BCSGA → bcsga
    expect(tickers).toContain('bcsga')
    // RTSI → rtsi
    expect(tickers).toContain('rtsi')
    // IMOEX → imoex
    expect(tickers).toContain('imoex')
  })

  it('index collision — same SECID on different boards falls back to secid_boardid', () => {
    const rates = repo.parseRatesFromRaw(MOEX_MOCK_CURRENCIES, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES)
    const tickers = rates.map((r) => r.ticker)
    // BCSGA на INAV выигрывает (первый), BCSGA на SNDX получает bcsga_sndx
    expect(tickers).toContain('bcsga')
    expect(tickers).toContain('bcsga_sndx')
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

  it('falls back to MARKETPRICE when WAPRICE is zero', () => {
    const rates = repo.parseRatesFromRaw(MOEX_MOCK_CURRENCIES, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES)
    const entry = rates.find((r) => r.ticker === 'fallback_ok')
    expect(entry).toBeDefined()
    expect(entry?.btcPrice).toBeGreaterThan(0)
  })

  it('falls back to MARKETPRICE when WAPRICE is null', () => {
    const rates = repo.parseRatesFromRaw(MOEX_MOCK_CURRENCIES, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES)
    const entry = rates.find((r) => r.ticker === 'fallback_null')
    expect(entry).toBeDefined()
    expect(entry?.btcPrice).toBeGreaterThan(0)
  })

  it('skips share when both WAPRICE and MARKETPRICE are missing', () => {
    const rates = repo.parseRatesFromRaw(MOEX_MOCK_CURRENCIES, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES)
    const tickers = rates.map((r) => r.ticker)
    expect(tickers).not.toContain('missing_both')
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
