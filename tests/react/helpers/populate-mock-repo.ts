import { DexieRepository } from '@/repositories/dexie-repository'
import type { DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'
import type { ExchangeRate, SourceName } from '@/entities/exchange-rate'
import type { Ticker } from '@/entities/ticker'
import type { TickerPair } from '@/entities/ticker-pair'
import exchangeRatesData from '../fixtures/exchange-rates.json'
import favoritePairsData from '../fixtures/favorite-pairs.json'
import holdingsData from '../fixtures/holdings.json'
import settingsData from '../fixtures/settings.json'

function groupBySource(rates: ExchangeRate[]): Map<SourceName, ExchangeRate[]> {
  const bySource = new Map<SourceName, ExchangeRate[]>()
  for (const r of rates) {
    const list = bySource.get(r.source)
    if (list) {
      list.push(r)
    } else {
      bySource.set(r.source, [r])
    }
  }
  return bySource
}

/**
 * Создаёт настоящий DexieRepository, наполненный данными из fixtures.
 * Работает в react-тестах благодаря полифилу fake-indexeddb/auto.
 *
 * Каждый вызов создаёт новую БД (DexieRepository использует фиксированное
 * имя 'VibeFinanceDb', но в jsdom каждый тестовый файл получает свой
 * экземпляр глобального окружения → своя in-memory IndexedDB).
 */
export async function createPopulatedRepo(): Promise<DatabaseRepositoryInterface> {
  const repo = new DexieRepository()

  const bySource = groupBySource(exchangeRatesData as ExchangeRate[])
  for (const [source, sourceRates] of bySource) {
    await repo.updateRatesForSource(source, sourceRates)
  }

  const pairs = favoritePairsData as TickerPair[]
  for (const pair of pairs) {
    await repo.addFavoriteRate(pair)
  }

  // 3. Добавляем холдинги
  const holdings = holdingsData as { ticker: Ticker; amount: number; label: string }[]
  for (const h of holdings) {
    await repo.addHolding(h.ticker, h.amount, h.label)
  }

  // 4. Устанавливаем настройки
  const settings = settingsData as { totalBaseTicker: Ticker | undefined; fontSize: number }
  if (settings.totalBaseTicker) {
    await repo.setSetting('totalBaseTicker', settings.totalBaseTicker)
  }
  await repo.setSetting('fontSize', settings.fontSize)

  return repo
}

/**
 * Очищает все таблицы в репозитории.
 */
export async function clearRepo(repo: DatabaseRepositoryInterface): Promise<void> {
  await repo.clearAll()
}
