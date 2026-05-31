import type { MoexResponse } from './types'
import { buildCompositeMap, buildRowMap, getNumericField, getStringField } from './row-helpers'

/** Допустимые валюты индексов (остальные отбрасываются). */
const VALID_CURRENCIES = new Set(['RUB', 'USD', 'EUR', 'CNY'])

/** Распарсенный индекс с ценой в оригинальной валюте. */
export type IndexEntry = {
  /** Первичный тикер для дедупликации (SECID в нижнем регистре). */
  ticker: string
  /** Код инструмента (SECID). */
  secId: string
  /** Режим торгов (BOARDID). */
  boardId: string
  /** Цена (CURRENTVALUE) в оригинальной валюте. */
  priceInCurrency: number
  /** Валюта индекса (RUB, USD, EUR, CNY). */
  currency: string
  /** Человекочитаемое название индекса. */
  name: string
}

/**
 * Парсит индексы из ответа MOEX.
 *
 * Первичный тикер: `SECID` в нижнем регистре.
 * Коллизии (одинаковый SECID на разных бордах) разрешаются через resolveTickers().
 * Индексы с неизвестными валютами или нулевыми ценами отбрасываются.
 */
export function parseIndexes(indexesJson: MoexResponse): IndexEntry[] {
  const secMap = buildCompositeMap(indexesJson.securities)
  const mdMap = buildRowMap(indexesJson.marketdata)

  const entries: IndexEntry[] = []

  for (const [, sec] of secMap) {
    const entry = buildIndexEntry(sec, mdMap)
    if (entry) entries.push(entry)
  }

  return entries
}

/** Строит IndexEntry из записи securities. Возвращает undefined если данные неполные. */
function buildIndexEntry(
  sec: Record<string, string | number | undefined>,
  mdMap: Map<string, Record<string, string | number | undefined>>
): IndexEntry | undefined {
  const currency = getStringField(sec, 'CURRENCYID')
  if (!VALID_CURRENCIES.has(currency)) return undefined

  const secId = getStringField(sec, 'SECID')
  const md = mdMap.get(secId)
  if (!md) return undefined

  const price = getNumericField(md, 'CURRENTVALUE')
  if (price === undefined) return undefined

  const boardId = getStringField(sec, 'BOARDID')
  const name = getStringField(sec, 'NAME')

  return {
    ticker: secId.toLowerCase(),
    secId: secId.toLowerCase(),
    boardId: boardId.toLowerCase(),
    priceInCurrency: price,
    currency,
    name,
  }
}
