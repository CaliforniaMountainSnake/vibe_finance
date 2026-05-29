import type { Holding } from '@/entities/Holding'
import type { Ticker } from '@/entities/Ticker'
import type { TickerPair } from '@/entities/TickerPair'
import { formatAmount } from '@/lib/format-amount'

export type ConvertedResult = {
  holdingId: string
  /** Отформатированная конвертированная сумма. undefined если rate недоступен. */
  converted: string | undefined
  /** Курс конвертации. undefined если курс не удалось получить. */
  rate: number | undefined
}

function computeConverted(amount: number, rate: number | undefined): string | undefined {
  if (rate === undefined || isNaN(rate)) return undefined
  return formatAmount(amount * rate)
}

function computeRate(
  from: Ticker,
  to: Ticker,
  getRate: (pair: TickerPair) => Promise<number | undefined>
): Promise<number | undefined> {
  return getRate({ from, to }).catch(() => undefined)
}

/**
 * Конвертирует все холдинги в итоговую валюту через переданный адаптер getRate.
 *
 * @returns массив результатов конвертации — по одному на каждый holding.
 */
export async function convert(
  holdings: Holding[],
  getRate: (pair: TickerPair) => Promise<number | undefined>,
  totalTicker: Ticker | null
): Promise<ConvertedResult[]> {
  if (!totalTicker || holdings.length === 0) {
    return holdings.map((h) => ({ holdingId: h.id, converted: undefined, rate: undefined }))
  }

  const results: ConvertedResult[] = []
  for (const holding of holdings) {
    const rate = await computeRate(holding.ticker, totalTicker, getRate)
    const converted = computeConverted(holding.amount, rate)
    results.push({ holdingId: holding.id, converted, rate })
  }
  return results
}
