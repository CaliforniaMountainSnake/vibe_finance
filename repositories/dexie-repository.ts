import Dexie, { type Table } from 'dexie'
import { type ExchangeRate, type SourceName } from '@/entities/exchange-rate'
import { type FavoriteRate } from '@/entities/favorite-rate'
import { type Ticker } from '@/entities/ticker'
import { type TickerPair } from '@/entities/ticker-pair'
import { type DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'
import { type Holding, type HoldingUpdate } from '@/entities/holding'
import { type AppSetting, type AppSettingsMap } from '@/entities/app-setting'
import { v4 as uuidv4 } from 'uuid'

const DB_VERSION_1 = 1
const DB_VERSION_2 = 2
const DB_VERSION_3 = 3
const DB_VERSION_4 = 4
const DB_VERSION_5 = 5
const DB_VERSION_6 = 6

/**
 * Схема БД
 */
class FinanceDatabase extends Dexie {
  exchangeRates!: Table<ExchangeRate, [string, string]>
  favoriteRates!: Table<FavoriteRate, string>
  holdings!: Table<Holding, string>
  settings!: Table<AppSetting, string>

  constructor() {
    super('VibeFinanceDb')

    this.version(DB_VERSION_1).stores({
      exchangeRates: '[source+ticker], source, ticker',
    })

    this.version(DB_VERSION_2).stores({
      exchangeRates: '[source+ticker], source, ticker',
      favoriteRates: '[from+to], addedAt',
    })

    // v3: удаляем старую таблицу favoriteRates (Dexie не даёт менять первичный ключ на лету)
    this.version(DB_VERSION_3).stores({
      exchangeRates: '[source+ticker], source, ticker',
      // eslint-disable-next-line unicorn/no-null -- Dexie API requires null to drop a table
      favoriteRates: null,
    })

    // v4: пересоздаём favoriteRates с новой схемой
    this.version(DB_VERSION_4).stores({
      exchangeRates: '[source+ticker], source, ticker',
      favoriteRates: 'id, addedAt',
    })

    // v5: заменяем addedAt на order — мигрируем существующие записи
    this.version(DB_VERSION_5)
      .stores({
        exchangeRates: '[source+ticker], source, ticker',
        favoriteRates: 'id, order',
      })
      .upgrade(async (tx) => {
        const records = await tx.table('favoriteRates').toArray()
        const sorted = records.toSorted((a, b) => {
          const aTime = (a as { addedAt?: number }).addedAt ?? 0
          const bTime = (b as { addedAt?: number }).addedAt ?? 0
          return aTime - bTime
        })
        await tx.table('favoriteRates').clear()
        const migrated = sorted.map((r, index) => ({ ...r, order: index }))
        await tx.table('favoriteRates').bulkPut(migrated)
      })

    // v6: добавляем таблицы holdings (средства) и settings (настройки приложения)
    this.version(DB_VERSION_6).stores({
      exchangeRates: '[source+ticker], source, ticker',
      favoriteRates: 'id, order',
      holdings: 'id, order',
      settings: '&key',
    })
  }
}

/** Формирует уникальный идентификатор пары тикеров. */
function pairId(from: Ticker, to: Ticker): string {
  return `${from.source}:${from.ticker}->${to.source}:${to.ticker}`
}

/** Применяет поля из HoldingUpdate к объекту Holding (мутабельно). */
function applyUpdates(holding: Holding, updates: HoldingUpdate): void {
  if (updates.ticker !== undefined) holding.ticker = updates.ticker
  if (updates.amount !== undefined) holding.amount = updates.amount
  if (updates.label !== undefined) holding.label = updates.label.trim()
  if (updates.enabled !== undefined) holding.enabled = updates.enabled
}

/**
 * Репозиторий
 */
export class DexieRepository implements DatabaseRepositoryInterface {
  private readonly db: FinanceDatabase

  constructor() {
    this.db = new FinanceDatabase()
  }

  async updateRatesForSource(source: SourceName, rates: ExchangeRate[]): Promise<void> {
    await this.db.transaction('rw', this.db.exchangeRates, async () => {
      await this.db.exchangeRates.where('source').equals(source).delete()
      await this.db.exchangeRates.bulkPut(rates)
    })
  }

  async getRate(pair: TickerPair): Promise<number> {
    const { from, to } = pair

    const [fromRecord, toRecord] = await Promise.all([
      this.db.exchangeRates.get([from.source, from.ticker]),
      this.db.exchangeRates.get([to.source, to.ticker]),
    ])

    if (!fromRecord) {
      throw new Error(`Unknown ticker: ${from.source}:${from.ticker}`)
    }
    if (!toRecord) {
      throw new Error(`Unknown ticker: ${to.source}:${to.ticker}`)
    }
    if (fromRecord.btcPrice <= 0) {
      throw new Error(`Invalid btcPrice for ticker ${from.source}:${from.ticker}: ${fromRecord.btcPrice}`)
    }

    return toRecord.btcPrice / fromRecord.btcPrice
  }

  async getAllRates(): Promise<ExchangeRate[]> {
    return await this.db.exchangeRates.toArray()
  }

  async clearAll(): Promise<void> {
    await this.db.exchangeRates.clear()
    await this.db.favoriteRates.clear()
    await this.db.holdings.clear()
    await this.db.settings.clear()
  }

  async addFavoriteRate(pair: TickerPair): Promise<void> {
    const id = pairId(pair.from, pair.to)
    const existing = await this.db.favoriteRates.get(id)
    if (existing) return
    const maxOrder = await this.db.favoriteRates.orderBy('order').last()
    const nextOrder = maxOrder === undefined ? 0 : maxOrder.order + 1
    await this.db.favoriteRates.put({
      from: pair.from,
      to: pair.to,
      order: nextOrder,
      id,
    })
  }

  async removeFavoriteRate(pair: TickerPair): Promise<void> {
    await this.db.favoriteRates.delete(pairId(pair.from, pair.to))
  }

  async getFavoriteRates(): Promise<TickerPair[]> {
    const records = await this.db.favoriteRates.orderBy('order').toArray()
    return records.map((r) => ({ from: r.from, to: r.to }))
  }

  async isFavoriteRate(pair: TickerPair): Promise<boolean> {
    const record = await this.db.favoriteRates.get(pairId(pair.from, pair.to))
    return record !== undefined
  }

  async getUpdateTime(source: SourceName): Promise<number | null> {
    const row = await this.db.exchangeRates.where('source').equals(source).first()
    // eslint-disable-next-line unicorn/no-null -- matches interface contract (Promise<number | null>)
    return row ? row.updatedAt : null
  }

  async moveFavoriteRateUp(pair: TickerPair): Promise<void> {
    await this.swapWithNeighbor(pair, 'above')
  }

  async moveFavoriteRateDown(pair: TickerPair): Promise<void> {
    await this.swapWithNeighbor(pair, 'below')
  }

  // ---------------------------------------------------------------------------
  // Holdings
  // ---------------------------------------------------------------------------

  async getHoldings(): Promise<Holding[]> {
    return await this.db.holdings.orderBy('order').toArray()
  }

  async addHolding(ticker: Ticker, amount: number, label: string): Promise<void> {
    const maxOrder = await this.db.holdings.orderBy('order').last()
    const nextOrder = maxOrder === undefined ? 0 : maxOrder.order + 1
    await this.db.holdings.put({
      id: uuidv4(),
      ticker,
      amount,
      label: label.trim(),
      order: nextOrder,
      enabled: true,
    })
  }

  async updateHolding(id: string, updates: HoldingUpdate): Promise<void> {
    const holding = await this.db.holdings.get(id)
    if (!holding) return
    applyUpdates(holding, updates)
    await this.db.holdings.put(holding)
  }

  async removeHolding(id: string): Promise<void> {
    await this.db.holdings.delete(id)
  }

  async moveHoldingUp(id: string): Promise<void> {
    await this.swapHoldingWithNeighbor(id, 'above')
  }

  async moveHoldingDown(id: string): Promise<void> {
    await this.swapHoldingWithNeighbor(id, 'below')
  }

  private async swapHoldingWithNeighbor(id: string, direction: 'above' | 'below'): Promise<void> {
    const current = await this.db.holdings.get(id)
    if (!current) return

    const collection =
      direction === 'above'
        ? // eslint-disable-next-line unicorn/no-array-reverse -- Dexie Collection.reverse(), not Array.reverse()
          this.db.holdings.where('order').below(current.order).reverse()
        : this.db.holdings.where('order').above(current.order)

    const neighbor = await collection.first()
    if (neighbor) {
      const temporary = current.order
      current.order = neighbor.order
      neighbor.order = temporary
      await this.db.holdings.bulkPut([current, neighbor])
    }
  }

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  async getSetting<K extends keyof AppSettingsMap>(key: K): Promise<AppSettingsMap[K] | undefined> {
    const record = await this.db.settings.get(key)
    return record?.value as AppSettingsMap[K] | undefined
  }

  async setSetting<K extends keyof AppSettingsMap>(key: K, value: AppSettingsMap[K]): Promise<void> {
    await this.db.settings.put({ key, value })
  }

  async removeSetting(key: string): Promise<void> {
    await this.db.settings.delete(key)
  }

  private async swapWithNeighbor(pair: TickerPair, direction: 'above' | 'below'): Promise<void> {
    const id = pairId(pair.from, pair.to)
    const current = await this.db.favoriteRates.get(id)
    if (!current) return

    const collection =
      direction === 'above'
        ? // eslint-disable-next-line unicorn/no-array-reverse -- Dexie Collection.reverse(), not Array.reverse()
          this.db.favoriteRates.where('order').below(current.order).reverse()
        : this.db.favoriteRates.where('order').above(current.order)

    const neighbor = await collection.first()
    if (neighbor) {
      const temporary = current.order
      current.order = neighbor.order
      neighbor.order = temporary
      await this.db.favoriteRates.bulkPut([current, neighbor])
    }
  }
}
