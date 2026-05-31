import type { SourceName } from '@/entities/exchange-rate'

const DISPLAY: Record<SourceName, string> = {
  binance: 'Binance',
  coingecko: 'CoinGecko',
  moex: 'MOEX',
}

export function sourceDisplayName(s: SourceName): string {
  return DISPLAY[s]
}
