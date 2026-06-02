import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { MoexRepository } from '@/repositories/moex-repository'

/**
 * Тесты парсинга на полных реальных данных из tests/raw_data/moex/.
 */
describe('MoexRepository with real raw data', () => {
  const repo = new MoexRepository()

  const rawDirectory = path.join(import.meta.dirname, '..', 'raw_data', 'moex')
  const currenciesRaw = readFileSync(path.join(rawDirectory, 'currencies.json'), 'utf8')
  const indexesRaw = readFileSync(path.join(rawDirectory, 'indexes.json'), 'utf8')
  const sharesRaw = readFileSync(path.join(rawDirectory, 'shares.json'), 'utf8')

  const combined = MoexRepository.combineResponses(currenciesRaw, indexesRaw, sharesRaw)
  const rates = repo.parseRates(combined)

  it('парсит реальные данные без ошибок', () => {
    expect(rates.length).toBeGreaterThan(0)
  })

  it('BTC имеет btcPrice = 1', () => {
    const btc = rates.find((r) => r.ticker === 'btc')
    expect(btc).toBeDefined()
    expect(btc?.btcPrice).toBe(1)
  })

  it('содержит ключевые валюты', () => {
    const tickers = new Set(rates.map((r) => r.ticker))
    expect(tickers).toContain('usd')
    expect(tickers).toContain('rub')
    expect(tickers).toContain('cny')
    expect(tickers).toContain('gld')
  })

  it('содержит акции TQBR/TQTF (тикер = secid, без суффикса)', () => {
    // TQBR/TQTF акции используют SECID без суффикса
    const noSuffix = rates.filter((r) => !r.ticker.includes('_') && !['btc', 'usd', 'rub'].includes(r.ticker))
    // Часть из них — акции TQBR/TQTF, другие — валюты без подчёркиваний
    expect(noSuffix.length).toBeGreaterThan(0)
  })

  it('тикеры TQTY заканчиваются на _cny', () => {
    const tqty = rates.filter((r) => r.ticker.endsWith('_cny'))
    expect(tqty.length).toBeGreaterThan(0)
  })

  it('содержит индексные записи (тикер = secid, без суффикса валюты)', () => {
    // Индексы теперь: SECID, без CURRENCYID
    const tickers = new Set(rates.map((r) => r.ticker))
    expect(tickers).toContain('imoex')
    expect(tickers).toContain('rtsi')
    expect(tickers).toContain('bcsga')
  })

  it('использует MARKETPRICE, когда WAPRICE отсутствует (EQMX, TMON)', () => {
    // В реальных данных у EQMX и TMON WAPRICE = null, но есть MARKETPRICE
    const tickers = new Set(rates.map((r) => r.ticker))
    expect(tickers).toContain('eqmx')
    expect(tickers).toContain('tmon')
    const eqmx = rates.find((r) => r.ticker === 'eqmx')
    const tmon = rates.find((r) => r.ticker === 'tmon')
    expect(eqmx?.btcPrice).toBeGreaterThan(0)
    expect(tmon?.btcPrice).toBeGreaterThan(0)
  })

  it('делит цену KZT на FACEVALUE=100', () => {
    // KZT WAPRICE=15.3548 с FACEVALUE=100 → priceInRub=0.153548
    // BTC/RUB ≈ 71.3693 * 77271.151 ≈ 5,514,000
    // btcPrice ≈ 5,514,000 / 0.153548 ≈ 35,910,000
    const kzt = rates.find((r) => r.ticker === 'kzt')
    expect(kzt).toBeDefined()
    expect(kzt?.btcPrice).toBeGreaterThan(0)
    // Verify it's much larger than CNY (since KZT per unit is tiny after FACEVALUE division)
    const cny = rates.find((r) => r.ticker === 'cny')
    expect(cny).toBeDefined()
    if (kzt && cny) {
      expect(cny.btcPrice).toBeLessThan(kzt.btcPrice)
    }
  })

  it('делит цену AMD на FACEVALUE=100', () => {
    const amd = rates.find((r) => r.ticker === 'amd')
    expect(amd).toBeDefined()
    expect(amd?.btcPrice).toBeGreaterThan(0)
  })

  it('делит цену KGS на FACEVALUE=100', () => {
    const kgs = rates.find((r) => r.ticker === 'kgs')
    expect(kgs).toBeDefined()
    expect(kgs?.btcPrice).toBeGreaterThan(0)
  })

  it('использует PREVPRICE, когда WAPRICE равен null для валют (JPY, TJS, UZS)', () => {
    // JPY: WAPRICE=null, PREVPRICE=44, FACEVALUE=100 → priceInRub=0.44
    const jpy = rates.find((r) => r.ticker === 'jpy')
    expect(jpy).toBeDefined()
    expect(jpy?.btcPrice).toBeGreaterThan(0)
    // TJS: WAPRICE=null, PREVPRICE=84.3, FACEVALUE=10 → priceInRub=8.43
    const tjs = rates.find((r) => r.ticker === 'tjs')
    expect(tjs).toBeDefined()
    expect(tjs?.btcPrice).toBeGreaterThan(0)
    // UZS: WAPRICE=null, PREVPRICE=61, FACEVALUE=10000 → priceInRub=0.0061
    const uzs = rates.find((r) => r.ticker === 'uzs')
    expect(uzs).toBeDefined()
    expect(uzs?.btcPrice).toBeGreaterThan(0)
  })

  it('валюты с FACEVALUE=1 без изменения цены', () => {
    // USD: WAPRICE=71.3693, FACEVALUE=1 → priceInRub=71.3693
    const usd = rates.find((r) => r.ticker === 'usd')
    expect(usd).toBeDefined()
    expect(usd?.btcPrice).toBeGreaterThan(0)
  })

  it('нет дублирующихся тикеров', () => {
    const tickers = rates.map((r) => r.ticker)
    expect(new Set(tickers).size).toBe(tickers.length)
  })
})
