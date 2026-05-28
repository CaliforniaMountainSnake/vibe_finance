import type { Ticker } from '@/entities/Ticker'

/**
 * Единица отображения тикера: поле unit (например "₾") или тикер в верхнем регистре.
 */
export function holdingUnit(t: Ticker): string {
  return t.unit ?? t.ticker.toUpperCase()
}

/**
 * Проверяет, совпадает ли тикер holding с итоговой валютой.
 */
export function isSameCurrency(ticker: Ticker, totalTicker: Ticker | null): boolean {
  return totalTicker !== null && ticker.source === totalTicker.source && ticker.ticker === totalTicker.ticker
}
