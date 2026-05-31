import type { Holding } from '@/entities/Holding'
import type { Ticker } from '@/entities/Ticker'
import type { TickerPair } from '@/entities/TickerPair'
import type { DbRepositoryInterface } from '@/repositories/DbRepositoryInterface'

/**
 * Вычисляет курс конвертации между двумя тикерами.
 * Если тикер не найден в БД или btcPrice некорректен — возвращает undefined.
 */
async function computeRate(repo: DbRepositoryInterface, from: Ticker, to: Ticker): Promise<number | undefined> {
  const pair: TickerPair = { from, to }
  try {
    return await repo.getRate(pair)
  } catch {
    return undefined
  }
}

/**
 * Вычисляет карту курсов конвертации для всех холдингов в итоговую валюту.
 *
 * - Для каждого holding вызывает repo.getRate(holding.ticker, totalTicker).
 * - Если курс недоступен (тикер холдинга или итоговой валюты отсутствует в БД,
 *   btcPrice ≤ 0, сетевая ошибка и т.д.) — записывается undefined.
 *
 * @returns Record<holdingId, курс | undefined>
 */
export async function computeConversionRates(
  repo: DbRepositoryInterface,
  holdings: Holding[],
  totalTicker: Ticker
): Promise<Record<string, number | undefined>> {
  const map: Record<string, number | undefined> = {}
  for (const h of holdings) {
    map[h.id] = await computeRate(repo, h.ticker, totalTicker)
  }
  return map
}
