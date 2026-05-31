import type { Holding } from '@/entities/holding'

export type HoldingsTotal = {
  /** Сумма холдингов в пересчёте на целевую валюту (только те, у которых курс доступен) */
  totalAmount: number
  /** Сколько включённых холдингов участвовало в расчёте (курс доступен) */
  contributedCount: number
  /** Сколько включённых холдингов пропущено (курс недоступен) */
  skippedCount: number
}

/**
 * Вычисляет итоговую сумму включённых холдингов в пересчёте на целевую валюту.
 *
 * - Холдинги с `enabled: false` игнорируются полностью.
 * - Холдинги, для которых курс не найден или NaN, пропускаются и учитываются в `skippedCount`.
 *
 * @param holdings  Список холдингов
 * @param conversionRates  Карта holding.id → курс (или undefined, если курс недоступен)
 */
export function computeHoldingsTotal(
  holdings: Holding[],
  conversionRates: Record<string, number | undefined>
): HoldingsTotal {
  let totalAmount = 0
  let contributedCount = 0
  let skippedCount = 0

  for (const h of holdings) {
    if (!h.enabled) continue
    const rate = conversionRates[h.id]
    if (rate === undefined || Number.isNaN(rate)) {
      skippedCount++
      continue
    }
    totalAmount += h.amount * rate
    contributedCount++
  }

  return { totalAmount, contributedCount, skippedCount }
}
