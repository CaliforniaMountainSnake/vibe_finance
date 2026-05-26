import type { MoexColumnarData, MoexResponse } from './types'
import { getNumericField, getStringField } from './row-helpers'

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
  /** Тикер вида secid_boardid (в нижнем регистре). */
  ticker: string
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
 * Тикер формируется как `SECID_BOARDID` в нижнем регистре.
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

  return { ticker: compositeKey.toLowerCase(), priceInCurrency: price, currency, name }
}

/**
 * Строит Map с составным ключом SECID_BOARDID.
 * Это необходимо, т.к. один и тот же SECID может быть
 * на разных бордах (TQBR, SMAL, SPEQ и т.д.).
 */
function buildCompositeMap(columnar: MoexColumnarData): Map<string, Record<string, string | number | null>> {
  const { columns, data } = columnar
  const map = new Map<string, Record<string, string | number | null>>()

  for (const row of data) {
    const result = parseCompositeRow(columns, row)
    if (result) map.set(result.key, result.record)
  }

  return map
}

/** Разбирает одну строку columnar-данных в составной ключ + объект-запись. */
function parseCompositeRow(
  columns: string[],
  row: (string | number | null)[]
): { key: string; record: Record<string, string | number | null> } | null {
  const record = toRecord(columns, row)
  const secId = String(record['SECID'] ?? '')
  const boardId = String(record['BOARDID'] ?? '')
  if (!secId || !boardId) return null
  return { key: `${secId}_${boardId}`, record }
}

/** Собирает объект-запись из массива имён колонок и массива значений. */
function toRecord(columns: string[], row: (string | number | null)[]): Record<string, string | number | null> {
  const record: Record<string, string | number | null> = {}
  for (let i = 0; i < columns.length; i++) {
    record[columns[i]] = row[i] ?? null
  }
  return record
}
