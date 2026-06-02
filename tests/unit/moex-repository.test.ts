import { describe, it, expect } from 'vitest'
import { MoexRepository } from '@/repositories/moex-repository'
import { MOEX_MOCK_CURRENCIES, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES } from '@/tests/mocks/moex-data'
import { assertFinanceApiRates } from '../helpers/assert-finance-api-rates'

describe('MoexRepository — парсинг ответа', () => {
  const repo = new MoexRepository()

  const combined = MoexRepository.combineResponses(MOEX_MOCK_CURRENCIES, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES)

  assertFinanceApiRates(() => repo.parseRates(combined))

  it('включает BTC с btcPrice = 1', () => {
    const rates = repo.parseRates(combined)
    const btc = rates.find((r) => r.ticker === 'btc')
    expect(btc).toBeDefined()
    expect(btc?.btcPrice).toBe(1)
  })

  it('включает курс USD', () => {
    const rates = repo.parseRates(combined)
    const usd = rates.find((r) => r.ticker === 'usd')
    expect(usd).toBeDefined()
    expect(usd?.btcPrice).toBeGreaterThan(0)
  })

  it('включает курс RUB', () => {
    const rates = repo.parseRates(combined)
    const rub = rates.find((r) => r.ticker === 'rub')
    expect(rub).toBeDefined()
    expect(rub?.btcPrice).toBeGreaterThan(0)
  })

  it('включает валюты RUB_TOM (CNY, KZT, GLD, SLV и др)', () => {
    const rates = repo.parseRates(combined)
    const tickers = rates.map((r) => r.ticker)
    expect(tickers).toContain('cny')
    expect(tickers).toContain('kzt')
    expect(tickers).toContain('gld')
    expect(tickers).toContain('slv')
    expect(tickers).toContain('byn')
    expect(tickers).toContain('try')
  })

  it('делит цену на FACEVALUE (у KZT FACEVALUE=100)', () => {
    const rates = repo.parseRates(combined)
    const kzt = rates.find((r) => r.ticker === 'kzt')
    expect(kzt).toBeDefined()
    // KZTRUB_TOM WAPRICE=15.7556, FACEVALUE=100 → 15.7556/100 = 0.157556
    expect(kzt?.btcPrice).toBeGreaterThan(0)
    expect(kzt?.btcPrice).toBeLessThan(100_000_000)
  })

  it('валюты с FACEVALUE=1 не делятся (проверка CNY)', () => {
    const rates = repo.parseRates(combined)
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

  it('использует PREVPRICE, когда WAPRICE равен null', () => {
    const rates = repo.parseRates(combined)
    const entry = rates.find((r) => r.ticker === 'prevfall')
    expect(entry).toBeDefined()
    // PREVFALLRUB_TOM: WAPRICE=null, PREVPRICE=50, FACEVALUE=1
    expect(entry?.btcPrice).toBeGreaterThan(0)
  })

  it('считает FACEVALUE=0 как 1 (без деления)', () => {
    const rates = repo.parseRates(combined)
    const entry = rates.find((r) => r.ticker === 'facezero')
    expect(entry).toBeDefined()
    // FACEZERORUB_TOM: WAPRICE=42, FACEVALUE=0 → treated as 1, priceInRub=42
    expect(entry?.btcPrice).toBeGreaterThan(0)
  })

  it('включает индексные записи', () => {
    const rates = repo.parseRates(combined)
    const tickers = rates.map((r) => r.ticker)
    // BCSGA → bcsga
    expect(tickers).toContain('bcsga')
    // RTSI → rtsi
    expect(tickers).toContain('rtsi')
    // IMOEX → imoex
    expect(tickers).toContain('imoex')
  })

  it('коллизия индексов — одинаковый SECID на разных досках, fallback на secid_boardid', () => {
    const rates = repo.parseRates(combined)
    const tickers = rates.map((r) => r.ticker)
    // BCSGA на INAV выигрывает (первый), BCSGA на SNDX получает bcsga_sndx
    expect(tickers).toContain('bcsga')
    expect(tickers).toContain('bcsga_sndx')
  })

  it('включает записи акций с дедуплицированными тикерами', () => {
    const rates = repo.parseRates(combined)
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

  it('выбрасывает ошибку, если USD/RUB отсутствует', () => {
    const badCurrencies = JSON.stringify({
      securities: { columns: ['SECID', 'SECNAME'], data: [] },
      marketdata: { columns: ['SECID', 'WAPRICE'], data: [] },
    })
    const badCombined = MoexRepository.combineResponses(badCurrencies, MOEX_MOCK_INDEXES, MOEX_MOCK_SHARES)
    expect(() => repo.parseRates(badCombined)).toThrow('USD/RUB')
  })

  it('выбрасывает ошибку, если BTC/USD (MOEXBTC) отсутствует в индексах', () => {
    const badIndexes = JSON.stringify({
      securities: {
        columns: ['SECID', 'BOARDID', 'CURRENCYID', 'NAME'],
        data: [],
      },
      marketdata: { columns: ['SECID', 'CURRENTVALUE'], data: [] },
    })
    const badCombined = MoexRepository.combineResponses(MOEX_MOCK_CURRENCIES, badIndexes, MOEX_MOCK_SHARES)
    expect(() => repo.parseRates(badCombined)).toThrow('MOEXBTC')
  })

  it('использует MARKETPRICE, когда WAPRICE равен нулю', () => {
    const rates = repo.parseRates(combined)
    const entry = rates.find((r) => r.ticker === 'fallback_ok')
    expect(entry).toBeDefined()
    expect(entry?.btcPrice).toBeGreaterThan(0)
  })

  it('использует MARKETPRICE, когда WAPRICE равен null', () => {
    const rates = repo.parseRates(combined)
    const entry = rates.find((r) => r.ticker === 'fallback_null')
    expect(entry).toBeDefined()
    expect(entry?.btcPrice).toBeGreaterThan(0)
  })

  it('пропускает акцию, когда отсутствуют и WAPRICE, и MARKETPRICE', () => {
    const rates = repo.parseRates(combined)
    const tickers = rates.map((r) => r.ticker)
    expect(tickers).not.toContain('missing_both')
  })

  it('все валюты имеют правильные единицы измерения', () => {
    const rates = repo.parseRates(combined)
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
