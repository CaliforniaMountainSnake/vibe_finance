import { ExchangeRate } from '@/entities/ExchangeRate'
import { RepositoryInterface } from '@/repositories/RepositoryInterface'

type BinanceTicker = {
    symbol: string
    price: string
}

export class BinanceRepository implements RepositoryInterface {
    readonly sourceName = 'binance' as const

    private readonly baseUrl = 'https://api.binance.com/api/v3/ticker/price'

    /**
     * Получить курсы валют.
     * 
     * @example Формат ответа API.
     * ```json
     * [
     *  {
     *      "symbol": "BTCUSDT",
     *      "price": "76808.44000000"
     *  }
     * ]
     * ```
     */
    async fetchRates(): Promise<ExchangeRate[]> {
        const response = await fetch(this.baseUrl)
        if (!response.ok) {
            throw new Error(`Binance API error: ${response.status} ${response.statusText}`)
        }

        const data: BinanceTicker[] = await response.json()

        // Keep only pairs to USDT
        const usdtPairs = data.filter((t) =>
            t.symbol.toLowerCase().endsWith('usdt'),
        )

        // Build a price map: ticker -> USDT price (base currency -> how many USDT per 1 unit)
        const usdtPriceMap = new Map<string, number>()
        for (const t of usdtPairs) {
            const ticker = t.symbol.toLowerCase().replace(/usdt$/, '')
            const price = parseFloat(t.price)
            if (price > 0) {
                usdtPriceMap.set(ticker, price)
            }
        }

        // Need BTCUSDT price to compute btcPrice for all tickers
        const btcUsdtPrice = usdtPriceMap.get('btc')
        if (btcUsdtPrice === undefined) {
            throw new Error('Binance API did not return BTCUSDT pair')
        }

        const result: ExchangeRate[] = []
        for (const [ticker, usdtPrice] of usdtPriceMap) {
            // btcPrice = how much 1 BTC costs in this currency
            // All prices are in USDT, so btcPrice = btcUsdtPrice / usdtPrice
            const btcPrice = btcUsdtPrice / usdtPrice
            result.push({
                source: 'binance',
                ticker,
                btcPrice,
            })
        }

        return result
    }
}
