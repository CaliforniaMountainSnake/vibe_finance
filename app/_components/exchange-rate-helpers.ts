import type { ExchangeRate, SourceName } from '@/entities/ExchangeRate'

const MS_PER_SEC = 1000

function maxUpdatedAt(rates: ExchangeRate[]): number {
  if (rates.length === 0) {
    return Math.floor(Date.now() / MS_PER_SEC)
  }
  return Math.max(...rates.map((r) => r.updatedAt))
}

const SEC_PER_MINUTE = 60
const SEC_PER_HOUR = 3600
const SEC_PER_DAY = 86400
const SEC_PER_MONTH = 2592000
const SEC_PER_YEAR = 31536000

function relativeTime(ts: number): string {
  const now = Math.floor(Date.now() / MS_PER_SEC)
  const diff = now - ts

  const intervals: [number, string][] = [
    [SEC_PER_MINUTE, 'сек.'],
    [SEC_PER_HOUR, 'мин.'],
    [SEC_PER_DAY, 'ч.'],
    [SEC_PER_MONTH, 'дн.'],
    [SEC_PER_YEAR, 'мес.'],
    [Infinity, 'г.'],
  ]

  let value = diff
  let unit = 'сек.'
  for (const [threshold, label] of intervals) {
    if (diff < threshold) {
      break
    }
    value = Math.floor(diff / threshold)
    unit = label
  }

  return `${value} ${unit} назад`
}

type SourceStatus = {
  updatedAt: number | null
  error: string | null
  loading: boolean
}

function computeStatus(rates: ExchangeRate[], source: SourceName, prev: SourceStatus): SourceStatus {
  const sourceRates = rates.filter((r) => r.source === source)
  return {
    ...prev,
    updatedAt: sourceRates.length > 0 ? maxUpdatedAt(sourceRates) : null,
  }
}

export { maxUpdatedAt, relativeTime, computeStatus, MS_PER_SEC }
export type { SourceStatus }
