import type { MoexResponse } from './types'
import { buildRowMap, getNumericField, getStringField } from './row-helpers'

/** Допустимые валюты индексов (остальные отбрасываются). */
const VALID_CURRENCIES = new Set(['RUB', 'USD', 'EUR', 'CNY'])

/** Распарсенный индекс с ценой в оригинальной валюте. */
export type IndexEntry = {
  /** Первичный тикер для дедупликации (secid_currency в нижнем регистре). */
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
 * Первичный тикер: `SECID_CURRENCYID` в нижнем регистре.
 * Коллизии разрешаются отдельно через resolveTickers().
 * Индексы с неизвестными валютами или нулевыми ценами отбрасываются.
 */
export function parseIndexes(indexesJson: MoexResponse): IndexEntry[] {
  const secMap = buildRowMap(indexesJson.securities)
  const mdMap = buildRowMap(indexesJson.marketdata)

  const entries: IndexEntry[] = []

  for (const [key, sec] of secMap) {
    const currency = getStringField(sec, 'CURRENCYID')
    if (!VALID_CURRENCIES.has(currency)) continue

    const md = mdMap.get(key)
    if (!md) continue

    const price = getNumericField(md, 'CURRENTVALUE')
    if (price === null) continue

    const secId = getStringField(sec, 'SECID')
    const boardId = getStringField(sec, 'BOARDID')
    const name = getStringField(sec, 'NAME')
    const ticker = `${secId}_${currency}`.toLowerCase()

    entries.push({
      ticker,
      secId: secId.toLowerCase(),
      boardId: boardId.toLowerCase(),
      priceInCurrency: price,
      currency,
      name,
    })
  }

  return entries
}
