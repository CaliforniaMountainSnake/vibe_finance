import type { ShareEntry } from './parse-shares'

/**
 * Разрешает коллизии тикеров среди акций.
 *
 * Если несколько акций претендуют на один и тот же первичный тикер,
 * первая сохраняет его, а остальные получают тикер вида SECID_BOARDID.
 */
export function resolveShareTickers(entries: ShareEntry[]): ShareEntry[] {
  const groups = new Map<string, ShareEntry[]>()

  for (const entry of entries) {
    const key = entry.ticker.toLowerCase()
    const group = groups.get(key)
    if (group) {
      group.push(entry)
    } else {
      groups.set(key, [entry])
    }
  }

  const result: ShareEntry[] = []
  for (const [, group] of groups) {
    result.push(group[0])

    for (let i = 1; i < group.length; i++) {
      const entry = group[i]
      result.push({
        ...entry,
        ticker: `${entry.secId}_${entry.boardId}`.toLowerCase(),
      })
    }
  }

  return result
}
