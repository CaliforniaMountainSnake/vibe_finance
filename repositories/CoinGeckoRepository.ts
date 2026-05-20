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

    async fetchRates(): Promise<ExchangeRate[]> {
        const response = await fetch(this.baseUrl)
        if (!response.ok) {
            throw new Error(
                `CoinGecko API error: ${response.status} ${response.statusText}`,
            )
        }

        const data: CoinGeckoResponse = await response.json()
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
