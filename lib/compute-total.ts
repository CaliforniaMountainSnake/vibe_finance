import type { Holding } from '@/entities/Holding'

/**
 * Суммирует amount * rate только для enabled holding'ов.
 * Пропускает holding с undefined или NaN rate.
 */
export function computeTotalAmount(holdings: Holding[], conversionRates: Record<string, number | undefined>): number {
  return holdings
    .filter((h) => h.enabled)
    .reduce((sum, h) => {
      const rate = conversionRates[h.id]
      if (rate === undefined || isNaN(rate)) return sum
      return sum + h.amount * rate
    }, 0)
}
