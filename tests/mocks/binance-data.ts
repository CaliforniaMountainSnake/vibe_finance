/**
 * Мок-данные в формате ответа Binance API.
 *
 * ```json
 * [
 *  {
 *      "symbol": "BTCUSDT",
 *      "price": "76808.44000000"
 *  }
 * ]
 * ```
 */
export const BINANCE_MOCK_JSON = JSON.stringify([
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
])
