const PAD_LENGTH = 2

/**
 * Создать ключ для сохранения в БД снапшота обменных курсов.
 */
export function makeSnapshotKey(date: Date): string {
  const year = String(date.getUTCFullYear())
  const month = String(date.getUTCMonth() + 1).padStart(PAD_LENGTH, '0')
  const day = String(date.getUTCDate()).padStart(PAD_LENGTH, '0')
  return `${year}-${month}-${day}`
}
