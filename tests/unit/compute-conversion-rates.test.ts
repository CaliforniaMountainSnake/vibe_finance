import { describe, it, expect, beforeEach } from 'vitest'
import { computeConversionRates } from '@/lib/compute-conversion-rates'
import { DexieRepository } from '@/repositories/dexie-repository'
import { makeRate } from '../helpers/database-repository-test-helpers'
import type { Holding } from '@/entities/holding'
import type { Ticker } from '@/entities/ticker'

const btc: Ticker = { source: 'coingecko', ticker: 'btc', name: 'Bitcoin', unit: 'BTC' }
const eth: Ticker = { source: 'coingecko', ticker: 'eth', name: 'Ethereum', unit: 'ETH' }
const usdt: Ticker = { source: 'coingecko', ticker: 'usdt', name: 'Tether', unit: 'USDT' }
function holding(id: string, ticker: Ticker, amount = 100): Holding {
  return { id, ticker, amount, label: '', order: 0, enabled: true }
}

async function seedRepo(repo: DexieRepository): Promise<void> {
  await repo.updateRatesForSource('coingecko', [
    makeRate({ source: 'coingecko', ticker: 'btc', btcPrice: 1 }),
    makeRate({ source: 'coingecko', ticker: 'eth', btcPrice: 36.379 }),
    makeRate({ source: 'coingecko', ticker: 'usdt', btcPrice: 76_808.44 }),
    makeRate({ source: 'coingecko', ticker: 'gel', btcPrice: 205_015.665 }),
  ])
}

describe('computeConversionRates — реальный DexieRepository + fake-indexeddb', () => {
  let repo: DexieRepository

  beforeEach(async () => {
    repo = new DexieRepository()
    await repo.clearAll()
    await seedRepo(repo)
  })

  it('возвращает курс для каждого холдинга', async () => {
    const holdings = [holding('h1', btc, 2), holding('h2', eth, 10)]
    const result = await computeConversionRates(repo, holdings, usdt)

    expect(result['h1']).toBeCloseTo(76_808.44, 2) // btc→usdt
    expect(result['h2']).toBeCloseTo(76_808.44 / 36.379, 3) // eth→usdt = usdt.btcPrice / eth.btcPrice
  })

  it('тикер холдинга отсутствует в БД → undefined', async () => {
    const missingTicker: Ticker = { source: 'coingecko', ticker: 'nonexistent', name: 'Nope' }
    const holdings = [holding('h1', btc, 2), holding('h2', missingTicker, 50)]
    const result = await computeConversionRates(repo, holdings, usdt)

    expect(result['h1']).toBeDefined()
    expect(result['h2']).toBeUndefined()
  })

  it('итоговая валюта отсутствует в БД → все undefined', async () => {
    const missingTotal: Ticker = { source: 'coingecko', ticker: 'xxx', name: 'Unknown' }
    const holdings = [holding('h1', btc, 1), holding('h2', eth, 5)]

    const result = await computeConversionRates(repo, holdings, missingTotal)
    expect(result).toEqual({ h1: undefined, h2: undefined })
  })

  it('и тикер холдинга, и итоговый тикер отсутствуют → все undefined', async () => {
    const missingTotal: Ticker = { source: 'coingecko', ticker: 'xxx', name: 'Unknown' }
    const missingHolding: Ticker = { source: 'coingecko', ticker: 'yyy', name: 'Also unknown' }

    const holdings = [holding('bad', missingHolding, 100)]
    const result = await computeConversionRates(repo, holdings, missingTotal)
    expect(result).toEqual({ bad: undefined })
  })

  it('смешанный: часть курсов есть, часть нет', async () => {
    const missingTicker: Ticker = { source: 'coingecko', ticker: 'gone', name: 'Delisted' }
    const holdings = [holding('btc-id', btc, 2), holding('delisted', missingTicker, 100), holding('eth-id', eth, 5)]

    const result = await computeConversionRates(repo, holdings, usdt)
    expect(result['btc-id']).toBeDefined()
    expect(result['delisted']).toBeUndefined()
    expect(result['eth-id']).toBeDefined()
  })

  it('кросс-сорс: холдинг из binance, итог из coingecko', async () => {
    await repo.updateRatesForSource('binance', [makeRate({ source: 'binance', ticker: 'btc', btcPrice: 1 })])
    const binanceBtc: Ticker = { source: 'binance', ticker: 'btc', name: 'BTC Binance', unit: 'BTC' }

    const holdings = [holding('cross', binanceBtc, 1)]
    const result = await computeConversionRates(repo, holdings, usdt)
    // binance btc → coingecko usdt: usdt.btcPrice / btc.btcPrice = 76808.44 / 1
    expect(result['cross']).toBeCloseTo(76_808.44, 2)
  })

  it('пустой список холдингов → пустой объект', async () => {
    const result = await computeConversionRates(repo, [], usdt)
    expect(result).toEqual({})
  })
})
