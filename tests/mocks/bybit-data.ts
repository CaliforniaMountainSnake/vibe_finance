/**
 * Мок-данные в формате ответа Bybit API.
 *
 * ```json
 * {
 *   "retCode": 0,
 *   "retMsg": "OK",
 *   "result": {
 *     "category": "spot",
 *     "list": [
 *       {
 *         "symbol": "BTCUSDT",
 *         "bid1Price": "68029.2",
 *         "ask1Price": "68029.3"
 *       }
 *     ]
 *   }
 * }
 * ```
 */
export const BYBIT_MOCK_JSON = JSON.stringify({
  retCode: 0,
  retMsg: 'OK',
  result: {
    category: 'spot',
    list: [
      { symbol: 'BTCUSDT', bid1Price: '68029.2', ask1Price: '68029.3' },
      { symbol: 'ETHUSDT', bid1Price: '3200.15', ask1Price: '3200.16' },
      { symbol: 'BNBUSDT', bid1Price: '580.32', ask1Price: '580.33' },
      { symbol: 'XRPUSDT', bid1Price: '0.52341', ask1Price: '0.52342' },
      { symbol: 'ADAUSDT', bid1Price: '0.45121', ask1Price: '0.45122' },
      { symbol: 'SOLUSDT', bid1Price: '142.89', ask1Price: '142.90' },
      { symbol: 'DOGEUSDT', bid1Price: '0.16231', ask1Price: '0.16232' },
      { symbol: 'DOTUSDT', bid1Price: '7.12', ask1Price: '7.13' },
      // Не-USDT пары — должны быть отфильтрованы
      { symbol: 'ETHBTC', bid1Price: '0.04166', ask1Price: '0.04167' },
      { symbol: 'BNBBTC', bid1Price: '0.00755', ask1Price: '0.00756' },
    ],
  },
})
