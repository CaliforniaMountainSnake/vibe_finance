import type { SourceName } from '@/entities/ExchangeRate'

const DISPLAY: Record<SourceName, string> = {
  binance: 'Binance',
  coingecko: 'CoinGecko',
  moex: 'MOEX',
}

export function sourceDisplayName(s: SourceName): string {
  return DISPLAY[s]
}
