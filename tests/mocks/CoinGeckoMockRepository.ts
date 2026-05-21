import { ExchangeRate } from '@/entities/ExchangeRate'
import { RepositoryInterface } from '@/repositories/RepositoryInterface'

/**
 * Мок-данные в формате ответа CoinGecko API.
 *
 * @example Формат ответа API.
 * ```json
 *  {
 *      "rates": {
 *          "btc": {
 *              "name": "Bitcoin",
 *              "unit": "BTC",
 *              "value": 1.0,
 *              "type": "crypto"
 *          },
 *          "eth": {
 *              "name": "Ether",
 *              "unit": "ETH",
 *              "value": 36.379,
 *              "type": "crypto"
 *          }
 *      }
 *  }
 * ```
 */
const MOCK_RATES = {
    rates: {
        btc: {
            name: 'Bitcoin',
            unit: 'BTC',
            value: 1.0,
            type: 'crypto',
        },
        eth: {
            name: 'Ether',
            unit: 'ETH',
            value: 36.379,
            type: 'crypto',
        },
        usd: {
            name: 'US Dollar',
            unit: '$',
            value: 76808.44,
            type: 'fiat',
        },
        eur: {
            name: 'Euro',
            unit: '€',
            value: 70215.833,
            type: 'fiat',
        },
        gel: {
            name: 'Georgian Lari',
            unit: '₾',
            value: 205015.665,
            type: 'fiat',
        },
        // Нулевая цена — должна быть пропущена
        zero_coin: {
            name: 'Zero Coin',
            unit: 'ZERO',
            value: 0,
            type: 'crypto',
        },
    },
}

export class CoinGeckoMockRepository implements RepositoryInterface {
    readonly sourceName = 'coingecko' as const

    async fetchRates(): Promise<ExchangeRate[]> {
        // Повторяем ту же логику трансформации, что и в CoinGeckoRepository
        const result: ExchangeRate[] = []

        for (const [ticker, rate] of Object.entries(MOCK_RATES.rates)) {
            const lowerTicker = ticker.toLowerCase()

            if (rate.value <= 0) continue

            result.push({
                source: 'coingecko',
                ticker: lowerTicker,
                name: rate.name,
                unit: rate.unit,
                btcPrice: rate.value,
            })
        }

        return result
    }
}
