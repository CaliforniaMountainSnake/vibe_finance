import { ExchangeRate } from '@/entities/ExchangeRate'
import { RepositoryInterface } from '@/repositories/RepositoryInterface'

/**
 * Мок-данные в формате ответа Binance API.
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
const MOCK_TICKERS = [
    { symbol: 'BTCUSDT', price: '76808.44000000' },
    { symbol: 'ETHUSDT', price: '3200.15000000' },
    { symbol: 'BNBUSDT', price: '580.32000000' },
    { symbol: 'XRPUSDT', price: '0.52340000' },
    { symbol: 'ADAUSDT', price: '0.45120000' },
    { symbol: 'SOLUSDT', price: '142.89000000' },
    { symbol: 'DOGEUSDT', price: '0.16230000' },
    { symbol: 'DOTUSDT', price: '7.12000000' },
    // Не-USDT пары — должны быть отфильтрованы
    { symbol: 'ETHBTC', price: '0.04166000' },
    { symbol: 'BNBBTC', price: '0.00755000' },
]

export class BinanceMockRepository implements RepositoryInterface {
    readonly sourceName = 'binance' as const

    async fetchRates(): Promise<ExchangeRate[]> {
        // Повторяем ту же логику трансформации, что и в BinanceRepository
        const usdtPairs = MOCK_TICKERS.filter((t) =>
            t.symbol.toLowerCase().endsWith('usdt'),
        )

        const usdtPriceMap = new Map<string, number>()
        for (const t of usdtPairs) {
            const ticker = t.symbol.toLowerCase().replace(/usdt$/, '')
            const price = parseFloat(t.price)
            if (price > 0) {
                usdtPriceMap.set(ticker, price)
            }
        }

        const btcUsdtPrice = usdtPriceMap.get('btc')!
        const result: ExchangeRate[] = []

        for (const [ticker, usdtPrice] of usdtPriceMap) {
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
