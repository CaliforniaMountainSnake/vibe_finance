import type { IndexEntry } from './parse-indexes'
import type { ShareEntry } from './parse-shares'

/** Entry с полями для дедупликации тикеров. */
type ResolvableEntry = ShareEntry | IndexEntry

/**
 * Разрешает коллизии тикеров среди акций и индексов.
 *
 * Если несколько entry претендуют на один и тот же первичный тикер,
 * первая сохраняет его, а остальные получают тикер вида SECID_BOARDID.
 */
export function resolveTickers<T extends ResolvableEntry>(entries: T[]): T[] {
  const groups = new Map<string, T[]>()

  for (const entry of entries) {
    const key = entry.ticker.toLowerCase()
    const group = groups.get(key)
    if (group) {
      group.push(entry)
    } else {
      groups.set(key, [entry])
    }
  }

  const result: T[] = []
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
