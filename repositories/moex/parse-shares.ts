import type { MoexResponse } from './types'
import { buildCompositeMap, getNumericField, getStringField } from './row-helpers'

/** Режимы торгов (борды), которые мы обрабатываем. */
const ALLOWED_BOARDS = new Set(['TQBR', 'TQTF', 'TQTY'])

/** Маппинг борда → валюта номинала. */
const BOARD_CURRENCY: Record<string, string> = {
  TQBR: 'RUB',
  TQTF: 'RUB',
  TQTY: 'CNY',
}

/** Распарсенная акция/ETF с ценой в оригинальной валюте. */
export type ShareEntry = {
  /** Первичный тикер для дедупликации (secid для TQBR/TQTF, secid_cny для TQTY). */
  ticker: string
  /** Код инструмента (SECID). */
  secId: string
  /** Режим торгов (BOARDID: TQBR, TQTF, TQTY). */
  boardId: string
  /** Цена (WAPRICE) в оригинальной валюте борда. */
  priceInCurrency: number
  /** Валюта цены (RUB для TQBR/TQTF, CNY для TQTY). */
  currency: string
  /** Человекочитаемое название инструмента. */
  name: string
}

/**
 * Парсит акции из ответа MOEX.
 *
 * Обрабатывает только три режима торгов:
 * - TQBR — акции в рублях
 * - TQTF — ETF в рублях
 * - TQTY — ETF в юанях
 *
 * Первичный тикер: `SECID` для TQBR/TQTF, `SECID_CNY` для TQTY.
 * Коллизии разрешаются отдельно через resolveTickers().
 */
export function parseShares(sharesJson: MoexResponse): ShareEntry[] {
  const secMap = buildCompositeMap(sharesJson.securities)
  const mdMap = buildCompositeMap(sharesJson.marketdata)

  const entries: ShareEntry[] = []

  for (const [compositeKey, sec] of secMap) {
    const boardId = getStringField(sec, 'BOARDID')
    if (!ALLOWED_BOARDS.has(boardId)) continue

    const entry = buildShareEntry({ mdMap, compositeKey, sec, boardId })
    if (entry) entries.push(entry)
  }

  return entries
}

/** Параметры для buildShareEntry. */
type ShareBuildParams = {
  mdMap: Map<string, Record<string, string | number | null>>
  compositeKey: string
  sec: Record<string, string | number | null>
  boardId: string
}

/** Строит ShareEntry для одной акции. Возвращает null, если цены нет. */
function buildShareEntry(params: ShareBuildParams): ShareEntry | null {
  const { mdMap, compositeKey, sec, boardId } = params

  const md = mdMap.get(compositeKey)
  if (!md) return null

  const price = getNumericField(md, 'WAPRICE')
  if (price === null) return null

  const currency = BOARD_CURRENCY[boardId] ?? 'RUB'
  const name = getStringField(sec, 'SECNAME')

  const secId = getStringField(sec, 'SECID')
  const ticker = boardId === 'TQTY' ? `${secId}_cny`.toLowerCase() : secId.toLowerCase()

  return { ticker, secId: secId.toLowerCase(), boardId: boardId.toLowerCase(), priceInCurrency: price, currency, name }
}
