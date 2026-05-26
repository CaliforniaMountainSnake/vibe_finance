import type { MoexColumnarData } from './types'

/**
 * Превращает колонки + строки в Map, где ключ — SECID, значение — объект-запись.
 *
 * Используется для валют и индексов, где SECID уникален.
 */
export function buildRowMap(columnar: MoexColumnarData): Map<string, Record<string, string | number | null>> {
  const { columns, data } = columnar
  const map = new Map<string, Record<string, string | number | null>>()

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
function buildRecord(columns: string[], row: (string | number | null)[]): Record<string, string | number | null> {
  const record: Record<string, string | number | null> = {}
  for (let i = 0; i < columns.length; i++) {
    record[columns[i]] = row[i] ?? null
  }
  return record
}

/**
 * Извлекает числовое значение поля из записи.
 * Возвращает null, если поле отсутствует, равно null, 0 или не-числу.
 */
export function getNumericField(record: Record<string, string | number | null>, field: string): number | null {
  const raw = record[field]
  if (raw === null || raw === undefined) return null
  const num = Number(raw)
  if (!Number.isFinite(num) || num === 0) return null
  return num
}

/** Извлекает строковое значение поля из записи, возвращает '' если отсутствует. */
export function getStringField(record: Record<string, string | number | null>, field: string): string {
  return String(record[field] ?? '')
}
