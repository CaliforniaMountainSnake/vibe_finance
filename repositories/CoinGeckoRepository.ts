import { ExchangeRate } from '@/entities/ExchangeRate'
import { RepositoryInterface } from '@/repositories/RepositoryInterface'

type CoinGeckoResponse = {
    rates: Record<
        string,
        {
            name: string
            unit: string
            value: number
            type: string
        }
    >
}

export class CoinGeckoRepository implements RepositoryInterface {
    readonly sourceName = 'coingecko' as const

    private readonly baseUrl = 'https://api.coingecko.com/api/v3/exchange_rates'

    /**
     * Получить курсы валют.
     */
    async fetchRates(): Promise<ExchangeRate[]> {
        const response = await fetch(this.baseUrl)
        if (!response.ok) {
            throw new Error(
                `CoinGecko API error: ${response.status} ${response.statusText}`,
            )
        }

        const text = await response.text()
        return this.parseRates(text)
    }

    /**
     * Распарсить сырой ответ API в ExchangeRate[].
     *
     * @example Формат входной строки.
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
    parseRates(raw: string): ExchangeRate[] {
        const data: CoinGeckoResponse = JSON.parse(raw)
        const result: ExchangeRate[] = []

        for (const [ticker, rate] of Object.entries(data.rates)) {
            const lowerTicker = ticker.toLowerCase()

            // Skip zero prices
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
