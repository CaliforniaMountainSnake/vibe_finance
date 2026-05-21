/**
 * Мок-данные в формате ответа CoinGecko API.
 *
 * ```json
 *  {
 *      "rates": {
 *          "btc": {
 *              "name": "Bitcoin",
 *              "unit": "BTC",
 *              "value": 1.0,
 *              "type": "crypto"
 *          }
 *      }
 *  }
 * ```
 */
export const COINGECKO_MOCK_JSON = JSON.stringify({
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
})
