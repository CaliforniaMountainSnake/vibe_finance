export type SourceName = 'binance' | 'coingecko'

export type ExchangeRate = {
  source: SourceName // binance | coingecko
  ticker: string // gel
  name?: string // Georgian Lari
  unit?: string // ₾
  btcPrice: number // 205015.665
}
