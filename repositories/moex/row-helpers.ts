import type { MoexColumnarData } from './types'

/**
 * Превращает колонки + строки в Map, где ключ — SECID, значение — объект-запись.
 *
 * Используется для валют, где SECID уникален.
 * Для акций и индексов (где SECID может повторяться на разных бордах)
 * используйте buildCompositeMap.
 */
export function buildRowMap(columnar: MoexColumnarData): Map<string, Record<string, string | number | undefined>> {
  const { columns, data } = columnar
  const map = new Map<string, Record<string, string | number | undefined>>()

  for (const row of data) {
    const record = buildRecord(columns, row)
    const secId = String(record['SECID'] ?? '')
    if (secId) {
      map.set(secId, record)
    }
  }

  return map
}

/** Собирает объект-запись из массива имён колонок и массива значений. */
function buildRecord(columns: string[], row: (string | number | null)[]): Record<string, string | number | undefined> {
  const record: Record<string, string | number | undefined> = {}
  for (const [index, column] of columns.entries()) {
    record[column] = row[index] ?? undefined
  }
  return record
}

/**
 * Извлекает числовое значение поля из записи.
 * Возвращает null, если поле отсутствует, равно null, 0 или не-числу.
 */
export function getNumericField(
  record: Record<string, string | number | undefined>,
  field: string
): number | undefined {
  const raw = record[field]
  if (raw === null || raw === undefined) return undefined
  const number_ = Number(raw)
  if (!Number.isFinite(number_) || number_ === 0) return undefined
  return number_
}

/**
 * Превращает колонки + строки в Map, где ключ — SECID_BOARDID, значение — объект-запись.
 *
 * Используется для акций и индексов, где один SECID может быть
 * на нескольких бордах (TQBR, TQTF, INAV, SNDX и т.д.).
 */
export function buildCompositeMap(
  columnar: MoexColumnarData
): Map<string, Record<string, string | number | undefined>> {
  const { columns, data } = columnar
  const map = new Map<string, Record<string, string | number | undefined>>()

  for (const row of data) {
    const record = buildRecord(columns, row)
    const key = compositeKey(record)
    if (key) {
      map.set(key, record)
    }
  }

  return map
}

/** Строит составной ключ SECID_BOARDID из записи. Возвращает undefined, если SECID или BOARDID отсутствуют. */
function compositeKey(record: Record<string, string | number | undefined>): string | undefined {
  const secId = String(record['SECID'] ?? '')
  const boardId = String(record['BOARDID'] ?? '')
  if (!secId || !boardId) return undefined
  return `${secId}_${boardId}`
}

/** Извлекает строковое значение поля из записи, возвращает '' если отсутствует. */
export function getStringField(record: Record<string, string | number | undefined>, field: string): string {
  return String(record[field] ?? '')
}
