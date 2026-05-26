import type { MoexResponse } from './types'
import { buildRowMap, getNumericField, getStringField } from './row-helpers'

/** Допустимые валюты индексов (остальные отбрасываются). */
const VALID_CURRENCIES = new Set(['RUB', 'USD', 'EUR', 'CNY'])

/** Распарсенный индекс с ценой в оригинальной валюте. */
export type IndexEntry = {
  /** Тикер вида secid_boardid_currency (в нижнем регистре). */
  ticker: string
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
 * Тикер формируется как `SECID_BOARDID_CURRENCYID` в нижнем регистре.
 * Индексы с неизвестными валютами или нулевыми ценами отбрасываются.
 */
export function parseIndexes(indexesJson: MoexResponse): IndexEntry[] {
  const secMap = buildRowMap(indexesJson.securities)
  const mdMap = buildRowMap(indexesJson.marketdata)

  const entries: IndexEntry[] = []

  for (const [secId, sec] of secMap) {
    const currency = getStringField(sec, 'CURRENCYID')
    if (!VALID_CURRENCIES.has(currency)) continue

    const md = mdMap.get(secId)
    if (!md) continue

    const price = getNumericField(md, 'CURRENTVALUE')
    if (price === null) continue

    const boardId = getStringField(sec, 'BOARDID')
    const name = getStringField(sec, 'NAME')
    const ticker = `${secId}_${boardId}_${currency}`.toLowerCase()

    entries.push({ ticker, priceInCurrency: price, currency, name })
  }

  return entries
}
