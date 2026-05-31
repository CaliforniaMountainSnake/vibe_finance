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
  const groups = groupByTicker(entries)

  const result: T[] = []
  for (const [, group] of groups) {
    result.push(...resolveGroupCollisions(group))
  }

  return result
}

/** Группирует entries по ticker (lowercase). */
function groupByTicker<T extends ResolvableEntry>(entries: T[]): Map<string, T[]> {
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

  return groups
}

/** Разрешает коллизии внутри группы: первая сохраняет ticker, остальные — secId_boardId. */
function resolveGroupCollisions<T extends ResolvableEntry>(group: T[]): T[] {
  const resolved: T[] = [group[0]]

  for (let index = 1; index < group.length; index++) {
    const entry = group[index]
    resolved.push({
      ...entry,
      ticker: `${entry.secId}_${entry.boardId}`.toLowerCase(),
    })
  }

  return resolved
}
