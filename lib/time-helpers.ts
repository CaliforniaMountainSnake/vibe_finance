const MS_PER_SEC = 1000
const SEC_PER_MINUTE = 60
const SEC_PER_HOUR = 3600
const SEC_PER_DAY = 86400
const SEC_PER_MONTH = 2592000
const SEC_PER_YEAR = 31536000

function relativeTime(ts: number): string {
  const now = Math.floor(Date.now() / MS_PER_SEC)
  const diff = now - ts

  const intervals: [number, string][] = [
    [SEC_PER_MINUTE, 'мин.'],
    [SEC_PER_HOUR, 'ч.'],
    [SEC_PER_DAY, 'дн.'],
    [SEC_PER_MONTH, 'мес.'],
    [SEC_PER_YEAR, 'г.'],
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

export { relativeTime, MS_PER_SEC, SEC_PER_MINUTE, SEC_PER_HOUR, SEC_PER_DAY, SEC_PER_MONTH, SEC_PER_YEAR }
