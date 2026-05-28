import { formatAmount } from '@/lib/format-amount'

/**
 * Возвращает отформатированную конвертированную сумму.
 * Возвращает undefined при undefined или NaN rate.
 */
export function computeConverted(amount: number, rate: number | undefined): string | undefined {
  if (rate === undefined || isNaN(rate)) return undefined
  return formatAmount(amount * rate)
}
