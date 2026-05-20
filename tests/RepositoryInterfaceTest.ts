import { it, expect, beforeAll } from 'vitest'
import { RepositoryInterface } from '@/repositories/RepositoryInterface'
import { ExchangeRate } from '@/entities/ExchangeRate'

export function testRepositoryInterface(repo: RepositoryInterface) {
    let rates: ExchangeRate[]

    beforeAll(async () => {
        rates = await repo.fetchRates()
    }, 5_000)

    it('returns a non-empty list', () => {
        expect(rates.length).toBeGreaterThan(0)
    })

    it('every rate has valid shape', () => {
        for (const r of rates) {
            expect(r.source).toBe(repo.sourceName)
            expect(typeof r.ticker).toBe('string')
            expect(r.ticker).toBe(r.ticker.toLowerCase())
            expect(typeof r.btcPrice).toBe('number')
            expect(Number.isFinite(r.btcPrice)).toBe(true)
            expect(r.btcPrice).toBeGreaterThan(0)
        }
    })

    it('has no duplicate tickers', () => {
        const tickers = rates.map((r) => r.ticker)
        expect(new Set(tickers).size).toBe(tickers.length)
    })

    it('has BTC with btcPrice strictly 1', () => {
        const btc = rates.find((r) => r.ticker === 'btc')
        expect(btc).toBeDefined()
        expect(btc!.btcPrice).toBe(1)
    })
}
