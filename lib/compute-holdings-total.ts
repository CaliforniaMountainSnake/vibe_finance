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
function accumulateHolding(h: Holding, rate: number | undefined, accumulator: HoldingsTotal): void {
  if (!h.enabled) return
  if (rate === undefined || Number.isNaN(rate)) {
    accumulator.skippedCount++
    return
  }
  accumulator.totalAmount += h.amount * rate
  accumulator.contributedCount++
}

export function computeHoldingsTotal(
  holdings: Holding[],
  conversionRates: Record<string, number | undefined>
): HoldingsTotal {
  const accumulator: HoldingsTotal = { totalAmount: 0, contributedCount: 0, skippedCount: 0 }

  for (const h of holdings) {
    accumulateHolding(h, conversionRates[h.id], accumulator)
  }

  return accumulator
}
